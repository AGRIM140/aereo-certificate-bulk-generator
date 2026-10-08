"""Phase 8 & 9 tests for certificate metadata retrieval, PDF download, filtering, and ZIP download."""

import io
import uuid
import zipfile
from pathlib import Path

from rest_framework import status
from rest_framework.test import APIClient

from certificates.models import Certificate
from certificates.services import process_job
from certificates.tests.helpers import CeleryEagerTestCase
from certificates.tests.test_job_creation import submit, valid_data


class CertificateRetrievalTests(CeleryEagerTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_certificate_metadata(self):
        job = submit(valid_data([{"name": "Ada Lovelace", "email": "ada@example.com"}]))
        certificate = job.certificates.get()
        response = self.client.get(f"/api/certificates/{certificate.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(certificate.id))
        self.assertEqual(response.data["job_id"], certificate.job_id)
        self.assertEqual(response.data["row_number"], 1)
        self.assertEqual(response.data["recipient_name"], "Ada Lovelace")
        self.assertEqual(response.data["recipient_email"], "ada@example.com")
        self.assertEqual(response.data["certificate_number"], certificate.certificate_number)
        self.assertEqual(response.data["status"], Certificate.Status.PENDING)
        self.assertIsNone(response.data["error"])
        self.assertIsNone(response.data["download_url"])
        self.assertIsNone(response.data["generated_at"])

    def test_certificate_number_in_api_response(self):
        job = submit(valid_data([{"name": "Grace Hopper"}]))
        certificate = job.certificates.get()
        response = self.client.get(f"/api/certificates/{certificate.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["certificate_number"].startswith(f"CERT-{job.issue_date.year}-"))
        self.assertEqual(response.data["certificate_number"], certificate.certificate_number)

    def test_download_returns_pdf(self):
        job = submit(valid_data([{"name": "Ada Lovelace"}]))
        process_job(job.id)
        certificate = job.certificates.get()

        response = self.client.get(f"/api/certificates/{certificate.id}/download/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertEqual(
            response["Content-Disposition"],
            f'attachment; filename="{certificate.certificate_number}.pdf"',
        )
        content = b"".join(response.streaming_content)
        self.assertTrue(content.startswith(b"%PDF"))

    def test_unknown_certificate_404(self):
        unknown_id = uuid.uuid4()
        detail_resp = self.client.get(f"/api/certificates/{unknown_id}/")
        self.assertEqual(detail_resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(detail_resp.data["error"]["code"], "not_found")
        self.assertEqual(detail_resp.data["error"]["message"], "The requested resource was not found.")

        download_resp = self.client.get(f"/api/certificates/{unknown_id}/download/")
        self.assertEqual(download_resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(download_resp.data["error"]["code"], "not_found")

    def test_malformed_certificate_id_404(self):
        for bad_id in ("not-a-uuid", "123", "bad-cert-id"):
            with self.subTest(bad_id=bad_id):
                resp_detail = self.client.get(f"/api/certificates/{bad_id}/")
                self.assertEqual(resp_detail.status_code, status.HTTP_404_NOT_FOUND)
                self.assertEqual(resp_detail.data["error"]["code"], "not_found")

                resp_dl = self.client.get(f"/api/certificates/{bad_id}/download/")
                self.assertEqual(resp_dl.status_code, status.HTTP_404_NOT_FOUND)
                self.assertEqual(resp_dl.data["error"]["code"], "not_found")

    def test_download_pending_or_failed_returns_409(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": ""}]))
        pending_cert = job.certificates.get(row_number=1)
        failed_cert = job.certificates.get(row_number=2)

        resp_pending = self.client.get(f"/api/certificates/{pending_cert.id}/download/")
        self.assertEqual(resp_pending.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp_pending.data["error"]["code"], "certificate_not_available")
        self.assertEqual(resp_pending.data["error"]["message"], "Certificate is not available.")

        resp_failed = self.client.get(f"/api/certificates/{failed_cert.id}/download/")
        self.assertEqual(resp_failed.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp_failed.data["error"]["code"], "certificate_not_available")

    def test_missing_file_returns_404_without_path_leak(self):
        job = submit(valid_data([{"name": "Ada"}]))
        process_job(job.id)
        certificate = job.certificates.get()

        storage = certificate.pdf_file.storage
        file_path = certificate.pdf_file.path
        storage.delete(certificate.pdf_file.name)
        self.assertFalse(Path(file_path).exists())

        with self.assertLogs("certificates.views", level="ERROR") as logs:
            response = self.client.get(f"/api/certificates/{certificate.id}/download/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"]["code"], "not_found")
        self.assertNotIn(file_path, str(response.data))
        self.assertNotIn("media", str(response.data))
        self.assertTrue(any(str(certificate.id) in log for log in logs.output))

    def test_storage_path_uses_only_uuids(self):
        job = submit(valid_data([{"name": "Ada Lovelace"}]))
        process_job(job.id)
        certificate = job.certificates.get()

        expected_rel_path = f"certificates/{job.id}/{certificate.id}.pdf"
        self.assertEqual(certificate.pdf_file.name, expected_rel_path)

    def test_malicious_name_does_not_affect_path(self):
        malicious_name = "../../../etc/passwd"
        job = submit(valid_data([{"name": malicious_name}]))
        process_job(job.id)
        certificate = job.certificates.get()

        self.assertEqual(
            certificate.pdf_file.name,
            f"certificates/{job.id}/{certificate.id}.pdf",
        )
        self.assertNotIn("passwd", certificate.pdf_file.name)
        self.assertNotIn("..", certificate.pdf_file.name)

    def test_wrong_http_methods_return_405(self):
        job = submit(valid_data([{"name": "Ada"}]))
        certificate = job.certificates.get()

        for method in ("post", "put", "delete", "patch"):
            with self.subTest(method=method):
                resp1 = getattr(self.client, method)(f"/api/certificates/{certificate.id}/")
                self.assertEqual(resp1.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
                self.assertEqual(resp1.data["error"]["code"], "method_not_allowed")

                resp2 = getattr(self.client, method)(f"/api/certificates/{certificate.id}/download/")
                self.assertEqual(resp2.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
                self.assertEqual(resp2.data["error"]["code"], "method_not_allowed")

    def test_filter_by_status(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": ""}, {"name": "Grace"}]))
        # Row 1 is PENDING, Row 2 is FAILED (validation), Row 3 is PENDING
        resp_pending = self.client.get(f"/api/jobs/{job.id}/certificates/?status=PENDING")
        self.assertEqual(resp_pending.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_pending.data["count"], 2)
        for cert in resp_pending.data["results"]:
            self.assertEqual(cert["status"], Certificate.Status.PENDING)

        resp_failed = self.client.get(f"/api/jobs/{job.id}/certificates/?status=FAILED")
        self.assertEqual(resp_failed.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_failed.data["count"], 1)
        self.assertEqual(resp_failed.data["results"][0]["recipient_name"], "")
        self.assertEqual(resp_failed.data["results"][0]["status"], Certificate.Status.FAILED)

        resp_gen_none = self.client.get(f"/api/jobs/{job.id}/certificates/?status=GENERATED")
        self.assertEqual(resp_gen_none.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_gen_none.data["count"], 0)

        # Now process job (Ada & Grace will be GENERATED)
        process_job(job.id)
        resp_gen = self.client.get(f"/api/jobs/{job.id}/certificates/?status=generated")
        self.assertEqual(resp_gen.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_gen.data["count"], 2)
        for cert in resp_gen.data["results"]:
            self.assertEqual(cert["status"], Certificate.Status.GENERATED)

    def test_invalid_status_filter_400(self):
        job = submit(valid_data())
        response = self.client.get(f"/api/jobs/{job.id}/certificates/?status=INVALID_STATUS")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("status", response.data["error"]["details"])

    def test_job_certificate_list_pagination(self):
        job = submit(valid_data([{"name": f"User {i}"} for i in range(5)]))
        response = self.client.get(f"/api/jobs/{job.id}/certificates/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 5)
        self.assertEqual(len(response.data["results"]), 5)
        row_numbers = [c["row_number"] for c in response.data["results"]]
        self.assertEqual(row_numbers, [1, 2, 3, 4, 5])

    def test_job_certificate_list_unknown_and_malformed_job_404(self):
        unknown_id = uuid.uuid4()
        resp_unknown = self.client.get(f"/api/jobs/{unknown_id}/certificates/")
        self.assertEqual(resp_unknown.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp_unknown.data["error"]["code"], "not_found")

        resp_malformed = self.client.get("/api/jobs/not-a-uuid/certificates/")
        self.assertEqual(resp_malformed.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp_malformed.data["error"]["code"], "not_found")

    def test_zip_contains_only_generated(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": ""}, {"name": "Grace"}]))
        process_job(job.id)
        # Ada (row 1) and Grace (row 3) are GENERATED; row 2 is FAILED
        response = self.client.get(f"/api/jobs/{job.id}/download/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/zip")
        self.assertEqual(
            response["Content-Disposition"],
            f'attachment; filename="job_{job.id}_certificates.zip"',
        )

        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            namelist = sorted(archive.namelist())
            self.assertEqual(len(namelist), 2)
            self.assertTrue(namelist[0].startswith("0001_CERT-"))
            self.assertTrue(namelist[1].startswith("0003_CERT-"))
            for name in namelist:
                content = archive.read(name)
                self.assertTrue(content.startswith(b"%PDF"))

    def test_zip_409_when_none_generated(self):
        job = submit(valid_data([{"name": "Ada"}, {"name": ""}]))
        # Neither is GENERATED
        response = self.client.get(f"/api/jobs/{job.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"]["code"], "certificate_not_available")

    def test_zip_unknown_and_malformed_job_404(self):
        unknown_id = uuid.uuid4()
        resp_unknown = self.client.get(f"/api/jobs/{unknown_id}/download/")
        self.assertEqual(resp_unknown.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp_unknown.data["error"]["code"], "not_found")

        resp_malformed = self.client.get("/api/jobs/not-a-uuid/download/")
        self.assertEqual(resp_malformed.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp_malformed.data["error"]["code"], "not_found")

    def test_zip_missing_file_handled(self):
        job = submit(valid_data([{"name": "Ada"}]))
        process_job(job.id)
        cert = job.certificates.get()
        # Delete the file from storage
        cert.pdf_file.storage.delete(cert.pdf_file.name)

        response = self.client.get(f"/api/jobs/{job.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"]["code"], "certificate_not_available")

    def test_zip_and_certificate_list_wrong_http_methods_return_405(self):
        job = submit(valid_data([{"name": "Ada"}]))

        for method in ("post", "put", "delete", "patch"):
            with self.subTest(method=method):
                resp_list = getattr(self.client, method)(f"/api/jobs/{job.id}/certificates/")
                self.assertEqual(resp_list.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
                self.assertEqual(resp_list.data["error"]["code"], "method_not_allowed")

                resp_zip = getattr(self.client, method)(f"/api/jobs/{job.id}/download/")
                self.assertEqual(resp_zip.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
                self.assertEqual(resp_zip.data["error"]["code"], "method_not_allowed")
