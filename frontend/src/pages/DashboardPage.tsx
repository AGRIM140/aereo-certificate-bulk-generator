import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';
import { getJobs } from '../api/jobs';
import type { PaginatedResponse, JobSummary } from '../types/api';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { JobTable } from '../components/jobs/JobTable';
import { useArchivedJobs } from '../lib/archiveStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isArchived, toggleArchiveJob } = useArchivedJobs();
  const [data, setData] = useState<PaginatedResponse<JobSummary> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    getJobs(1, controller.signal)
      .then((response) => {
        if (isMounted) {
          setData(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [refreshTrigger]);

  const allJobs = data?.results || [];
  const recentJobs = allJobs.filter((job) => !isArchived(job.id)).slice(0, 10);
  const totalCount = data?.count || 0;

  return (
    <div className="space-y-6">
      {/* 1. Dell 1996 Section Eyebrow Banner (Tint Olive) */}
      <div className="border border-black bg-[#8e8a25] p-3 sm:p-4 text-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg sm:text-2xl font-black uppercase font-ui tracking-wide text-black">
              OPERATIONAL TELEMETRY CONSOLE
            </h1>
            <span className="dell-burst-new text-[10px] px-1.5 py-0.2">
              LIVE
            </span>
          </div>
          <p className="text-xs font-serif text-black leading-tight">
            Real-time batch generation overview, authoritative database telemetry, and recent certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            aria-label="Refresh operational telemetry"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={() => navigate('/jobs/new')}
          >
            Initialize Batch
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert
          variant="error"
          title="Telemetry Connection Error"
          error={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Ribbon Metrics Row */}
      <DashboardMetrics totalJobsCount={totalCount} recentJobs={recentJobs} />

      {/* Recent Jobs Table Ribbon Card */}
      <div className="border border-black bg-white shadow-[2px_2px_0px_#000000]">
        <div className="bg-white border-b border-black px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase font-ui text-black">
              RECENT GENERATION JOBS
            </h3>
            <p className="text-xs font-serif text-neutral-700">
              Showing the latest batches registered in PostgreSQL. Click any row to inspect per-recipient certificates.
            </p>
          </div>
          {totalCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-3 h-3" />}
              onClick={() => navigate('/jobs')}
            >
              Full Ledger ({totalCount} jobs)
            </Button>
          )}
        </div>
        <div className="p-0">
          <JobTable
            jobs={recentJobs}
            isLoading={isLoading}
            emptyTitle="No Generation Batches Dispatched"
            emptyMessage="The PostgreSQL database contains no active certificate jobs. Click below to initialize your first high-volume certificate batch."
            onNewJob={() => navigate('/jobs/new')}
            isArchived={isArchived}
            onToggleArchive={(jobId, e) => {
              e.stopPropagation();
              toggleArchiveJob(jobId);
            }}
          />
        </div>
      </div>

      {/* 3 Ribbon Cards Architecture Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Tint Periwinkle */}
        <div className="border border-black bg-[#8c9ae0] shadow-[2px_2px_0px_#000000]">
          <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
            <span className="font-ui font-bold text-xs uppercase">DATA INTEGRITY</span>
            <Database className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="p-3 text-xs font-serif text-black leading-relaxed">
            State is strictly persisted in PostgreSQL. Row locking via <strong className="font-mono">select_for_update()</strong> prevents duplicate worker execution.
          </div>
        </div>

        {/* Card 2: Tint Salmon */}
        <div className="border border-black bg-[#d77a7a] shadow-[2px_2px_0px_#000000]">
          <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
            <span className="font-ui font-bold text-xs uppercase">DISPATCH ISOLATION</span>
            <Cpu className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="p-3 text-xs font-serif text-black leading-relaxed">
            Celery workers process background jobs independently. Per-certificate failure isolation ensures invalid recipients never halt valid generation.
          </div>
        </div>

        {/* Card 3: Tint Sage */}
        <div className="border border-black bg-[#b3bd95] shadow-[2px_2px_0px_#000000]">
          <div className="bg-white border-b border-black px-3 py-1.5 flex items-center justify-between text-black">
            <span className="font-ui font-bold text-xs uppercase">AUTHORITATIVE OUTPUT</span>
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="p-3 text-xs font-serif text-black leading-relaxed">
            ReportLab dynamically overlays text onto the fixed 1468×1071 template. The 3D inspector rasterizes the authoritative PDF with zero divergence.
          </div>
        </div>
      </div>
    </div>
  );
};
