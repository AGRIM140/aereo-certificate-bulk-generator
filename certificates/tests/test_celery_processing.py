"""Phase 6 tests for after-commit dispatch and Celery task behavior."""

from pathlib import Path
from unittest.mock import patch

from django.conf import settings
from django.db import transaction

from certificates.models import Certificate, GenerationJob
from certificates.tasks import process_job_task
from certificates.tests.helpers import CeleryEagerTestCase
from certificates.tests.test_job_creation import submit, valid_data
from config.celery import app as celery_app


class CeleryProcessingTests(CeleryEagerTestCase):
    def test_celery_uses_redis_json_and_no_result_backend(self):
        self.assertEqual(celery_app.conf.broker_url, settings.CELERY_BROKER_URL)
        self.assertEqual(celery_app.conf.accept_content, ["json"])
        self.assertEqual(celery_app.conf.task_serializer, "json")
        self.assertTrue(celery_app.conf.task_ignore_result)
        self.assertIsNone(celery_app.conf.result_backend)
        self.assertTrue(celery_app.conf.task_always_eager)
        self.assertTrue(celery_app.conf.task_eager_propagates)

    def test_task_is_thin_and_passes_only_the_job_uuid(self):
        with patch("certificates.services.process_job") as process:
            process_job_task.run("4d32a9ac-08c6-4603-9dfb-f70fbeb1d6b5")
        process.assert_called_once_with("4d32a9ac-08c6-4603-9dfb-f70fbeb1d6b5")

    def test_task_is_queued_once_after_commit_with_uuid_string(self):
        with patch.object(process_job_task, "delay") as delay:
            with self.captureOnCommitCallbacks(execute=False) as callbacks:
                with transaction.atomic():
                    job = submit(valid_data([{"name": "Ada"}, {"name": "Grace"}]))
                    self.assertEqual(job.certificates.count(), 2)
                    delay.assert_not_called()
                delay.assert_not_called()

            self.assertEqual(len(callbacks), 1)
            callbacks[0]()
            delay.assert_called_once_with(str(job.id))

    def test_rolled_back_creation_queues_nothing(self):
        with patch.object(process_job_task, "delay") as delay:
            with self.captureOnCommitCallbacks(execute=True) as callbacks:
                with self.assertRaisesRegex(RuntimeError, "roll back"):
                    with transaction.atomic():
                        submit(valid_data())
                        raise RuntimeError("roll back")

        self.assertEqual(callbacks, [])
        delay.assert_not_called()
        self.assertEqual(GenerationJob.objects.count(), 0)
        self.assertEqual(Certificate.objects.count(), 0)

    def test_eager_dispatch_updates_postgresql_and_stores_pdf(self):
        with self.captureOnCommitCallbacks(execute=True):
            job = submit(valid_data([{"name": "Ada"}]))

        job.refresh_from_db()
        certificate = job.certificates.get()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED)
        self.assertEqual(certificate.status, Certificate.Status.GENERATED)
        self.assertEqual(job.get_progress()["percent_complete"], 100)
        self.assertTrue(Path(certificate.pdf_file.path).is_file())
        with certificate.pdf_file.open("rb") as pdf:
            self.assertEqual(pdf.read(4), b"%PDF")

    def test_broker_failure_is_logged_and_leaves_job_pending(self):
        with patch.object(process_job_task, "delay", side_effect=ConnectionError("broker unavailable")):
            with self.assertLogs("certificates.services", level="ERROR") as logs:
                with self.captureOnCommitCallbacks(execute=True):
                    job = submit(valid_data())

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.PENDING)
        self.assertEqual(job.certificates.get().status, Certificate.Status.PENDING)
        self.assertEqual(GenerationJob.objects.count(), 1)
        self.assertIn(str(job.id), " ".join(logs.output))

    def test_duplicate_task_execution_does_not_regenerate(self):
        job = submit(valid_data())
        with patch("certificates.pdf_generator.generate_certificate_pdf", return_value=b"%PDF-fake") as generate:
            process_job_task.apply(args=[str(job.id)])
            process_job_task.apply(args=[str(job.id)])

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED)
        self.assertEqual(job.certificates.get().status, Certificate.Status.GENERATED)
        generate.assert_called_once()

    def test_already_processing_and_finished_jobs_are_skipped(self):
        for status in (GenerationJob.Status.PROCESSING, GenerationJob.Status.COMPLETED, GenerationJob.Status.FAILED):
            with self.subTest(status=status):
                job = submit(valid_data())
                job.status = status
                job.save(update_fields=["status"])
                with patch("certificates.pdf_generator.generate_certificate_pdf") as generate:
                    process_job_task.apply(args=[str(job.id)])
                job.refresh_from_db()
                self.assertEqual(job.status, status)
                self.assertIsNone(job.started_at)
                generate.assert_not_called()
