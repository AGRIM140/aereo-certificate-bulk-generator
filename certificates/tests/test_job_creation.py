"""Phase 5 job-creation behavior on PostgreSQL."""

from datetime import date
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from certificates.models import Certificate, GenerationJob, build_certificate_number
from certificates.serializers import JobRequestSerializer
from certificates.services import create_job
from certificates.tasks import process_job_task
from certificates.tests.helpers import CeleryEagerTestCase


def valid_data(recipients=None, **changes):
    data = {
        "event_name": "Python Workshop",
        "organization_name": "Example Club",
        "issue_date": "2026-10-08",
        "recipients": recipients if recipients is not None else [{"name": "Ada"}],
    }
    data.update(changes)
    return data


def submit(data):
    serializer = JobRequestSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    return create_job(serializer.validated_data)


class JobCreationTests(TestCase):
    def test_valid_job_fields_defaults_and_certificate_number(self):
        before = timezone.now()
        job = submit(valid_data([{"name": "  Ada Lovelace  ", "email": "ada@example.com"}]))
        certificate = job.certificates.get()

        self.assertEqual(job.status, GenerationJob.Status.PENDING)
        self.assertEqual(job.event_name, "Python Workshop")
        self.assertEqual(job.organization_name, "Example Club")
        self.assertEqual(job.issue_date, date(2026, 10, 8))
        self.assertLessEqual(before, job.created_at)
        self.assertIsNone(job.started_at)
        self.assertIsNone(job.finished_at)
        self.assertEqual(job.error_message, "")
        self.assertEqual(certificate.row_number, 1)
        self.assertEqual(certificate.recipient_name, "Ada Lovelace")
        self.assertEqual(certificate.recipient_email, "ada@example.com")
        self.assertEqual(certificate.status, Certificate.Status.PENDING)
        self.assertEqual(certificate.certificate_number, build_certificate_number(job.issue_date, certificate.id))
        self.assertEqual(certificate.error_type, "")
        self.assertFalse(certificate.pdf_file)
        self.assertIsNone(certificate.generated_at)

    def test_default_issue_date_comes_from_request_serializer(self):
        data = valid_data()
        del data["issue_date"]
        job = submit(data)
        self.assertEqual(job.issue_date, timezone.localdate())

    def test_every_submitted_row_is_preserved_in_order(self):
        recipients = [
            {"name": "Ada"},
            {"name": "  "},
            "not an object",
            {"name": "Grace", "email": "bad-address"},
            {"name": "Lin", "extra": "ignored"},
        ]
        job = submit(valid_data(recipients))
        rows = list(job.certificates.all())

        self.assertEqual(GenerationJob.objects.count(), 1)
        self.assertEqual(Certificate.objects.count(), len(recipients))
        self.assertEqual([row.row_number for row in rows], [1, 2, 3, 4, 5])
        self.assertEqual(
            [row.status for row in rows],
            ["PENDING", "FAILED", "FAILED", "FAILED", "PENDING"],
        )
        self.assertEqual([row.error_type for row in rows[1:4]], ["VALIDATION"] * 3)
        for row in rows[1:4]:
            self.assertIn(f"Row {row.row_number}:", row.error_message)
            self.assertLessEqual(len(row.error_message), 500)
        self.assertIn("name:", rows[1].error_message)
        self.assertIn("non_field_errors:", rows[2].error_message)
        self.assertIn("email:", rows[3].error_message)
        self.assertEqual(rows[3].recipient_name, "Grace")
        self.assertEqual(rows[3].recipient_email, "bad-address")
        self.assertEqual(rows[4].recipient_name, "Lin")
        self.assertEqual(rows[4].recipient_email, "")
        self.assertEqual(len({row.certificate_number for row in rows}), len(rows))

    def test_invalid_request_creates_no_rows(self):
        serializer = JobRequestSerializer(data=valid_data([], event_name=""))
        self.assertFalse(serializer.is_valid())
        self.assertEqual(GenerationJob.objects.count(), 0)
        self.assertEqual(Certificate.objects.count(), 0)

    def test_creation_rolls_back_if_bulk_insert_fails(self):
        with patch("certificates.services.Certificate.objects.bulk_create", side_effect=RuntimeError("insert failed")):
            with self.assertRaisesRegex(RuntimeError, "insert failed"):
                submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
        self.assertEqual(GenerationJob.objects.count(), 0)
        self.assertEqual(Certificate.objects.count(), 0)

    def test_creation_is_atomic_on_failure(self):
        self.test_creation_rolls_back_if_bulk_insert_fails()



class JobCreationAPITests(CeleryEagerTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_valid_request_returns_202_with_job_id(self):
        payload = valid_data([{"name": "Ada Lovelace", "email": "ada@example.com"}])
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["status"], GenerationJob.Status.PENDING)
        self.assertEqual(response.data["event_name"], "Python Workshop")
        self.assertEqual(response.data["organization_name"], "Example Club")
        self.assertEqual(response.data["issue_date"], "2026-10-08")
        self.assertEqual(response.data["progress"]["total"], 1)
        self.assertEqual(response.data["progress"]["pending"], 1)
        self.assertEqual(len(response.data["certificates"]), 1)
        self.assertEqual(
            response.data["status_url"],
            f"http://testserver/api/jobs/{response.data['id']}/",
        )

    def test_job_and_certificate_rows_created(self):
        payload = valid_data([{"name": "Ada"}, {"name": "Grace"}])
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        job = GenerationJob.objects.get(pk=response.data["id"])
        self.assertEqual(job.certificates.count(), 2)

    def test_response_does_not_wait_for_generation(self):
        payload = valid_data([{"name": "Ada"}])
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data["status"], GenerationJob.Status.PENDING)
        self.assertEqual(response.data["certificates"][0]["status"], Certificate.Status.PENDING)
        self.assertIsNone(response.data["started_at"])
        self.assertIsNone(response.data["finished_at"])

    def test_response_contains_status_url(self):
        payload = valid_data()
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        job_id = response.data["id"]
        self.assertEqual(response.data["status_url"], f"http://testserver/api/jobs/{job_id}/")

    def test_missing_event_name_returns_400_and_creates_no_job(self):
        payload = valid_data(event_name="")
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("event_name", response.data["error"]["details"])
        self.assertEqual(GenerationJob.objects.count(), 0)
        self.assertEqual(Certificate.objects.count(), 0)

    def test_empty_recipients_rejected(self):
        payload = valid_data(recipients=[])
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("recipients", response.data["error"]["details"])
        self.assertEqual(GenerationJob.objects.count(), 0)

    def test_invalid_issue_date_rejected(self):
        payload = valid_data(issue_date="not-a-date")
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("issue_date", response.data["error"]["details"])
        self.assertEqual(GenerationJob.objects.count(), 0)

    @override_settings(MAX_RECIPIENTS_PER_JOB=2)
    def test_too_many_recipients_rejected(self):
        payload = valid_data(recipients=[{"name": "A"}, {"name": "B"}, {"name": "C"}])
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("recipients", response.data["error"]["details"])
        self.assertEqual(GenerationJob.objects.count(), 0)

    def test_mixed_valid_and_invalid_recipients_are_accepted(self):
        payload = valid_data([{"name": "Ada"}, {"name": "  "}])
        response = self.client.post("/api/jobs/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        certs = response.data["certificates"]
        self.assertEqual(len(certs), 2)
        self.assertEqual(certs[0]["status"], Certificate.Status.PENDING)
        self.assertEqual(certs[1]["status"], Certificate.Status.FAILED)
        self.assertEqual(certs[1]["error"]["type"], Certificate.ErrorType.VALIDATION)

    def test_dispatch_called_after_commit(self):
        payload = valid_data([{"name": "Ada"}])
        with patch.object(process_job_task, "delay") as delay:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post("/api/jobs/", payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

        job_id = response.data["id"]
        delay.assert_called_once_with(str(job_id))

    def test_wrong_method_returns_405(self):
        for method in ("put", "delete", "patch"):
            with self.subTest(method=method):
                response = getattr(self.client, method)("/api/jobs/")
                self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
                self.assertEqual(response.data["error"]["code"], "method_not_allowed")

    def test_non_json_body_rejected(self):
        response = self.client.post("/api/jobs/", "not json", content_type="text/plain")
        self.assertEqual(response.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
        self.assertEqual(response.data["error"]["code"], "unsupported_media_type")

    def test_malformed_json_body_rejected(self):
        response = self.client.post("/api/jobs/", "{broken json", content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")

