import React from 'react';
import { Activity, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import type { GenerationJob } from '../../types/api';

interface JobTelemetryHudProps {
  job: GenerationJob;
}

export const JobTelemetryHud: React.FC<JobTelemetryHudProps> = ({ job }) => {
  const { progress } = job;
  const isFailed = job.status === 'FAILED';
  const isCompletedWithErrors = job.status === 'COMPLETED_WITH_ERRORS';
  const isProcessing = job.status === 'PROCESSING' || job.status === 'PENDING';

  const hasProgress = progress && typeof progress.percent_complete === 'number';
  const percent = hasProgress ? progress.percent_complete : 0;

  return (
    <div className="border-2 border-black bg-white shadow-[3px_3px_0px_#000000] text-black">
      <div className="p-3 border-b-2 border-black bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-black" />
          <h3 className="font-ui font-bold uppercase tracking-wider text-xs text-black">
            GENERATION TELEMETRY HUD
          </h3>
        </div>
        <span className="font-ui text-[10px] uppercase font-bold text-neutral-600">
          {isProcessing ? 'Active Worker Pipeline' : 'Final Telemetry Ledger'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Bar & Status Text */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs font-ui">
            <span className="text-black font-bold uppercase tracking-wider">
              {isFailed
                ? 'PIPELINE ABORTED'
                : isCompletedWithErrors
                  ? 'COMPLETED WITH EXCEPTIONS'
                  : isProcessing
                    ? 'PROCESSING CERTIFICATES'
                    : 'PIPELINE COMPLETED'}
            </span>
            {hasProgress && !isFailed && (
              <span className="text-black font-black text-sm">
                {percent.toFixed(1)}%
              </span>
            )}
          </div>

          {isFailed ? (
            <div className="p-3 bg-[#d77a7a] border border-black text-black text-xs font-serif flex items-start gap-2">
              <XCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div>
                <p className="font-ui font-bold uppercase">Batch Generation Failed</p>
                <p className="mt-0.5">
                  {job.error_message || 'An unrecoverable system exception interrupted certificate generation.'}
                </p>
              </div>
            </div>
          ) : (
            <ProgressBar
              percent={percent}
              isProcessing={isProcessing}
              size="lg"
              showPercentText={false}
              aria-label={`Generation Progress: ${percent.toFixed(1)}%`}
            />
          )}
        </div>

        {/* Telemetry Metric Catalog Tints Grid */}
        {progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-[#a5b8c0] border border-black p-2.5 text-black">
              <span className="text-[10px] uppercase font-ui font-bold block">
                TOTAL
              </span>
              <span className="text-xl font-black font-ui text-black">
                {progress.total}
              </span>
            </div>

            <div className="bg-[#c0d4a7] border border-black p-2.5 text-black">
              <span className="text-[10px] uppercase font-ui font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-black" /> GENERATED
              </span>
              <span className="text-xl font-black font-ui text-black">
                {progress.generated}
              </span>
            </div>

            <div className="bg-[#fcc20f] border border-black p-2.5 text-black">
              <span className="text-[10px] uppercase font-ui font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-black" /> PENDING
              </span>
              <span className="text-xl font-black font-ui text-black">
                {progress.pending}
              </span>
            </div>

            <div className="bg-[#d77a7a] border border-black p-2.5 text-black">
              <span className="text-[10px] uppercase font-ui font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-black" /> FAILED
              </span>
              <span className="text-xl font-black font-ui text-black">
                {progress.failed}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
