"""PostgreSQL records for certificate jobs and their individual results."""

import uuid
from datetime import date

from django.db import models
from django.db.models import Count, Q
from django.utils import timezone


def certificate_upload_path(certificate: "Certificate", filename: str) -> str:
    """Use only server-generated IDs in a certificate's storage path."""
    return f"certificates/{certificate.job_id}/{certificate.id}.pdf"


def build_certificate_number(issue_date: date, certificate_id: uuid.UUID) -> str:
    """Build the display number from the issue year and certificate UUID."""
    return f"CERT-{issue_date.year}-{certificate_id.hex[:12].upper()}"


class GenerationJob(models.Model):
    """An event's bulk certificate request and its processing state."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        COMPLETED_WITH_ERRORS = "COMPLETED_WITH_ERRORS", "Completed with errors"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(
        max_length=21, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    event_name = models.CharField(max_length=150)
    organization_name = models.CharField(max_length=100)
    issue_date = models.DateField(default=timezone.localdate)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def get_progress(self) -> dict[str, int | float]:
        """Count certificate rows in one query so progress cannot drift."""
        counts = self.certificates.aggregate(
            total=Count("id"),
            generated=Count("id", filter=Q(status=Certificate.Status.GENERATED)),
            failed=Count("id", filter=Q(status=Certificate.Status.FAILED)),
            pending=Count("id", filter=Q(status=Certificate.Status.PENDING)),
        )
        total = counts["total"]
        counts["percent_complete"] = (
            (counts["generated"] + counts["failed"]) / total * 100 if total else 0
        )
        return counts


class Certificate(models.Model):
    """One submitted recipient and the outcome of that certificate."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        GENERATED = "GENERATED", "Generated"
        FAILED = "FAILED", "Failed"

    class ErrorType(models.TextChoices):
        VALIDATION = "VALIDATION", "Validation"
        GENERATION = "GENERATION", "Generation"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_number = models.CharField(max_length=32, unique=True)
    job = models.ForeignKey(
        GenerationJob, related_name="certificates", on_delete=models.CASCADE
    )
    row_number = models.PositiveIntegerField()
    recipient_name = models.CharField(max_length=100, blank=True)
    recipient_email = models.EmailField(max_length=254, blank=True)
    status = models.CharField(
        max_length=9, choices=Status.choices, default=Status.PENDING
    )
    error_type = models.CharField(
        max_length=10, choices=ErrorType.choices, blank=True, default=""
    )
    error_message = models.CharField(max_length=500, blank=True)
    pdf_file = models.FileField(upload_to=certificate_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["row_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["job", "row_number"], name="unique_certificate_job_row"
            )
        ]
        indexes = [models.Index(fields=["job", "status"], name="cert_job_status_idx")]
