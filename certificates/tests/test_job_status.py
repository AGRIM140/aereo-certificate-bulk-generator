"""Phase 5 processing lifecycle and durable PDF results."""

import tempfile
import uuid
from pathlib import Path
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from certificates.models import Certificate, GenerationJob
from certificates.services import process_job
from certificates.tests.helpers import CeleryEagerTestCase
from certificates.tests.test_job_creation import submit, valid_data



class JobProcessingTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        override = override_settings(MEDIA_ROOT=self.media_directory.name)
        override.enable()
        self.addCleanup(override.disable)

    def test_all_success_uses_generator_and_saves_uuid_named_pdfs(self):
        job = submit(valid_data([{"name": "José Álvarez"}, {"name": "André Müller"}]))

        process_job(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED)
        self.assertIsNotNone(job.started_at)
        self.assertIsNotNone(job.finished_at)
        self.assertLessEqual(job.started_at, job.finished_at)
        self.assertEqual(job.get_progress()["generated"], 2)
        self.assertEqual(job.get_progress()["pending"], 0)
        for certificate in job.certificates.all():
            self.assertEqual(certificate.status, Certificate.Status.GENERATED)
            self.assertIsNotNone(certificate.generated_at)
            self.assertEqual(
                certificate.pdf_file.name,
                f"certificates/{job.id}/{certificate.id}.pdf",
            )
            self.assertTrue(Path(certificate.pdf_file.path).is_file())
            with certificate.pdf_file.open("rb") as saved_file:
                self.assertTrue(saved_file.read(4) == b"%PDF")

    def test_mixed_valid_and_invalid_rows_complete_with_errors(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": " "}, {"name": "Grace"}]))
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake") as generator:
            process_job(job.id)

        job.refresh_from_db()
        rows = list(job.certificates.all())
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED_WITH_ERRORS)
        self.assertEqual([row.status for row in rows], ["GENERATED", "FAILED", "GENERATED"])
        self.assertEqual(rows[1].error_type, Certificate.ErrorType.VALIDATION)
        self.assertEqual(rows[1].row_number, 2)
        self.assertEqual(generator.call_count, 2)
        self.assertEqual(job.get_progress()["percent_complete"], 100)

    def test_all_invalid_rows_finish_failed_without_calling_generator(self):
        job = submit(valid_data([{"name": ""}, None]))
        with patch("certificates.pdf_generator.generate_certificate_pdf") as generator:
            process_job(job.id)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.FAILED)
        self.assertIsNotNone(job.finished_at)
        self.assertEqual(job.get_progress()["failed"], 2)
        generator.assert_not_called()

    def test_second_run_and_already_claimed_or_finished_jobs_are_noops(self):
        first = submit(valid_data())
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake") as generator:
            process_job(first.id)
            process_job(first.id)
        self.assertEqual(generator.call_count, 1)

        for status in (GenerationJob.Status.PROCESSING, GenerationJob.Status.COMPLETED_WITH_ERRORS, GenerationJob.Status.FAILED):
            with self.subTest(status=status):
                job = submit(valid_data())
                job.status = status
                job.save(update_fields=["status"])
                with patch("certificates.pdf_generator.generate_certificate_pdf") as generator:
                    process_job(job.id)
                job.refresh_from_db()
                self.assertEqual(job.status, status)
                self.assertIsNone(job.started_at)
                generator.assert_not_called()

    def test_missing_job_is_a_noop(self):
        process_job(uuid.uuid4())
        self.assertEqual(GenerationJob.objects.count(), 0)

    def test_all_success_is_completed(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake"):
            process_job(job.id)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED)

    def test_mixed_is_completed_with_errors(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": " "}]))
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake"):
            process_job(job.id)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED_WITH_ERRORS)

    def test_all_failed_is_failed(self):
        job = submit(valid_data([{"name": " "}, {"name": ""}]))
        process_job(job.id)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.FAILED)

    def test_timestamps_set(self):
        job = submit(valid_data([{"name": "Ada"}]))
        self.assertIsNotNone(job.created_at)
        self.assertIsNone(job.started_at)
        self.assertIsNone(job.finished_at)
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake"):
            process_job(job.id)
        job.refresh_from_db()
        self.assertIsNotNone(job.started_at)
        self.assertIsNotNone(job.finished_at)
        self.assertLessEqual(job.started_at, job.finished_at)
        cert = job.certificates.get()
        self.assertIsNotNone(cert.created_at)
        self.assertIsNotNone(cert.generated_at)

    def test_certificate_status_and_error_fields(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": " "}]))
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake"):
            process_job(job.id)
        job.refresh_from_db()
        cert_gen = job.certificates.get(row_number=1)
        cert_fail = job.certificates.get(row_number=2)
        self.assertEqual(cert_gen.status, Certificate.Status.GENERATED)
        self.assertEqual(cert_gen.error_type, "")
        self.assertEqual(cert_gen.error_message, "")
        self.assertIsNotNone(cert_gen.generated_at)
        self.assertEqual(cert_fail.status, Certificate.Status.FAILED)
        self.assertEqual(cert_fail.error_type, Certificate.ErrorType.VALIDATION)
        self.assertIn("name:", cert_fail.error_message)
        self.assertIsNone(cert_fail.generated_at)



class JobStatusAPITests(CeleryEagerTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_job_detail_shows_progress_counts(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
        response = self.client.get(f"/api/jobs/{job.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(job.id))
        self.assertEqual(response.data["status"], GenerationJob.Status.PENDING)
        progress = response.data["progress"]
        self.assertEqual(progress["total"], 2)
        self.assertEqual(progress["generated"], 0)
        self.assertEqual(progress["failed"], 0)
        self.assertEqual(progress["pending"], 2)
        self.assertEqual(progress["percent_complete"], 0.0)

    def test_job_detail_lists_failures_with_errors(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": ""}]))
        response = self.client.get(f"/api/jobs/{job.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        certs = response.data["certificates"]
        self.assertEqual(len(certs), 2)
        self.assertEqual(certs[1]["status"], Certificate.Status.FAILED)
        self.assertIsNotNone(certs[1]["error"])
        self.assertEqual(certs[1]["error"]["type"], "VALIDATION")
        self.assertIn("name:", certs[1]["error"]["message"])
        self.assertIsNone(certs[1]["download_url"])

    def test_job_detail_shows_generated_certificates_with_download_urls(self):
        job = submit(valid_data([{"name": "Ada"}]))
        process_job(job.id)
        response = self.client.get(f"/api/jobs/{job.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], GenerationJob.Status.COMPLETED)
        cert = response.data["certificates"][0]
        self.assertEqual(cert["status"], Certificate.Status.GENERATED)
        self.assertEqual(
            cert["download_url"],
            f"http://testserver/api/certificates/{cert['id']}/download/",
        )
        self.assertIsNone(cert["error"])

    def test_unknown_job_returns_404(self):
        unknown_id = uuid.uuid4()
        response = self.client.get(f"/api/jobs/{unknown_id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"]["code"], "not_found")
        self.assertEqual(response.data["error"]["message"], "The requested resource was not found.")

    def test_malformed_job_id_returns_404(self):
        for bad_id in ("not-a-uuid", "123", "4d32a9ac-bad", "undefined"):
            with self.subTest(bad_id=bad_id):
                response = self.client.get(f"/api/jobs/{bad_id}/")
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
                self.assertEqual(response.data["error"]["code"], "not_found")

    def test_job_detail_query_count_is_small(self):
        job = submit(valid_data([{"name": f"User {i}"} for i in range(15)]))
        with self.assertNumQueries(3):
            response = self.client.get(f"/api/jobs/{job.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["certificates"]), 15)

    def test_api_reports_job_status_not_celery_state(self):
        for expected_status in (
            GenerationJob.Status.PENDING,
            GenerationJob.Status.PROCESSING,
            GenerationJob.Status.COMPLETED,
            GenerationJob.Status.COMPLETED_WITH_ERRORS,
            GenerationJob.Status.FAILED,
        ):
            with self.subTest(status=expected_status):
                job = submit(valid_data())
                job.status = expected_status
                job.save(update_fields=["status"])
                response = self.client.get(f"/api/jobs/{job.id}/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["status"], expected_status)

    def test_eager_celery_post_and_get_lifecycle(self):
        payload = valid_data([{"name": "Ada Lovelace", "email": "ada@example.com"}])
        with self.captureOnCommitCallbacks(execute=True):
            post_resp = self.client.post("/api/jobs/", payload, format="json")
            self.assertEqual(post_resp.status_code, status.HTTP_202_ACCEPTED)

        job_id = post_resp.data["id"]
        get_resp = self.client.get(f"/api/jobs/{job_id}/")
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(get_resp.data["status"], GenerationJob.Status.COMPLETED)
        self.assertEqual(get_resp.data["progress"]["percent_complete"], 100.0)
        self.assertEqual(get_resp.data["certificates"][0]["status"], Certificate.Status.GENERATED)

    def test_job_list_paginated_newest_first(self):
        job1 = submit(valid_data([{"name": "Alice"}]))
        job2 = submit(valid_data([{"name": "Bob"}]))
        job3 = submit(valid_data([{"name": "Charlie"}]))

        response = self.client.get("/api/jobs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(response.data["count"], 3)

        results = response.data["results"]
        result_ids = [r["id"] for r in results]
        self.assertIn(str(job3.id), result_ids)
        self.assertIn(str(job2.id), result_ids)
        self.assertIn(str(job1.id), result_ids)
        self.assertLess(result_ids.index(str(job3.id)), result_ids.index(str(job2.id)))
        self.assertLess(result_ids.index(str(job2.id)), result_ids.index(str(job1.id)))

        sample = results[0]
        self.assertIn("id", sample)
        self.assertIn("status", sample)
        self.assertIn("event_name", sample)
        self.assertIn("organization_name", sample)
        self.assertIn("issue_date", sample)
        self.assertIn("progress", sample)
        self.assertIn("status_url", sample)
        self.assertNotIn("certificates", sample)

