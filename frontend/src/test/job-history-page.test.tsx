import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JobHistoryPage } from '../pages/JobHistoryPage';
import * as jobsApi from '../api/jobs';
import type { PaginatedResponse, JobSummary } from '../types/api';

const mockLedgerResponse: PaginatedResponse<JobSummary> = {
  count: 75,
  next: 'http://localhost:8000/api/jobs/?page=2',
  previous: null,
  results: [
    {
      id: 'e4da7a17-3b4a-48dc-aed3-c750c6ad94d3',
      status: 'COMPLETED',
      event_name: 'DevOps Summit 2026',
      organization_name: 'Cloud Alliance',
      issue_date: '2026-10-08',
      progress: {
        total: 50,
        generated: 50,
        failed: 0,
        pending: 0,
        percent_complete: 100.0,
      },
      created_at: '2026-10-08T18:00:00Z',
      started_at: '2026-10-08T18:00:01Z',
      finished_at: '2026-10-08T18:00:05Z',
      error_message: '',
      status_url: 'http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/',
    },
  ],
};

describe('JobHistoryPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders historical ledger and pagination controls', async () => {
    vi.spyOn(jobsApi, 'getJobs').mockResolvedValue(mockLedgerResponse);

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Routes>
          <Route path="/jobs" element={<JobHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('HISTORICAL JOB LEDGER')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('DevOps Summit 2026')).toBeInTheDocument();
      expect(screen.getByText('75 TOTAL BATCHES')).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(jobsApi.getJobs).toHaveBeenCalledWith(2, expect.anything());
    });
  });

  it('renders empty state if ledger has 0 records', async () => {
    vi.spyOn(jobsApi, 'getJobs').mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Routes>
          <Route path="/jobs" element={<JobHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Batches in Ledger')).toBeInTheDocument();
      expect(screen.getByText('0 TOTAL BATCHES')).toBeInTheDocument();
    });
  });

  it('renders error banner if ledger request fails', async () => {
    vi.spyOn(jobsApi, 'getJobs').mockRejectedValue(new Error('PostgreSQL connection timeout'));

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Routes>
          <Route path="/jobs" element={<JobHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ledger Retrieval Error')).toBeInTheDocument();
      expect(screen.getByText(/PostgreSQL connection timeout/i)).toBeInTheDocument();
    });
  });

  it('allows archiving a batch and restoring it via the Archived tab', async () => {
    window.localStorage.clear();
    vi.spyOn(jobsApi, 'getJobs').mockResolvedValue(mockLedgerResponse);

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Routes>
          <Route path="/jobs" element={<JobHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial load: job is visible in active list
    await waitFor(() => {
      expect(screen.getByText('DevOps Summit 2026')).toBeInTheDocument();
    });

    // Find and click the Archive button on the row
    const archiveBtn = screen.getByRole('button', { name: /archive job/i });
    expect(archiveBtn).toBeInTheDocument();
    fireEvent.click(archiveBtn);

    // Now it should be hidden from Active view
    await waitFor(() => {
      expect(screen.queryByText('DevOps Summit 2026')).not.toBeInTheDocument();
      expect(screen.getByText('No Batches in Ledger')).toBeInTheDocument();
    });

    // Switch to Archived tab
    const archivedTab = screen.getByRole('button', { name: /archived/i });
    fireEvent.click(archivedTab);

    // Job should be visible in Archived view
    await waitFor(() => {
      expect(screen.getByText('DevOps Summit 2026')).toBeInTheDocument();
      expect(screen.getAllByText(/ARCHIVED/).length).toBeGreaterThan(0);
    });

    // Click Restore button
    const restoreBtn = screen.getByRole('button', { name: /restore job/i });
    fireEvent.click(restoreBtn);

    // Archived view is now empty
    await waitFor(() => {
      expect(screen.getByText('No Archived Batches')).toBeInTheDocument();
    });

    // Switch back to Active tab
    const activeTab = screen.getByRole('button', { name: /active/i });
    fireEvent.click(activeTab);

    // Job is restored and visible in Active tab
    await waitFor(() => {
      expect(screen.getByText('DevOps Summit 2026')).toBeInTheDocument();
    });
  });
});
