import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJobPolling } from '../hooks/useJobPolling';
import * as jobsApi from '../api/jobs';
import type { GenerationJob } from '../types/api';

const mockBaseJob: GenerationJob = {
  id: '30fbfb90-5416-48f8-9c69-4d23ff0f41d9',
  status: 'PROCESSING',
  event_name: 'Aerospace Symposium',
  organization_name: 'Aero Council',
  issue_date: '2026-10-09',
  progress: {
    total: 10,
    generated: 5,
    failed: 0,
    pending: 5,
    percent_complete: 50.0,
  },
  created_at: '2026-10-09T00:00:00Z',
  started_at: '2026-10-09T00:01:00Z',
  finished_at: null,
  error_message: '',
  certificates: [],
  status_url: 'http://127.0.0.1:8000/api/jobs/30fbfb90-5416-48f8-9c69-4d23ff0f41d9/',
};

describe('useJobPolling Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('triggers initial job request immediately on mount', async () => {
    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValueOnce(mockBaseJob);

    const { result } = renderHook(() =>
      useJobPolling('30fbfb90-5416-48f8-9c69-4d23ff0f41d9', { intervalMs: 1500 })
    );

    expect(result.current.isLoading).toBe(true);
    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);
    expect(getJobDetailSpy).toHaveBeenCalledWith('30fbfb90-5416-48f8-9c69-4d23ff0f41d9', expect.any(AbortSignal));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.job?.id).toBe(mockBaseJob.id);
    expect(result.current.isPolling).toBe(true);
  });

  it('continues polling while job is in PENDING state', async () => {
    const pendingJob: GenerationJob = { ...mockBaseJob, status: 'PENDING' };
    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValue(pendingJob);

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 2000 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isPolling).toBe(true);

    // Advance timer by interval
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(3);
    expect(result.current.isPolling).toBe(true);
  });

  it('continues polling while job is in PROCESSING state', async () => {
    const processingJob: GenerationJob = { ...mockBaseJob, status: 'PROCESSING' };
    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValue(processingJob);

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 1500 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);
    expect(result.current.isPolling).toBe(true);
  });

  it('stops polling when status becomes COMPLETED', async () => {
    const completedJob: GenerationJob = {
      ...mockBaseJob,
      status: 'COMPLETED',
      progress: { ...mockBaseJob.progress, pending: 0, generated: 10, percent_complete: 100 },
      finished_at: '2026-10-09T00:02:00Z',
    };

    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValueOnce(mockBaseJob) // 1: PROCESSING
      .mockResolvedValueOnce(completedJob); // 2: COMPLETED

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 1500 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isPolling).toBe(true);

    // Advance timer -> transitions to COMPLETED
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(result.current.job?.status).toBe('COMPLETED');
    expect(result.current.isPolling).toBe(false);

    // Further timer advancement should NOT trigger any more fetches
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);
  });

  it('stops polling when status becomes COMPLETED_WITH_ERRORS', async () => {
    const completedWithErrorsJob: GenerationJob = {
      ...mockBaseJob,
      status: 'COMPLETED_WITH_ERRORS',
      progress: { ...mockBaseJob.progress, pending: 0, generated: 8, failed: 2, percent_complete: 100 },
    };

    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValueOnce(mockBaseJob)
      .mockResolvedValueOnce(completedWithErrorsJob);

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 1500 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isPolling).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(result.current.job?.status).toBe('COMPLETED_WITH_ERRORS');
    expect(result.current.isPolling).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);
  });

  it('stops polling when status becomes FAILED', async () => {
    const failedJob: GenerationJob = {
      ...mockBaseJob,
      status: 'FAILED',
      error_message: 'Worker encountered an unhandled exception',
    };

    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValueOnce(mockBaseJob)
      .mockResolvedValueOnce(failedJob);

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 1500 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isPolling).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(result.current.job?.status).toBe('FAILED');
    expect(result.current.isPolling).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);
  });

  it('prevents overlapping polling requests while a previous request is in-flight', async () => {
    let resolveFirstRequest: ((val: GenerationJob) => void) | null = null;
    const slowPromise = new Promise<GenerationJob>((resolve) => {
      resolveFirstRequest = resolve;
    });

    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockReturnValueOnce(slowPromise)
      .mockResolvedValue(mockBaseJob);

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 1500 })
    );

    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);

    // Advance timer while request is still pending
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should NOT have triggered a second request because request 1 was in flight
    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);

    // Now resolve first request
    await act(async () => {
      resolveFirstRequest!(mockBaseJob);
      await Promise.resolve();
    });

    expect(result.current.job?.id).toBe(mockBaseJob.id);

    // After resolution, advance timer -> triggers request 2
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);
  });

  it('handles temporary background polling errors without marking job failed or clearing job state', async () => {
    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValueOnce(mockBaseJob) // Initial success
      .mockRejectedValueOnce(new Error('Network timeout')) // Temp error
      .mockResolvedValueOnce(mockBaseJob); // Recovery

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 1500 })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.job?.id).toBe(mockBaseJob.id);
    expect(result.current.isPollingError).toBe(false);

    // Advance to trigger failing poll
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    // Job state must be PRESERVED, not cleared or marked failed!
    expect(result.current.job?.id).toBe(mockBaseJob.id);
    expect(result.current.job?.status).toBe('PROCESSING'); // Not FAILED
    expect(result.current.isPollingError).toBe(true);
    expect(result.current.pollingErrorMessage).toBe('Network timeout');

    // Advance to next poll -> succeeds and clears error
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(result.current.isPollingError).toBe(false);
    expect(result.current.pollingErrorMessage).toBeNull();
    expect(getJobDetailSpy).toHaveBeenCalledTimes(3);
  });

  it('supports manual refresh trigger', async () => {
    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockResolvedValue(mockBaseJob);

    const { result } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 5000 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);

    // Trigger manual refresh before timer expires
    await act(async () => {
      await result.current.refresh();
    });

    expect(getJobDetailSpy).toHaveBeenCalledTimes(2);
  });

  it('cleans up timers and aborts in-flight request on unmount', async () => {
    const abortSpy = vi.fn();
    const getJobDetailSpy = vi
      .spyOn(jobsApi, 'getJobDetail')
      .mockImplementation((_id, signal) => {
        signal?.addEventListener('abort', abortSpy);
        return Promise.resolve(mockBaseJob);
      });

    const { unmount } = renderHook(() =>
      useJobPolling(mockBaseJob.id, { intervalMs: 2000 })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);

    unmount();

    // Advance timers after unmount -> no new requests should fire
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(getJobDetailSpy).toHaveBeenCalledTimes(1);
  });
});
