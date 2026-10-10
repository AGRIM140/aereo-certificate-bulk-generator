import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FolderX, Archive, ArchiveRestore } from 'lucide-react';
import type { JobSummary } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime, formatDuration, shortenUuid } from '../../lib/formatters';

export interface JobTableProps {
  jobs: JobSummary[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onNewJob?: () => void;
  isArchived?: (jobId: string) => boolean;
  onToggleArchive?: (jobId: string, event: React.MouseEvent) => void;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  isLoading = false,
  emptyTitle = 'No certificate jobs found',
  emptyMessage = 'No bulk generation jobs have been dispatched yet. Initialize a new batch to begin.',
  onNewJob,
  isArchived,
  onToggleArchive,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto border border-black">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-black bg-[#a5b8c0] text-black font-ui uppercase font-bold text-xs">
              <th className="py-2.5 px-3 border-r border-black">Event & Organization</th>
              <th className="py-2.5 px-3 border-r border-black">Job ID / Date</th>
              <th className="py-2.5 px-3 border-r border-black">Status</th>
              <th className="py-2.5 px-3 border-r border-black">Progress Telemetry</th>
              <th className="py-2.5 px-3 border-r border-black">Timeline</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-3 px-3 border-r border-black">
                  <div className="h-4 bg-neutral-200 w-44 mb-1" />
                  <div className="h-3 bg-neutral-200 w-28" />
                </td>
                <td className="py-3 px-3 border-r border-black">
                  <div className="h-3.5 bg-neutral-200 w-24 mb-1" />
                  <div className="h-3 bg-neutral-200 w-20" />
                </td>
                <td className="py-3 px-3 border-r border-black">
                  <div className="h-5 bg-neutral-200 w-24" />
                </td>
                <td className="py-3 px-3 border-r border-black">
                  <div className="h-3 bg-neutral-200 w-32 mb-1" />
                  <div className="h-2 bg-neutral-200 w-40" />
                </td>
                <td className="py-3 px-3 border-r border-black">
                  <div className="h-3.5 bg-neutral-200 w-28 mb-1" />
                  <div className="h-3 bg-neutral-200 w-16" />
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="h-6 bg-neutral-200 w-20 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 border border-black bg-[#a5b8c0]/20">
        <div className="w-12 h-12 bg-white border border-black flex items-center justify-center text-black">
          <FolderX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold tracking-wider text-black uppercase font-ui">
            {emptyTitle}
          </h4>
          <p className="text-xs text-neutral-800 font-serif max-w-md mx-auto">{emptyMessage}</p>
        </div>
        {onNewJob && (
          <Button variant="primary" size="sm" onClick={onNewJob} className="mt-2">
            Initialize Batch
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-black">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-black bg-[#a5b8c0] text-black font-ui uppercase font-bold text-xs select-none">
            <th scope="col" className="py-2.5 px-3 font-bold tracking-wider border-r border-black">
              Event & Organization
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold tracking-wider border-r border-black">
              Job ID / Date
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold tracking-wider border-r border-black">
              Status
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold tracking-wider border-r border-black">
              Progress Telemetry
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold tracking-wider border-r border-black">
              Timeline
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold tracking-wider text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black bg-white">
          {jobs.map((job) => {
            const { total, generated, failed, pending, percent_complete } = job.progress;
            const archived = isArchived ? isArchived(job.id) : false;

            return (
              <tr
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className={`transition-none cursor-pointer group ${
                  archived ? 'bg-neutral-100 hover:bg-neutral-200/70 opacity-90' : 'hover:bg-[#b3bd95]/30'
                }`}
              >
                {/* Event & Org */}
                <td className="py-2.5 px-3 border-r border-black">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-ui font-bold text-xs text-black group-hover:text-[#0000ee] underline decoration-transparent group-hover:decoration-[#0000ee]">
                      {job.event_name}
                    </span>
                    {archived && (
                      <span className="px-1.5 py-0.2 bg-[#fcc20f] text-black font-ui font-bold text-[9px] uppercase border border-black">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-600 font-serif mt-0.5">
                    {job.organization_name}
                  </div>
                </td>

                {/* Job ID / Date */}
                <td className="py-2.5 px-3 font-mono text-[11px] border-r border-black">
                  <span className="font-bold text-black" title={job.id}>
                    {shortenUuid(job.id)}
                  </span>
                  <div className="text-[10px] text-neutral-600 font-serif">
                    {formatDateTime(job.created_at)}
                  </div>
                </td>

                {/* Status Badge */}
                <td className="py-2.5 px-3 border-r border-black">
                  <Badge status={job.status} size="sm" />
                </td>

                {/* Progress Telemetry */}
                <td className="py-2.5 px-3 border-r border-black">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-ui font-bold text-xs text-black">
                      {percent_complete.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-neutral-600 font-serif">({total} total)</span>
                  </div>

                  <div className="w-24 bg-neutral-200 h-2 border border-black overflow-hidden">
                    <div
                      className="bg-black h-full"
                      style={{ width: `${percent_complete}%` }}
                    />
                  </div>

                  {/* Micro breakdown counters */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                    <span className="text-black font-bold">✓ {generated}</span>
                    {failed > 0 && <span className="text-[#e91d2a] font-bold">✗ {failed}</span>}
                    {pending > 0 && <span className="text-[#8e8a25] font-bold">⋯ {pending}</span>}
                  </div>
                </td>

                {/* Timeline */}
                <td className="py-2.5 px-3 text-[11px] font-serif border-r border-black">
                  <div>
                    {job.finished_at ? (
                      <span>Done in {formatDuration(job.created_at, job.finished_at)}</span>
                    ) : (
                      <span className="font-ui font-bold text-[#8e8a25]">Active in queue...</span>
                    )}
                  </div>
                </td>

                {/* Action CTA */}
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onToggleArchive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleArchive(job.id, e);
                        }}
                        className={`px-2 py-1 text-[10px] font-ui font-bold uppercase border border-black transition-colors cursor-pointer flex items-center gap-1 ${
                          archived
                            ? 'bg-[#fcc20f] hover:bg-yellow-400 text-black shadow-none'
                            : 'bg-white hover:bg-neutral-200 text-neutral-800'
                        }`}
                        title={archived ? 'Restore to active ledger' : 'Archive batch (hide from active ledger)'}
                        aria-label={archived ? `Restore job ${job.id}` : `Archive job ${job.id}`}
                      >
                        {archived ? (
                          <>
                            <ArchiveRestore className="w-3 h-3 text-black" />
                            <span className="hidden sm:inline">Restore</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3 h-3 text-neutral-600" />
                            <span className="hidden sm:inline">Archive</span>
                          </>
                        )}
                      </button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job.id}`);
                      }}
                      rightIcon={<ArrowUpRight className="w-3 h-3" />}
                      aria-label={`View details for job ${job.id}`}
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
