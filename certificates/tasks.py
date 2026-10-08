"""Thin Celery entry point for background certificate processing."""

from celery import shared_task

from certificates import services


@shared_task
def process_job_task(job_id: str) -> None:
    """Load and process the job identified by its UUID string."""
    services.process_job(job_id)
