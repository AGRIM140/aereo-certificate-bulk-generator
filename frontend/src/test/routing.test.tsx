import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { CreateJobPage } from '../pages/CreateJobPage';
import { JobHistoryPage } from '../pages/JobHistoryPage';
import * as jobsApi from '../api/jobs';

describe('App Routing and Shell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(jobsApi, 'getJobs').mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  });

  it('renders DashboardPage by default at /', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /OPERATIONAL TELEMETRY CONSOLE/i })
      ).toBeInTheDocument();
      expect(screen.getByText('ARCHIVAL TELEMETRY')).toBeInTheDocument();
    });
  });

  it('renders CreateJobPage at /jobs/new', () => {
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/jobs/new" element={<CreateJobPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /INITIALIZE CERTIFICATE BATCH/i })
    ).toBeInTheDocument();
  });

  it('renders JobHistoryPage at /jobs', async () => {
    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/jobs" element={<JobHistoryPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /HISTORICAL JOB LEDGER/i })
      ).toBeInTheDocument();
    });
  });
});
