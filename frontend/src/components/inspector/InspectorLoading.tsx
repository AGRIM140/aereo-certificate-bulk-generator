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
      <div className="border-2 border-black bg-[#9ab6c8] p-3 shadow-[2px_2px_0px_#000000]">
        <h1 className="text-lg sm:text-xl font-black uppercase font-ui tracking-wide text-black">
          CERTIFICATE INSPECTOR
        </h1>
        <p className="text-xs font-serif text-black mt-0.5">
          INITIALIZING ZERO-DIVERGENCE PIPELINE FOR {certificateId || 'DOCUMENT'}…
        </p>
      </div>

      <div className="bg-white border-2 border-black p-12 text-center space-y-6 shadow-[2px_2px_0px_#000000] text-black">
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-black animate-spin" />
            <FileCode className="w-4 h-4 text-black absolute inset-0 m-auto" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <p className="text-sm font-bold text-black font-ui uppercase tracking-wide">
            {current.label}
          </p>
          <p className="text-xs text-neutral-600 font-serif">
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
                className={`p-2 border border-black text-[10px] font-mono transition-none ${
                  isCurrent
                    ? 'bg-[#fcc20f] text-black font-bold shadow-[1px_1px_0px_#000000]'
                    : isCompleted
                      ? 'bg-[#c0d4a7] text-black'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>STEP 0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-black" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 bg-black" />
                  ) : null}
                </div>
                <div className="truncate font-bold font-ui uppercase">{item.label.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
