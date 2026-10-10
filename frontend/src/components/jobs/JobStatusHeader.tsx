import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Radio } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime, formatDuration, shortenUuid } from '../../lib/formatters';
import type { GenerationJob } from '../../types/api';

interface JobStatusHeaderProps {
  job: GenerationJob;
  isPolling: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

const statusDisplayLabels: Record<string, string> = {
  PENDING: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETE',
  COMPLETED_WITH_ERRORS: 'COMPLETE W/ ERRORS',
  FAILED: 'FAILED',
};

export const JobStatusHeader: React.FC<JobStatusHeaderProps> = ({
  job,
  isPolling,
  onRefresh,
  isRefreshing = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(job.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isActive = job.status === 'PENDING' || job.status === 'PROCESSING';

  return (
    <div className="bg-[#ffffff] border border-[#e2dac9] rounded-lg p-5 shadow-sm text-[#161a22]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece5d6]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono-telemetry text-[#7d8b9e] font-semibold">
              JOB ID
            </span>
            <span
              className="text-sm font-mono-telemetry font-bold text-[#161a22] bg-[#f5efe4] px-2 py-0.5 rounded border border-[#dcd3c1]"
              title={job.id}
            >
              {shortenUuid(job.id)}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-[11px] font-mono-telemetry text-[#647287] hover:text-[#1f304d] transition-colors px-1.5 py-0.5 rounded hover:bg-[#f5efe4]"
              aria-label={copied ? 'Job ID copied to clipboard' : 'Copy full Job ID to clipboard'}
              title="Copy full UUID"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803d]" />
                  <span className="text-[#15803d] font-semibold">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161a22] font-serif">
            {job.event_name}
          </h1>
          <p className="text-xs text-[#647287] font-mono-telemetry">
            ISSUED BY <span className="text-[#161a22] font-semibold">{job.organization_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:self-start">
          {isActive && isPolling && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#edf3fa] border border-[#ccdbeb] text-[#1e3a5f] text-xs font-mono-telemetry font-semibold"
              role="status"
              aria-label="Live generation telemetry active"
            >
              <Radio className="w-3 h-3 text-[#2563eb] animate-pulse" />
              <span className="tracking-wider">LIVE TELEMETRY</span>
            </div>
          )}

          <Badge
            status={job.status}
            label={statusDisplayLabels[job.status] || job.status}
            size="md"
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            disabled={isRefreshing}
            className="text-xs"
            aria-label="Refresh job telemetry"
            title="Refresh job status from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Technical Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs font-mono-telemetry">
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">CREATED</span>
          <span className="text-[#161a22]">{formatDateTime(job.created_at)}</span>
        </div>
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">STARTED</span>
          <span className="text-[#161a22]">{formatDateTime(job.started_at)}</span>
        </div>
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">FINISHED</span>
          <span className="text-[#161a22]">{formatDateTime(job.finished_at)}</span>
        </div>
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">TOTAL DURATION</span>
          <span className="text-[#15803d] font-bold">
            {formatDuration(job.started_at, job.finished_at)}
          </span>
        </div>
      </div>
    </div>
  );
};
