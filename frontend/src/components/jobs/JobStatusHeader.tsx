import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Radio, Archive } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime, formatDuration, shortenUuid } from '../../lib/formatters';
import type { GenerationJob } from '../../types/api';
import { useArchivedJobs } from '../../lib/archiveStore';

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

  const { isArchived } = useArchivedJobs();
  const archived = isArchived(job.id);

  const isActive = job.status === 'PENDING' || job.status === 'PROCESSING';

  return (
    <div className="bg-white border-2 border-black rounded-none p-4 sm:p-5 shadow-[3px_3px_0px_#000000] text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-ui text-neutral-700 font-bold">
              JOB ID
            </span>
            <span
              className="text-xs font-mono font-bold text-black bg-neutral-200 px-2 py-0.5 border border-black"
              title={job.id}
            >
              {shortenUuid(job.id)}
            </span>
            {archived && (
              <span className="inline-flex items-center gap-1 text-[10px] font-ui font-bold bg-[#fcc20f] text-black px-1.5 py-0.5 border border-black uppercase">
                <Archive className="w-3 h-3 text-black" />
                ARCHIVED
              </span>
            )}
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-[11px] font-ui uppercase font-bold text-black hover:bg-black hover:text-white transition-none px-1.5 py-0.5 border border-black"
              aria-label={copied ? 'Job ID copied to clipboard' : 'Copy full Job ID to clipboard'}
              title="Copy full UUID"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span className="font-bold">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black font-ui uppercase">
            {job.event_name}
          </h1>
          <p className="text-xs text-neutral-700 font-serif">
            ISSUED BY <strong className="text-black font-ui font-bold uppercase">{job.organization_name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:self-start">
          {isActive && isPolling && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#9ab6c8] border border-black text-black text-xs font-ui font-bold uppercase"
              role="status"
              aria-label="Live generation telemetry active"
            >
              <Radio className="w-3 h-3 text-black animate-pulse" />
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
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            aria-label="Refresh job telemetry"
          >
            Poll
          </Button>
        </div>
      </div>

      {/* Timestamp Details Bar */}
      <div className="pt-3 flex flex-wrap items-center justify-between gap-4 text-xs font-serif text-neutral-800">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="text-neutral-500 font-ui text-[10px] uppercase font-bold mr-1">Created:</span>
            <span className="font-mono text-black">{formatDateTime(job.created_at)}</span>
          </div>

          <div>
            <span className="text-neutral-500 font-ui text-[10px] uppercase font-bold mr-1">Issue Date:</span>
            <span className="font-mono text-black">{job.issue_date || 'N/A'}</span>
          </div>

          <div>
            <span className="text-neutral-500 font-ui text-[10px] uppercase font-bold mr-1">Duration:</span>
            <span className="font-serif text-black">
              {job.finished_at ? formatDuration(job.created_at, job.finished_at) : 'Active...'}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-ui uppercase font-bold text-neutral-600">
          Engine Release: <span className="font-mono text-black">v1.0.0 (Production)</span>
        </div>
      </div>
    </div>
  );
};
