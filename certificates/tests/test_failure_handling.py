"""Phase 5 generation failure isolation and safe persisted errors."""

import tempfile
from pathlib import Path
from unittest.mock import patch

from django.db.models.query import QuerySet
from django.test import TestCase, override_settings

from certificates.models import Certificate, GenerationJob
from certificates.pdf_generator import TextDoesNotFitError
from certificates.services import process_job
from certificates.tests.test_job_creation import submit, valid_data


class ProcessingFailureTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        override = override_settings(MEDIA_ROOT=self.media_directory.name)
        override.enable()
        self.addCleanup(override.disable)

    def test_one_generator_failure_does_not_stop_other_certificates(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}, {"name": "Lin"}]))

        def generate(name, *_args):
            if name == "Grace":
                raise RuntimeError("secret path /private/info")
            return b"%PDF-fake"

        with patch("certificates.pdf_generator.generate_certificate_pdf", side_effect=generate):
            with self.assertLogs("certificates.services", level="ERROR"):
                process_job(job.id)

        job.refresh_from_db()
        rows = list(job.certificates.all())
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED_WITH_ERRORS)
        self.assertEqual([row.status for row in rows], ["GENERATED", "FAILED", "GENERATED"])
        self.assertEqual(rows[1].error_type, Certificate.ErrorType.GENERATION)
        self.assertEqual(rows[1].error_message, "Certificate generation failed.")
        self.assertFalse(rows[1].pdf_file)
        self.assertIsNone(rows[1].generated_at)
        self.assertNotIn("/private/info", rows[1].error_message)

    def test_all_generation_failures_finish_failed(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
        with patch("certificates.pdf_generator.generate_certificate_pdf", side_effect=RuntimeError("broken")):
            with self.assertLogs("certificates.services", level="ERROR"):
                process_job(job.id)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.FAILED)
        self.assertEqual(job.get_progress()["failed"], 2)
        self.assertIsNotNone(job.finished_at)

    def test_text_fit_error_has_specific_safe_message(self):
        job = submit(valid_data())
        with patch("certificates.pdf_generator.generate_certificate_pdf", side_effect=TextDoesNotFitError("too long")):
            with self.assertLogs("certificates.services", level="ERROR"):
                process_job(job.id)
        certificate = job.certificates.get()
        self.assertEqual(certificate.error_message, "Text does not fit the certificate template.")

    def test_failed_row_update_cannot_falsely_complete_a_job(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))

        def generate(name, *_args):
            if name == "Ada":
                raise RuntimeError("generation failed")
            return b"%PDF-fake"

        with patch("certificates.pdf_generator.generate_certificate_pdf", side_effect=generate):
            with patch("certificates.services._mark_generation_failed", side_effect=RuntimeError("database hiccup")):
                with self.assertLogs("certificates.services", level="ERROR"):
                    process_job(job.id)

        job.refresh_from_db()
        rows = list(job.certificates.all())
        self.assertEqual(job.status, GenerationJob.Status.FAILED)
        self.assertEqual([row.status for row in rows], ["FAILED", "GENERATED"])
        self.assertEqual(rows[0].error_message, "Job processing was interrupted.")
        self.assertEqual(job.get_progress()["pending"], 0)

    def test_file_save_error_is_isolated_and_partial_file_is_removed(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
        original_save = Certificate.pdf_file.field.attr_class.save
        calls = 0

        def save_file(field_file, name, content, save=True):
            nonlocal calls
            calls += 1
            if calls == 1:
                original_save(field_file, name, content, save=save)
                raise OSError("storage failure /secret")
            return original_save(field_file, name, content, save=save)

        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake"):
            with patch.object(Certificate.pdf_file.field.attr_class, "save", save_file):
                with self.assertLogs("certificates.services", level="ERROR"):
                    process_job(job.id)

        rows = list(job.certificates.all())
        self.assertEqual([row.status for row in rows], ["FAILED", "GENERATED"])
        self.assertFalse(rows[0].pdf_file)
        failed_path = Path(self.media_directory.name) / "certificates" / str(job.id) / f"{rows[0].id}.pdf"
        self.assertFalse(failed_path.exists())
        self.assertEqual(job.get_progress()["pending"], 0)

    def test_job_level_crash_marks_remaining_rows_and_job_failed(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
        original_iterator = QuerySet.iterator

        def interrupt_after_first(queryset, *args, **kwargs):
            for index, certificate in enumerate(original_iterator(queryset, *args, **kwargs)):
                if index == 1:
                    raise RuntimeError("database secret")
                yield certificate

        with patch.object(QuerySet, "iterator", interrupt_after_first):
            with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake"):
                with self.assertLogs("certificates.services", level="ERROR"):
                    process_job(job.id)
        job.refresh_from_db()
        rows = list(job.certificates.all())
        self.assertEqual(job.status, GenerationJob.Status.FAILED)
        self.assertEqual(job.error_message, "Job processing was interrupted.")
        self.assertIsNotNone(job.finished_at)
        self.assertNotIn("database secret", job.error_message)
        self.assertEqual([row.status for row in rows], ["GENERATED", "FAILED"])
        self.assertEqual(rows[1].error_type, Certificate.ErrorType.GENERATION)
        self.assertEqual(rows[1].error_message, "Job processing was interrupted.")
