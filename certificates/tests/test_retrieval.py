"""Phase 8 tests for certificate metadata retrieval and PDF download."""

import uuid
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
