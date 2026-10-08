"""Phase 3 request, recipient, response and error-format tests."""

import uuid
from datetime import date
from unittest.mock import patch

from django.test import SimpleTestCase, TestCase, override_settings
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.exceptions import MethodNotAllowed, NotFound, UnsupportedMediaType
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from certificates.models import Certificate, GenerationJob, build_certificate_number
from certificates.serializers import (
    CertificateDetailSerializer,
    CertificateSerializer,
    GenerationJobSerializer,
    JobRequestSerializer,
    RecipientSerializer,
)


class RequestValidationTests(SimpleTestCase):
    def valid_request(self, **changes):
        data = {
            "event_name": " Workshop ",
            "organization_name": " Club ",
            "recipients": [{"name": "Ada"}],
        }
        data.update(changes)
        return data

    def test_valid_request_trims_fields_and_defaults_issue_date(self):
        with patch("certificates.serializers.timezone.localdate", return_value=date(2026, 10, 8)):
            serializer = JobRequestSerializer(data=self.valid_request())
            self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["event_name"], "Workshop")
        self.assertEqual(serializer.validated_data["organization_name"], "Club")
        self.assertEqual(serializer.validated_data["issue_date"], date(2026, 10, 8))

    def test_explicit_iso_issue_date_and_unknown_keys(self):
        serializer = JobRequestSerializer(
            data=self.valid_request(issue_date="2026-10-09", extra="ignored")
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["issue_date"], date(2026, 10, 9))
        self.assertNotIn("extra", serializer.validated_data)

    def test_non_object_body_is_invalid(self):
        for body in ([], "text", None):
            with self.subTest(body=body):
                serializer = JobRequestSerializer(data=body)
                self.assertFalse(serializer.is_valid())
                self.assertIn("non_field_errors", serializer.errors)

    def test_required_and_blank_job_fields(self):
        for field in ("event_name", "organization_name"):
            with self.subTest(field=field):
                missing = self.valid_request()
                del missing[field]
                missing_serializer = JobRequestSerializer(data=missing)
                self.assertFalse(missing_serializer.is_valid())
                self.assertIn(field, missing_serializer.errors)
                blank = JobRequestSerializer(data=self.valid_request(**{field: "  "}))
                self.assertFalse(blank.is_valid())
                self.assertIn(field, blank.errors)

    def test_job_field_length_limits(self):
        for field, limit in (("event_name", 150), ("organization_name", 100)):
            with self.subTest(field=field):
                at_limit = JobRequestSerializer(data=self.valid_request(**{field: "x" * limit}))
                self.assertTrue(at_limit.is_valid(), at_limit.errors)
                over_limit = JobRequestSerializer(data=self.valid_request(**{field: "x" * (limit + 1)}))
                self.assertFalse(over_limit.is_valid())
                self.assertIn(field, over_limit.errors)

    def test_invalid_issue_dates_are_rejected(self):
        for value in ("2026-02-30", "2026-1-2", "09/10/2026", "not-a-date", None):
            with self.subTest(value=value):
                serializer = JobRequestSerializer(data=self.valid_request(issue_date=value))
                self.assertFalse(serializer.is_valid())
                self.assertIn("issue_date", serializer.errors)

    def test_recipients_are_required_nonempty_list(self):
        missing = self.valid_request()
        del missing["recipients"]
        for body in (missing, self.valid_request(recipients=[]), self.valid_request(recipients={"name": "Ada"})):
            with self.subTest(body=body):
                serializer = JobRequestSerializer(data=body)
                self.assertFalse(serializer.is_valid())
                self.assertIn("recipients", serializer.errors)

    @override_settings(MAX_RECIPIENTS_PER_JOB=2)
    def test_recipient_limit_is_configurable(self):
        two = JobRequestSerializer(data=self.valid_request(recipients=[{}, {}]))
        self.assertTrue(two.is_valid(), two.errors)
        three = JobRequestSerializer(data=self.valid_request(recipients=[{}, {}, {}]))
        self.assertFalse(three.is_valid())
        self.assertIn("recipients", three.errors)

    def test_malformed_recipients_remain_request_valid(self):
        recipients = [{"name": "Ada"}, {"name": " "}, "text", None, 3, []]
        serializer = JobRequestSerializer(data=self.valid_request(recipients=recipients))
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["recipients"], recipients)


class RecipientValidationTests(SimpleTestCase):
    def test_valid_name_email_and_unknown_key(self):
        serializer = RecipientSerializer(data={"name": " José Álvarez ", "email": "jose@example.com", "extra": 1})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data, {"name": "José Álvarez", "email": "jose@example.com"})

    def test_optional_email_is_omitted(self):
        serializer = RecipientSerializer(data={"name": "Ada"})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn("email", serializer.validated_data)

    def test_name_required_blank_and_string_only(self):
        for recipient in ({}, {"name": "  "}, {"name": 123}, {"name": None}, {"name": []}):
            with self.subTest(recipient=recipient):
                serializer = RecipientSerializer(data=recipient)
                self.assertFalse(serializer.is_valid())
                self.assertIn("name", serializer.errors)

    def test_name_limit(self):
        self.assertTrue(RecipientSerializer(data={"name": "x" * 100}).is_valid())
        serializer = RecipientSerializer(data={"name": "x" * 101})
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_control_characters_are_rejected_even_at_edges(self):
        for name in ("Ada\nLovelace", "Ada\r", "\tAda", "Ada\x00", "Ada\x7f"):
            with self.subTest(name=name):
                serializer = RecipientSerializer(data={"name": name})
                self.assertFalse(serializer.is_valid())
                self.assertIn("name", serializer.errors)

    def test_email_format_and_length(self):
        self.assertTrue(RecipientSerializer(data={"name": "Ada", "email": "a@b.co"}).is_valid())
        for email in ("abc", "", "x" * 250 + "@a.co"):
            with self.subTest(email=email):
                serializer = RecipientSerializer(data={"name": "Ada", "email": email})
                self.assertFalse(serializer.is_valid())
                self.assertIn("email", serializer.errors)

    def test_non_object_recipient_is_invalid(self):
        for item in (None, "Ada", 7, ["Ada"]):
            with self.subTest(item=item):
                serializer = RecipientSerializer(data=item)
                self.assertFalse(serializer.is_valid())
                self.assertIn("non_field_errors", serializer.errors)

    def test_mixed_recipients_keep_their_one_based_positions(self):
        items = [{"name": "Ada"}, {"name": " "}, {"name": "Grace"}, "bad row"]
        results = [(row_number, RecipientSerializer(data=item)) for row_number, item in enumerate(items, 1)]
        self.assertEqual([number for number, item in results if item.is_valid()], [1, 3])
        self.assertEqual([number for number, item in results if not item.is_valid()], [2, 4])
        self.assertIn("name", results[1][1].errors)
        self.assertIn("non_field_errors", results[3][1].errors)


class ErrorEnvelopeTests(SimpleTestCase):
    def handle(self, exception):
        return api_settings.EXCEPTION_HANDLER(exception, {})

    def test_handler_is_registered_and_formats_validation_details(self):
        exception = serializers.ValidationError({"recipients": ["This list may not be empty."]})
        response = self.handle(exception)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {
            "error": {
                "code": "validation_error",
                "message": "The request data is invalid.",
                "details": {"recipients": ["This list may not be empty."]},
            }
        })

    def test_other_documented_http_errors_use_envelope(self):
        cases = (
            (NotFound(), 404, "not_found"),
            (MethodNotAllowed("POST"), 405, "method_not_allowed"),
            (UnsupportedMediaType("text/plain"), 415, "unsupported_media_type"),
        )
        for exception, http_status, code in cases:
            with self.subTest(code=code):
                response = self.handle(exception)
                self.assertEqual(response.status_code, http_status)
                self.assertEqual(response.data["error"]["code"], code)
                self.assertEqual(response.data["error"]["details"], {})

    def test_certificate_unavailable_uses_409_envelope(self):
        from rest_framework.exceptions import APIException

        class Unavailable(APIException):
            status_code = 409

        response = self.handle(Unavailable())
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["error"]["code"], "certificate_not_available")

    def test_non_json_body_uses_415_envelope(self):
        class ValidationView(APIView):
            def post(self, request):
                serializer = JobRequestSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                return Response(serializer.validated_data)

        request = APIRequestFactory().post("/api/jobs/", "not JSON", content_type="text/plain")
        response = ValidationView.as_view()(request)
        self.assertEqual(response.status_code, 415)
        self.assertEqual(response.data["error"]["code"], "unsupported_media_type")

    def test_malformed_json_uses_400_envelope(self):
        class ValidationView(APIView):
            def post(self, request):
                serializer = JobRequestSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                return Response(serializer.validated_data)

        request = APIRequestFactory().post("/api/jobs/", "{broken", content_type="application/json")
        response = ValidationView.as_view()(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "validation_error")


class NoPersistenceTests(TestCase):
    def test_request_level_failure_creates_no_job(self):
        serializer = JobRequestSerializer(data={"event_name": "", "recipients": []})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(GenerationJob.objects.count(), 0)
        self.assertEqual(Certificate.objects.count(), 0)


class ResponseSerializerTests(TestCase):
    def test_job_and_certificate_output(self):
        job = GenerationJob.objects.create(
            event_name="Workshop", organization_name="Club", issue_date=date(2026, 10, 8)
        )
        generated_id = uuid.uuid4()
        generated = Certificate.objects.create(
            id=generated_id, job=job, row_number=1, recipient_name="Ada",
            certificate_number=build_certificate_number(job.issue_date, generated_id),
            status=Certificate.Status.GENERATED, generated_at=timezone.now(),
        )
        invalid_id = uuid.uuid4()
        Certificate.objects.create(
            id=invalid_id, job=job, row_number=2, recipient_name="",
            recipient_email="bad", certificate_number=build_certificate_number(job.issue_date, invalid_id),
            status=Certificate.Status.FAILED, error_type=Certificate.ErrorType.VALIDATION,
            error_message="name: This field may not be blank. email: Enter a valid email address.",
        )
        request = Request(APIRequestFactory().get("/api/jobs/", HTTP_HOST="testserver"))
        data = GenerationJobSerializer(job, context={"request": request}).data
        self.assertEqual(data["progress"]["total"], 2)
        self.assertEqual(data["progress"]["generated"], 1)
        self.assertEqual(data["progress"]["failed"], 1)
        self.assertEqual([item["row_number"] for item in data["certificates"]], [1, 2])
        self.assertEqual(data["certificates"][0]["certificate_number"], generated.certificate_number)
        self.assertEqual(data["certificates"][0]["download_url"], f"http://testserver/api/certificates/{generated.id}/download/")
        self.assertIsNone(data["certificates"][0]["error"])
        self.assertEqual(data["certificates"][1]["error"]["type"], "VALIDATION")
        self.assertIsNone(data["certificates"][1]["download_url"])
        self.assertEqual(data["status_url"], f"http://testserver/api/jobs/{job.id}/")

        detail = CertificateDetailSerializer(generated, context={"request": request}).data
        self.assertEqual(str(detail["job_id"]), str(job.id))
        self.assertIsNotNone(detail["generated_at"])
        self.assertNotIn("job_id", CertificateSerializer(generated).data)
