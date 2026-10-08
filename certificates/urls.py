"""Certificate API routes."""

from django.urls import path

from certificates.views import (
    CertificateDetailView,
    CertificateDownloadView,
    JobCreateView,
    JobDetailView,
    MalformedCertificateView,
    MalformedJobDetailView,
)

urlpatterns = [
    path("jobs/", JobCreateView.as_view(), name="job-create"),
    path("jobs/<uuid:job_id>/", JobDetailView.as_view(), name="job-detail"),
    path("jobs/<str:job_id>/", MalformedJobDetailView.as_view(), name="job-detail-malformed"),
    path("certificates/<uuid:certificate_id>/", CertificateDetailView.as_view(), name="certificate-detail"),
    path("certificates/<uuid:certificate_id>/download/", CertificateDownloadView.as_view(), name="certificate-download"),
    path("certificates/<str:certificate_id>/download/", MalformedCertificateView.as_view(), name="certificate-download-malformed"),
    path("certificates/<str:certificate_id>/", MalformedCertificateView.as_view(), name="certificate-detail-malformed"),
]
