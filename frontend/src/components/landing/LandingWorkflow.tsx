import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Send,
  Activity,
  Download,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';

const workflowSteps = [
  {
    step: '01',
    title: 'PREPARE RECIPIENT DATA',
    icon: FileSpreadsheet,
    description:
      'Structure recipient records with full names and optional email addresses via CSV file import or direct tabular manual entry, supporting up to 500 recipients per batch.',
    tag: 'INPUT FORMAT: CSV / JSON',
    details: {
      heading: 'ARCHIVAL DATASET PARSING & RECIPIENT MANIFEST',
      caption: 'Client-side atomic RFC 4180 parsing with real-time duplicate name detection and email syntax validation.',
      sampleData: [
        { id: 'REC-001', name: 'Dr. Aris Thorne', email: 'aris.thorne@quantum.org', status: 'VALIDATED' },
        { id: 'REC-002', name: 'Marcus Vance, PhD', email: 'm.vance@cryo-labs.edu', status: 'VALIDATED' },
        { id: 'REC-003', name: 'Dr. Aaliyah Chen', email: 'aaliyah.c@bio-synth.io', status: 'VALIDATED' },
      ],
    },
  },
  {
    step: '02',
    title: 'SUBMIT BATCH JOB',
    icon: Send,
    description:
      'Atomic validation verifies event parameters, dates, and names before queuing. The API returns HTTP 202 Accepted with dedicated status URL and asynchronous Celery dispatch.',
    tag: 'DISPATCH: CELERY + REDIS',
    details: {
      heading: 'TRANSACTIONAL DISPATCH & ASYNCHRONOUS TASK QUEUE',
      caption: 'Django on_commit hooks trigger background worker tasks in Redis only after database state is committed.',
      sampleData: [
        { id: 'JOB-9A4B', event: 'Global Quantum Summit', recipients: 500, state: 'HTTP 202 QUEUED' },
        { id: 'QUEUE', worker: 'celery@worker-01', broker: 'redis://127.0.0.1:6379/0', task: 'generate_batch' },
      ],
    },
  },
  {
    step: '03',
    title: 'TRACK REAL-TIME PROGRESS',
    icon: Activity,
    description:
      'Observe live generation telemetry with exponential backoff polling. Fault-tolerant row isolation ensures any individual invalid record never halts batch processing.',
    tag: 'RELIABILITY: FAILURE ISOLATION',
    details: {
      heading: 'LIVE TELEMETRY STREAM & ROW-LEVEL ISOLATION',
      caption: 'Individual try/except boundaries log specific row anomalies without interrupting the remaining certificates.',
      sampleData: [
        { metric: 'PROCESSED', value: '500 / 500', rate: '142 certs/sec', status: 'COMPLETED' },
        { metric: 'FAULT TOLERANCE', value: '100% ISOLATED', containment: 'PER-ROW EXCEPTION SAFE', status: 'VERIFIED' },
      ],
    },
  },
  {
    step: '04',
    title: 'INSPECT & EXPORT ARCHIVE',
    icon: Download,
    description:
      'Examine authoritative certificates in the zero-divergence 3D inspector, or download single official PDFs and complete bulk ZIP archives in one click.',
    tag: 'DELIVERY: PDF / BULK ZIP',
    details: {
      heading: 'ZERO-DIVERGENCE 3D INSPECTION & BULK PACKAGING',
      caption: 'Authoritative PDF.js raster projected onto Three.js curved mesh; deterministic server-side ZIP packaging.',
      sampleData: [
        { file: 'CERT-2026-466DBC643C27.pdf', format: 'Vector PDF (Cormorant Garamond)', hash: 'SHA-256 e48b..9c' },
        { file: 'certificates_batch_9a4b.zip', format: 'Archival ZIP Package', size: '18.4 MB' },
      ],
    },
  },
];

export const LandingWorkflow: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const activeStep = workflowSteps[activeStepIndex];

  return (
    <section className="py-16 lg:py-24 border-t border-[#e2dac9] bg-transparent">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Header: Archival Dossier Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e2dac9]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono-telemetry uppercase tracking-wider text-[#15803d] font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>ARCHITECTURAL PIPELINE // FOUR-STAGE VERIFIED DISPATCH</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#161a22] font-serif">
              FROM RAW DATA TO CERTIFICATE ARCHIVE
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5a6678] font-sans max-w-md leading-relaxed">
            Built on a four-stage verified pipeline ensuring strict consistency, atomic transactions,
            and complete fault isolation across high-volume batches.
          </p>
        </div>

        {/* Master Split Pipeline (12 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 Cols): Vertical Interactive Station Dossier */}
          <div className="lg:col-span-5 space-y-3 relative">
            {/* Connecting Vertical Ink Spine */}
            <div className="hidden lg:block absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-[#1f304d] via-[#b8a892] to-[#15803d] -z-0" />

            {workflowSteps.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeStepIndex === idx;

              return (
                <button
                  type="button"
                  key={item.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-full text-left rounded-xl p-5 border transition-all cursor-pointer relative z-10 flex items-start gap-4 ${
                    isSelected
                      ? 'bg-[#ffffff] border-[#1f304d] ring-2 ring-[#1f304d]/15 shadow-md'
                      : 'bg-[#ffffff]/80 border-[#e2dac9] hover:bg-[#ffffff] hover:border-[#b8a892] shadow-sm'
                  }`}
                >
                  {/* Step Badge */}
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono-telemetry font-bold shrink-0 transition-colors flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-[#1f304d] text-white shadow-sm'
                        : 'bg-[#fbf9f4] border border-[#e2dac9] text-[#7d8b9e]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] leading-none">{item.step}</span>
                  </div>

                  {/* Step Content */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-bold text-[#161a22] font-mono-telemetry tracking-wide truncate">
                        {item.title}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] font-mono-telemetry font-bold text-[#15803d] flex items-center gap-1 bg-[#f0fdf4] px-1.5 py-0.5 rounded border border-[#bbf7d0]">
                          <Sparkles className="w-3 h-3" />
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#556377] font-sans leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-1 text-[10px] font-mono-telemetry text-[#1f304d] font-semibold">
                      {item.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column (7 Cols): Live Archival Station Telemetry Chamber */}
          <div className="lg:col-span-7 bg-[#ffffff] border border-[#e2dac9] rounded-xl shadow-md p-6 sm:p-7 space-y-6">
            {/* Station Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ece5d6] gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#15803d] animate-pulse" />
                <span className="font-mono-telemetry text-sm font-bold text-[#161a22]">
                  STAGE {activeStep.step} PREVIEW: {activeStep.details.heading}
                </span>
              </div>
              <span className="text-[10px] font-mono-telemetry text-[#7d8b9e] bg-[#fbf9f4] px-2 py-1 rounded border border-[#e2dac9]">
                STATION // VERIFIED INTERFACE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#556377] font-sans leading-relaxed">
              {activeStep.details.caption}
            </p>

            {/* Stage Telemetry Manifest Screen */}
            <div className="bg-[#fbf9f4] border border-[#e2dac9] rounded-lg p-5 font-mono-telemetry text-xs overflow-x-auto shadow-inner">
              {activeStepIndex === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e2dac9] text-[10px] text-[#7d8b9e]">
                    <span className="font-bold text-[#161a22]">RFC 4180 DATA VALIDATION MATRIX</span>
                    <span className="text-[#15803d] font-bold">ALL 500 ROWS SANITIZED</span>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#e2dac9] text-[10px] text-[#7d8b9e]">
                        <th className="pb-2 font-semibold">RECORD ID</th>
                        <th className="pb-2 font-semibold">RECIPIENT NAME</th>
                        <th className="pb-2 font-semibold">EMAIL IDENTIFIER</th>
                        <th className="pb-2 font-semibold text-right">RFC VALIDATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece5d6] text-[11px]">
                      {activeStep.details.sampleData.map((row: any) => (
                        <tr key={row.id}>
                          <td className="py-2.5 text-[#7d8b9e]">{row.id}</td>
                          <td className="py-2.5 font-bold text-[#161a22]">{row.name}</td>
                          <td className="py-2.5 text-[#556377]">{row.email}</td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center gap-1 text-[#15803d] font-semibold text-[10px] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                              <CheckCircle2 className="w-3 h-3" />
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pt-2 border-t border-[#ece5d6] flex justify-between text-[10px] text-[#7d8b9e]">
                    <span>UTF-8 PARSER: RFC 5322 COMPLIANT</span>
                    <span className="text-[#1f304d]">MAX PAYLOAD: 500 RECIPIENTS</span>
                  </div>
                </div>
              )}

              {activeStepIndex === 1 && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center justify-between pb-2 text-[#7d8b9e] text-[10px] border-b border-[#e2dac9]">
                    <span className="font-bold text-[#161a22]">DISPATCH PIPELINE SPECIFICATION</span>
                    <span className="text-[#15803d] font-bold">TRANSACTION COMMITTED</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#161a22] font-semibold">POST /api/jobs/ (JSON payload: 500 recipients)</span>
                    <span className="text-[#15803d] font-bold bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                      HTTP 202 ACCEPTED
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-[#556377] border-t border-[#ece5d6]">
                    <span>CELERY BROKER: Redis task queue on redis://127.0.0.1:6379/0</span>
                    <span className="text-[#1f304d] font-mono-telemetry">TASK ID: d8f3-882a-4c</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#ffffff] border border-[#e2dac9] text-[10px] space-y-1">
                    <span className="text-[#7d8b9e] block font-bold">TRANSACTION GUARANTEE (FR-019):</span>
                    <p className="text-[#556377]">
                      Tasks are triggered exclusively via <code className="text-[#1f304d]">transaction.on_commit</code> hooks, preventing duplicate dispatch or race conditions during worker pickups.
                    </p>
                  </div>
                </div>
              )}

              {activeStepIndex === 2 && (
                <div className="space-y-4 text-[11px]">
                  <div className="flex items-center justify-between pb-2 text-[10px] border-b border-[#e2dac9]">
                    <span className="font-bold text-[#161a22]">REAL-TIME COMPILATION MONITOR</span>
                    <span className="text-[#15803d] font-semibold">142 CERTS/SEC RASTER RATE</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-[#161a22]">BATCH PROGRESS: 500 / 500 (100% COMPLETE)</span>
                      <span className="text-[#15803d]">0.024s / CERT</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#e2dac9] overflow-hidden p-0.5">
                      <div className="h-full bg-[#15803d] rounded-full w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-[#556377]">
                    <div className="p-2.5 rounded bg-[#ffffff] border border-[#e2dac9]">
                      <span className="font-bold text-[#161a22] block mb-0.5">FAULT ISOLATION (FR-006)</span>
                      <span>0 ERRORS DETECTED • INDIVIDUAL ROW TRYCATCH ISOLATION</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#ffffff] border border-[#e2dac9]">
                      <span className="font-bold text-[#161a22] block mb-0.5">POLLING TELEMETRY</span>
                      <span>EXPONENTIAL BACKOFF POLLING RESOLVED IN 3.8s</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStepIndex === 3 && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center justify-between pb-2 text-[10px] border-b border-[#e2dac9]">
                    <span className="font-bold text-[#161a22]">AUTHORITATIVE ARCHIVAL ARTIFACTS</span>
                    <span className="text-[#15803d] font-bold">SHA-256 SIGNED</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#e2dac9]">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#15803d]" />
                      <span className="font-semibold text-[#161a22]">CERT-2026-466DBC643C27.pdf</span>
                    </div>
                    <span className="text-[10px] bg-[#f5efe4] text-[#1f304d] px-2 py-0.5 rounded border border-[#dcd3c1]">
                      CORMORANT GARAMOND // SHA-256 VERIFIED
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#1f304d]" />
                      <span className="font-semibold text-[#161a22]">certificates_batch_quantum_2026.zip</span>
                    </div>
                    <span className="text-[#15803d] font-bold bg-[#f0fdf4] px-2.5 py-0.5 rounded border border-[#bbf7d0]">
                      SERVER-SIDE STREAMING ZIP (500 FILES)
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#ffffff] border border-[#e2dac9] text-[10px] text-[#556377]">
                    <span className="font-bold text-[#161a22]">ZERO DIVERGENCE (PHASE F6): </span>
                    Authoritative ReportLab PDF bytes rendered through PDF.js and Three.js CanvasTexture for flawless physical preview.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Link Footer */}
            <div className="flex items-center justify-between pt-2 text-xs font-mono-telemetry">
              <span className="text-[#7d8b9e]">CLICK ANY STEP ON THE LEFT TO RE-INSPECT</span>
              <span className="text-[#15803d] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PIPELINE VALIDATED
              </span>
            </div>
          </div>
        </div>

        {/* Action Link Banner */}
        <div className="p-6 rounded-xl bg-[#ffffff] border border-[#e2dac9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono-telemetry text-[#161a22]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-pulse" />
            <div>
              <span className="text-[#161a22] font-bold block sm:inline">READY TO PROCESS CERTIFICATES?</span>
              <span className="text-[#647287] hidden md:inline ml-2">— Configure event metadata and upload up to 500 recipients.</span>
            </div>
          </div>
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 bg-[#1f304d] hover:bg-[#2d4263] text-white px-4 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            <span>Launch Batch Generator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

