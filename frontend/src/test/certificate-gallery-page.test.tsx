import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CertificateGalleryPage } from '../pages/CertificateGalleryPage';
import * as jobsApi from '../api/jobs';
import * as certificatesApi from '../api/certificates';
import { ApiClientError } from '../api/client';
import type { Certificate, GenerationJob, PaginatedResponse } from '../types/api';

const mockJob: GenerationJob = {
  id: '587e4f8e-6b80-4438-b6a6-69ff421c364b',
  status: 'COMPLETED',
  event_name: 'Global Quantum Computing Summit 2026',
  organization_name: 'International Quantum Alliance',
  issue_date: '2026-10-09',
  progress: {
    total: 2,
    generated: 2,
    failed: 0,
    pending: 0,
    percent_complete: 100.0,
  },
  created_at: '2026-10-09T00:00:00Z',
  started_at: '2026-10-09T00:00:01Z',
  finished_at: '2026-10-09T00:00:03Z',
  error_message: '',
  certificates: [],
  status_url: 'http://127.0.0.1:8000/api/jobs/587e4f8e-6b80-4438-b6a6-69ff421c364b/',
};

const mockCertificates: Certificate[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    row_number: 1,
    certificate_number: 'CERT-2026-466DBC643C27',
    recipient_name: 'Dr. Elena Rostova',
    recipient_email: 'elena.rostova@quantum.org',
    status: 'GENERATED',
    error: null,
    download_url: '/api/certificates/c1111111-1111-1111-1111-111111111111/download/',
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    row_number: 2,
    certificate_number: 'CERT-2026-AC1A706AB5D5',
    recipient_name: 'Marcus Thorne',
    recipient_email: 'marcus.thorne@quantum.org',
    status: 'GENERATED',
    error: null,
    download_url: '/api/certificates/c2222222-2222-2222-2222-222222222222/download/',
  },
];

const mockPaginatedCerts: PaginatedResponse<Certificate> = {
  count: 2,
  next: null,
  previous: null,
  results: mockCertificates,
};

function renderGallery(jobId = '587e4f8e-6b80-4438-b6a6-69ff421c364b') {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${jobId}/certificates`]}>
      <Routes>
        <Route path="/jobs/:jobId/certificates" element={<CertificateGalleryPage />} />
        <Route path="/jobs/:jobId" element={<div>JOB TELEMETRY PAGE</div>} />
        <Route path="/certificates/:certificateId" element={<div>INSPECTOR PAGE HANDOFF</div>} />
        <Route path="/jobs" element={<div>JOB LEDGER PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CertificateGalleryPage Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders gallery header, job context, and certificates from API', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Global Quantum Computing Summit 2026' })).toBeInTheDocument();
    });

    expect(screen.getByText('International Quantum Alliance')).toBeInTheDocument();
    expect(screen.getByText('Dr. Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('CERT-2026-466DBC643C27')).toBeInTheDocument();
    expect(screen.getByText('Marcus Thorne')).toBeInTheDocument();
    expect(screen.getByText('CERT-2026-AC1A706AB5D5')).toBeInTheDocument();
  });

  it('reads jobId correctly from URL and requests GET /api/jobs/{job_id}/certificates/', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery('custom-test-job-uuid');

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledWith(
        'custom-test-job-uuid',
        { page: 1 },
        expect.any(AbortSignal)
      );
    });
  });

  it('omits status query parameter when ALL filter is active', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery();

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledWith(
        '587e4f8e-6b80-4438-b6a6-69ff421c364b',
        { page: 1 },
        expect.any(AbortSignal)
      );
    });
  });

  it('sends status=GENERATED when GENERATED filter is clicked and resets page to 1', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /GENERATED/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /GENERATED/i }));

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledWith(
        '587e4f8e-6b80-4438-b6a6-69ff421c364b',
        { page: 1, status: 'GENERATED' },
        expect.any(AbortSignal)
      );
    });
  });

  it('sends status=PENDING when PENDING filter is clicked', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderGallery();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /PENDING/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /PENDING/i }));

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledWith(
        '587e4f8e-6b80-4438-b6a6-69ff421c364b',
        { page: 1, status: 'PENDING' },
        expect.any(AbortSignal)
      );
    });
  });

  it('sends status=FAILED when FAILED filter is clicked', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderGallery();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /FAILED/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /FAILED/i }));

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledWith(
        '587e4f8e-6b80-4438-b6a6-69ff421c364b',
        { page: 1, status: 'FAILED' },
        expect.any(AbortSignal)
      );
    });
  });

  it('handles multi-page pagination: next page preserves active filter', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue({
      count: 120, // 3 pages of 50
      next: 'http://127.0.0.1:8000/api/jobs/587e4f8e-6b80-4438-b6a6-69ff421c364b/certificates/?page=2',
      previous: null,
      results: mockCertificates,
    });

    renderGallery();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next page/i })).toBeInTheDocument();
    });

    // Select GENERATED filter first
    fireEvent.click(screen.getByRole('tab', { name: /GENERATED/i }));

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledWith(
        expect.any(String),
        { page: 1, status: 'GENERATED' },
        expect.any(AbortSignal)
      );
    });

    // Click Next page
    const nextBtn = screen.getByRole('button', { name: /Next page/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      // Must preserve status: 'GENERATED' while advancing page to 2
      expect(getCertsSpy).toHaveBeenCalledWith(
        expect.any(String),
        { page: 2, status: 'GENERATED' },
        expect.any(AbortSignal)
      );
    });
  });

  it('renders Inspect and Download PDF actions for GENERATED certificates', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Dr. Elena Rostova')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Inspect certificate for Dr\. Elena Rostova/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PDF for Dr\. Elena Rostova/i })).toBeInTheDocument();
  });

  it('navigates to /certificates/:certificateId when Inspect is activated (F6 handoff)', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Dr. Elena Rostova')).toBeInTheDocument();
    });

    const inspectBtn = screen.getByRole('button', { name: /Inspect certificate for Dr\. Elena Rostova/i });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText('INSPECTOR PAGE HANDOFF')).toBeInTheDocument();
    });
  });

  it('disables download and inspect for PENDING and FAILED certificates', async () => {
    const mixedCerts: Certificate[] = [
      {
        id: 'c-pending',
        row_number: 1,
        certificate_number: '',
        recipient_name: 'Pending User',
        recipient_email: 'pending@example.com',
        status: 'PENDING',
        error: null,
        download_url: null,
      },
      {
        id: 'c-failed',
        row_number: 2,
        certificate_number: '',
        recipient_name: 'Failed User',
        recipient_email: 'failed@example.com',
        status: 'FAILED',
        error: { type: 'VALIDATION', message: 'Name too long' },
        download_url: null,
      },
    ];

    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mixedCerts,
    });

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
      expect(screen.getByText('Failed User')).toBeInTheDocument();
    });

    // PENDING & FAILED should NOT offer Inspect or Download PDF buttons
    expect(screen.queryByRole('button', { name: /Inspect certificate for Pending User/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download PDF for Pending User/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inspect certificate for Failed User/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download PDF for Failed User/i })).not.toBeInTheDocument();

    expect(screen.getByText('ACTIONS PENDING')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENT UNAVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('Name too long')).toBeInTheDocument();
  });

  it('invokes downloadAndSaveCertificatePdf when Download PDF button is clicked', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);
    const downloadSpy = vi
      .spyOn(certificatesApi, 'downloadAndSaveCertificatePdf')
      .mockResolvedValue('CERT-2026-466DBC643C27.pdf');

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Dr. Elena Rostova')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download PDF for Dr\. Elena Rostova/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('c1111111-1111-1111-1111-111111111111');
    });

    expect(await screen.findByText(/Downloaded: CERT-2026-466DBC643C27\.pdf/i)).toBeInTheDocument();
  });

  it('renders BATCH ARCHIVE NOT FOUND on HTTP 404', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockRejectedValue(
      new ApiClientError(404, {
        error: { code: 'not_found', message: 'Job not found', details: {} },
      })
    );
    vi.spyOn(jobsApi, 'getJobCertificates').mockRejectedValue(
      new ApiClientError(404, {
        error: { code: 'not_found', message: 'Job not found', details: {} },
      })
    );

    renderGallery('missing-job-uuid');

    await waitFor(() => {
      expect(screen.getByText(/BATCH ARCHIVE NOT FOUND/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Return to Ledger/i)).toBeInTheDocument();
  });

  it('renders empty state when filtered collection contains no records', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText(/NO CERTIFICATE RECORDS RECORDED/i)).toBeInTheDocument();
    });
  });

  it('supports manual refresh trigger', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockJob);
    const getCertsSpy = vi.spyOn(jobsApi, 'getJobCertificates').mockResolvedValue(mockPaginatedCerts);

    renderGallery();

    await waitFor(() => {
      expect(screen.getByText('Dr. Elena Rostova')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh certificate gallery/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(getCertsSpy).toHaveBeenCalledTimes(2);
    });
  });
});
