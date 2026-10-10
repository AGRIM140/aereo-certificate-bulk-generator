/**
 * API functions for Certificates.
 */

import { apiDownload, apiRequest, triggerBrowserDownload } from './client';
import type { CertificateDetail } from '../types/api';

/**
 * Retrieve metadata for a single certificate.
 * GET /api/certificates/{certificate_id}/
 */
export async function getCertificateDetail(
  certificateId: string,
  signal?: AbortSignal
): Promise<CertificateDetail> {
  return apiRequest<CertificateDetail>(`/api/certificates/${certificateId}/`, {
    method: 'GET',
    signal,
  });
}

/**
 * Download the generated PDF file for a certificate.
 * GET /api/certificates/{certificate_id}/download/
 */
export async function downloadCertificatePdf(
  certificateId: string,
  signal?: AbortSignal
): Promise<{ blob: Blob; filename: string }> {
  return apiDownload(
    `/api/certificates/${certificateId}/download/`,
    { method: 'GET', signal },
    `certificate_${certificateId}.pdf`
  );
}

/**
 * Convenience helper to download and trigger browser file save.
 */
export async function downloadAndSaveCertificatePdf(
  certificateId: string,
  fallbackFilename?: string,
  signal?: AbortSignal
): Promise<string> {
  const { blob, filename } = await downloadCertificatePdf(certificateId, signal);
  triggerBrowserDownload(blob, fallbackFilename || filename);
  return filename;
}
