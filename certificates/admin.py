"""Django admin configuration for certificate generation models."""

from django.contrib import admin

from certificates.models import Certificate, GenerationJob


@admin.register(GenerationJob)
class GenerationJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "event_name",
        "organization_name",
        "issue_date",
        "status",
        "created_at",
        "finished_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("event_name", "organization_name", "id")
    readonly_fields = ("id", "created_at", "started_at", "finished_at")
    ordering = ("-created_at",)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "certificate_number",
        "job",
        "row_number",
        "recipient_name",
        "status",
        "generated_at",
    )
    list_filter = ("status", "error_type")
    search_fields = ("recipient_name", "recipient_email", "certificate_number", "id")
    readonly_fields = ("id", "certificate_number", "job", "row_number", "generated_at")
    ordering = ("job", "row_number")
