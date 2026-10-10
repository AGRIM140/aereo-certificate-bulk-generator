import React from 'react';
import { FileCheck, Activity, Layers, CheckCircle2 } from 'lucide-react';
import type { JobSummary } from '../../types/api';

export interface DashboardMetricsProps {
  totalJobsCount: number;
  recentJobs: JobSummary[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalJobsCount,
  recentJobs,
}) => {
  const activeJobs = recentJobs.filter(
    (j) => j.status === 'PENDING' || j.status === 'PROCESSING'
  ).length;

  const recentGeneratedCount = recentJobs.reduce(
    (acc, j) => acc + (j.progress.generated || 0),
    0
  );

  const recentTotalRecipients = recentJobs.reduce(
    (acc, j) => acc + (j.progress.total || 0),
    0
  );

  const recentSuccessRate =
    recentTotalRecipients > 0
      ? ((recentGeneratedCount / recentTotalRecipients) * 100).toFixed(1)
      : '100.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Registered Batches (Tint Steel) */}
      <div className="border border-black bg-[#a5b8c0] shadow-[2px_2px_0px_#000000]">
        <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
          <span className="font-ui font-bold text-xs uppercase">REGISTERED BATCHES</span>
          <Layers className="w-3.5 h-3.5 text-black" />
        </div>
        <div className="p-3 text-black">
          <div className="text-3xl font-ui font-black text-black">
            {totalJobsCount}
          </div>
          <div className="text-[11px] font-serif text-neutral-900 mt-1 flex items-center justify-between">
            <span>Authoritative DB Records</span>
            <span className="font-mono text-[10px] bg-black text-white px-1">PostgreSQL 17</span>
          </div>
        </div>
      </div>

      {/* 2. Active In Queue (Tint Peach) */}
      <div className="border border-black bg-[#e6915d] shadow-[2px_2px_0px_#000000]">
        <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
          <span className="font-ui font-bold text-xs uppercase">ACTIVE IN QUEUE</span>
          <Activity className="w-3.5 h-3.5 text-black" />
        </div>
        <div className="p-3 text-black">
          <div className="text-3xl font-ui font-black text-black">
            {activeJobs}
          </div>
          <div className="text-[11px] font-serif text-neutral-900 mt-1 flex items-center justify-between">
            <span>Pending & Processing</span>
            <span className="font-mono text-[10px] bg-black text-white px-1">Celery Queue</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Certificates (Tint Sage) */}
      <div className="border border-black bg-[#b3bd95] shadow-[2px_2px_0px_#000000]">
        <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
          <span className="font-ui font-bold text-xs uppercase">RECENT CERTIFICATES</span>
          <FileCheck className="w-3.5 h-3.5 text-black" />
        </div>
        <div className="p-3 text-black">
          <div className="text-3xl font-ui font-black text-black">
            {recentGeneratedCount.toLocaleString()}
          </div>
          <div className="text-[11px] font-serif text-neutral-900 mt-1 flex items-center justify-between">
            <span>Generated Documents</span>
            <span className="font-mono text-[10px] bg-black text-white px-1">ReportLab</span>
          </div>
        </div>
      </div>

      {/* 4. Recent Success Rate (Tint Lime) */}
      <div className="border border-black bg-[#c0d4a7] shadow-[2px_2px_0px_#000000]">
        <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
          <span className="font-ui font-bold text-xs uppercase">SUCCESS RATE</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
        </div>
        <div className="p-3 text-black">
          <div className="text-3xl font-ui font-black text-black">
            {recentSuccessRate}%
          </div>
          <div className="text-[11px] font-serif text-neutral-900 mt-1 flex items-center justify-between">
            <span>Fault Isolation</span>
            <span className="font-mono text-[10px] bg-black text-white px-1">100% RELIABLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
