/**
 * Centralized API Client Layer for Bulk Certificate Generator.
 * Adapts to Django backend at commit cf5bb3d.
 *
 * Rules:
 * - All routes MUST have trailing slashes.
 * - Absolute backend URLs (e.g., http://localhost:8000/api/...) MUST be normalized
 *   to relative /api/... paths so they route cleanly through the Vite proxy.
 * - Standardized error envelopes are parsed into ApiClientError.
 */

import type { ApiErrorEnvelope } from '../types/api';

export class ApiClientError extends Error {
  public status: number;
  public envelope: ApiErrorEnvelope;

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.error.message || `Request failed with status ${status}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.envelope = envelope;
  }

  get code(): string {
    return this.envelope.error.code;
  }

  get details(): Record<string, unknown> {
    return (this.envelope.error.details as Record<string, unknown>) || {};
  }
}

/**
 * Normalizes any API URL into a clean relative path with a trailing slash.
 * Strips origin if the backend returned an absolute URI.
 * Examples:
 *   "http://localhost:8000/api/jobs/123/" -> "/api/jobs/123/"
 *   "/api/jobs/123"                      -> "/api/jobs/123/"
 *   "jobs/123/"                          -> "/api/jobs/123/"
 */
export function normalizeApiPath(urlOrPath: string): string {
  let path: string;

  try {
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const parsed = new URL(urlOrPath);
      path = parsed.pathname;
    } else {
      path = urlOrPath;
    }
  } catch {
    path = urlOrPath;
  }

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Ensure /api prefix
  if (!path.startsWith('/api/') && path !== '/api') {
    path = `/api${path}`;
  }

  // Ensure trailing slash (before any query parameters)
  const [pathname, search] = path.split('?');
  const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;

  return search ? `${normalizedPath}?${search}` : normalizedPath;
}

/**
 * Extracts a suggested filename from Content-Disposition header.
 * Example: `attachment; filename="job_123_certificates.zip"`
 */
export function extractFilenameFromHeader(header: string | null, fallback: string): string {
  if (!header) return fallback;

  const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(header);
  if (matches && matches[1]) {
    return matches[1].replace(/['"]/g, '').trim();
  }
  return fallback;
}

/**
 * Generic JSON request handler.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedUrl = normalizeApiPath(path);

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(normalizedUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorEnvelope: ApiErrorEnvelope;
    try {
      errorEnvelope = await response.json();
    } catch {
      errorEnvelope = {
        error: {
          code: 'network_or_server_error',
          message: response.statusText || `HTTP ${response.status} Error`,
          details: {},
        },
      };
    }
    throw new ApiClientError(response.status, errorEnvelope);
  }

  return (await response.json()) as T;
}

/**
 * Generic binary download handler (for PDF & ZIP files).
 */
export async function apiDownload(
  path: string,
  options: RequestInit = {},
  defaultFilename = 'download'
): Promise<{ blob: Blob; filename: string }> {
  const normalizedUrl = normalizeApiPath(path);

  const response = await fetch(normalizedUrl, {
    ...options,
  });

  if (!response.ok) {
    let errorEnvelope: ApiErrorEnvelope;
    try {
      errorEnvelope = await response.json();
    } catch {
      errorEnvelope = {
        error: {
          code: response.status === 409 ? 'certificate_not_available' : 'download_failed',
          message: `Download failed with HTTP ${response.status}`,
          details: {},
        },
      };
    }
    throw new ApiClientError(response.status, errorEnvelope);
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = extractFilenameFromHeader(contentDisposition, defaultFilename);
  const blob = await response.blob();

  return { blob, filename };
}

/**
 * Helper to trigger browser download of a received Blob.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}
