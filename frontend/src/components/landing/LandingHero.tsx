import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  HardDrive,
  Terminal,
  FileCheck2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LandingScene } from './LandingScene';

interface SpecimenSample {
  id: string;
  name: string;
  event: string;
  certNumber: string;
  date: string;
  hash: string;
  font: string;
}

const SPECIMENS: SpecimenSample[] = [
  {
    id: 'spec-1',
    name: 'Elena Rostova, ScD',
    event: 'Global Quantum Computing Summit',
    certNumber: 'CERT-2026-466DBC643C27',
    date: '2026-10-14',
    hash: '0x8f4d...3c27',
    font: 'Cormorant Garamond 36pt',
  },
  {
    id: 'spec-2',
    name: 'Marcus Vance, PE',
    event: 'Advanced Aerospace Materials Symposium',
    certNumber: 'CERT-2026-921AA78B0912',
    date: '2026-10-18',
    hash: '0x1c9e...0912',
    font: 'Cormorant Garamond 34pt',
  },
  {
    id: 'spec-3',
    name: 'Aria Chen',
    event: 'Foundations of Distributed Cryptography',
    certNumber: 'CERT-2026-B8710EF24401',
    date: '2026-10-22',
    hash: '0x43b2...4401',
    font: 'Cormorant Garamond 38pt',
  },
];

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSpecimen, setSelectedSpecimen] = useState<SpecimenSample>(SPECIMENS[0]);

  return (
    <section className="relative pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden">
      {/* Archival Folio Reference Ticks */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2dac9] text-[11px] font-mono-telemetry text-[#7d8b9e]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#161a22] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#1f304d]" />
              ATELIER ARCHIVE VOL. 01
            </span>
            <span className="text-[#dcd3c1]">/</span>
            <span>REGISTRY SPECIFICATION</span>
            <span className="text-[#dcd3c1]">/</span>
            <span className="text-[#15803d] font-semibold">ONLINE // VERIFIED</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[#7d8b9e]">
            <span>ENGINE: cf5bb3d (CELERY + REDIS)</span>
            <span className="text-[#dcd3c1]">|</span>
            <span>PDF: REPORTLAB 1200 DPI</span>
            <span className="text-[#dcd3c1]">|</span>
            <span className="text-[#15803d] font-semibold">100% PARITY</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Grand Editorial Masthead Proclamation */}
        <div className="space-y-6">
          {/* Telemetry Micro-Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ffffff] border border-[#dcd3c1] text-xs font-mono-telemetry text-[#2d3748] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
            <span className="text-[#1f304d] uppercase tracking-wider font-semibold">
              ARCHIVE → PAPER → DATA → CERTIFICATE
            </span>
            <span className="text-[#c5a059] font-bold">✦ SPECIFICATION v1.0</span>
          </div>

          {/* Grand Typographic Hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#161a22] font-serif leading-[1.08]">
                HIGH-VOLUME ARCHIVAL CERTIFICATE GENERATION.
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-[#556377] leading-relaxed font-sans max-w-2xl">
                Transform structured recipient datasets into high-fidelity, verified, downloadable
                physical certificates in seconds. Powered by sub-second ReportLab vector compilation,
                atomic Celery queue dispatch, and zero-divergence 3D physical inspection.
              </p>
            </div>

            {/* Action CTAs Cluster */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/jobs/new')}
                className="w-full text-xs font-mono-telemetry uppercase tracking-wider px-6 py-3 shadow-md flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Initialize Certificate Batch</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/jobs')}
                className="w-full text-xs font-mono-telemetry uppercase tracking-wider px-5 py-3 flex items-center justify-center gap-2"
              >
                <span>View Job Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="px-3 py-1.5 rounded bg-[#fbf9f4] border border-[#e2dac9] text-[10px] font-mono-telemetry text-[#7d8b9e] flex items-center justify-between">
                <span>SYSTEM STATUS</span>
                <span className="text-[#15803d] font-bold">READY // 500 RECIPIENTS / BATCH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Archival Workbench Bento (12 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center Stage: Archival Drafting Table & 3D Stage (8 Columns) */}
          <div className="lg:col-span-8 bg-[#ffffff] border border-[#e2dac9] rounded-xl shadow-sm p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
            {/* Drafting Board Corner Crosshair Markers */}
            <div className="absolute top-2 left-2 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">
              +
            </div>
            <div className="absolute top-2 right-2 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">
              +
            </div>
            <div className="absolute bottom-2 left-2 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">
              +
            </div>
            <div className="absolute bottom-2 right-2 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">
              +
            </div>

            {/* Drafting Table Calibration Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#ece5d6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#c5a059]" />
                <span className="font-mono-telemetry text-xs font-bold text-[#161a22] uppercase tracking-wider">
                  ARCHIVAL DRAFTING BENCH // 3D PHYSICAL PAPER INSPECTION
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono-telemetry text-[#7d8b9e]">
                <span className="bg-[#f5efe4] px-2 py-0.5 rounded border border-[#dcd3c1] text-[#161a22] font-semibold">
                  INTERACTIVE CAMERA
                </span>
                <span>•</span>
                <span>DRAG TO ROTATE 360°</span>
              </div>
            </div>

            {/* The 3D Archival Paper Centerpiece Canvas */}
            <div className="w-full flex-1">
              <LandingScene className="h-[480px] sm:h-[520px] lg:h-[580px]" />
            </div>

            {/* Specimen Calibration & Status Toolbar */}
            <div className="mt-4 pt-3 border-t border-[#ece5d6] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-telemetry">
              <div className="p-2 rounded bg-[#fbf9f4] border border-[#ece5d6]">
                <span className="text-[10px] text-[#7d8b9e] block">PARITY STANDARD</span>
                <span className="text-[#15803d] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                  ZERO DIVERGENCE
                </span>
              </div>

              <div className="p-2 rounded bg-[#fbf9f4] border border-[#ece5d6]">
                <span className="text-[10px] text-[#7d8b9e] block">DEFLECTION MODEL</span>
                <span className="text-[#161a22] font-semibold">CURVED 3D VELLUM</span>
              </div>

              <div className="p-2 rounded bg-[#fbf9f4] border border-[#ece5d6]">
                <span className="text-[10px] text-[#7d8b9e] block">EMBOSSED SEAL</span>
                <span className="text-[#991b1b] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#c5a059]" />
                  CRIMSON WAX
                </span>
              </div>

              <div className="p-2 rounded bg-[#fbf9f4] border border-[#ece5d6]">
                <span className="text-[10px] text-[#7d8b9e] block">STUDIO ILLUMINATION</span>
                <span className="text-[#b45309] font-semibold">REACTIVE WARMTH</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Telemetry Monitor & Inscription Synthesizer (4 Columns) */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            {/* Specimen Inscription Live Selector */}
            <div className="bg-[#ffffff] border border-[#e2dac9] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#ece5d6] pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#1f304d]" />
                  <span className="font-mono-telemetry text-xs font-bold text-[#161a22]">
                    SPECIMEN INSCRIPTION LEDGER
                  </span>
                </div>
                <span className="text-[10px] font-mono-telemetry text-[#c5a059] font-bold">
                  SAMPLE PROOFS
                </span>
              </div>

              <p className="text-xs text-[#556377] font-sans">
                Select a verified recipient proof to examine live vector compiler parameters and cryptographic serial numbers:
              </p>

              {/* Specimen Buttons */}
              <div className="space-y-2">
                {SPECIMENS.map((spec) => {
                  const isSelected = selectedSpecimen.id === spec.id;
                  return (
                    <button
                      type="button"
                      key={spec.id}
                      onClick={() => setSelectedSpecimen(spec)}
                      className={`w-full text-left p-2.5 rounded-lg border font-mono-telemetry transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1f304d] text-white border-[#1f304d] shadow-sm'
                          : 'bg-[#fbf9f4] border-[#e2dac9] text-[#161a22] hover:border-[#b8a892]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">{spec.name}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-[#c5a059]' : 'text-[#7d8b9e]'}`}>
                          {spec.date}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-[#cad5e2]' : 'text-[#556377]'}`}>
                        {spec.event}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Specimen Cryptographic Readout */}
              <div className="p-3 rounded-lg bg-[#fbf9f4] border border-[#e2dac9] font-mono-telemetry text-[11px] space-y-1.5">
                <div className="flex justify-between items-center text-[#7d8b9e] text-[10px]">
                  <span>SERIAL IDENTIFIER:</span>
                  <span className="text-[#15803d] font-bold">VERIFIED RFC-4122</span>
                </div>
                <div className="font-bold text-[#1f304d] tracking-wider text-xs">
                  {selectedSpecimen.certNumber}
                </div>
                <div className="flex justify-between pt-1 border-t border-[#ece5d6] text-[10px]">
                  <span className="text-[#7d8b9e]">INTEGRITY HASH:</span>
                  <span className="text-[#161a22] font-semibold">{selectedSpecimen.hash}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#7d8b9e]">TYPOGRAPHY:</span>
                  <span className="text-[#161a22]">{selectedSpecimen.font}</span>
                </div>
              </div>
            </div>

            {/* Technical Telemetry Metadata Cards (FR-005, FR-006, Phase F6) */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm hover:border-[#b8a892] transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[#7d8b9e] mb-0.5">
                    <Cpu className="w-3.5 h-3.5 text-[#1f304d]" />
                    <span className="uppercase text-[10px] font-mono-telemetry font-bold">CAPACITY</span>
                  </div>
                  <div className="text-[#161a22] font-bold text-sm font-mono-telemetry">500 / BATCH</div>
                  <div className="text-[#7d8b9e] text-[10px] font-mono-telemetry">Max batch throughput</div>
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#1f304d] bg-[#f5efe4] px-2 py-1 rounded border border-[#dcd3c1]">
                  CELERY QUEUE
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm hover:border-[#b8a892] transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[#7d8b9e] mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" />
                    <span className="uppercase text-[10px] font-mono-telemetry font-bold">ISOLATION</span>
                  </div>
                  <div className="text-[#15803d] font-bold text-sm font-mono-telemetry">FAULT TOLERANT</div>
                  <div className="text-[#7d8b9e] text-[10px] font-mono-telemetry">Per-row error containment</div>
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#15803d] bg-[#f0fdf4] px-2 py-1 rounded border border-[#bbf7d0]">
                  ATOMIC TRY/CATCH
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm hover:border-[#b8a892] transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[#7d8b9e] mb-0.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#b45309]" />
                    <span className="uppercase text-[10px] font-mono-telemetry font-bold">INTEGRITY</span>
                  </div>
                  <div className="text-[#b45309] font-bold text-sm font-mono-telemetry">ZERO DIVERGENCE</div>
                  <div className="text-[#7d8b9e] text-[10px] font-mono-telemetry">Authoritative PDF raster</div>
                </div>
                <span className="text-[10px] font-mono-telemetry font-bold text-[#b45309] bg-[#fffbeb] px-2 py-1 rounded border border-[#fde68a]">
                  PDF.JS TEXTURE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

