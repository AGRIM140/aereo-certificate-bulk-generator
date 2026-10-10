"""Project URL routes."""

from django.urls import include, path
from config.health import health

urlpatterns = [
    path("health/", health),
    path("api/", include("certificates.urls")),
]

handler404 = "certificates.views.custom_404_view"
