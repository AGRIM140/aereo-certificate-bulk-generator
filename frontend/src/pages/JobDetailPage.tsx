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
        <div className="pb-4 border-b border-[#e2dac9]">
          <h1 className="text-xl font-bold tracking-tight text-[#161a22] font-serif uppercase">
            TELEMETRY COMMAND DESK
          </h1>
          <p className="text-xs text-[#5a6678] mt-1 font-mono-telemetry">
            INITIALIZING WORKER STREAM FOR JOB {jobId}…
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#dcd3c1] rounded-lg p-12 text-center space-y-4 shadow-sm">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-[#1f304d] animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#161a22] font-mono-telemetry">
              CONTACTING TELEMETRY BUS
            </p>
            <p className="text-xs text-[#647287] font-mono-telemetry">
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
        <div className="pb-4 border-b border-[#e2dac9]">
          <h1 className="text-xl font-bold tracking-tight text-[#161a22] font-mono-telemetry uppercase">
            JOB TELEMETRY — ERROR
          </h1>
          <p className="text-xs text-[#5a6678] mt-1 font-mono-telemetry">
            JOB IDENTIFIER: {jobId}
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#fecaca] rounded-lg p-8 space-y-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#b83a34] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#991b1b] font-mono-telemetry uppercase">
                {isNotFound ? 'BATCH RECORD NOT FOUND' : 'UNABLE TO RETRIEVE BATCH TELEMETRY'}
              </h2>
              <p className="text-xs text-[#556377]">
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
                className="text-xs font-mono-telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry Connection
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="text-xs font-mono-telemetry"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Return to Ledger
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-[#e2dac9]">
          <h1 className="text-xl font-bold tracking-tight text-[#161a22] font-serif uppercase">
            TELEMETRY COMMAND DESK
          </h1>
          <p className="text-xs text-[#5a6678] mt-1 font-mono-telemetry">
            CONNECTING TO WORKER BUS FOR JOB {jobId}…
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#dcd3c1] rounded-lg p-12 text-center space-y-4 shadow-sm">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-[#1f304d] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-[#161a22] font-mono-telemetry">
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
