import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { getJobCertificates, getJobDetail } from '../api/jobs';
import { downloadAndSaveCertificatePdf } from '../api/certificates';
import { CertificateCard } from '../components/certificates/CertificateCard';
import {
  CertificateStatusFilter,
  type FilterStatus,
} from '../components/certificates/CertificateStatusFilter';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../api/client';
import type { Certificate, CertificateStatus, GenerationJob } from '../types/api';

const PAGE_SIZE = 50;

export const CertificateGalleryPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<GenerationJob | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Load Job metadata for header summary
  useEffect(() => {
    let isMounted = true;
    if (!jobId) return;

    getJobDetail(jobId)
      .then((data) => {
        if (isMounted) setJob(data);
      })
      .catch(() => {
        // Non-fatal if certificates still load
      });

    return () => {
      isMounted = false;
    };
  }, [jobId, refreshTrigger]);

  // Load certificates whenever jobId, page, statusFilter, or refreshTrigger changes
  useEffect(() => {
    let isMounted = true;
    if (!jobId) return;

    const controller = new AbortController();
    const options: { page?: number; status?: CertificateStatus } = {
      page: currentPage,
    };
    if (statusFilter !== 'ALL') {
      options.status = statusFilter;
    }

    getJobCertificates(jobId, options, controller.signal)
      .then((response) => {
        if (isMounted) {
          setCertificates(response.results);
          setTotalCount(response.count);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted && err.name !== 'AbortError') {
          setError(err instanceof Error ? err : new Error('Failed to load certificates'));
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
  }, [jobId, currentPage, statusFilter, refreshTrigger]);

  const handleStatusChange = (newStatus: FilterStatus) => {
    if (newStatus === statusFilter) return;
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to page 1 on filter switch
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleInspect = (cert: Certificate) => {
    navigate(`/certificates/${cert.id}`);
  };

  const handleDownloadPdf = async (cert: Certificate) => {
    if (cert.status !== 'GENERATED') return;
    setDownloadingCertId(cert.id);
    setDownloadSuccessMessage(null);
    try {
      const filename = await downloadAndSaveCertificatePdf(cert.id);
      setDownloadSuccessMessage(`Downloaded: ${filename}`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch {
      // Ignore download errors or show temporary toast
    } finally {
      setDownloadingCertId(null);
    }
  };

  // 1. Not Found / Fatal Error State
  if (error && certificates.length === 0 && !job) {
    const isNotFound =
      (error instanceof ApiClientError && error.status === 404) ||
      error.message?.toLowerCase().includes('not found');

    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-[#e2dac9]">
          <h1 className="text-xl font-bold tracking-tight text-[#161a22] font-mono-telemetry uppercase">
            CERTIFICATE ARCHIVE — ERROR
          </h1>
          <p className="text-xs text-[#5a6678] mt-1 font-mono-telemetry">
            BATCH UUID: {jobId}
          </p>
        </div>

        <div className="bg-[#ffffff] border border-[#fecaca] rounded-lg p-8 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#b83a34] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#991b1b] font-mono-telemetry uppercase">
                {isNotFound ? 'BATCH ARCHIVE NOT FOUND' : 'FAILED TO LOAD ARCHIVE MANIFEST'}
              </h2>
              <p className="text-xs text-[#556377]">
                {isNotFound
                  ? `No certificate generation job exists with identifier "${jobId}".`
                  : error.message || 'An unexpected error occurred while communicating with the backend.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualRefresh}
              className="text-xs font-mono-telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry Query
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="text-xs font-mono-telemetry"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Return to Ledger
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Job Context */}
      <div className="bg-[#ffffff] border border-[#e2dac9] rounded-lg p-5 shadow-sm text-[#161a22]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#ece5d6]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-mono-telemetry text-[#7d8b9e] font-semibold">
                BATCH ARCHIVE
              </span>
              <span
                className="text-sm font-mono-telemetry font-bold text-[#161a22] bg-[#f5efe4] px-2 py-0.5 rounded border border-[#dcd3c1]"
                title={jobId}
              >
                {jobId ? `${jobId.slice(0, 8)}…${jobId.slice(-4)}` : '—'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161a22] font-serif">
              {job ? job.event_name : 'Certificate Archive Ledger'}
            </h1>
            <p className="text-xs text-[#647287] font-mono-telemetry">
              ORGANIZATION:{' '}
              <span className="text-[#161a22] font-semibold">
                {job ? job.organization_name : 'Official Issuer'}
              </span>
            </p>
          </div>

          {/* Quick Nav & Refresh Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:self-start">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/jobs/${jobId}`)}
              className="text-xs font-mono-telemetry"
              title="Return to operational monitoring view"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 text-[#1f304d]" />
              Job Telemetry
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualRefresh}
              isLoading={isRefreshing}
              disabled={isRefreshing || isLoading}
              className="text-xs"
              aria-label="Refresh certificate gallery"
              title="Refresh certificate list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Telemetry Summary Strip */}
        {job && job.progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs font-mono-telemetry">
            <div>
              <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">TOTAL RECORDS</span>
              <span className="text-[#161a22] font-bold">{job.progress.total}</span>
            </div>
            <div>
              <span className="text-[#15803d] block text-[10px] uppercase font-semibold">GENERATED</span>
              <span className="text-[#15803d] font-bold">{job.progress.generated}</span>
            </div>
            <div>
              <span className="text-[#92400e] block text-[10px] uppercase font-semibold">PENDING</span>
              <span className="text-[#92400e] font-bold">{job.progress.pending}</span>
            </div>
            <div>
              <span className="text-[#b83a34] block text-[10px] uppercase font-semibold">FAILED</span>
              <span className={`font-bold ${job.progress.failed > 0 ? 'text-[#b83a34]' : 'text-[#7d8b9e]'}`}>
                {job.progress.failed}
              </span>
            </div>
          </div>
        )}
      </div>

      {downloadSuccessMessage && (
        <Alert
          variant="success"
          title="Download Complete"
          onClose={() => setDownloadSuccessMessage(null)}
        >
          {downloadSuccessMessage}
        </Alert>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <CertificateStatusFilter
          activeStatus={statusFilter}
          onStatusChange={handleStatusChange}
          counts={
            job?.progress
              ? {
                  total: job.progress.total,
                  generated: job.progress.generated,
                  pending: job.progress.pending,
                  failed: job.progress.failed,
                }
              : undefined
          }
          disabled={isLoading && certificates.length === 0}
        />

        <div className="text-xs font-mono-telemetry text-[#647287]">
          Showing <span className="text-[#161a22] font-bold">{certificates.length}</span> of{' '}
          <span className="text-[#161a22] font-bold">{totalCount}</span> filtered records
        </div>
      </div>

      {/* Main Content: Gallery Grid / Loading Skeleton / Empty State */}
      {isLoading && certificates.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 rounded-lg border border-[#e2dac9] bg-[#ffffff] p-5 shadow-sm animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-[#ede5d4] rounded" />
                <div className="h-5 w-16 bg-[#ede5d4] rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-[#ede5d4] rounded" />
                <div className="h-5 w-44 bg-[#ded5c2] rounded" />
                <div className="h-3 w-28 bg-[#ede5d4] rounded" />
              </div>
              <div className="h-8 w-full bg-[#ede5d4] rounded" />
            </div>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#e2dac9] rounded-lg p-12 text-center space-y-3 shadow-sm text-[#161a22]">
          <div className="flex justify-center">
            <Archive className="w-10 h-10 text-[#7d8b9e]" />
          </div>
          <h2 className="text-base font-bold text-[#161a22] font-mono-telemetry uppercase">
            {statusFilter === 'ALL'
              ? 'NO CERTIFICATE RECORDS RECORDED'
              : `NO ${statusFilter} CERTIFICATES FOUND`}
          </h2>
          <p className="text-xs text-[#647287] max-w-md mx-auto">
            {statusFilter === 'ALL'
              ? 'This batch does not currently contain any certificate records.'
              : `No certificates matching status "${statusFilter}" were found for this batch.`}
          </p>
          {statusFilter !== 'ALL' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange('ALL')}
              className="text-xs font-mono-telemetry mt-2"
            >
              View All Certificates
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                onInspect={handleInspect}
                onDownload={handleDownloadPdf}
                isDownloading={downloadingCertId === cert.id}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            isLoading={isLoading}
            itemNoun="certificates"
          />
        </div>
      )}
    </div>
  );
};
