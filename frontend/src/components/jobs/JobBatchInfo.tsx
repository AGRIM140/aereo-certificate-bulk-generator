import React from 'react';
import { Calendar, Building2, Users, Award, Link as LinkIcon } from 'lucide-react';
import { formatDateOnly } from '../../lib/formatters';
import type { GenerationJob } from '../../types/api';

interface JobBatchInfoProps {
  job: GenerationJob;
}

export const JobBatchInfo: React.FC<JobBatchInfoProps> = ({ job }) => {
  return (
    <div className="dell-ribbon-card h-full">
      {/* Catalog Ribbon Header */}
      <div className="dell-ribbon-bar bg-[#e8e4c9]">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-black" />
          <span className="font-ui font-bold text-xs uppercase tracking-wider text-black">
            BATCH PARAMETERS & SPECIFICATIONS
          </span>
        </div>
        <span className="font-mono text-[10px] text-black">REF: {job.id.slice(0, 8)}</span>
      </div>

      <div className="p-4 space-y-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-black p-2.5 bg-[#fbf9f4]">
            <span className="font-ui text-[10px] text-black uppercase font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-black" /> Event Name
            </span>
            <p className="font-body-dell text-base font-bold text-black mt-1 truncate" title={job.event_name}>
              {job.event_name}
            </p>
          </div>

          <div className="border border-black p-2.5 bg-[#fbf9f4]">
            <span className="font-ui text-[10px] text-black uppercase font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-black" /> Issuing Organization
            </span>
            <p className="font-body-dell text-base font-bold text-black mt-1 truncate" title={job.organization_name}>
              {job.organization_name}
            </p>
          </div>

          <div className="border border-black p-2.5 bg-[#fbf9f4]">
            <span className="font-ui text-[10px] text-black uppercase font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-black" /> Issue Date
            </span>
            <p className="font-body-dell text-base text-black mt-1">
              {formatDateOnly(job.issue_date)}
            </p>
          </div>

          <div className="border border-black p-2.5 bg-[#fbf9f4]">
            <span className="font-ui text-[10px] text-black uppercase font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-black" /> Target Recipients
            </span>
            <p className="font-mono text-base font-bold text-black mt-1">
              {job.progress?.total ?? job.certificates?.length ?? 0} RECORDS
            </p>
          </div>
        </div>

        {job.status_url && (
          <div className="pt-3 border-t border-black flex items-center justify-between text-xs font-mono text-black">
            <span className="flex items-center gap-1 font-bold">
              <LinkIcon className="w-3 h-3 text-black" /> CANONICAL URL:
            </span>
            <span className="truncate max-w-[280px]" title={job.status_url}>
              {job.status_url}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

