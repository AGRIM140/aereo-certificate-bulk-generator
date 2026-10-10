"""Storage regression checks; fake S3 transport, real ORM and PDF generation."""

import io
import zipfile
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError, EndpointConnectionError
from django.core.files.base import ContentFile, File
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from certificates.models import Certificate
from certificates.services import process_job
from certificates.storage import CertificateStorageUnavailable, PrivateCertificateStorage
from certificates.tests.helpers import CeleryEagerTestCase
from certificates.tests.test_job_creation import submit, valid_data


def provider_error(status):
    return ClientError({
        "Error": {"Code": str(status), "Message": "private-provider-detail"},
        "ResponseMetadata": {"HTTPStatusCode": status},
    }, "HeadObject")


def object_storage():
    return PrivateCertificateStorage(
        bucket_name="synthetic-test-bucket", access_key="test-access",
        secret_key="test-secret", endpoint_url="https://storage.example",
        region_name="test-region", default_acl=None, querystring_auth=True,
        file_overwrite=True, object_parameters={"CacheControl": "private, no-store"},
    )


class ObjectStorageTests(SimpleTestCase):
    def test_upload_keeps_uuid_path_and_private_parameters(self):
        storage = object_storage()
        storage._bucket = Mock()
        name = "certificates/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.pdf"
        self.assertEqual(storage.save(name, ContentFile(b"%PDF-test")), name)
        storage._bucket.Object.assert_called_with(name)
        args = storage._bucket.Object.return_value.upload_fileobj.call_args
        self.assertEqual(args.args[0].read(), b"%PDF-test")
        self.assertNotIn("ACL", args.kwargs["ExtraArgs"])
        self.assertEqual(args.kwargs["ExtraArgs"]["CacheControl"], "private, no-store")
        self.assertTrue(storage.querystring_auth)

    def test_retrieval_finishes_before_returning_file(self):
        storage = object_storage()
        source = File(io.BytesIO(b"%PDF-test"))
        with patch("storages.backends.s3.S3Storage._open", return_value=source):
            with storage.open("certificates/test.pdf") as result:
                self.assertEqual(result.read(), b"%PDF-test")
        self.assertTrue(source.closed)

    def test_missing_object_is_false_and_missing_open_is_file_not_found(self):
        storage = object_storage()
        storage._connections.connection = Mock()
        storage.connection.meta.client.head_object.side_effect = provider_error(404)
        self.assertFalse(storage.exists("missing.pdf"))
        with patch("storages.backends.s3.S3Storage._open", side_effect=provider_error(404)):
            with self.assertRaises(FileNotFoundError):
                storage.open("missing.pdf")

    def test_provider_failures_have_safe_messages(self):
        for method, arguments in (
            ("_open", ("test.pdf", "rb")),
            ("_save", ("test.pdf", ContentFile(b"%PDF"))),
            ("exists", ("test.pdf",)),
            ("delete", ("test.pdf",)),
        ):
            for error in (provider_error(403), EndpointConnectionError(endpoint_url="https://private.example")):
                with self.subTest(method=method, error=type(error).__name__):
                    with patch(f"storages.backends.s3.S3Storage.{method}", side_effect=error):
                        with self.assertRaises(CertificateStorageUnavailable) as result:
                            getattr(object_storage(), method)(*arguments)
                    self.assertEqual(str(result.exception), "Certificate storage is unavailable.")

    def test_lazy_download_error_is_caught_before_response_streaming(self):
        source = Mock()
        source.__enter__ = Mock(return_value=source)
        source.__exit__ = Mock(return_value=False)
        source.read.side_effect = provider_error(503)
        with patch("storages.backends.s3.S3Storage._open", return_value=source):
            with self.assertRaises(CertificateStorageUnavailable):
                object_storage().open("test.pdf")


class ObjectStorageIntegrationTests(CeleryEagerTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.storage = object_storage()
        self.objects = {}
        self.storage._bucket = Mock()
        self.storage._connections.connection = Mock()

        def object_for(name):
            obj = Mock()
            def upload(content, **kwargs):
                self.objects[name] = content.read()
            obj.upload_fileobj.side_effect = upload
            return obj

        def head(**kwargs):
            if kwargs["Key"] not in self.objects:
                raise provider_error(404)
            return {}

        def retrieve(name, mode="rb"):
            if name not in self.objects:
                raise FileNotFoundError("Missing synthetic object")
            return ContentFile(self.objects[name])

        self.storage._bucket.Object.side_effect = object_for
        self.storage.connection.meta.client.head_object.side_effect = head
        field = Certificate._meta.get_field("pdf_file")
        storage_patch = patch.object(field, "storage", self.storage)
        storage_patch.start()
        self.addCleanup(storage_patch.stop)
        read_patch = patch("storages.backends.s3.S3Storage._open", side_effect=retrieve)
        read_patch.start()
        self.addCleanup(read_patch.stop)

    def generated_job(self):
        job = submit(valid_data([{"name": "Synthetic Release Test"}]))
        process_job(job.id)
        self.assertEqual(job.certificates.get().status, Certificate.Status.GENERATED)
        return job

    def test_processing_uploads_real_pdf_and_api_downloads_pdf_and_zip(self):
        job = self.generated_job()
        cert = job.certificates.get()
        self.assertEqual(cert.pdf_file.name, f"certificates/{job.id}/{cert.id}.pdf")
        self.assertTrue(self.objects[cert.pdf_file.name].startswith(b"%PDF"))
        response = self.client.get(f"/api/certificates/{cert.id}/download/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(b"".join(response.streaming_content), self.objects[cert.pdf_file.name])
        archive_response = self.client.get(f"/api/jobs/{job.id}/download/")
        self.assertEqual(archive_response.status_code, 200)
        with zipfile.ZipFile(io.BytesIO(archive_response.content)) as archive:
            self.assertEqual(archive.namelist(), [f"0001_{cert.certificate_number}.pdf"])
            self.assertEqual(archive.read(archive.namelist()[0]), self.objects[cert.pdf_file.name])

    def test_missing_object_keeps_existing_pdf_and_zip_error_contract(self):
        job = self.generated_job()
        cert = job.certificates.get()
        self.objects.clear()
        self.assertEqual(self.client.get(f"/api/certificates/{cert.id}/download/").status_code, 404)
        self.assertEqual(self.client.get(f"/api/jobs/{job.id}/download/").status_code, 409)

    def test_storage_outage_returns_safe_503_for_pdf_and_zip(self):
        job = self.generated_job()
        cert = job.certificates.get()
        self.storage.connection.meta.client.head_object.side_effect = provider_error(403)
        for path in (f"/api/certificates/{cert.id}/download/", f"/api/jobs/{job.id}/download/"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.data["error"], {
                    "code": "storage_unavailable",
                    "message": "Certificate storage is temporarily unavailable.",
                    "details": {},
                })

    def test_upload_outage_records_generation_failure(self):
        job = submit(valid_data([{"name": "Synthetic Release Test"}]))
        with patch.object(self.storage, "_save", side_effect=CertificateStorageUnavailable("Safe message")):
            process_job(job.id)
        cert = job.certificates.get()
        self.assertEqual(cert.status, Certificate.Status.FAILED)
        self.assertEqual(cert.error_type, Certificate.ErrorType.GENERATION)
        self.assertNotIn("private-provider-detail", cert.error_message)


class HealthTests(TestCase):
    def test_database_readiness(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_database_failure_is_safe(self):
        from django.db import OperationalError
        with patch("config.health.connection.cursor", side_effect=OperationalError("private-db-detail")):
            response = self.client.get("/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})
