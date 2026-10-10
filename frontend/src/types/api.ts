/**
 * TypeScript types matching the backend models and serializers.
 * Source of truth: certificates/models.py and certificates/serializers.py
 * Production Release: v1.0.0
 */

export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type CertificateStatus = 'PENDING' | 'GENERATED' | 'FAILED';

export type CertificateErrorType = 'VALIDATION' | 'GENERATION';

export interface CertificateError {
  type: CertificateErrorType;
  message: string;
}

export interface JobProgress {
  total: number;
  generated: number;
  failed: number;
  pending: number;
  percent_complete: number;
}

export interface RecipientInput {
  name: string;
  email?: string;
}

export interface JobRequest {
  event_name: string;
  organization_name: string;
  issue_date?: string; // YYYY-MM-DD
  recipients: RecipientInput[];
}

export interface Certificate {
  id: string; // UUID
  row_number: number;
  certificate_number: string;
  recipient_name: string;
  recipient_email: string;
  status: CertificateStatus;
  error: CertificateError | null;
  download_url: string | null;
}

export interface CertificateDetail extends Certificate {
  job_id: string; // UUID
  generated_at: string | null; // ISO-8601
}

export interface GenerationJob {
  id: string; // UUID
  status: JobStatus;
  event_name: string;
  organization_name: string;
  issue_date: string; // YYYY-MM-DD
  progress: JobProgress;
  created_at: string; // ISO-8601
  started_at: string | null; // ISO-8601
  finished_at: string | null; // ISO-8601
  error_message: string;
  certificates: Certificate[];
  status_url: string;
}

export interface JobSummary {
  id: string; // UUID
  status: JobStatus;
  event_name: string;
  organization_name: string;
  issue_date: string; // YYYY-MM-DD
  progress: JobProgress;
  created_at: string; // ISO-8601
  started_at: string | null; // ISO-8601
  finished_at: string | null; // ISO-8601
  error_message: string;
  status_url: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiErrorDetail {
  [key: string]: string | string[] | ApiErrorDetail;
}

export interface ApiErrorEnvelope {
  error: {
    code:
      | 'validation_error'
      | 'not_found'
      | 'method_not_allowed'
      | 'certificate_not_available'
      | 'unsupported_media_type'
      | 'error'
      | string;
    message: string;
    details: ApiErrorDetail | Record<string, unknown>;
  };
}

/**
 * Status classification helpers
 */
export const TERMINAL_JOB_STATUSES: readonly JobStatus[] = [
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
] as const;

export const ACTIVE_JOB_STATUSES: readonly JobStatus[] = [
  'PENDING',
  'PROCESSING',
] as const;

export function isJobTerminal(status: JobStatus): boolean {
  return TERMINAL_JOB_STATUSES.includes(status);
}

export function isJobActive(status: JobStatus): boolean {
  return ACTIVE_JOB_STATUSES.includes(status);
}
