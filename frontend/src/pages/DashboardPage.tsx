import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';
import { getJobs } from '../api/jobs';
import type { PaginatedResponse, JobSummary } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics';
import { JobTable } from '../components/jobs/JobTable';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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

  const recentJobs = data?.results.slice(0, 10) || [];
  const totalCount = data?.count || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2dac9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161a22] uppercase font-serif">
              OPERATIONAL TELEMETRY CONSOLE
            </h1>
            <span className="text-[10px] font-mono-telemetry px-2 py-0.5 rounded bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] font-semibold">
              LIVE API
            </span>
          </div>
          <p className="text-xs text-[#5a6678]">
            Real-time batch generation overview, authoritative database telemetry, and recent certificates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            leftIcon={<PlusCircle className="w-4 h-4" />}
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

      {/* Bento Telemetry Metrics Cards */}
      <DashboardMetrics totalJobsCount={totalCount} recentJobs={recentJobs} />

      {/* Recent Jobs Table Card */}
      <Card variant="elevated">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>RECENT GENERATION JOBS</CardTitle>
            <CardDescription>
              Showing the latest batches registered in PostgreSQL. Click any row to inspect per-recipient certificates.
            </CardDescription>
          </div>
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/jobs')}
              className="text-xs text-[#1f304d] hover:text-[#166534] font-mono-telemetry font-semibold"
            >
              Full Ledger ({totalCount} jobs)
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <JobTable
            jobs={recentJobs}
            isLoading={isLoading}
            emptyTitle="No Generation Batches Dispatched"
            emptyMessage="The PostgreSQL database contains no certificate jobs yet. Click below to initialize your first high-volume certificate batch."
            onNewJob={() => navigate('/jobs/new')}
          />
        </CardContent>
      </Card>

      {/* System Architecture Specifications (Secondary Bento Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="subtle">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-[11px] text-[#334155]">DATA INTEGRITY</CardTitle>
            <Database className="w-3.5 h-3.5 text-[#1f304d]" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-[#556377] leading-relaxed">
              State is strictly persisted in PostgreSQL. Row locking via <code className="text-[#161a22] font-mono-telemetry font-semibold">select_for_update()</code> prevents duplicate worker execution.
            </p>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-[11px] text-[#334155]">DISPATCH ISOLATION</CardTitle>
            <Cpu className="w-3.5 h-3.5 text-[#b45309]" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-[#556377] leading-relaxed">
              Celery workers process background jobs independently. Per-certificate failure isolation ensures invalid recipients never halt valid generation.
            </p>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-[11px] text-[#334155]">AUTHORITATIVE OUTPUT</CardTitle>
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-[#556377] leading-relaxed">
              ReportLab dynamically overlays text onto the fixed 1468×1071 template. The 3D inspector rasterizes the authoritative PDF with zero divergence.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
