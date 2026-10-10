import React from 'react';
import { Loader2, FileCode, CheckCircle2 } from 'lucide-react';

export type InspectorLoadingStage =
  | 'loading_metadata'
  | 'fetching_pdf'
  | 'rasterizing'
  | 'building_scene';

interface InspectorLoadingProps {
  stage: InspectorLoadingStage;
  certificateId?: string;
}

const stageDescriptions: Record<
  InspectorLoadingStage,
  { label: string; detail: string; step: number }
> = {
  loading_metadata: {
    label: 'LOADING CERTIFICATE METADATA',
    detail: 'Querying authoritative ledger for certificate parameters…',
    step: 1,
  },
  fetching_pdf: {
    label: 'FETCHING AUTHORITATIVE PDF',
    detail: 'Retrieving official ReportLab document stream from backend…',
    step: 2,
  },
  rasterizing: {
    label: 'RASTERIZING DOCUMENT SURFACE',
    detail: 'Executing zero-divergence PDF.js high-resolution rasterizer…',
    step: 3,
  },
  building_scene: {
    label: 'INITIALIZING 3D PHYSICAL SURFACE',
    detail: 'Synthesizing curved paper geometry, specular lighting, and shaders…',
    step: 4,
  },
};

export const InspectorLoading: React.FC<InspectorLoadingProps> = ({
  stage,
  certificateId,
}) => {
  const current = stageDescriptions[stage];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#e2dac9]">
        <h1 className="text-xl font-bold tracking-tight text-[#161a22] font-mono-telemetry uppercase">
          CERTIFICATE INSPECTOR
        </h1>
        <p className="text-xs text-[#647287] mt-1 font-mono-telemetry">
          INITIALIZING ZERO-DIVERGENCE PIPELINE FOR {certificateId || 'DOCUMENT'}…
        </p>
      </div>

      <div className="bg-[#ffffff] border border-[#dcd3c1] rounded-lg p-12 text-center space-y-6 shadow-sm text-[#161a22]">
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-[#1f304d] animate-spin" />
            <FileCode className="w-4 h-4 text-[#1f304d] absolute inset-0 m-auto" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <p className="text-sm font-bold text-[#161a22] font-mono-telemetry tracking-wide">
            {current.label}
          </p>
          <p className="text-xs text-[#647287] font-mono-telemetry">
            {current.detail}
          </p>
        </div>

        {/* 4-Step Pipeline Telemetry Tracker */}
        <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto pt-4 text-left">
          {(Object.keys(stageDescriptions) as InspectorLoadingStage[]).map((key, idx) => {
            const item = stageDescriptions[key];
            const isCompleted = item.step < current.step;
            const isCurrent = item.step === current.step;

            return (
              <div
                key={key}
                className={`p-2 rounded border text-[10px] font-mono-telemetry transition-colors ${
                  isCurrent
                    ? 'border-[#3b82f6]/60 bg-[#edf3fa] text-[#1e3a5f] font-bold shadow-sm'
                    : isCompleted
                      ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                      : 'border-[#e2dac9] bg-[#fbf9f4] text-[#7d8b9e]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>STEP 0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-ping" />
                  ) : null}
                </div>
                <div className="truncate font-semibold">{item.label.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
