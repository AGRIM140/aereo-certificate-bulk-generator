import { useEffect, useRef, useState, useCallback } from 'react';
import { getJobDetail } from '../api/jobs';
import type { GenerationJob, JobStatus } from '../types/api';

export interface UseJobPollingOptions {
  /**
   * Polling interval in milliseconds.
   * Default: 2000ms (1.5-2.5s recommended).
   */
  intervalMs?: number;
  /**
   * Whether polling is enabled. Default: true.
   */
  enabled?: boolean;
  /**
   * Optional callback triggered on job status transition.
   */
  onStatusChange?: (newStatus: JobStatus, previousStatus: JobStatus | null) => void;
}

export interface UseJobPollingResult {
  job: GenerationJob | null;
  isLoading: boolean;
  isPolling: boolean;
  error: Error | null;
  isPollingError: boolean;
  pollingErrorMessage: string | null;
  refresh: () => Promise<void>;
}

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
]);

/**
 * Custom hook to monitor a GenerationJob via polling.
 *
 * Implements recursive timeout polling (request -> await response -> schedule next)
 * to strictly prevent overlapping requests under high latency.
 *
 * Automatically stops polling when job reaches a terminal state.
 * Gracefully preserves existing job state across temporary network interruptions.
 */
export function useJobPolling(
  jobId: string | undefined,
  options: UseJobPollingOptions = {}
): UseJobPollingResult {
  const { intervalMs = 2000, enabled = true, onStatusChange } = options;

  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPollingError, setIsPollingError] = useState<boolean>(false);
  const [pollingErrorMessage, setPollingErrorMessage] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const jobRef = useRef<GenerationJob | null>(null);
  const prevStatusRef = useRef<JobStatus | null>(null);

  // Keep jobRef in sync with state for access in callbacks
  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const scheduleNext = useCallback(
    (delay: number) => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (!mountedRef.current) return;

      timeoutIdRef.current = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        fetchJob(false);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fetchJob = useCallback(
    async (isInitial = false) => {
      if (!jobId || !mountedRef.current) return;

      // Abort any previous pending fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      inFlightRef.current = true;
      if (isInitial && !jobRef.current) {
        setIsLoading(true);
      }

      try {
        const data = await getJobDetail(jobId, controller.signal);
        if (!mountedRef.current || controller.signal.aborted) return;

        setJob(data);
        setError(null);
        setIsPollingError(false);
        setPollingErrorMessage(null);

        // Notify on status transition
        if (data.status !== prevStatusRef.current) {
          onStatusChange?.(data.status, prevStatusRef.current);
          prevStatusRef.current = data.status;
        }

        // Terminal status check
        if (TERMINAL_STATUSES.has(data.status)) {
          setIsPolling(false);
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }
        } else {
          // Job is PENDING or PROCESSING: continue polling
          setIsPolling(true);
          // Pause scheduling if browser tab is hidden to save battery & network
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            // Defer next poll until tab becomes visible
          } else {
            scheduleNext(intervalMs);
          }
        }
      } catch (err) {
        if (!mountedRef.current || controller.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        // If this was initial load and we have no cached data, display full error
        if (isInitial && !jobRef.current) {
          setError(err as Error);
          setIsPolling(false);
        } else {
          // Background polling error: do NOT overwrite job or mark job FAILED!
          setIsPollingError(true);
          const msg = err instanceof Error ? err.message : 'Connection interrupted';
          setPollingErrorMessage(msg);
          // Still schedule retry attempt
          scheduleNext(intervalMs);
        }
      } finally {
        if (!controller.signal.aborted) {
          inFlightRef.current = false;
          if (mountedRef.current && isInitial) {
            setIsLoading(false);
          }
        }
      }
    },
    [jobId, intervalMs, onStatusChange, scheduleNext]
  );

  const refresh = useCallback(async () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    await fetchJob(false);
  }, [fetchJob]);

  // Main polling lifecycle
  useEffect(() => {
    mountedRef.current = true;

    if (!jobId || !enabled) {
      setIsLoading(false);
      setIsPolling(false);
      return () => {
        mountedRef.current = false;
      };
    }

    // Initial fetch triggered immediately
    fetchJob(true);

    // Visibility change handler to resume polling when tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentJob = jobRef.current;
        if (currentJob && !TERMINAL_STATUSES.has(currentJob.status)) {
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }
          fetchJob(false);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      mountedRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [jobId, enabled, fetchJob]);

  return {
    job,
    isLoading,
    isPolling,
    error,
    isPollingError,
    pollingErrorMessage,
    refresh,
  };
}
