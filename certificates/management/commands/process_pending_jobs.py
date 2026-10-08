"""Management command to re-dispatch stale pending or interrupted processing jobs."""

from django.conf import settings
from django.core.management.base import BaseCommand

from certificates.services import recover_stale_jobs


class Command(BaseCommand):
    help = "Find stale PENDING or PROCESSING certificate jobs and re-dispatch them."

    def add_arguments(self, parser):
        default_minutes = getattr(settings, "STALE_JOB_MINUTES", 15)
        parser.add_argument(
            "--older-than-minutes",
            type=int,
            default=default_minutes,
            help=f"Age threshold in minutes for stale jobs (default: {default_minutes}).",
        )

    def handle(self, *args, **options):
        minutes = options["older_than_minutes"]
        self.stdout.write(f"Checking for jobs older than {minutes} minutes...")
        redispatched_pending, reset_processing = recover_stale_jobs(older_than_minutes=minutes)
        self.stdout.write(
            self.style.SUCCESS(
                f"Recovery complete: {redispatched_pending} pending job(s) re-dispatched, "
                f"{reset_processing} processing job(s) reset and re-dispatched."
            )
        )
