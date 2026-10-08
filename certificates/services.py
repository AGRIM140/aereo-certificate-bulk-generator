"""Create certificate jobs and process them without HTTP or Celery dependencies."""

import logging
import uuid

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from certificates import pdf_generator
from certificates.models import (
    Certificate,
    GenerationJob,
    build_certificate_number,
    certificate_upload_path,
)
from certificates.serializers import RecipientSerializer


logger = logging.getLogger(__name__)


def _validation_message(errors, row_number: int) -> str:
    """Turn serializer errors into a short, safe message for one row."""
    parts = []
    for field, messages in errors.items():
        for message in messages:
            parts.append(f"{field}: {message}")
    return f"Row {row_number}: {' '.join(parts)}"[:500]


def _certificate_for_recipient(job, recipient, row_number: int) -> Certificate:
    serializer = RecipientSerializer(data=recipient)
    certificate_id = uuid.uuid4()
    fields = {
        "id": certificate_id,
        "job": job,
        "row_number": row_number,
        "certificate_number": build_certificate_number(job.issue_date, certificate_id),
    }
    if serializer.is_valid():
        fields["recipient_name"] = serializer.validated_data["name"]
        fields["recipient_email"] = serializer.validated_data.get("email", "")
    else:
        if isinstance(recipient, dict):
            name = recipient.get("name")
            email = recipient.get("email")
            fields["recipient_name"] = name.strip()[:100] if isinstance(name, str) else ""
            fields["recipient_email"] = email.strip()[:254] if isinstance(email, str) else ""
        fields["status"] = Certificate.Status.FAILED
        fields["error_type"] = Certificate.ErrorType.VALIDATION
        fields["error_message"] = _validation_message(serializer.errors, row_number)
        logger.info("Certificate %s in job %s failed validation at row %s", certificate_id, job.id, row_number)
    return Certificate(**fields)


def create_job(validated_data: dict) -> GenerationJob:
    """Save one job and its rows, then queue processing after commit.

    ``validated_data`` comes from JobRequestSerializer. The HTTP view will
    perform request-level validation before calling this service in Phase 7.
    """
    with transaction.atomic():
        job = GenerationJob.objects.create(
            event_name=validated_data["event_name"],
            organization_name=validated_data["organization_name"],
            issue_date=validated_data["issue_date"],
        )
        certificates = [
            _certificate_for_recipient(job, recipient, row_number)
            for row_number, recipient in enumerate(validated_data["recipients"], start=1)
        ]
        Certificate.objects.bulk_create(certificates)
        dispatch_job(job.id)
    logger.info("Created certificate job %s with %s rows", job.id, len(certificates))
    return job


def dispatch_job(job_id: uuid.UUID) -> None:
    """Register one Celery dispatch only after the current transaction commits."""
    def queue_job() -> None:
        from certificates.tasks import process_job_task

        try:
            process_job_task.delay(str(job_id))
            logger.info("Queued certificate job %s", job_id)
        except Exception:
            # The job already committed; keep it PENDING for later recovery.
            logger.exception("Could not queue certificate job %s", job_id)

    transaction.on_commit(queue_job)


def _remove_partial_file(certificate: Certificate) -> None:
    """Remove a file even if storage wrote it before a database save failed."""
    storage = certificate.pdf_file.storage
    name = certificate.pdf_file.name or certificate_upload_path(certificate, "")
    try:
        storage.delete(name)
    except OSError:
        logger.exception("Could not remove partial PDF for certificate %s", certificate.id)
    certificate.pdf_file = None


def _mark_generation_failed(certificate: Certificate, message: str) -> None:
    certificate.status = Certificate.Status.FAILED
    certificate.error_type = Certificate.ErrorType.GENERATION
    certificate.error_message = message
    certificate.generated_at = None
    certificate.save(
        update_fields=["status", "error_type", "error_message", "pdf_file", "generated_at"]
    )


def finalize_job(job: GenerationJob) -> None:
    """Derive the terminal job state from certificate rows."""
    progress = job.get_progress()
    if progress["pending"]:
        logger.error("Certificate job %s has unprocessed rows at finalization", job.id)
        _fail_interrupted_job(job)
        return
    if progress["generated"] == 0:
        job.status = GenerationJob.Status.FAILED
    elif progress["failed"]:
        job.status = GenerationJob.Status.COMPLETED_WITH_ERRORS
    else:
        job.status = GenerationJob.Status.COMPLETED
    job.finished_at = timezone.now()
    job.save(update_fields=["status", "finished_at"])
    logger.info("Finished certificate job %s with status %s", job.id, job.status)


def _fail_interrupted_job(job: GenerationJob) -> None:
    """Keep a caught job-level error from leaving the job PROCESSING."""
    Certificate.objects.filter(job=job, status=Certificate.Status.PENDING).update(
        status=Certificate.Status.FAILED,
        error_type=Certificate.ErrorType.GENERATION,
        error_message="Job processing was interrupted.",
    )
    job.status = GenerationJob.Status.FAILED
    job.error_message = "Job processing was interrupted."
    job.finished_at = timezone.now()
    job.save(update_fields=["status", "error_message", "finished_at"])


def process_job(job_id: uuid.UUID | str) -> None:
    """Claim and process a job; the Celery task calls this service."""
    with transaction.atomic():
        job = GenerationJob.objects.select_for_update().filter(pk=job_id).first()
        if job is None:
            logger.info("Certificate job %s does not exist", job_id)
            return
        if job.status != GenerationJob.Status.PENDING:
            logger.info("Certificate job %s is already %s", job.id, job.status)
            return
        job.status = GenerationJob.Status.PROCESSING
        job.started_at = timezone.now()
        job.save(update_fields=["status", "started_at"])

    logger.info("Started certificate job %s", job.id)
    try:
        certificates = Certificate.objects.filter(
            job=job, status=Certificate.Status.PENDING
        ).order_by("row_number")
        for certificate in certificates.iterator():
            try:
                pdf_bytes = pdf_generator.generate_certificate_pdf(
                    certificate.recipient_name,
                    job.event_name,
                    job.organization_name,
                    job.issue_date,
                    certificate.certificate_number,
                )
                certificate.pdf_file.save(
                    f"{certificate.id}.pdf", ContentFile(pdf_bytes), save=False
                )
                certificate.status = Certificate.Status.GENERATED
                certificate.generated_at = timezone.now()
                certificate.save(update_fields=["pdf_file", "status", "generated_at"])
                logger.info("Generated certificate %s for job %s", certificate.id, job.id)
            except Exception as exc:
                logger.exception("Certificate %s failed in job %s", certificate.id, job.id)
                _remove_partial_file(certificate)
                message = (
                    "Text does not fit the certificate template."
                    if isinstance(exc, pdf_generator.TextDoesNotFitError)
                    else "Certificate generation failed."
                )
                try:
                    _mark_generation_failed(certificate, message)
                except Exception:
                    logger.exception("Could not record failure for certificate %s", certificate.id)
        finalize_job(job)
    except Exception:
        logger.exception("Certificate job %s crashed", job.id)
        _fail_interrupted_job(job)
