import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { JobTable } from '../components/jobs/JobTable';
import type { JobSummary } from '../types/api';

const mockJobs: JobSummary[] = [
  {
    id: 'e4da7a17-3b4a-48dc-aed3-c750c6ad94d3',
    status: 'COMPLETED',
    event_name: 'Full Stack Engineering Workshop 2026',
    organization_name: 'Antigravity Academy',
    issue_date: '2026-10-08',
    progress: {
      total: 10,
      generated: 10,
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
  {
    id: 'b1111111-2222-3333-4444-555555555555',
    status: 'COMPLETED_WITH_ERRORS',
    event_name: 'Cloud Computing Symposium',
    organization_name: 'Tech Institute',
    issue_date: '2026-10-09',
    progress: {
      total: 5,
      generated: 4,
      failed: 1,
      pending: 0,
      percent_complete: 100.0,
    },
    created_at: '2026-10-09T10:00:00Z',
    started_at: '2026-10-09T10:00:01Z',
    finished_at: '2026-10-09T10:00:03Z',
    error_message: '',
    status_url: 'http://localhost:8000/api/jobs/b1111111-2222-3333-4444-555555555555/',
  },
];

describe('JobTable', () => {
  it('renders loading skeleton rows when isLoading is true', () => {
    const { container } = render(
      <MemoryRouter>
        <JobTable jobs={[]} isLoading />
      </MemoryRouter>
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders empty state with custom title and message when jobs array is empty', () => {
    const handleNewJob = vi.fn();
    render(
      <MemoryRouter>
        <JobTable
          jobs={[]}
          emptyTitle="Custom Empty Title"
          emptyMessage="Custom empty description"
          onNewJob={handleNewJob}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Empty Title')).toBeInTheDocument();
    expect(screen.getByText('Custom empty description')).toBeInTheDocument();

    const ctaBtn = screen.getByRole('button', { name: /initialize batch/i });
    fireEvent.click(ctaBtn);
    expect(handleNewJob).toHaveBeenCalledTimes(1);
  });

  it('renders table columns, event details, status badges, and progress counts', () => {
    render(
      <MemoryRouter>
        <JobTable jobs={mockJobs} />
      </MemoryRouter>
    );

    // Event & Org
    expect(screen.getByText('Full Stack Engineering Workshop 2026')).toBeInTheDocument();
    expect(screen.getByText('Antigravity Academy')).toBeInTheDocument();
    expect(screen.getByText('Cloud Computing Symposium')).toBeInTheDocument();
    expect(screen.getByText('Tech Institute')).toBeInTheDocument();

    // Status Badges
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED W/ ERRORS')).toBeInTheDocument();

    // Progress counts
    expect(screen.getAllByText('100.0%')).toHaveLength(2);
    expect(screen.getByText('(10 total)')).toBeInTheDocument();
    expect(screen.getByText('✓ 10')).toBeInTheDocument();
    expect(screen.getByText('✗ 1')).toBeInTheDocument();

    // View buttons
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    expect(viewButtons).toHaveLength(2);
  });
});
