import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeApiPath,
  extractFilenameFromHeader,
  ApiClientError,
  apiRequest,
  apiDownload,
} from '../api/client';
import type { ApiErrorEnvelope } from '../types/api';

describe('normalizeApiPath', () => {
  it('adds trailing slash to relative paths', () => {
    expect(normalizeApiPath('/api/jobs')).toBe('/api/jobs/');
    expect(normalizeApiPath('/api/jobs/')).toBe('/api/jobs/');
  });

  it('adds /api prefix if missing', () => {
    expect(normalizeApiPath('/jobs/123')).toBe('/api/jobs/123/');
    expect(normalizeApiPath('jobs/123/')).toBe('/api/jobs/123/');
  });

  it('normalizes absolute backend URLs to relative proxy paths with trailing slashes', () => {
    expect(normalizeApiPath('http://localhost:8000/api/jobs/')).toBe('/api/jobs/');
    expect(
      normalizeApiPath(
        'http://localhost:8000/api/certificates/14b11094-349c-4860-9d5e-69ebc30c9ab6/download/'
      )
    ).toBe('/api/certificates/14b11094-349c-4860-9d5e-69ebc30c9ab6/download/');
  });

  it('preserves query parameters while enforcing trailing slash before query string', () => {
    expect(normalizeApiPath('https://backend.example/api/jobs/?page=2&status=FAILED'))
      .toBe('/api/jobs/?page=2&status=FAILED');
    expect(normalizeApiPath('/api/jobs?page=2')).toBe('/api/jobs/?page=2');
    expect(normalizeApiPath('/api/jobs/?page=2')).toBe('/api/jobs/?page=2');
    expect(
      normalizeApiPath('/api/jobs/123/certificates?status=FAILED&page=1')
    ).toBe('/api/jobs/123/certificates/?status=FAILED&page=1');
  });
});

describe('extractFilenameFromHeader', () => {
  it('extracts filename with quotes', () => {
    const header = 'attachment; filename="job_123_certificates.zip"';
    expect(extractFilenameFromHeader(header, 'default.zip')).toBe('job_123_certificates.zip');
  });

  it('extracts filename without quotes', () => {
    const header = 'attachment; filename=CERT-2026-14B11094349C.pdf';
    expect(extractFilenameFromHeader(header, 'default.pdf')).toBe('CERT-2026-14B11094349C.pdf');
  });

  it('returns fallback if header is null or malformed', () => {
    expect(extractFilenameFromHeader(null, 'fallback.pdf')).toBe('fallback.pdf');
    expect(extractFilenameFromHeader('inline', 'fallback.pdf')).toBe('fallback.pdf');
  });
});

describe('ApiClientError', () => {
  it('exposes status, code, and details from the error envelope', () => {
    const envelope: ApiErrorEnvelope = {
      error: {
        code: 'validation_error',
        message: 'The request data is invalid.',
        details: {
          event_name: ['This field is required.'],
        },
      },
    };

    const err = new ApiClientError(400, envelope);
    expect(err.status).toBe(400);
    expect(err.code).toBe('validation_error');
    expect(err.message).toBe('The request data is invalid.');
    expect(err.details).toEqual({ event_name: ['This field is required.'] });
  });
});

describe('apiRequest and apiDownload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('makes successful GET request and returns JSON', async () => {
    const mockData = { id: '123', status: 'PENDING' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await apiRequest<{ id: string; status: string }>('/api/jobs/123/');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/jobs/123/', expect.anything());
  });

  it('throws ApiClientError with standardized envelope on 400 Bad Request', async () => {
    const errorEnvelope: ApiErrorEnvelope = {
      error: {
        code: 'validation_error',
        message: 'The request data is invalid.',
        details: {
          recipients: ['Ensure this field has no more than 500 elements.'],
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => errorEnvelope,
    });

    await expect(apiRequest('/api/jobs/')).rejects.toThrow('The request data is invalid.');
  });

  it('handles binary download and extracts Content-Disposition filename', async () => {
    const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const headers = new Headers();
    headers.set('Content-Disposition', 'attachment; filename="CERT-2026-TEST.pdf"');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers,
      blob: async () => mockBlob,
    });

    const result = await apiDownload('/api/certificates/123/download/');
    expect(result.filename).toBe('CERT-2026-TEST.pdf');
    expect(result.blob).toBe(mockBlob);
  });
});
