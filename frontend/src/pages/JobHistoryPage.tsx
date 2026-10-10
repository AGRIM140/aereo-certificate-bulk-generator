import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RefreshCw, PlusCircle } from 'lucide-react';
import { getJobs } from '../api/jobs';
import type { PaginatedResponse, JobSummary } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { JobTable } from '../components/jobs/JobTable';
import { Pagination } from '../components/ui/Pagination';

const BACKEND_PAGE_SIZE = 50;

export const JobHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [data, setData] = useState<PaginatedResponse<JobSummary> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setSearchParams(newPage > 1 ? { page: String(newPage) } : {});
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    getJobs(currentPage, controller.signal)
      .then((response) => {
        if (isMounted) {
          setData(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err instanceof Error ? err : new Error('Failed to load jobs ledger'));
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
  }, [currentPage, refreshTrigger]);

  const totalCount = data?.count || 0;
  const jobs = data?.results || [];

  return (
    <div className="space-y-6">
      {/* Top Ledger Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2dac9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161a22] uppercase font-serif">
              HISTORICAL JOB LEDGER
            </h1>
            <span className="text-[10px] font-mono-telemetry px-2 py-0.5 rounded bg-[#f5efe4] text-[#161a22] border border-[#dcd3c1] font-semibold">
              {totalCount} TOTAL BATCHES
            </span>
          </div>
          <p className="text-xs text-[#5a6678]">
            Chronological audit log of all bulk certificate generation runs, ordered newest first by creation timestamp.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            aria-label="Refresh job ledger"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/jobs/new')}
          >
            New Batch Job
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert
          variant="error"
          title="Ledger Retrieval Error"
          error={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Ledger Table Card */}
      <Card variant="elevated">
        <CardHeader>
          <div>
            <CardTitle>DISPATCHED BATCHES</CardTitle>
            <CardDescription>
              Backend page size: {BACKEND_PAGE_SIZE} jobs per page. Click any batch to view per-recipient outcomes and download bulk ZIP packages.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <JobTable
            jobs={jobs}
            isLoading={isLoading}
            emptyTitle="No Batches in Ledger"
            emptyMessage="The ledger is currently empty. Initialize a new bulk generation batch to create certificates."
            onNewJob={() => navigate('/jobs/new')}
          />

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalCount={totalCount}
              pageSize={BACKEND_PAGE_SIZE}
              onPageChange={handlePageChange}
              isLoading={isLoading || isRefreshing}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
