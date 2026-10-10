import React from 'react';
import { FileCheck, Activity, Layers, CheckCircle2 } from 'lucide-react';
import type { JobSummary } from '../../types/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface DashboardMetricsProps {
  totalJobsCount: number;
  recentJobs: JobSummary[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalJobsCount,
  recentJobs,
}) => {
  // Compute metrics legitimately derived from recent jobs window
  const activeJobs = recentJobs.filter(
    (j) => j.status === 'PENDING' || j.status === 'PROCESSING'
  ).length;

  const completedJobs = recentJobs.filter(
    (j) => j.status === 'COMPLETED' || j.status === 'COMPLETED_WITH_ERRORS'
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
      {/* Total Registered Jobs */}
      <Card variant="default">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-[11px] text-[#556377]">REGISTERED BATCHES</CardTitle>
          <Layers className="w-3.5 h-3.5 text-[#1f304d]" />
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-2xl font-bold font-mono-telemetry text-[#161a22]">
            {totalJobsCount}
          </div>
          <div className="text-[11px] text-[#647287] mt-1 flex items-center justify-between">
            <span>Authoritative DB Records</span>
            <span className="font-mono-telemetry text-[#7d8b9e]">PostgreSQL 17</span>
          </div>
        </CardContent>
      </Card>

      {/* Active In Queue */}
      <Card variant="default">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-[11px] text-[#556377]">ACTIVE IN QUEUE</CardTitle>
          <Activity className="w-3.5 h-3.5 text-[#b45309]" />
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-2xl font-bold font-mono-telemetry text-[#b45309]">
            {activeJobs}
          </div>
          <div className="text-[11px] text-[#647287] mt-1 flex items-center justify-between">
            <span>Pending & Processing</span>
            <span className="font-mono-telemetry text-[#7d8b9e]">Celery Tasks</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents Produced */}
      <Card variant="default">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-[11px] text-[#556377]">RECENT CERTIFICATES</CardTitle>
          <FileCheck className="w-3.5 h-3.5 text-[#15803d]" />
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-2xl font-bold font-mono-telemetry text-[#15803d]">
            {recentGeneratedCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#647287] mt-1 flex items-center justify-between">
            <span>Generated Documents</span>
            <span className="font-mono-telemetry text-[#7d8b9e]">Recent Window</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Success Rate */}
      <Card variant="default">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-[11px] text-[#556377]">RECENT SUCCESS RATE</CardTitle>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-2xl font-bold font-mono-telemetry text-[#161a22]">
            {recentSuccessRate}%
          </div>
          <div className="text-[11px] text-[#647287] mt-1 flex items-center justify-between">
            <span>Completed Batches: {completedJobs}</span>
            <span className="font-mono-telemetry text-[#15803d] font-semibold">Clean Passes</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
