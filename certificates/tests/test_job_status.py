"""Phase 5 processing lifecycle and durable PDF results."""

import tempfile
import uuid
from pathlib import Path
from unittest.mock import patch

from django.test import TestCase, override_settings

from certificates.models import Certificate, GenerationJob
from certificates.services import process_job
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
