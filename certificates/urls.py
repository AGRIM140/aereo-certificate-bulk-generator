"""Certificate API routes."""

from django.urls import path

from certificates.views import JobCreateView, JobDetailView, MalformedJobDetailView

urlpatterns = [
    path("jobs/", JobCreateView.as_view(), name="job-create"),
    path("jobs/<uuid:job_id>/", JobDetailView.as_view(), name="job-detail"),
    path("jobs/<str:job_id>/", MalformedJobDetailView.as_view(), name="job-detail-malformed"),
]
