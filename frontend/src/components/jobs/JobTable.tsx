import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FolderX } from 'lucide-react';
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
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  isLoading = false,
  emptyTitle = 'No certificate jobs found',
  emptyMessage = 'No bulk generation jobs have been dispatched yet. Initialize a new batch to begin.',
  onNewJob,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e2dac9] bg-[#fbf9f4] text-[#556377] font-mono-telemetry uppercase text-[11px]">
              <th className="py-3 px-4">Event & Organization</th>
              <th className="py-3 px-4">Job ID / Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Progress Telemetry</th>
              <th className="py-3 px-4">Timeline</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece5d6]">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-4">
                  <div className="h-4 bg-[#ede5d4] rounded w-44 mb-1.5" />
                  <div className="h-3 bg-[#ede5d4]/70 rounded w-28" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-3.5 bg-[#ede5d4] rounded w-24 mb-1" />
                  <div className="h-3 bg-[#ede5d4]/60 rounded w-20" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-6 bg-[#ede5d4] rounded w-24" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-3 bg-[#ede5d4] rounded w-32 mb-1" />
                  <div className="h-2 bg-[#ede5d4]/70 rounded w-40" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-3.5 bg-[#ede5d4] rounded w-28 mb-1" />
                  <div className="h-3 bg-[#ede5d4]/60 rounded w-16" />
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="h-7 bg-[#ede5d4] rounded w-20 ml-auto" />
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
      <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#f7f3ea] border border-[#dcd3c1] flex items-center justify-center text-[#717e91]">
          <FolderX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold tracking-wide text-[#161a22] uppercase font-mono-telemetry">
            {emptyTitle}
          </h4>
          <p className="text-xs text-[#647287] max-w-md mx-auto">{emptyMessage}</p>
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
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#e2dac9] bg-[#fbf9f4] text-[#556377] font-mono-telemetry uppercase text-[11px] select-none">
            <th scope="col" className="py-3 px-4 font-semibold tracking-wider">
              Event & Organization
            </th>
            <th scope="col" className="py-3 px-4 font-semibold tracking-wider">
              Job ID / Date
            </th>
            <th scope="col" className="py-3 px-4 font-semibold tracking-wider">
              Status
            </th>
            <th scope="col" className="py-3 px-4 font-semibold tracking-wider">
              Progress Telemetry
            </th>
            <th scope="col" className="py-3 px-4 font-semibold tracking-wider">
              Timeline
            </th>
            <th scope="col" className="py-3 px-4 font-semibold tracking-wider text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ece5d6]">
          {jobs.map((job) => {
            const { total, generated, failed, pending, percent_complete } = job.progress;

            return (
              <tr
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="hover:bg-[#fbf7ee] transition-colors cursor-pointer group"
              >
                {/* Event & Org */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#161a22] group-hover:text-[#1f304d] transition-colors">
                    {job.event_name}
                  </div>
                  <div className="text-[11px] text-[#647287] mt-0.5">
                    {job.organization_name}
                  </div>
                </td>

                {/* Job ID / Date */}
                <td className="py-3.5 px-4 font-mono-telemetry">
                  <div className="text-[#2d3748] font-medium">{job.issue_date}</div>
                  <div
                    className="text-[10px] text-[#7d8b9e] mt-0.5 truncate max-w-[120px]"
                    title={job.id}
                  >
                    {shortenUuid(job.id)}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <Badge status={job.status} size="sm" />
                </td>

                {/* Progress Telemetry */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 mb-1.5 font-mono-telemetry text-[11px]">
                    <span className="font-bold text-[#161a22]">
                      {percent_complete.toFixed(1)}%
                    </span>
                    <span className="text-[#7d8b9e]">({total} total)</span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-36 h-1.5 bg-[#ede5d4] rounded-full overflow-hidden border border-[#dcd3c1]">
                    <div
                      className={`h-full bg-[#15803d] transition-all duration-300 ${
                        job.status === 'PROCESSING' ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percent_complete))}%` }}
                    />
                  </div>

                  {/* Micro breakdown counters */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono-telemetry">
                    <span className="text-[#15803d] font-semibold">✓ {generated}</span>
                    {failed > 0 && <span className="text-[#b83a34] font-semibold">✗ {failed}</span>}
                    {pending > 0 && <span className="text-[#b45309] font-semibold">⋯ {pending}</span>}
                  </div>
                </td>

                {/* Timeline */}
                <td className="py-3.5 px-4 font-mono-telemetry text-[11px]">
                  <div className="text-[#2d3748]">{formatDateTime(job.created_at)}</div>
                  <div className="text-[10px] text-[#7d8b9e] mt-0.5">
                    Duration: {formatDuration(job.started_at, job.finished_at)}
                  </div>
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/jobs/${job.id}`);
                    }}
                  >
                    View
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
