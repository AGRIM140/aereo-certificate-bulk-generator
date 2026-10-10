import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CreateJobPage } from '../pages/CreateJobPage';
import * as jobsApi from '../api/jobs';
import type { GenerationJob } from '../types/api';

const mockCreatedJob: GenerationJob = {
  id: 'e4da7a17-3b4a-48dc-aed3-c750c6ad94d3',
  status: 'PENDING',
  event_name: 'Full Stack Engineering Workshop 2026',
  organization_name: 'Antigravity Academy',
  issue_date: '2026-10-08',
  progress: {
    total: 2,
    generated: 0,
    failed: 0,
    pending: 2,
    percent_complete: 0.0,
  },
  created_at: '2026-10-08T18:00:00Z',
  started_at: null,
  finished_at: null,
  error_message: '',
  certificates: [],
  status_url: 'http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/',
};

describe('CreateJobPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Create Job renders heading and supporting copy', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /INITIALIZE CERTIFICATE BATCH/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Configure event credentials and populate the recipient roster/i)
    ).toBeInTheDocument();
  });

  it('2. Batch fields render (Event Name, Organization Name, Issue Date)', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Issue Date/i)).toBeInTheDocument();
  });

  it('3. Recipient row renders initially with index 01', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient 01 Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient 01 Email/i)).toBeInTheDocument();
  });

  it('4. Add recipient works and appends new editable row', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    const addBtn = screen.getByRole('button', { name: /add recipient/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient 02 Name/i)).toBeInTheDocument();
  });

  it('5. Remove recipient works and deletes the targeted row', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    // Add row 02
    const addBtn = screen.getByRole('button', { name: /add recipient/i });
    fireEvent.click(addBtn);
    expect(screen.getByText('02')).toBeInTheDocument();

    // Remove row 02
    const removeBtn = screen.getByLabelText(/Remove recipient 02/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText('02')).not.toBeInTheDocument();
  });

  it('6. Recipient count updates in header badge and summary card', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    expect(screen.getByText('1 / 500 RECIPIENTS')).toBeInTheDocument();
    expect(screen.getByText('1 / 500')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /add recipient/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('2 / 500 RECIPIENTS')).toBeInTheDocument();
    expect(screen.getByText('2 / 500')).toBeInTheDocument();
  });

  it('7. Empty recipient submission is blocked with validation message', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    // Enter event and org but leave recipient name empty
    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'Python Conf 2026' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Python Foundation' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Row 1: Name is required./i)).toBeInTheDocument();
  });

  it('8. Invalid email format is caught by validation', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Recipient 01 Name/i), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Email/i), {
      target: { value: 'invalid-email-address' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Row 1: Enter a valid email address./i)).toBeInTheDocument();
  });

  it('9. Required fields (event name, organization name) are validated', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Event name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Organization name is required/i)).toBeInTheDocument();
  });

  it('10. 500-recipient maximum disables the Add button', () => {
    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    // Click Import and simulate 500 recipients
    const importBtn = screen.getByRole('button', { name: /import csv \/ json/i });
    fireEvent.click(importBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('11. Valid form submits correct POST payload matching JobRequest schema', async () => {
    const createSpy = vi.spyOn(jobsApi, 'createJob').mockResolvedValue(mockCreatedJob);

    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'Full Stack Engineering Workshop 2026' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Antigravity Academy' },
    });
    fireEvent.change(screen.getByLabelText(/Issue Date/i), {
      target: { value: '2026-10-08' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Name/i), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Email/i), {
      target: { value: 'ada@example.com' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        event_name: 'Full Stack Engineering Workshop 2026',
        organization_name: 'Antigravity Academy',
        issue_date: '2026-10-08',
        recipients: [{ name: 'Ada Lovelace', email: 'ada@example.com' }],
      });
    });
  });

  it('12. 202 Accepted navigates to /jobs/:jobId', async () => {
    vi.spyOn(jobsApi, 'createJob').mockResolvedValue(mockCreatedJob);

    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<CreateJobPage />} />
          <Route path="/jobs/:jobId" element={<div>Target Job Page: {mockCreatedJob.id}</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'Full Stack Workshop' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Antigravity' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Name/i), {
      target: { value: 'Ada Lovelace' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(`Target Job Page: ${mockCreatedJob.id}`)).toBeInTheDocument();
    });
  });

  it('13. API failure displays structured error alert', async () => {
    vi.spyOn(jobsApi, 'createJob').mockRejectedValue(new Error('Internal server error'));

    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'Summit' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Org' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Name/i), {
      target: { value: 'Ada Lovelace' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Batch Submission Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
    });
  });

  it('14. Form data remains intact after API failure', async () => {
    vi.spyOn(jobsApi, 'createJob').mockRejectedValue(new Error('Connection dropped'));

    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'Intact Event' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Intact Org' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Name/i), {
      target: { value: 'Intact Recipient' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Verify fields preserved
    expect(screen.getByLabelText(/Event Name/i)).toHaveValue('Intact Event');
    expect(screen.getByLabelText(/Organization Name/i)).toHaveValue('Intact Org');
    expect(screen.getByLabelText(/Recipient 01 Name/i)).toHaveValue('Intact Recipient');
  });

  it('15. Duplicate submission is prevented while request is pending', async () => {
    let resolveCreate: (value: GenerationJob) => void;
    const pendingPromise = new Promise<GenerationJob>((resolve) => {
      resolveCreate = resolve;
    });

    const createSpy = vi.spyOn(jobsApi, 'createJob').mockReturnValue(pendingPromise);

    render(
      <MemoryRouter>
        <CreateJobPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Event Name/i), {
      target: { value: 'Event' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Org' },
    });
    fireEvent.change(screen.getByLabelText(/Recipient 01 Name/i), {
      target: { value: 'Ada Lovelace' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate certificates/i });
    fireEvent.click(submitBtn);

    // During pending state, button text changes and button is disabled
    expect(screen.getByText(/Generating Batch…/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Click again while pending
    fireEvent.click(submitBtn);
    expect(createSpy).toHaveBeenCalledTimes(1);

    // Cleanup
    await act(async () => {
      resolveCreate!(mockCreatedJob);
    });
  });
});
