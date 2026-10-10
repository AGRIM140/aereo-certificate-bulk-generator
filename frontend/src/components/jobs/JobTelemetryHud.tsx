import React from 'react';
import { Activity, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
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

  // Only render determinate percent if authoritative progress exists
  const hasProgress = progress && typeof progress.percent_complete === 'number';
  const percent = hasProgress ? progress.percent_complete : 0;

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-3 border-b border-[#ece5d6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1f304d]" />
            <CardTitle className="text-sm font-mono-telemetry uppercase tracking-wider text-[#161a22]">
              Generation Telemetry
            </CardTitle>
          </div>
          <span className="text-xs font-mono-telemetry text-[#7d8b9e]">
            {isProcessing ? 'Active Worker Pipeline' : 'Final Telemetry Ledger'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Progress Bar & Status Text */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs font-mono-telemetry">
            <span className="text-[#161a22] font-bold uppercase tracking-wider">
              {isFailed
                ? 'PIPELINE ABORTED'
                : isCompletedWithErrors
                  ? 'COMPLETED WITH EXCEPTIONS'
                  : isProcessing
                    ? 'PROCESSING CERTIFICATES'
                    : 'PIPELINE COMPLETED'}
            </span>
            {hasProgress && !isFailed && (
              <span className="text-[#15803d] font-bold text-sm">
                {percent.toFixed(1)}%
              </span>
            )}
          </div>

          {isFailed ? (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded text-xs text-[#991b1b] font-mono-telemetry flex items-start gap-2">
              <XCircle className="w-4 h-4 text-[#b83a34] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Batch Generation Failed</p>
                <p className="text-[#b83a34] mt-0.5">
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

        {/* Telemetry Metric Bento Grid */}
        {progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-[#fbf9f4] border border-[#e2dac9] rounded p-3 shadow-inner">
              <span className="text-[10px] text-[#7d8b9e] uppercase font-mono-telemetry block font-semibold">
                TOTAL
              </span>
              <span className="text-lg font-bold font-mono-telemetry text-[#161a22]">
                {progress.total}
              </span>
            </div>

            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded p-3 shadow-inner">
              <span className="text-[10px] text-[#15803d] uppercase font-mono-telemetry flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-[#15803d]" /> GENERATED
              </span>
              <span className="text-lg font-bold font-mono-telemetry text-[#15803d]">
                {progress.generated}
              </span>
            </div>

            <div className="bg-[#fffbeb] border border-[#fde68a] rounded p-3 shadow-inner">
              <span className="text-[10px] text-[#92400e] uppercase font-mono-telemetry flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3 text-[#b45309]" /> PENDING
              </span>
              <span className="text-lg font-bold font-mono-telemetry text-[#92400e]">
                {progress.pending}
              </span>
            </div>

            <div className={`rounded p-3 border shadow-inner ${
              progress.failed > 0
                ? 'bg-[#fef2f2] border-[#fecaca]'
                : 'bg-[#fbf9f4] border-[#e2dac9]'
            }`}>
              <span className={`text-[10px] uppercase font-mono-telemetry flex items-center gap-1 font-semibold ${
                progress.failed > 0 ? 'text-[#b83a34]' : 'text-[#7d8b9e]'
              }`}>
                {progress.failed > 0 ? (
                  <AlertTriangle className="w-3 h-3 text-[#b83a34]" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-[#7d8b9e]" />
                )}
                FAILED
              </span>
              <span className={`text-lg font-bold font-mono-telemetry ${
                progress.failed > 0 ? 'text-[#b83a34]' : 'text-[#161a22]'
              }`}>
                {progress.failed}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
