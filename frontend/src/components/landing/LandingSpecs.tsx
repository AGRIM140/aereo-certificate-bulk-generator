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
    <section className="py-12 lg:py-16 border-t-2 border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Masthead: Dell 1996 Catalog Header */}
        <div className="space-y-3">
          <div className="bg-[#d77a7a] border-2 border-black px-4 py-2 flex items-center justify-between text-black">
            <div className="inline-flex items-center gap-2 text-xs font-ui uppercase tracking-wider font-bold">
              <Terminal className="w-3.5 h-3.5 text-black" />
              <span>ENGINE SPECIFICATIONS & GUARANTEES</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-900 hidden sm:inline">
              PRODUCTION ARCHITECTURE
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b-2 border-black">
            <h2 className="text-2xl sm:text-4xl font-display-dell font-black tracking-tight text-black uppercase">
              ARCHIVAL CORE CAPABILITIES
            </h2>
            <p className="text-xs sm:text-sm text-black font-serif max-w-xl leading-relaxed">
              Engineered on an enterprise Django + DRF + Celery + PostgreSQL architecture, built for continuous
              high-throughput certification pipelines.
            </p>
          </div>
        </div>

        {/* Asymmetrical Engineering Blueprint Bento (12 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Flagship Card (8 Cols): ZERO DIVERGENCE (PRODUCTION) */}
          <div className="md:col-span-12 lg:col-span-8 bg-white border-2 border-black rounded-none p-5 sm:p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between space-y-4 relative overflow-hidden">
            {/* Ribbon Bar Strip (Steel) */}
            <div className="bg-[#a5b8c0] border-2 border-black -mt-5 sm:-mt-6 -mx-5 sm:-mx-6 px-4 py-2 flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#e91d2a]" />
                <span className="font-ui text-xs font-bold uppercase text-black">
                  ENTERPRISE PIPELINE // CORE CERTIFICATION
                </span>
              </div>
              <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#c0d4a7] text-black border border-black uppercase">
                IDENTICAL TO PRINT
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-black border border-black flex items-center justify-center text-white">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-ui font-bold text-black uppercase tracking-wide">
                    ZERO DIVERGENCE (PRODUCTION)
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-700">
                    AUTHORITATIVE PYTHON REPORTLAB BYTE STREAM → CLIENT THREE.JS CANVAS
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-black font-serif leading-relaxed max-w-2xl">
                The interactive 3D inspector renders the authoritative backend-generated PDF bytes with PDF.js, preserving 100% visual fidelity.
              </p>

              {/* Technical Blueprint Pipeline Diagram */}
              <div className="p-3.5 rounded-none bg-neutral-50 border border-black font-mono text-xs space-y-2">
                <div className="text-[10px] text-black font-ui font-bold uppercase tracking-wider">
                  ZERO-APPROXIMATION PIPELINE SCHEMATIC:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-white border border-black space-y-1">
                    <span className="text-black font-bold block font-ui">1. DJANGO BACKEND</span>
                    <span className="text-black text-[10px] font-serif block">ReportLab compiles vector PDF bytes with Cormorant Garamond font.</span>
                  </div>
                  <div className="p-2 bg-white border border-black space-y-1">
                    <span className="text-black font-bold block font-ui">2. CLIENT PDF.JS</span>
                    <span className="text-black text-[10px] font-serif block">Renders exact PDF binary into headless offscreen HTML5 canvas.</span>
                  </div>
                  <div className="p-2 bg-white border border-black space-y-1">
                    <span className="text-black font-bold block font-ui">3. THREE.JS TEXTURE</span>
                    <span className="text-black text-[10px] font-serif block">Maps canvas onto 3D curved paper mesh with vellum lighting.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-black flex flex-wrap items-center justify-between text-xs font-mono text-black">
              <span>VECTOR FIDELITY: 100% EXACT PARITY</span>
              <span className="font-ui font-bold text-[10px] uppercase bg-black text-white px-1.5 py-0.2">NO HARDCODED HTML OVERLAYS</span>
            </div>
          </div>

          {/* Concurrency Safety Card (4 Cols): POSTGRESQL + CELERY (FR-019) */}
          <div className="md:col-span-12 lg:col-span-4 bg-white border-2 border-black rounded-none p-5 shadow-[6px_6px_0px_#000] flex flex-col justify-between space-y-4">
            {/* Ribbon Bar Strip (Sage) */}
            <div className="bg-[#b3bd95] border-2 border-black -mt-5 -mx-5 px-3 py-1.5 flex items-center justify-between mb-1">
              <span className="font-ui text-xs font-bold uppercase text-black">
                DATABASE & QUEUE ARCHITECTURE
              </span>
              <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#fcc20f] text-black border border-black uppercase">
                CONCURRENCY SAFE
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-black border border-black flex items-center justify-center text-white">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-ui font-bold text-black uppercase tracking-wide">
                  POSTGRESQL + CELERY (FR-019)
                </h3>
              </div>

              <p className="text-xs text-black font-serif leading-relaxed">
                Transactional on_commit queue dispatch paired with select_for_update row claims guarantees zero duplicate processing or race conditions.
              </p>

              {/* Mini Terminal Readout */}
              <div className="p-2.5 rounded-none bg-neutral-50 border border-black font-mono text-[10px] space-y-1">
                <div className="text-black font-bold">SQL LOCK: select_for_update(nowait=False)</div>
                <div className="text-neutral-700">QUEUE: django.db.transaction.on_commit()</div>
                <div className="text-black font-bold bg-[#c0d4a7] px-1 inline-block border border-black">STATUS: ZERO RACE CONDITIONS GUARANTEED</div>
              </div>
            </div>

            <div className="pt-2 border-t border-black text-[10px] font-mono text-black">
              DISPATCH: CELERY 5.x OVER REDIS BROKER
            </div>
          </div>

          {/* Fault Isolation Card (4 Cols): FAILURE ISOLATION (FR-006) */}
          <div className="md:col-span-6 lg:col-span-4 bg-white border-2 border-black rounded-none p-4 shadow-[4px_4px_0px_#000] flex flex-col justify-between space-y-3">
            {/* Ribbon Bar Strip (Lime) */}
            <div className="bg-[#c0d4a7] border-2 border-black -mt-4 -mx-4 px-3 py-1 flex items-center justify-between mb-1">
              <span className="font-ui text-xs font-bold uppercase text-black">
                RELIABILITY BOUNDARY
              </span>
              <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-black text-white uppercase">
                FAULT TOLERANT
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#e91d2a]" />
                <h3 className="text-xs font-ui font-bold text-black uppercase tracking-wide">
                  FAILURE ISOLATION (FR-006)
                </h3>
              </div>

              <p className="text-xs text-black font-serif leading-relaxed">
                Atomic per-row try/catch boundaries ensure formatting or validation anomalies in one recipient never corrupt or block the rest of the batch.
              </p>
            </div>

            <div className="pt-2 border-t border-black text-[10px] font-mono text-black flex justify-between">
              <span>BATCH INTEGRITY: 100% ISOLATED</span>
              <span className="font-bold bg-[#c0d4a7] px-1 border border-black">PARTIAL SUCCESS OK</span>
            </div>
          </div>

          {/* ReportLab Vector Compiler (4 Cols): REPORTLAB COMPILER (FR-005) */}
          <div className="md:col-span-6 lg:col-span-4 bg-white border-2 border-black rounded-none p-4 shadow-[4px_4px_0px_#000] flex flex-col justify-between space-y-3">
            {/* Ribbon Bar Strip (Peach) */}
            <div className="bg-[#e6915d] border-2 border-black -mt-4 -mx-4 px-3 py-1 flex items-center justify-between mb-1">
              <span className="font-ui text-xs font-bold uppercase text-black">
                RENDER SPECIFICATION
              </span>
              <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-black text-white uppercase">
                VECTOR ACCURACY
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-black" />
                <h3 className="text-xs font-ui font-bold text-black uppercase tracking-wide">
                  REPORTLAB COMPILER (FR-005)
                </h3>
              </div>

              <p className="text-xs text-black font-serif leading-relaxed">
                Sub-second pure vector PDF compilation with bundled Cormorant Garamond typography, automatic font sizing, and text wrapping.
              </p>
            </div>

            <div className="pt-2 border-t border-black text-[10px] font-mono text-black flex justify-between">
              <span>OUTPUT: VECTOR PDF/A</span>
              <span className="font-bold">1200 DPI RASTER</span>
            </div>
          </div>

          {/* Deterministic IDs (4 Cols): DETERMINISTIC IDS (FR-021) */}
          <div className="md:col-span-6 lg:col-span-4 bg-white border-2 border-black rounded-none p-4 shadow-[4px_4px_0px_#000] flex flex-col justify-between space-y-3">
            {/* Ribbon Bar Strip (Salmon) */}
            <div className="bg-[#d77a7a] border-2 border-black -mt-4 -mx-4 px-3 py-1 flex items-center justify-between mb-1">
              <span className="font-ui text-xs font-bold uppercase text-black">
                SECURITY & AUDIT
              </span>
              <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-black text-white uppercase">
                UNIQUE AUDIT TRAIL
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-black" />
                <h3 className="text-xs font-ui font-bold text-black uppercase tracking-wide">
                  DETERMINISTIC IDS (FR-021)
                </h3>
              </div>

              <p className="text-xs text-black font-serif leading-relaxed">
                Archival certificate numbers generated in standard CERT-YYYY-XXXXXXXXXXXX format for cryptographic uniqueness across batches.
              </p>
            </div>

            <div className="pt-2 border-t border-black text-[10px] font-mono text-black flex justify-between">
              <span>FORMAT: CERT-YYYY-UUID</span>
              <span className="font-bold">SHA-256 SEED</span>
            </div>
          </div>

          {/* Bulk ZIP Export (12 Cols): BULK ZIP EXPORT (FR-016) */}
          <div className="md:col-span-12 bg-white border-2 border-black rounded-none p-5 shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 bg-[#8c9ae0] border-2 border-black flex items-center justify-center text-black shrink-0">
                <Archive className="w-5 h-5 text-black" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-ui font-bold text-black uppercase tracking-wide">
                    BULK ZIP EXPORT (FR-016)
                  </h3>
                  <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#fcc20f] text-black border border-black uppercase">
                    BATCH EXPORT
                  </span>
                </div>
                <p className="text-xs text-black font-serif leading-relaxed max-w-3xl">
                  Single-click server-side ZIP packaging collates all completed certificates with numbered row indexes for clean archival distribution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-black">
              <span className="bg-[#c0d4a7] text-black px-2 py-0.5 border border-black font-bold">STREAMING ARCHIVE // STREAM RESILIENT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

