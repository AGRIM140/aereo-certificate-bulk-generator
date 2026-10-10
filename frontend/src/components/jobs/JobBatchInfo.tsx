import React from 'react';
import { Calendar, Building2, Users, Award, Link as LinkIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatDateOnly } from '../../lib/formatters';
import type { GenerationJob } from '../../types/api';

interface JobBatchInfoProps {
  job: GenerationJob;
}

export const JobBatchInfo: React.FC<JobBatchInfoProps> = ({ job }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b border-[#ece5d6]">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#15803d]" />
          <CardTitle className="text-sm font-mono-telemetry uppercase tracking-wider text-[#161a22]">
            Batch Parameters
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-telemetry">
          <div className="space-y-1">
            <span className="text-[11px] text-[#7d8b9e] flex items-center gap-1.5 uppercase font-semibold">
              <Award className="w-3.5 h-3.5 text-[#7d8b9e]" /> Event Name
            </span>
            <p className="text-sm font-semibold text-[#161a22] truncate" title={job.event_name}>
              {job.event_name}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-[#7d8b9e] flex items-center gap-1.5 uppercase font-semibold">
              <Building2 className="w-3.5 h-3.5 text-[#7d8b9e]" /> Issuing Organization
            </span>
            <p className="text-sm font-semibold text-[#161a22] truncate" title={job.organization_name}>
              {job.organization_name}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-[#7d8b9e] flex items-center gap-1.5 uppercase font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#7d8b9e]" /> Issue Date
            </span>
            <p className="text-sm font-semibold text-[#2d3748]">
              {formatDateOnly(job.issue_date)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-[#7d8b9e] flex items-center gap-1.5 uppercase font-semibold">
              <Users className="w-3.5 h-3.5 text-[#7d8b9e]" /> Target Recipients
            </span>
            <p className="text-sm font-bold text-[#1f304d] font-mono-telemetry">
              {job.progress?.total ?? job.certificates?.length ?? 0}
            </p>
          </div>
        </div>

        {job.status_url && (
          <div className="pt-3 border-t border-[#ece5d6] flex items-center justify-between text-[11px] font-mono-telemetry text-[#7d8b9e]">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-[#7d8b9e]" /> Canonical Endpoint
            </span>
            <span className="text-[#2d3748] truncate max-w-[280px]" title={job.status_url}>
              {job.status_url}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
