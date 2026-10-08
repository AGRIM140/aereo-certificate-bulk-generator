"""Project URL routes."""

from django.urls import include, path

urlpatterns = [
    path("api/", include("certificates.urls")),
]

handler404 = "certificates.views.custom_404_view"
