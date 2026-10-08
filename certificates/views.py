"""API views for certificate generation jobs, status, and certificate retrieval."""

import logging

from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from certificates.models import Certificate, GenerationJob
from certificates.serializers import (
    CertificateDetailSerializer,
    CertificateSerializer,
    GenerationJobSerializer,
    JobRequestSerializer,
    JobSummarySerializer,
)
from certificates.services import build_job_zip, create_job

logger = logging.getLogger(__name__)


class CertificateNotAvailableError(APIException):
    """Raised when a client requests download of a non-GENERATED certificate."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Certificate is not available."
    default_code = "certificate_not_available"


class JobCreateView(APIView):
    """Accept and validate a bulk job request (POST) or list jobs paginated (GET)."""

    def post(self, request):
        serializer = JobRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = create_job(serializer.validated_data)
        response_serializer = GenerationJobSerializer(job, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_202_ACCEPTED)

    def get(self, request):
        queryset = GenerationJob.objects.all().order_by("-created_at")
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = JobSummarySerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class JobDetailView(APIView):
    """Retrieve job details, progress counts, and per-recipient certificate results."""

    def get(self, request, job_id):
        job = get_object_or_404(
            GenerationJob.objects.prefetch_related("certificates"),
            pk=job_id,
        )
        serializer = GenerationJobSerializer(job, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class JobCertificateListView(APIView):
    """Retrieve a paginated, optionally filtered list of certificates for a job."""

    def get(self, request, job_id):
        job = get_object_or_404(GenerationJob, pk=job_id)
        status_filter = request.query_params.get("status")
        queryset = Certificate.objects.filter(job=job).order_by("row_number")
        if status_filter is not None:
            status_upper = status_filter.upper()
            if status_upper not in Certificate.Status.values:
                raise ValidationError(
                    {"status": [f"Invalid status filter '{status_filter}'. Allowed values: PENDING, GENERATED, FAILED."]}
                )
            queryset = queryset.filter(status=status_upper)

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = CertificateSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class JobZipDownloadView(APIView):
    """Download a ZIP archive containing all GENERATED certificates for a job."""

    def get(self, request, job_id):
        job = get_object_or_404(GenerationJob, pk=job_id)
        zip_bytes = build_job_zip(job)
        if zip_bytes is None:
            raise CertificateNotAvailableError("No generated certificates available for this job.")

        response = HttpResponse(zip_bytes, content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="job_{job.id}_certificates.zip"'
        response["Content-Length"] = len(zip_bytes)
        return response


class MalformedJobDetailView(APIView):
    """Return documented 404 error envelope when a job ID is not a valid UUID."""

    def get(self, request, job_id=None):
        raise Http404("Job not found.")


class CertificateDetailView(APIView):
    """Retrieve metadata for one certificate."""

    def get(self, request, certificate_id):
        certificate = get_object_or_404(Certificate, pk=certificate_id)
        serializer = CertificateDetailSerializer(certificate, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CertificateDownloadView(APIView):
    """Download the generated PDF file for a certificate."""

    def get(self, request, certificate_id):
        certificate = get_object_or_404(Certificate, pk=certificate_id)
        if certificate.status != Certificate.Status.GENERATED:
            raise CertificateNotAvailableError()

        if not certificate.pdf_file:
            logger.error("Certificate %s is GENERATED but has no pdf_file reference", certificate.id)
            raise Http404("Certificate file not found.")

        storage = certificate.pdf_file.storage
        name = certificate.pdf_file.name
        if not storage.exists(name):
            logger.error("Stored PDF file %s for certificate %s is missing on storage", name, certificate.id)
            raise Http404("Certificate file not found.")

        try:
            file_handle = storage.open(name, "rb")
        except OSError:
            logger.exception("Could not open PDF file %s for certificate %s", name, certificate.id)
            raise Http404("Certificate file not found.")

        filename = f"{certificate.certificate_number}.pdf"
        return FileResponse(
            file_handle,
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )


class MalformedCertificateView(APIView):
    """Return documented 404 error envelope when a certificate ID is not a valid UUID."""

    def get(self, request, certificate_id=None):
        raise Http404("Certificate not found.")


def custom_404_view(request, exception=None):
    """Return standard error envelope for 404s outside DRF views."""
    return JsonResponse(
        {
            "error": {
                "code": "not_found",
                "message": "The requested resource was not found.",
                "details": {},
            }
        },
        status=404,
    )
