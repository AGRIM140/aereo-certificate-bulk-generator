"""Give DRF errors the documented, consistent JSON envelope."""

from rest_framework.views import exception_handler as drf_exception_handler


ERRORS = {
    400: ("validation_error", "The request data is invalid."),
    404: ("not_found", "The requested resource was not found."),
    405: ("method_not_allowed", "This method is not allowed."),
    409: ("certificate_not_available", "Certificate is not available."),
    415: ("unsupported_media_type", "The content type is not supported."),
}


def _plain_details(value):
    if isinstance(value, dict):
        return {key: _plain_details(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_plain_details(item) for item in value]
    return str(value)


def exception_handler(exc, context):
    """Preserve DRF status codes while normalizing their response bodies."""
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    code, message = ERRORS.get(response.status_code, ("error", "An error occurred."))
    details = _plain_details(response.data) if response.status_code == 400 else {}
    response.data = {"error": {"code": code, "message": message, "details": details}}
    return response
