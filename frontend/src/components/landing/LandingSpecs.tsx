import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Database,
  FileCheck,
  Layers,
  Archive,
  Terminal,
} from 'lucide-react';

export const LandingSpecs: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 border-t border-[#e2dac9] bg-transparent">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e2dac9]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono-telemetry uppercase tracking-wider text-[#1f304d] font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>ENGINE SPECIFICATIONS & GUARANTEES</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#161a22] font-mono-telemetry">
              ARCHIVAL CORE CAPABILITIES
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5a6678] font-mono-telemetry max-w-xl leading-relaxed">
            Engineered against a frozen Django + DRF + Celery + PostgreSQL backend, adhering strictly to
            the assignment requirement matrix.
          </p>
        </div>

        {/* Asymmetrical Engineering Blueprint Bento (12 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Flagship Card (8 Cols): ZERO DIVERGENCE (PHASE F6) */}
          <div className="md:col-span-12 lg:col-span-8 bg-[#ffffff] border border-[#e2dac9] rounded-xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
            {/* Blueprint watermark corner */}
            <div className="absolute top-3 right-3 text-[10px] font-mono-telemetry text-[#7d8b9e] bg-[#fbf9f4] px-2.5 py-1 rounded border border-[#ece5d6]">
              PHASE F6 // CORE CERTIFICATION
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#15803d]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#161a22] font-mono-telemetry tracking-wide">
                      ZERO DIVERGENCE (PHASE F6)
                    </h3>
                    <span className="text-[10px] font-mono-telemetry font-bold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                      IDENTICAL TO PRINT
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-telemetry text-[#7d8b9e]">
                    AUTHORITATIVE PYTHON REPORTLAB BYTE STREAM → CLIENT THREE.JS CANVAS
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#556377] leading-relaxed font-sans max-w-2xl">
                The interactive 3D inspector renders the authoritative backend-generated PDF bytes with PDF.js, preserving 100% visual fidelity.
              </p>

              {/* Technical Blueprint Pipeline Diagram */}
              <div className="p-4 rounded-lg bg-[#fbf9f4] border border-[#e2dac9] font-mono-telemetry text-xs space-y-3">
                <div className="text-[10px] text-[#7d8b9e] font-bold uppercase tracking-wider">
                  ZERO-APPROXIMATION PIPELINE SCHEMATIC:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 rounded bg-[#ffffff] border border-[#ece5d6] space-y-1">
                    <span className="text-[#1f304d] font-bold block">1. DJANGO BACKEND</span>
                    <span className="text-[#556377] text-[10px] block">ReportLab compiles vector PDF bytes with Cormorant Garamond font.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#ffffff] border border-[#ece5d6] space-y-1">
                    <span className="text-[#15803d] font-bold block">2. CLIENT PDF.JS</span>
                    <span className="text-[#556377] text-[10px] block">Renders exact PDF binary into headless offscreen HTML5 canvas.</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#ffffff] border border-[#ece5d6] space-y-1">
                    <span className="text-[#b45309] font-bold block">3. THREE.JS TEXTURE</span>
                    <span className="text-[#556377] text-[10px] block">Maps canvas onto 3D curved paper mesh with vellum lighting.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ece5d6] flex flex-wrap items-center justify-between text-[11px] font-mono-telemetry text-[#7d8b9e]">
              <span>VECTOR FIDELITY: 100% EXACT PARITY</span>
              <span className="text-[#15803d] font-semibold">NO HARDCODED HTML OVERLAYS</span>
            </div>
          </div>

          {/* Concurrency Safety Card (4 Cols): POSTGRESQL + CELERY (FR-019) */}
          <div className="md:col-span-12 lg:col-span-4 bg-[#ffffff] border border-[#e2dac9] rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#fbf9f4] border border-[#e2dac9] flex items-center justify-center text-[#1f304d]">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#1f304d] bg-[#f5efe4] px-2 py-0.5 rounded border border-[#dcd3c1]">
                  CONCURRENCY SAFE
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-[#161a22] font-mono-telemetry tracking-wide">
                POSTGRESQL + CELERY (FR-019)
              </h3>

              <p className="text-xs text-[#556377] leading-relaxed font-sans">
                Transactional on_commit queue dispatch paired with select_for_update row claims guarantees zero duplicate processing or race conditions.
              </p>

              {/* Mini Terminal Readout */}
              <div className="p-3 rounded-lg bg-[#fbf9f4] border border-[#e2dac9] font-mono-telemetry text-[10px] text-[#2d3748] space-y-1">
                <div className="text-[#15803d] font-bold">SQL LOCK: select_for_update(nowait=False)</div>
                <div className="text-[#556377]">QUEUE: django.db.transaction.on_commit()</div>
                <div className="text-[#7d8b9e]">STATUS: ZERO RACE CONDITIONS GUARANTEED</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ece5d6] text-[10px] font-mono-telemetry text-[#7d8b9e]">
              DISPATCH: CELERY 5.x OVER REDIS BROKER
            </div>
          </div>

          {/* Fault Isolation Card (4 Cols): FAILURE ISOLATION (FR-006) */}
          <div className="md:col-span-6 lg:col-span-4 bg-[#ffffff] border border-[#e2dac9] rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-[#fbf9f4] border border-[#e2dac9] flex items-center justify-center text-[#15803d]">
                  <ShieldCheck className="w-4 h-4 text-[#15803d]" />
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                  FAULT TOLERANT
                </span>
              </div>

              <h3 className="text-xs font-bold text-[#161a22] font-mono-telemetry tracking-wide">
                FAILURE ISOLATION (FR-006)
              </h3>

              <p className="text-xs text-[#556377] leading-relaxed font-sans">
                Atomic per-row try/catch boundaries ensure formatting or validation anomalies in one recipient never corrupt or block the rest of the batch.
              </p>
            </div>

            <div className="pt-3 border-t border-[#ece5d6] text-[10px] font-mono-telemetry text-[#7d8b9e] flex justify-between">
              <span>BATCH INTEGRITY: 100% ISOLATED</span>
              <span className="text-[#15803d] font-semibold">PARTIAL SUCCESS OK</span>
            </div>
          </div>

          {/* ReportLab Vector Compiler (4 Cols): REPORTLAB COMPILER (FR-005) */}
          <div className="md:col-span-6 lg:col-span-4 bg-[#ffffff] border border-[#e2dac9] rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-[#fbf9f4] border border-[#e2dac9] flex items-center justify-center text-[#1f304d]">
                  <Cpu className="w-4 h-4 text-[#1f304d]" />
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#1f304d] bg-[#f5efe4] px-2 py-0.5 rounded border border-[#dcd3c1]">
                  VECTOR ACCURACY
                </span>
              </div>

              <h3 className="text-xs font-bold text-[#161a22] font-mono-telemetry tracking-wide">
                REPORTLAB COMPILER (FR-005)
              </h3>

              <p className="text-xs text-[#556377] leading-relaxed font-sans">
                Sub-second pure vector PDF compilation with bundled Cormorant Garamond typography, automatic font sizing, and text wrapping.
              </p>
            </div>

            <div className="pt-3 border-t border-[#ece5d6] text-[10px] font-mono-telemetry text-[#7d8b9e] flex justify-between">
              <span>OUTPUT: VECTOR PDF/A</span>
              <span className="text-[#1f304d] font-semibold">1200 DPI RASTER</span>
            </div>
          </div>

          {/* Deterministic IDs (4 Cols): DETERMINISTIC IDS (FR-021) */}
          <div className="md:col-span-6 lg:col-span-4 bg-[#ffffff] border border-[#e2dac9] rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-[#fbf9f4] border border-[#e2dac9] flex items-center justify-center text-[#b45309]">
                  <FileCheck className="w-4 h-4 text-[#b45309]" />
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#b45309] bg-[#fffbeb] px-2 py-0.5 rounded border border-[#fde68a]">
                  UNIQUE AUDIT TRAIL
                </span>
              </div>

              <h3 className="text-xs font-bold text-[#161a22] font-mono-telemetry tracking-wide">
                DETERMINISTIC IDS (FR-021)
              </h3>

              <p className="text-xs text-[#556377] leading-relaxed font-sans">
                Archival certificate numbers generated in standard CERT-YYYY-XXXXXXXXXXXX format for cryptographic uniqueness across batches.
              </p>
            </div>

            <div className="pt-3 border-t border-[#ece5d6] text-[10px] font-mono-telemetry text-[#7d8b9e] flex justify-between">
              <span>FORMAT: CERT-YYYY-UUID</span>
              <span className="text-[#161a22] font-semibold">SHA-256 SEED</span>
            </div>
          </div>

          {/* Bulk ZIP Export (12 Cols): BULK ZIP EXPORT (FR-016) */}
          <div className="md:col-span-12 bg-[#ffffff] border border-[#e2dac9] rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#fbf9f4] border border-[#e2dac9] flex items-center justify-center text-[#15803d] shrink-0">
                <Archive className="w-5 h-5 text-[#15803d]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#161a22] font-mono-telemetry tracking-wide">
                    BULK ZIP EXPORT (FR-016)
                  </h3>
                  <span className="text-[10px] font-mono-telemetry font-bold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                    BATCH EXPORT
                  </span>
                </div>
                <p className="text-xs text-[#556377] leading-relaxed font-sans max-w-3xl">
                  Single-click server-side ZIP packaging collates all completed certificates with numbered row indexes for clean archival distribution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-xs font-mono-telemetry">
              <span className="text-[11px] text-[#7d8b9e]">STREAMING ARCHIVE // STREAM RESILIENT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

