"""Phase 5 job-creation behavior on PostgreSQL."""

from datetime import date
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from certificates.models import Certificate, GenerationJob, build_certificate_number
from certificates.serializers import JobRequestSerializer
from certificates.services import create_job


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
