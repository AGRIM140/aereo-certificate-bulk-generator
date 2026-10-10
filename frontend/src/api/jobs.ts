/**
 * API functions for Generation Jobs.
 */

import { apiDownload, apiRequest, triggerBrowserDownload } from './client';
import type {
  Certificate,
  CertificateStatus,
  GenerationJob,
  JobRequest,
  JobSummary,
  PaginatedResponse,
} from '../types/api';

/**
 * Submit a new bulk certificate generation job.
 * POST /api/jobs/
 * Returns HTTP 202 Accepted with GenerationJob data.
 */
export async function createJob(
  payload: JobRequest,
  signal?: AbortSignal
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>('/api/jobs/', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * List generation jobs paginated, newest first.
 * GET /api/jobs/
 */
export async function getJobs(
  page = 1,
  signal?: AbortSignal
): Promise<PaginatedResponse<JobSummary>> {
  const query = page > 1 ? `?page=${page}` : '';
  return apiRequest<PaginatedResponse<JobSummary>>(`/api/jobs/${query}`, {
    method: 'GET',
    signal,
  });
}

/**
 * Retrieve status, progress, and certificates for a single job.
 * GET /api/jobs/{job_id}/
 */
export async function getJobDetail(
  jobId: string,
  signal?: AbortSignal
): Promise<GenerationJob> {
  return apiRequest<GenerationJob>(`/api/jobs/${jobId}/`, {
    method: 'GET',
    signal,
  });
}

/**
 * Retrieve paginated and optionally filtered certificate list for a job.
 * GET /api/jobs/{job_id}/certificates/?status=...&page=...
 */
export async function getJobCertificates(
  jobId: string,
  options?: { page?: number; status?: CertificateStatus },
  signal?: AbortSignal
): Promise<PaginatedResponse<Certificate>> {
  const params = new URLSearchParams();
  if (options?.page && options.page > 1) {
    params.set('page', String(options.page));
  }
  if (options?.status) {
    params.set('status', options.status);
  }
  const queryString = params.toString();
  const path = `/api/jobs/${jobId}/certificates/${queryString ? `?${queryString}` : ''}`;

  return apiRequest<PaginatedResponse<Certificate>>(path, {
    method: 'GET',
    signal,
  });
}

/**
 * Download a ZIP archive containing all GENERATED certificates for a job.
 * GET /api/jobs/{job_id}/download/
 */
export async function downloadJobZip(
  jobId: string,
  signal?: AbortSignal
): Promise<{ blob: Blob; filename: string }> {
  return apiDownload(
    `/api/jobs/${jobId}/download/`,
    { method: 'GET', signal },
    `job_${jobId}_certificates.zip`
  );
}

/**
 * Convenience helper to download and automatically trigger browser file save.
 */
export async function downloadAndSaveJobZip(
  jobId: string,
  signal?: AbortSignal
): Promise<string> {
  const { blob, filename } = await downloadJobZip(jobId, signal);
  triggerBrowserDownload(blob, filename);
  return filename;
}
