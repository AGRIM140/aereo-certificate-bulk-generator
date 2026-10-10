import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ExternalLink, PlusCircle, ArrowLeft, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { downloadAndSaveJobZip } from '../../api/jobs';
import { ApiClientError } from '../../api/client';
import type { GenerationJob } from '../../types/api';
import { useArchivedJobs } from '../../lib/archiveStore';

interface JobActionsProps {
  job: GenerationJob;
}

export const JobActions: React.FC<JobActionsProps> = ({ job }) => {
  const navigate = useNavigate();
  const { isArchived, toggleArchiveJob } = useArchivedJobs();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const isCompleted = job.status === 'COMPLETED';
  const isCompletedWithErrors = job.status === 'COMPLETED_WITH_ERRORS';
  const isFailed = job.status === 'FAILED';
  const hasGeneratedCertificates = (job.progress?.generated ?? 0) > 0;
  const archived = isArchived(job.id);

  const handleDownloadBatch = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      const filename = await downloadAndSaveJobZip(job.id);
      setDownloadSuccess(`Downloaded archive: ${filename}`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setDownloadError(
          err.message || 'No generated certificates are available for download in this batch.'
        );
      } else if (err instanceof Error) {
        setDownloadError(err.message || 'Failed to download certificate batch archive.');
      } else {
        setDownloadError('An unexpected network error occurred while downloading the batch archive.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Completed With Errors Alert Notice */}
      {isCompletedWithErrors && (
        <Alert variant="warning" title="Partial Batch Completion">
          Batch completed with exceptions. {job.progress?.generated ?? 0} certificate(s) generated
          successfully, while {job.progress?.failed ?? 0} recipient(s) encountered errors. Generated
          certificates are available for archive download.
        </Alert>
      )}

      {/* Failed Job Alert Notice */}
      {isFailed && (
        <Alert variant="error" title="Batch Execution Terminated">
          {job.error_message ||
            'Batch processing could not be completed. Review job parameters and submit a new batch.'}
        </Alert>
      )}

      {/* Download Result Messages */}
      {downloadError && (
        <Alert variant="error" title="Download Conflict" onClose={() => setDownloadError(null)}>
          {downloadError}
        </Alert>
      )}

      {downloadSuccess && (
        <Alert variant="success" title="Download Initiated" onClose={() => setDownloadSuccess(null)}>
          {downloadSuccess}
        </Alert>
      )}

      {/* Archived Notice Banner */}
      {archived && (
        <div className="bg-[#fcc20f] border-2 border-black p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-ui text-black shadow-[2px_2px_0px_#000]">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-black shrink-0" />
            <span>
              <strong>ARCHIVED BATCH:</strong> This job is hidden from your primary active ledger. All generated PDFs and records remain fully preserved.
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleArchiveJob(job.id)}
            className="bg-black text-white px-2.5 py-1 text-[11px] font-bold uppercase hover:bg-neutral-800 transition-none cursor-pointer self-start sm:self-auto shrink-0"
          >
            Restore to Active
          </button>
        </div>
      )}

      {/* Action Controls Bar */}
      <div className="bg-white border-2 border-black p-4 flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/jobs')}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            JOB LEDGER
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/jobs/new')}
            className="text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            NEW BATCH
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleArchiveJob(job.id)}
            className={`text-xs ${archived ? 'bg-[#fcc20f] hover:bg-yellow-400 font-bold' : ''}`}
            title={archived ? 'Restore batch to active ledger' : 'Archive batch (hide from active ledger)'}
            aria-label={archived ? 'Restore batch' : 'Archive batch'}
          >
            {archived ? (
              <>
                <ArchiveRestore className="w-3.5 h-3.5 mr-1 text-black" />
                RESTORE BATCH
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 mr-1 text-neutral-700" />
                ARCHIVE BATCH
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {(isCompleted || isCompletedWithErrors) && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleDownloadBatch}
                isLoading={isDownloading}
                disabled={isDownloading || !hasGeneratedCertificates}
                className="text-xs bg-[#e91d2a] hover:bg-[#b8141e] text-white border-2 border-black font-ui font-bold uppercase tracking-wider"
                aria-label="Download generated certificate batch as ZIP archive"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isDownloading ? 'PACKAGING ARCHIVE…' : 'DOWNLOAD BATCH (.ZIP)'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/jobs/${job.id}/certificates`)}
                className="text-xs"
                title="View individual certificate ledger"
                aria-label="Navigate to Certificate Gallery"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                CERTIFICATE GALLERY
              </Button>
            </>
          )}

          {isFailed && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/jobs/new')}
              className="text-xs bg-[#e91d2a] hover:bg-[#b8141e] text-white border-2 border-black font-ui font-bold uppercase tracking-wider"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              RE-CREATE BATCH
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
