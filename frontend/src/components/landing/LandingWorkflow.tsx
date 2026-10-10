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

  const stepTints = ['#a5b8c0', '#b3bd95', '#d77a7a', '#c0d4a7'];

  return (
    <section className="py-12 lg:py-16 border-t-2 border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header: Dell 1996 Catalog Eyebrow Banner */}
        <div className="space-y-3">
          <div className="bg-[#8e8a25] border-2 border-black px-4 py-2 flex items-center justify-between text-black">
            <div className="inline-flex items-center gap-2 text-xs font-ui uppercase tracking-wider font-bold">
              <Terminal className="w-3.5 h-3.5 text-black" />
              <span>ARCHITECTURAL PIPELINE // FOUR-STAGE VERIFIED DISPATCH</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-900 hidden sm:inline">
              STAGES 01 - 04
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b-2 border-black">
            <h2 className="text-2xl sm:text-4xl font-display-dell font-black tracking-tight text-black uppercase">
              FROM RAW DATA TO CERTIFICATE ARCHIVE
            </h2>
            <p className="text-xs sm:text-sm text-black font-serif max-w-md leading-relaxed">
              Built on a four-stage verified pipeline ensuring strict consistency, atomic transactions,
              and complete fault isolation across high-volume batches.
            </p>
          </div>
        </div>

        {/* Master Split Pipeline (12 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols): Vertical Interactive Station Dossier */}
          <div className="lg:col-span-5 space-y-3 relative">
            {workflowSteps.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeStepIndex === idx;
              const tint = stepTints[idx];

              return (
                <button
                  type="button"
                  key={item.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-full text-left rounded-none p-4 border-2 transition-all cursor-pointer relative z-10 flex items-start gap-4 ${
                    isSelected
                      ? 'bg-neutral-100 border-black shadow-[4px_4px_0px_#000]'
                      : 'bg-white border-black hover:bg-neutral-50 shadow-[2px_2px_0px_#000]'
                  }`}
                >
                  {/* Step Badge */}
                  <div
                    style={{ backgroundColor: tint }}
                    className="w-12 h-12 rounded-none border border-black flex items-center justify-center font-ui font-bold shrink-0 flex-col gap-0.5 text-black"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] leading-none">{item.step}</span>
                  </div>

                  {/* Step Content */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-ui font-bold text-black uppercase tracking-wide truncate">
                        {item.title}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] font-ui font-bold text-black flex items-center gap-1 bg-[#fcc20f] px-1.5 py-0.2 border border-black">
                          <Sparkles className="w-3 h-3" />
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-black font-serif leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-0.5 text-[10px] font-mono text-neutral-700 font-semibold">
                      {item.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column (7 Cols): Live Archival Station Telemetry Chamber */}
          <div className="lg:col-span-7 bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000] p-5 sm:p-6 space-y-4">
            {/* Station Status Header (Ribbon Bar) */}
            <div className="bg-[#a5b8c0] border-2 border-black -mt-5 sm:-mt-6 -mx-5 sm:-mx-6 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#e91d2a]" />
                <span className="font-ui text-xs font-bold uppercase text-black">
                  STAGE {activeStep.step} PREVIEW: {activeStep.details.heading}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-800 bg-white px-1.5 py-0.5 border border-black self-start sm:self-auto">
                STATION // VERIFIED INTERFACE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-black font-serif leading-relaxed">
              {activeStep.details.caption}
            </p>

            {/* Stage Telemetry Manifest Screen */}
            <div className="bg-white border-2 border-black rounded-none p-4 font-mono text-xs overflow-x-auto">
              {activeStepIndex === 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-black text-[10px] text-black">
                    <span className="font-bold uppercase font-ui">RFC 4180 DATA VALIDATION MATRIX</span>
                    <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">ALL 500 ROWS SANITIZED</span>
                  </div>
                  <table className="dell-table w-full text-left">
                    <thead>
                      <tr>
                        <th>RECORD ID</th>
                        <th>RECIPIENT NAME</th>
                        <th>EMAIL IDENTIFIER</th>
                        <th className="text-right">RFC VALIDATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStep.details.sampleData.map((row: any) => (
                        <tr key={row.id}>
                          <td className="font-mono text-neutral-700">{row.id}</td>
                          <td className="font-serif font-bold text-black">{row.name}</td>
                          <td className="font-serif text-neutral-700">{row.email}</td>
                          <td className="text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#c0d4a7] text-black border border-black">
                              <CheckCircle2 className="w-3 h-3 text-black" />
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pt-2 border-t border-black flex justify-between text-[10px] text-neutral-700">
                    <span>UTF-8 PARSER: RFC 5322 COMPLIANT</span>
                    <span className="text-black font-bold">MAX PAYLOAD: 500 RECIPIENTS</span>
                  </div>
                </div>
              )}

              {activeStepIndex === 1 && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 text-black text-[10px] border-b border-black">
                    <span className="font-bold uppercase font-ui">DISPATCH PIPELINE SPECIFICATION</span>
                    <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">TRANSACTION COMMITTED</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-black font-semibold">POST /api/jobs/ (JSON payload: 500 recipients)</span>
                    <span className="text-black font-bold bg-[#c0d4a7] px-2 py-0.5 border border-black">
                      HTTP 202 ACCEPTED
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-black border-b border-neutral-200">
                    <span>CELERY BROKER: Redis task queue on redis://127.0.0.1:6379/0</span>
                    <span className="font-mono font-bold">TASK ID: d8f3-882a-4c</span>
                  </div>
                  <div className="p-2.5 rounded-none bg-neutral-50 border border-black text-[10px] space-y-1">
                    <span className="text-black block font-bold font-ui uppercase">TRANSACTION GUARANTEE (FR-019):</span>
                    <p className="text-black font-serif">
                      Tasks are triggered exclusively via <code className="bg-neutral-200 px-1 border border-black">transaction.on_commit</code> hooks, preventing duplicate dispatch or race conditions during worker pickups.
                    </p>
                  </div>
                </div>
              )}

              {activeStepIndex === 2 && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 text-[10px] border-b border-black">
                    <span className="font-bold text-black uppercase font-ui">REAL-TIME COMPILATION MONITOR</span>
                    <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">142 CERTS/SEC RASTER RATE</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-xs font-mono">
                      <span className="text-black">BATCH PROGRESS: 500 / 500 (100% COMPLETE)</span>
                      <span className="text-black">0.024s / CERT</span>
                    </div>
                    <div className="w-full h-3 rounded-none bg-neutral-200 border border-black overflow-hidden p-0.5">
                      <div className="h-full bg-black w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-black">
                    <div className="p-2 rounded-none bg-white border border-black">
                      <span className="font-bold text-black block mb-0.5 font-ui uppercase">FAULT ISOLATION (FR-006)</span>
                      <span className="font-serif">0 ERRORS DETECTED • INDIVIDUAL ROW TRYCATCH ISOLATION</span>
                    </div>
                    <div className="p-2 rounded-none bg-white border border-black">
                      <span className="font-bold text-black block mb-0.5 font-ui uppercase">POLLING TELEMETRY</span>
                      <span className="font-serif">EXPONENTIAL BACKOFF POLLING RESOLVED IN 3.8s</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStepIndex === 3 && (
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 text-[10px] border-b border-black">
                    <span className="font-bold text-black uppercase font-ui">AUTHORITATIVE ARCHIVAL ARTIFACTS</span>
                    <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">SHA-256 SIGNED</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-black" />
                      <span className="font-semibold text-black">CERT-2026-466DBC643C27.pdf</span>
                    </div>
                    <span className="text-[10px] bg-neutral-100 text-black px-1.5 py-0.2 border border-black font-bold">
                      CORMORANT GARAMOND // SHA-256 VERIFIED
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-black" />
                      <span className="font-semibold text-black">certificates_batch_quantum_2026.zip</span>
                    </div>
                    <span className="text-[10px] bg-[#c0d4a7] text-black px-1.5 py-0.2 border border-black font-bold">
                      SERVER-SIDE STREAMING ZIP (500 FILES)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-none bg-neutral-50 border border-black text-[10px] text-black">
                    <span className="font-bold text-black font-ui uppercase">ZERO DIVERGENCE (PRODUCTION): </span>
                    <span className="font-serif">Authoritative ReportLab PDF bytes rendered through PDF.js and Three.js CanvasTexture for flawless physical preview.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Link Footer */}
            <div className="flex items-center justify-between pt-2 text-xs font-mono border-t border-black">
              <span className="text-neutral-700">CLICK ANY STEP ON THE LEFT TO RE-INSPECT</span>
              <span className="text-black font-bold flex items-center gap-1 font-ui uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#e91d2a]" />
                PIPELINE VALIDATED
              </span>
            </div>
          </div>
        </div>

        {/* Action Link Banner: Dell 1996 Proclamation Bar */}
        <div className="p-4 sm:p-5 rounded-none bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-ui text-black">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-[#e91d2a]" />
            <div>
              <span className="text-black font-bold uppercase block sm:inline">READY TO PROCESS CERTIFICATES?</span>
              <span className="text-neutral-700 font-serif text-sm hidden md:inline ml-2">— Configure event metadata and upload up to 500 recipients.</span>
            </div>
          </div>
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 bg-[#e91d2a] hover:bg-[#c81924] text-white px-5 py-2.5 border-2 border-black font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#000]"
          >
            <span>Launch Batch Generator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

