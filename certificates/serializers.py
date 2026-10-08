"""Validate job input and format job and certificate responses."""

import re
import unicodedata

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from certificates.models import Certificate, GenerationJob


class ISODateField(serializers.DateField):
    """Accept only the documented YYYY-MM-DD JSON date format."""

    def to_internal_value(self, value):
        if not isinstance(value, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value):
            self.fail("invalid", format="YYYY-MM-DD")
        return super().to_internal_value(value)


class JobRequestSerializer(serializers.Serializer):
    event_name = serializers.CharField(max_length=150, trim_whitespace=True)
    organization_name = serializers.CharField(max_length=100, trim_whitespace=True)
    issue_date = ISODateField(default=timezone.localdate)
    # Item shape is intentionally checked later, one recipient at a time.
    recipients = serializers.ListField(
        child=serializers.JSONField(allow_null=True), allow_empty=False
    )

    def validate_recipients(self, value):
        if len(value) > settings.MAX_RECIPIENTS_PER_JOB:
            raise serializers.ValidationError(
                f"Ensure this field has no more than {settings.MAX_RECIPIENTS_PER_JOB} elements."
            )
        return value


class RecipientSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    email = serializers.EmailField(max_length=254, required=False)

    def to_internal_value(self, data):
        if isinstance(data, dict) and "name" in data:
            name = data["name"]
            if not isinstance(name, str):
                raise serializers.ValidationError({"name": ["A valid string is required."]})
            if any(unicodedata.category(character) == "Cc" for character in name):
                raise serializers.ValidationError(
                    {"name": ["Control characters are not allowed."]}
                )
        return super().to_internal_value(data)


class CertificateSerializer(serializers.ModelSerializer):
    error = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            "id",
            "row_number",
            "certificate_number",
            "recipient_name",
            "recipient_email",
            "status",
            "error",
            "download_url",
        )

    def get_error(self, certificate):
        if not certificate.error_type:
            return None
        return {"type": certificate.error_type, "message": certificate.error_message}

    def get_download_url(self, certificate):
        if certificate.status != Certificate.Status.GENERATED:
            return None
        path = f"/api/certificates/{certificate.id}/download/"
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path


class CertificateDetailSerializer(CertificateSerializer):
    class Meta(CertificateSerializer.Meta):
        fields = CertificateSerializer.Meta.fields + ("job_id", "generated_at")


class GenerationJobSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    certificates = CertificateSerializer(many=True, read_only=True)
    status_url = serializers.SerializerMethodField()

    class Meta:
        model = GenerationJob
        fields = (
            "id",
            "status",
            "event_name",
            "organization_name",
            "issue_date",
            "progress",
            "created_at",
            "started_at",
            "finished_at",
            "error_message",
            "certificates",
            "status_url",
        )

    def get_progress(self, job):
        return job.get_progress()

    def get_status_url(self, job):
        path = f"/api/jobs/{job.id}/"
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path


class JobSummarySerializer(serializers.ModelSerializer):
    """Paginated job list summary omitting the full per-recipient certificate list."""

    progress = serializers.SerializerMethodField()
    status_url = serializers.SerializerMethodField()

    class Meta:
        model = GenerationJob
        fields = (
            "id",
            "status",
            "event_name",
            "organization_name",
            "issue_date",
            "progress",
            "created_at",
            "started_at",
            "finished_at",
            "error_message",
            "status_url",
        )

    def get_progress(self, job):
        return job.get_progress()

    def get_status_url(self, job):
        path = f"/api/jobs/{job.id}/"
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path
