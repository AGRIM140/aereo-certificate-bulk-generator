import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useJobPolling } from '../hooks/useJobPolling';
import { JobStatusHeader } from '../components/jobs/JobStatusHeader';
import { JobBatchInfo } from '../components/jobs/JobBatchInfo';
import { JobTelemetryHud } from '../components/jobs/JobTelemetryHud';
import { JobCertificateSummary } from '../components/jobs/JobCertificateSummary';
import { JobActions } from '../components/jobs/JobActions';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../api/client';

export const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const {
    job,
    isLoading,
    isPolling,
    error,
    isPollingError,
    pollingErrorMessage,
    refresh,
  } = useJobPolling(jobId);

  // 1. Initial Loading State
  if (isLoading && !job) {
    return (
      <div className="space-y-6">
        <div className="border-2 border-black bg-[#9ab6c8] p-3 shadow-[2px_2px_0px_#000000]">
          <h1 className="font-display-dell text-xl font-black uppercase text-black tracking-wider">
            BATCH TELEMETRY COMMAND DESK
          </h1>
          <p className="font-body-dell text-sm text-black mt-0.5">
            INITIALIZING WORKER STREAM FOR JOB {jobId}…
          </p>
        </div>

        <div className="bg-white border-2 border-black p-12 text-center space-y-4 shadow-[2px_2px_0px_#000000]">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="font-ui text-sm font-bold uppercase tracking-wider text-black">
              CONTACTING TELEMETRY BUS
            </p>
            <p className="font-body-dell text-sm text-black">
              Querying generation ledger for batch metadata and progress…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fatal / Not Found Error State (no cached job)
  if (error && !job) {
    const isNotFound =
      (error instanceof ApiClientError && error.status === 404) ||
      error.message?.toLowerCase().includes('not found');

    return (
      <div className="space-y-6">
        <div className="border-2 border-black bg-[#d77a7a] p-3 shadow-[2px_2px_0px_#000000]">
          <h1 className="font-display-dell text-xl font-black uppercase text-black tracking-wider">
            BATCH TELEMETRY — EXCEPTION ERROR
          </h1>
          <p className="font-mono text-xs text-black mt-0.5 font-bold">
            JOB IDENTIFIER: {jobId}
          </p>
        </div>

        <div className="bg-white border-2 border-black p-8 space-y-5 shadow-[2px_2px_0px_#000000]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#e91d2a] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-ui text-sm font-bold text-black uppercase tracking-wider">
                {isNotFound ? 'BATCH RECORD NOT FOUND' : 'UNABLE TO RETRIEVE BATCH TELEMETRY'}
              </h2>
              <p className="font-body-dell text-base text-black">
                {isNotFound
                  ? `No certificate generation job exists with UUID "${jobId}". Verify the link or check the job ledger.`
                  : error.message || 'An unexpected communication error occurred while connecting to the backend.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {!isNotFound && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => refresh()}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                RETRY CONNECTION
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              RETURN TO LEDGER
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="border-2 border-black bg-[#9ab6c8] p-3 shadow-[2px_2px_0px_#000000]">
          <h1 className="font-display-dell text-xl font-black uppercase text-black tracking-wider">
            BATCH TELEMETRY COMMAND DESK
          </h1>
          <p className="font-mono text-xs text-black mt-0.5 font-bold">
            CONNECTING TO WORKER BUS FOR JOB {jobId}…
          </p>
        </div>

        <div className="bg-white border-2 border-black p-12 text-center space-y-4 shadow-[2px_2px_0px_#000000]">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          </div>
          <p className="font-ui text-sm font-bold uppercase tracking-wider text-black">
            AWAITING TELEMETRY STREAM…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Background Polling Disruption Banner */}
      {isPollingError && (
        <Alert
          variant="warning"
          title="Telemetry Feed Interrupted"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refresh()}
              className="text-xs font-mono-telemetry"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reconnect
            </Button>
          }
        >
          {pollingErrorMessage || 'Connection to the generation service could not be refreshed. Retrying…'} (Current job state preserved)
        </Alert>
      )}

      {/* Top Header */}
      <JobStatusHeader
        job={job}
        isPolling={isPolling}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />

      {/* Two-Column Bento Grid: Batch Info & Progress HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <JobBatchInfo job={job} />
        </div>
        <div className="lg:col-span-7">
          <JobTelemetryHud job={job} />
        </div>
      </div>

      {/* Actions Bar */}
      <JobActions job={job} />

      {/* Certificate Roster Manifest */}
      <JobCertificateSummary
        certificates={job.certificates || []}
        jobId={job.id}
      />
    </div>
  );
};
