import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import * as jobsApi from '../api/jobs';
import type { PaginatedResponse, JobSummary } from '../types/api';

const mockResponse: PaginatedResponse<JobSummary> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 'e4da7a17-3b4a-48dc-aed3-c750c6ad94d3',
      status: 'COMPLETED',
      event_name: 'Antigravity Annual Summit',
      organization_name: 'Antigravity Corp',
      issue_date: '2026-10-08',
      progress: {
        total: 25,
        generated: 25,
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches getJobs(1) on mount and renders metrics and recent jobs table', async () => {
    vi.spyOn(jobsApi, 'getJobs').mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Initial heading
    expect(screen.getByText('OPERATIONAL TELEMETRY CONSOLE')).toBeInTheDocument();

    // After fetch completes
    await waitFor(() => {
      expect(screen.getByText('Antigravity Annual Summit')).toBeInTheDocument();
      expect(screen.getByText('Antigravity Corp')).toBeInTheDocument();
    });

    // Check bento metric values
    expect(screen.getByText('REGISTERED BATCHES')).toBeInTheDocument();
    expect(screen.getByText('RECENT CERTIFICATES')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders clean empty state when no jobs exist in backend', async () => {
    vi.spyOn(jobsApi, 'getJobs').mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Generation Batches Dispatched')).toBeInTheDocument();
    });
  });

  it('displays error alert if API request fails', async () => {
    vi.spyOn(jobsApi, 'getJobs').mockRejectedValue(new Error('Network connection refused'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Telemetry Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/Network connection refused/i)).toBeInTheDocument();
    });
  });
});
