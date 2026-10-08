"""Phase 9 tests for process_pending_jobs management command."""

from datetime import timedelta
import io

from django.core.management import call_command
from django.utils import timezone

from certificates.models import Certificate, GenerationJob
from certificates.tests.helpers import CeleryEagerTestCase
from certificates.tests.test_job_creation import submit, valid_data


class ProcessPendingJobsCommandTests(CeleryEagerTestCase):
    def test_command_redispatches_stale_pending_job(self):
        job = submit(valid_data([{"name": "Ada Lovelace"}]))
        self.assertEqual(job.status, GenerationJob.Status.PENDING)

        past_time = timezone.now() - timedelta(minutes=30)
        GenerationJob.objects.filter(pk=job.id).update(created_at=past_time)

        out = io.StringIO()
        with self.captureOnCommitCallbacks(execute=True):
            call_command("process_pending_jobs", older_than_minutes=15, stdout=out)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED)
        self.assertIn("1 pending job(s) re-dispatched", out.getvalue())

    def test_command_resets_stale_processing_job(self):
        job = submit(valid_data([{"name": "Ada Lovelace"}, {"name": "Grace Hopper"}]))
        first_cert = job.certificates.get(row_number=1)
        first_cert.status = Certificate.Status.GENERATED
        first_cert.generated_at = timezone.now()
        first_cert.save(update_fields=["status", "generated_at"])

        past_time = timezone.now() - timedelta(minutes=30)
        GenerationJob.objects.filter(pk=job.id).update(
            status=GenerationJob.Status.PROCESSING,
            started_at=past_time,
        )

        out = io.StringIO()
        with self.captureOnCommitCallbacks(execute=True):
            call_command("process_pending_jobs", older_than_minutes=15, stdout=out)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.Status.COMPLETED)
        self.assertIn("1 processing job(s) reset and re-dispatched", out.getvalue())
        for cert in job.certificates.all():
            self.assertEqual(cert.status, Certificate.Status.GENERATED)

    def test_command_ignores_recent_jobs(self):
        recent_pending = submit(valid_data([{"name": "Recent User"}]))
        self.assertEqual(recent_pending.status, GenerationJob.Status.PENDING)

        out = io.StringIO()
        with self.captureOnCommitCallbacks(execute=True):
            call_command("process_pending_jobs", older_than_minutes=15, stdout=out)

        recent_pending.refresh_from_db()
        self.assertEqual(recent_pending.status, GenerationJob.Status.PENDING)
        self.assertIn("0 pending job(s) re-dispatched", out.getvalue())
        self.assertIn("0 processing job(s) reset", out.getvalue())
