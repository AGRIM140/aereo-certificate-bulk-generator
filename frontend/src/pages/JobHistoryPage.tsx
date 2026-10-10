import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RefreshCw, PlusCircle, Archive, ArchiveRestore, Layers } from 'lucide-react';
import { getJobs } from '../api/jobs';
import type { PaginatedResponse, JobSummary } from '../types/api';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { JobTable } from '../components/jobs/JobTable';
import { Pagination } from '../components/ui/Pagination';
import { useArchivedJobs } from '../lib/archiveStore';

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
  const [viewFilter, setViewFilter] = useState<'active' | 'archived' | 'all'>('active');

  const { isArchived, toggleArchiveJob, archivedCount } = useArchivedJobs();

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setSearchParams(newPage > 1 ? { page: String(newPage) } : {});
  };

  const handleToggleArchive = useCallback(
    (jobId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      toggleArchiveJob(jobId);
    },
    [toggleArchiveJob]
  );

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

  const pageArchivedCount = jobs.filter((j) => isArchived(j.id)).length;
  const pageActiveCount = jobs.length - pageArchivedCount;

  const displayedJobs = jobs.filter((job) => {
    if (viewFilter === 'active') return !isArchived(job.id);
    if (viewFilter === 'archived') return isArchived(job.id);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Dell 1996 Section Eyebrow Banner (Tint Salmon) */}
      <div className="border border-black bg-[#d77a7a] p-3 sm:p-4 text-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]">
        <div>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-black uppercase font-ui tracking-wide text-black">
              HISTORICAL JOB LEDGER
            </h1>
            <span className="bg-black text-white px-2 py-0.5 text-[10px] font-ui font-bold">
              {totalCount} TOTAL BATCHES
            </span>
            {archivedCount > 0 && (
              <span className="bg-[#fcc20f] text-black border border-black px-1.5 py-0.5 text-[10px] font-ui font-bold">
                {archivedCount} ARCHIVED
              </span>
            )}
          </div>
          <p className="text-xs font-serif text-black leading-tight">
            Chronological audit log of all bulk certificate generation runs, with archive controls to hide unwanted historical records.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
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

      {/* Ledger Table Ribbon Card */}
      <div className="border border-black bg-white shadow-[2px_2px_0px_#000000]">
        {/* Navigation / Filter Tabs Strip */}
        <div className="bg-white border-b border-black px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase font-ui text-black">
              DISPATCHED BATCHES
            </h3>
            <p className="text-xs font-serif text-neutral-700">
              Backend page size: {BACKEND_PAGE_SIZE} jobs per page. Click &apos;Archive&apos; on any batch row to hide it from your active ledger.
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div className="inline-flex border-2 border-black bg-neutral-100 p-0.5 font-ui text-xs font-bold select-none self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewFilter('active')}
              className={`px-3 py-1 flex items-center gap-1.5 cursor-pointer uppercase transition-none ${
                viewFilter === 'active'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Active</span>
              <span className={`text-[10px] px-1 py-0.2 border ${
                viewFilter === 'active' ? 'border-white text-white' : 'border-black text-black bg-white'
              }`}>
                {pageActiveCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewFilter('archived')}
              className={`px-3 py-1 flex items-center gap-1.5 cursor-pointer uppercase transition-none ${
                viewFilter === 'archived'
                  ? 'bg-[#fcc20f] text-black font-black'
                  : 'bg-transparent text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Archived</span>
              <span className={`text-[10px] px-1 py-0.2 border ${
                viewFilter === 'archived' ? 'border-black bg-black text-white' : 'border-black text-black bg-white'
              }`}>
                {pageArchivedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1 flex items-center gap-1.5 cursor-pointer uppercase transition-none ${
                viewFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              <ArchiveRestore className="w-3 h-3" />
              <span>All</span>
              <span className={`text-[10px] px-1 py-0.2 border ${
                viewFilter === 'all' ? 'border-white text-white' : 'border-black text-black bg-white'
              }`}>
                {jobs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Notice when viewing archived jobs */}
        {viewFilter === 'archived' && (
          <div className="bg-[#fcc20f]/20 border-b border-black px-4 py-2 flex items-center justify-between text-xs font-mono text-black">
            <div className="flex items-center gap-2">
              <Archive className="w-3.5 h-3.5 text-black" />
              <span>ARCHIVE REPOSITORY — Displaying batches hidden from active ledger. Click &apos;Restore&apos; to return any batch to the active view.</span>
            </div>
          </div>
        )}

        <div className="p-0">
          <JobTable
            jobs={displayedJobs}
            isLoading={isLoading}
            emptyTitle={
              viewFilter === 'archived'
                ? 'No Archived Batches'
                : 'No Batches in Ledger'
            }
            emptyMessage={
              viewFilter === 'archived'
                ? 'You have not archived any batches yet. Click "Archive" on any row in the active view to hide unwanted historical records.'
                : 'The ledger is currently empty. Initialize a new bulk generation batch to create certificates.'
            }
            onNewJob={() => navigate('/jobs/new')}
            isArchived={isArchived}
            onToggleArchive={handleToggleArchive}
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
        </div>
      </div>
    </div>
  );
};
