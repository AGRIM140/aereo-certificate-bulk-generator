"""API views for certificate generation jobs and status retrieval."""

from django.http import Http404, JsonResponse
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from certificates.models import GenerationJob
from certificates.serializers import GenerationJobSerializer, JobRequestSerializer
from certificates.services import create_job


class JobCreateView(APIView):
    """Accept and validate a bulk job request and return 202 Accepted."""

    def post(self, request):
        serializer = JobRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = create_job(serializer.validated_data)
        response_serializer = GenerationJobSerializer(job, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_202_ACCEPTED)


class JobDetailView(APIView):
    """Retrieve job details, progress counts, and per-recipient certificate results."""

    def get(self, request, job_id):
        job = get_object_or_404(
            GenerationJob.objects.prefetch_related("certificates"),
            pk=job_id,
        )
        serializer = GenerationJobSerializer(job, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MalformedJobDetailView(APIView):
    """Return documented 404 error envelope when a job ID is not a valid UUID."""

    def get(self, request, job_id=None):
        raise Http404("Job not found.")


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
