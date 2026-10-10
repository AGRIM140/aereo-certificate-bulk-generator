import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ExternalLink, PlusCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { downloadAndSaveJobZip } from '../../api/jobs';
import { ApiClientError } from '../../api/client';
import type { GenerationJob } from '../../types/api';

interface JobActionsProps {
  job: GenerationJob;
}

export const JobActions: React.FC<JobActionsProps> = ({ job }) => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const isCompleted = job.status === 'COMPLETED';
  const isCompletedWithErrors = job.status === 'COMPLETED_WITH_ERRORS';
  const isFailed = job.status === 'FAILED';
  const hasGeneratedCertificates = (job.progress?.generated ?? 0) > 0;

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

      {/* Action Controls Bar */}
      <div className="bg-[#ffffff] border border-[#e2dac9] rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/jobs')}
            className="text-xs text-[#647287] hover:text-[#161a22]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Job Ledger
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/jobs/new')}
            className="text-xs text-[#647287] hover:text-[#161a22]"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            New Batch
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
                className="text-xs font-mono-telemetry"
                aria-label="Download generated certificate batch as ZIP archive"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isDownloading ? 'Downloading Batch…' : 'Download Batch (.ZIP)'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/jobs/${job.id}/certificates`)}
                className="text-xs font-mono-telemetry"
                title="View individual certificate ledger (Phase F5)"
                aria-label="Navigate to Certificate Gallery"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Certificate Gallery
              </Button>
            </>
          )}

          {isFailed && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/jobs/new')}
              className="text-xs font-mono-telemetry"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Re-create Batch
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
