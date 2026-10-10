import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JobDetailPage } from '../pages/JobDetailPage';
import * as jobsApi from '../api/jobs';
import { ApiClientError } from '../api/client';
import type { GenerationJob } from '../types/api';

const mockCompletedJob: GenerationJob = {
  id: '30fbfb90-5416-48f8-9c69-4d23ff0f41d9',
  status: 'COMPLETED',
  event_name: 'Aerospace Defense Symposium',
  organization_name: 'National Aeronautics Council',
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
  certificates: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      row_number: 1,
      certificate_number: 'CERT-2026-0001',
      recipient_name: 'Agrim Singh',
      recipient_email: 'agrim@example.com',
      status: 'GENERATED',
      error: null,
      download_url: '/api/certificates/c1111111-1111-1111-1111-111111111111/download/',
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      row_number: 2,
      certificate_number: 'CERT-2026-0002',
      recipient_name: 'Ayush Vardhan Singh',
      recipient_email: 'ayush@example.com',
      status: 'GENERATED',
      error: null,
      download_url: '/api/certificates/c2222222-2222-2222-2222-222222222222/download/',
    },
  ],
  status_url: 'http://127.0.0.1:8000/api/jobs/30fbfb90-5416-48f8-9c69-4d23ff0f41d9/',
};

function renderJobDetailPage(jobId = '30fbfb90-5416-48f8-9c69-4d23ff0f41d9') {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
      <Routes>
        <Route path="/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/jobs" element={<div>JOB LEDGER PAGE</div>} />
        <Route path="/jobs/new" element={<div>CREATE JOB PAGE</div>} />
        <Route path="/jobs/:jobId/certificates" element={<div>CERTIFICATE GALLERY PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('JobDetailPage Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially while fetching job telemetry', () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockReturnValue(new Promise(() => {}));

    renderJobDetailPage();

    expect(screen.getByText(/TELEMETRY COMMAND DESK/i)).toBeInTheDocument();
    expect(screen.getByText(/CONTACTING TELEMETRY BUS/i)).toBeInTheDocument();
  });

  it('renders complete job telemetry data correctly upon resolution', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockCompletedJob);

    renderJobDetailPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Aerospace Defense Symposium' })
      ).toBeInTheDocument();
    });

    // Check organization
    expect(screen.getAllByText(/National Aeronautics Council/i).length).toBeGreaterThan(0);

    // Check status badge
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();

    // Check progress numbers
    expect(screen.getByText('100.0%')).toBeInTheDocument();

    // Check recipient manifest
    expect(screen.getByText('Agrim Singh')).toBeInTheDocument();
    expect(screen.getByText('agrim@example.com')).toBeInTheDocument();
    expect(screen.getByText('CERT-2026-0001')).toBeInTheDocument();

    expect(screen.getByText('Ayush Vardhan Singh')).toBeInTheDocument();
    expect(screen.getByText('CERT-2026-0002')).toBeInTheDocument();
  });

  it('displays active LIVE TELEMETRY indicator during PROCESSING state', async () => {
    const processingJob: GenerationJob = {
      ...mockCompletedJob,
      status: 'PROCESSING',
      finished_at: null,
      progress: {
        total: 10,
        generated: 4,
        failed: 0,
        pending: 6,
        percent_complete: 40.0,
      },
    };
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(processingJob);

    renderJobDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/LIVE TELEMETRY/i)).toBeInTheDocument();
    });

    expect(screen.getByText('40.0%')).toBeInTheDocument();
    expect(screen.getByText('PROCESSING')).toBeInTheDocument();
  });

  it('exposes batch ZIP download button when job is COMPLETED', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockCompletedJob);
    const downloadSpy = vi
      .spyOn(jobsApi, 'downloadAndSaveJobZip')
      .mockResolvedValue('job_30fbfb90_certificates.zip');

    renderJobDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/Download Batch \(\.ZIP\)/i)).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download generated certificate batch/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('30fbfb90-5416-48f8-9c69-4d23ff0f41d9');
    });

    await waitFor(() => {
      expect(screen.getByText(/Downloaded archive: job_30fbfb90_certificates\.zip/i)).toBeInTheDocument();
    });
  });

  it('handles HTTP 409 download conflict gracefully without crashing', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockCompletedJob);
    vi.spyOn(jobsApi, 'downloadAndSaveJobZip').mockRejectedValue(
      new ApiClientError(409, {
        error: {
          code: 'certificate_not_available',
          message: 'No generated certificates available for this job.',
          details: {},
        },
      })
    );

    renderJobDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/Download Batch \(\.ZIP\)/i)).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download generated certificate batch/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(screen.getByText(/No generated certificates available for this job\./i)).toBeInTheDocument();
    });
  });

  it('distinguishes COMPLETED_WITH_ERRORS from FAILED with informative partial notice', async () => {
    const errorJob: GenerationJob = {
      ...mockCompletedJob,
      status: 'COMPLETED_WITH_ERRORS',
      progress: {
        total: 5,
        generated: 4,
        failed: 1,
        pending: 0,
        percent_complete: 100.0,
      },
      certificates: [
        ...mockCompletedJob.certificates,
        {
          id: 'c3333333-3333-3333-3333-333333333333',
          row_number: 3,
          certificate_number: '',
          recipient_name: 'Failed Recipient',
          recipient_email: 'invalid-email',
          status: 'FAILED',
          error: { type: 'VALIDATION', message: 'Enter a valid email address.' },
          download_url: null,
        },
      ],
    };

    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(errorJob);

    renderJobDetailPage();

    await waitFor(() => {
      expect(screen.getByText('COMPLETE W/ ERRORS')).toBeInTheDocument();
    });

    // Verify partial completion banner
    expect(screen.getByText(/Partial Batch Completion/i)).toBeInTheDocument();
    expect(screen.getByText(/4 certificate\(s\) generated successfully, while 1 recipient\(s\) encountered errors/i)).toBeInTheDocument();

    // Batch download should still be available for the 4 successful certificates
    expect(screen.getByRole('button', { name: /Download generated certificate batch/i })).toBeInTheDocument();

    // Verify error detail in recipient table
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('renders terminal FAILED state with failure explanation and re-create button', async () => {
    const failedJob: GenerationJob = {
      ...mockCompletedJob,
      status: 'FAILED',
      error_message: 'Celery worker lost connection to Redis broker during PDF compilation.',
      progress: {
        total: 2,
        generated: 0,
        failed: 2,
        pending: 0,
        percent_complete: 100.0,
      },
    };

    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(failedJob);

    renderJobDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('status', { name: /Status: FAILED/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Celery worker lost connection to Redis broker/i).length).toBeGreaterThan(0);
    // Does NOT render download batch button on total failure
    expect(screen.queryByText(/Download Batch \(\.ZIP\)/i)).not.toBeInTheDocument();
    // Provides Re-create Batch button
    expect(screen.getByRole('button', { name: /Re-create Batch/i })).toBeInTheDocument();
  });

  it('renders BATCH RECORD NOT FOUND on HTTP 404', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockRejectedValue(
      new ApiClientError(404, {
        error: {
          code: 'not_found',
          message: 'Job not found.',
          details: {},
        },
      })
    );

    renderJobDetailPage('unknown-uuid');

    await waitFor(() => {
      expect(screen.getByText(/BATCH RECORD NOT FOUND/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Return to Ledger/i)).toBeInTheDocument();
  });

  it('allows copying full job UUID to clipboard', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockCompletedJob);

    // Mock clipboard writeText
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderJobDetailPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Aerospace Defense Symposium' })
      ).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /Copy full Job ID to clipboard/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('30fbfb90-5416-48f8-9c69-4d23ff0f41d9');
    expect(await screen.findByText('COPIED')).toBeInTheDocument();
  });

  it('navigates cleanly to Job Ledger and Create Job routes', async () => {
    vi.spyOn(jobsApi, 'getJobDetail').mockResolvedValue(mockCompletedJob);

    renderJobDetailPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Aerospace Defense Symposium' })
      ).toBeInTheDocument();
    });

    // Click Job Ledger
    const ledgerBtn = screen.getByRole('button', { name: /Job Ledger/i });
    fireEvent.click(ledgerBtn);

    await waitFor(() => {
      expect(screen.getByText('JOB LEDGER PAGE')).toBeInTheDocument();
    });
  });
});
