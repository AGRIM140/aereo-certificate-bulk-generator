import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ArrowRight,
  Terminal,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Layers,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LandingScene } from './LandingScene';

type ActId = 'I' | 'II' | 'III' | 'IV' | 'V';

interface ActMeta {
  id: ActId;
  index: string;
  navLabel: string;
  badge: string;
  centerProgress: number;
  startProgress: number;
  endProgress: number;
}

const ACTS: ActMeta[] = [
  {
    id: 'I',
    index: 'I • Folio',
    navLabel: 'Folio Open',
    badge: 'ACT I: THE FOLIO OPEN',
    centerProgress: 0.08,
    startProgress: 0.00,
    endProgress: 0.20,
  },
  {
    id: 'II',
    index: 'II • Intake',
    navLabel: 'Data Intake',
    badge: 'ACT II: RECIPIENT INTAKE',
    centerProgress: 0.31,
    startProgress: 0.20,
    endProgress: 0.42,
  },
  {
    id: 'III',
    index: 'III • Press',
    navLabel: 'Active Press',
    badge: 'ACT III: ATELIER PRESS',
    centerProgress: 0.54,
    startProgress: 0.42,
    endProgress: 0.66,
  },
  {
    id: 'IV',
    index: 'IV • Emergence',
    navLabel: 'Emergence',
    badge: 'ACT IV: SPECIMEN EMERGENCE',
    centerProgress: 0.76,
    startProgress: 0.66,
    endProgress: 0.88,
  },
  {
    id: 'V',
    index: 'V • Archive',
    navLabel: 'Archival Vault',
    badge: 'ACT V: ARCHIVE COMPLETED',
    centerProgress: 0.94,
    startProgress: 0.88,
    endProgress: 1.00,
  },
];

export const AtelierProductionExperience: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeAct, setActiveAct] = useState<ActId>('I');

  const [isReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Continuous Scroll Observer
  useEffect(() => {
    if (isReducedMotion) return;

    let rafId: number | null = null;
    let lastProgress = -1;
    let lastAct: ActId = 'I';

    const onScroll = () => {
      if (!containerRef.current) return;
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const totalScrollable = containerHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const containerTop = containerRef.current.offsetTop;
      const rawProgress = (scrollY - containerTop) / totalScrollable;
      const progress = Math.min(1.0, Math.max(0.0, rawProgress));

      let nextAct: ActId = 'I';
      if (progress < 0.20) nextAct = 'I';
      else if (progress < 0.42) nextAct = 'II';
      else if (progress < 0.66) nextAct = 'III';
      else if (progress < 0.88) nextAct = 'IV';
      else nextAct = 'V';

      const actChanged = nextAct !== lastAct;
      const delta = Math.abs(progress - lastProgress);

      if (actChanged || delta > 0.003) {
        lastProgress = progress;
        lastAct = nextAct;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setScrollProgress(progress);
          setActiveAct(nextAct);
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isReducedMotion]);

  // Jump smoothly to a specific act
  const scrollToAct = (actId: ActId) => {
    if (!containerRef.current) return;
    const act = ACTS.find((a) => a.id === actId);
    if (!act) return;

    const containerTop = window.scrollY + containerRef.current.getBoundingClientRect().top;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + act.centerProgress * totalScrollable;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  /**
   * Calculates continuous opacity and translation with strict mutual exclusion.
   * Guarantees zero overlapping text between adjacent acts.
   */
  const getActStyle = useMemo(() => {
    // Transition boundary points between Acts [I-II, II-III, III-IV, IV-V]
    const boundaries = [0.20, 0.42, 0.66, 0.88];
    const halfWidth = 0.025; // 0.05 total crossfade window

    return (act: ActMeta): { opacity: number; transform: string; pointerEvents: 'auto' | 'none'; visibility: 'visible' | 'hidden' } => {
      const p = scrollProgress;
      const actIndex = ACTS.findIndex((a) => a.id === act.id);

      // Entry phase (acts after Act I)
      if (actIndex > 0) {
        const entryCenter = boundaries[actIndex - 1];
        const entryStart = entryCenter - halfWidth;
        const entryEnd = entryCenter + halfWidth;

        if (p < entryStart) {
          return {
            opacity: 0,
            transform: 'translate3d(0, 24px, 0) scale(0.96)',
            pointerEvents: 'none',
            visibility: 'hidden',
          };
        }

        if (p <= entryEnd) {
          const t = (p - entryStart) / (entryEnd - entryStart);
          const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
          const scale = 0.96 + 0.04 * ease;
          const y = (1 - ease) * 24;
          return {
            opacity: ease,
            transform: `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
            pointerEvents: ease > 0.6 ? 'auto' : 'none',
            visibility: ease > 0.01 ? 'visible' : 'hidden',
          };
        }
      }

      // Exit phase (acts before Act V)
      if (actIndex < ACTS.length - 1) {
        const exitCenter = boundaries[actIndex];
        const exitStart = exitCenter - halfWidth;
        const exitEnd = exitCenter + halfWidth;

        if (p > exitEnd) {
          return {
            opacity: 0,
            transform: 'translate3d(0, -24px, 0) scale(0.96)',
            pointerEvents: 'none',
            visibility: 'hidden',
          };
        }

        if (p >= exitStart) {
          const t = (p - exitStart) / (exitEnd - exitStart);
          const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
          const opacity = 1 - ease;
          const scale = 0.96 + 0.04 * opacity;
          const y = -ease * 24;
          return {
            opacity,
            transform: `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
            pointerEvents: opacity > 0.6 ? 'auto' : 'none',
            visibility: opacity > 0.01 ? 'visible' : 'hidden',
          };
        }
      }

      // Fully active interior window
      return {
        opacity: 1.0,
        transform: 'translate3d(0, 0px, 0) scale(1.0)',
        pointerEvents: 'auto',
        visibility: 'visible',
      };
    };
  }, [scrollProgress]);

  return (
    <section
      id="atelier-experience"
      ref={containerRef}
      className="relative min-h-[450vh] bg-[#0c0e14] select-none"
      data-testid="atelier-production-experience"
    >
      {/* 1. STICKY FULL-VIEWPORT 3D LIVE CINEMATIC THEATRE */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden z-0">
        <LandingScene scrollProgress={scrollProgress} className="w-full h-full" />

        {/* Floating Master Navigation Island (Anti-Slop Pill Architecture) */}
        <div className="absolute top-4 inset-x-0 mx-auto w-[92%] max-w-4xl z-30 pointer-events-auto">
          <div className="p-1 rounded-full bg-black/25 backdrop-blur-md ring-1 ring-white/10">
            <div className="bg-[#ffffff]/95 backdrop-blur-md rounded-full px-4 sm:px-5 py-2 flex items-center justify-between shadow-xl text-xs font-mono-telemetry border border-[#e2dac9]">
              {/* Active Stage Indicator */}
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[#161a22] hidden sm:flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#1f304d]" />
                  ATELIER
                </span>
                <span className="hidden sm:inline text-[#dcd3c1]">/</span>
                <span className="text-[#15803d] font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
                  {ACTS.find((a) => a.id === activeAct)?.badge}
                </span>
              </div>

              {/* Interactive Stage Scrub Pills */}
              <div className="flex items-center gap-1">
                {ACTS.map((act) => {
                  const isActive = activeAct === act.id;
                  return (
                    <button
                      type="button"
                      key={act.id}
                      onClick={() => scrollToAct(act.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#1f304d] text-white shadow-sm'
                          : 'bg-[#fbf9f4] border border-[#e2dac9] text-[#7d8b9e] hover:text-[#161a22] hover:border-[#b8a892]'
                      }`}
                    >
                      <span>{act.id}</span>
                      <span className="hidden md:inline font-mono text-[10px] opacity-60">• {act.navLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Telemetry */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-[#1f304d]">
                <span className="w-2 h-2 rounded-sm bg-[#c5a059]" />
                <span>{Math.round(scrollProgress * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Interaction Guide (Bottom Center) */}
        <div className="absolute bottom-4 inset-x-0 mx-auto w-max z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161b24]/85 backdrop-blur border border-[#3e4d66] text-[10px] font-mono-telemetry text-[#cad5e2] shadow-lg">
          <Compass className="w-3.5 h-3.5 text-[#c5a059] animate-spin-slow" />
          <span>DRAG 360° TO INSPECT ATELIER PRESS</span>
          <span className="text-[#475569]">|</span>
          <span className="text-[#c5a059]">SCROLL ADVANCES NARRATIVE</span>
        </div>

        {/* 2. CHOREOGRAPHED PINNED EDITORIAL NARRATIVE ACTS (Smooth In-Place Crossfade) */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[46%] xl:w-[42%] flex items-center px-6 sm:px-8 lg:px-12 pointer-events-none z-20">
          <div className="relative w-full max-w-xl min-h-[460px] flex items-center">
            {/* ACT I: THE ARCHIVAL FOLIO OPENS */}
            <div
              style={getActStyle(ACTS[0])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-2 rounded-[2rem] bg-black/15 backdrop-blur-md border border-black/10 shadow-2xl">
                <div className="p-7 sm:p-9 rounded-[calc(2rem-0.5rem)] bg-[#ffffff] border border-[#e2dac9] shadow-2xl space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbf9f4] border border-[#dcd3c1] text-xs font-mono-telemetry text-[#2d3748] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
                    <span className="text-[#1f304d] uppercase tracking-wider font-semibold">
                      ARCHIVE → PAPER → DATA → CERTIFICATE
                    </span>
                    <span className="text-[#c5a059] font-bold">✦ SPECIFICATION v1.0</span>
                  </div>

                  <div className="space-y-2.5">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#161a22] font-serif leading-[1.1]">
                      HIGH-VOLUME ARCHIVAL CERTIFICATE GENERATION.
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-[#556377] leading-relaxed font-sans">
                      Transform structured recipient datasets into high-fidelity, verified, downloadable
                      physical certificates in seconds. Powered by sub-second ReportLab vector compilation,
                      atomic Celery queue dispatch, and zero-divergence 3D physical inspection.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate('/jobs/new')}
                      className="rounded-full px-6 py-3 bg-[#1f304d] hover:bg-[#2d4263] text-white text-xs font-mono-telemetry uppercase tracking-wider shadow-md flex items-center justify-center gap-3 group cursor-pointer"
                    >
                      <span>Initialize Certificate Batch</span>
                      <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <PlusCircle className="w-3.5 h-3.5 text-white" />
                      </span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => navigate('/jobs')}
                      className="rounded-full px-6 py-3 text-xs font-mono-telemetry uppercase tracking-wider flex items-center justify-center gap-3 group cursor-pointer"
                    >
                      <span>View Job Ledger</span>
                      <span className="w-6 h-6 rounded-full bg-[#1f304d]/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <ArrowRight className="w-3.5 h-3.5 text-[#1f304d]" />
                      </span>
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-[#ece5d6] flex items-center justify-between text-[11px] font-mono-telemetry text-[#7d8b9e]">
                    <span>SYSTEM STATUS:</span>
                    <span className="text-[#15803d] font-bold">READY // 500 RECIPIENTS / BATCH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT II: RECIPIENT DATA INTAKE */}
            <div
              style={getActStyle(ACTS[1])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-2 rounded-[2rem] bg-black/15 backdrop-blur-md border border-black/10 shadow-2xl">
                <div className="p-7 sm:p-9 rounded-[calc(2rem-0.5rem)] bg-[#ffffff] border border-[#e2dac9] shadow-2xl space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#fbf9f4] border border-[#dcd3c1] text-[11px] font-mono-telemetry text-[#1f304d] font-bold">
                      ACT II
                    </span>
                    <span className="text-xs font-mono-telemetry uppercase tracking-wider text-[#7d8b9e]">
                      Recipient Data Intake // Feeder Chute
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161a22] font-serif leading-tight">
                      STRUCTURED RECIPIENT INGESTION.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#556377] font-sans leading-relaxed">
                      Recipient rosters enter the atelier through CSV or JSON imports. Every record is sanitized against RFC 5322 rules, assigned deterministic identifiers, and queued for the mechanical press.
                    </p>
                  </div>

                  {/* Specimen Roster Table */}
                  <div className="border border-[#e2dac9] rounded-xl overflow-hidden font-mono-telemetry text-xs bg-[#fbf9f4]">
                    <div className="bg-[#ede6d6] px-4 py-2 border-b border-[#e2dac9] flex items-center justify-between text-[#161a22] font-semibold text-[11px]">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#1f304d]" />
                        <span>SPECIMEN ROSTER // CHUTE QUEUE</span>
                      </div>
                      <span className="text-[10px] text-[#7d8b9e]">3 SAMPLE RECORDS</span>
                    </div>

                    <div className="divide-y divide-[#ece5d6]">
                      <div className="px-4 py-2 flex items-center justify-between bg-[#ffffff]">
                        <div>
                          <div className="font-bold text-[#161a22]">Elena Rostova, ScD</div>
                          <div className="text-[11px] text-[#7d8b9e]">Global Quantum Computing Summit</div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                          RFC 5322 VALID
                        </span>
                      </div>

                      <div className="px-4 py-2 flex items-center justify-between bg-[#ffffff]">
                        <div>
                          <div className="font-bold text-[#161a22]">Marcus Vance, PE</div>
                          <div className="text-[11px] text-[#7d8b9e]">Advanced Aerospace Symposium</div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                          RFC 5322 VALID
                        </span>
                      </div>

                      <div className="px-4 py-2 flex items-center justify-between bg-[#ffffff]">
                        <div>
                          <div className="font-bold text-[#161a22]">Aria Chen</div>
                          <div className="text-[11px] text-[#7d8b9e]">Distributed Cryptography</div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                          RFC 5322 VALID
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-telemetry pt-2 border-t border-[#ece5d6] text-[#7d8b9e]">
                    <span>FEEDER MECHANISM:</span>
                    <span className="text-[#15803d] font-bold">CHUTE ENGAGED // PAPERS ADVANCING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT III: ATELIER PRESS & COMPILATION REACTOR */}
            <div
              style={getActStyle(ACTS[2])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-2 rounded-[2rem] bg-black/15 backdrop-blur-md border border-black/10 shadow-2xl">
                <div className="p-7 sm:p-9 rounded-[calc(2rem-0.5rem)] bg-[#ffffff] border border-[#e2dac9] shadow-2xl space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#fbf9f4] border border-[#dcd3c1] text-[11px] font-mono-telemetry text-[#1f304d] font-bold">
                      ACT III
                    </span>
                    <span className="text-xs font-mono-telemetry uppercase tracking-wider text-[#7d8b9e]">
                      Active Atelier Press // Mechanical Compilation
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161a22] font-serif leading-tight">
                      ASYNCHRONOUS COMPILATION REACTOR.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#556377] font-sans leading-relaxed">
                      Django <code className="text-[#1f304d] font-mono font-bold">on_commit</code> hooks guarantee tasks enter Redis only after database state commits. Dedicated Celery workers execute atomic row-level try/catch blocks, calling ReportLab to compile 1200 DPI vector PDFs with embedded typography.
                    </p>
                  </div>

                  {/* 4 Pipeline Stations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono-telemetry">
                    <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm space-y-0.5">
                      <div className="flex items-center justify-between text-[#1f304d] font-bold">
                        <span>STAGE I</span>
                        <span className="text-[10px] text-[#7d8b9e]">INGESTION</span>
                      </div>
                      <h3 className="font-bold text-[#161a22]">DATA INGESTION PROTOCOL</h3>
                      <p className="text-[11px] text-[#556377] font-sans">CSV/JSON validation with RFC 5322 sanitization.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm space-y-0.5">
                      <div className="flex items-center justify-between text-[#1f304d] font-bold">
                        <span>STAGE II</span>
                        <span className="text-[10px] text-[#7d8b9e]">TRANSACTION</span>
                      </div>
                      <h3 className="font-bold text-[#161a22]">QUEUE DISPATCH</h3>
                      <p className="text-[11px] text-[#556377] font-sans">HTTP 202 queue allocation via Celery over Redis.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm space-y-0.5">
                      <div className="flex items-center justify-between text-[#15803d] font-bold">
                        <span>STAGE III</span>
                        <span className="text-[10px] text-[#15803d]">ACTIVE</span>
                      </div>
                      <h3 className="font-bold text-[#161a22]">VECTOR COMPILER</h3>
                      <p className="text-[11px] text-[#556377] font-sans">142 certs/sec raster rate with fault containment.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm space-y-0.5">
                      <div className="flex items-center justify-between text-[#1f304d] font-bold">
                        <span>STAGE IV</span>
                        <span className="text-[10px] text-[#7d8b9e]">DELIVERY</span>
                      </div>
                      <h3 className="font-bold text-[#161a22]">STREAMING VAULT</h3>
                      <p className="text-[11px] text-[#556377] font-sans">Authoritative PDF texture and bulk ZIP export.</p>
                    </div>
                  </div>

                  {/* Machinery Telemetry Box */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e2dac9] space-y-1.5 font-mono-telemetry text-xs shadow-sm">
                    <div className="flex justify-between items-center text-[#7d8b9e] text-[11px] pb-1.5 border-b border-[#ece5d6]">
                      <span>REACTOR STATUS</span>
                      <span className="text-[#15803d] font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#15803d] animate-pulse" />
                        BRASS ROLLERS SPINNING // ~142 CERTS/SEC
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#556377]">FAULT CONTAINMENT:</span>
                      <span className="text-[#161a22] font-semibold">ATOMIC ROW TRY/CATCH SAFETIES</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT IV: THE CERTIFICATE EMERGES */}
            <div
              style={getActStyle(ACTS[3])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-2 rounded-[2rem] bg-black/15 backdrop-blur-md border border-black/10 shadow-2xl">
                <div className="p-7 sm:p-9 rounded-[calc(2rem-0.5rem)] bg-[#ffffff] border border-[#e2dac9] shadow-2xl space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#fbf9f4] border border-[#dcd3c1] text-[11px] font-mono-telemetry text-[#15803d] font-bold">
                      ACT IV
                    </span>
                    <span className="text-xs font-mono-telemetry uppercase tracking-wider text-[#7d8b9e]">
                      Specimen Emergence // Physical Reveal
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161a22] font-serif leading-tight">
                      PHYSICALLY ACCURATE SPECIMEN REVELATION.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#556377] font-sans leading-relaxed">
                      As the rendering cycle completes, each certificate glides forward out of the rollers into prominent inspection view. Curved vellum deflection, layered paper shadow, and reactive studio lighting bring tactile authenticity to the digital document.
                    </p>
                  </div>

                  {/* Emergence Specimen Box */}
                  <div className="p-4 rounded-xl bg-[#ffffff] border-2 border-[#e2dac9] space-y-3 shadow-sm relative overflow-hidden">
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#fcfbf9] border border-[#c5a059]/40 text-[#855d14] text-[10px] font-mono-telemetry font-bold">
                      <Sparkles className="w-3 h-3 text-[#c5a059]" />
                      <span>EMBOSSED SEAL VERIFIED</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-mono-telemetry text-[#7d8b9e] uppercase tracking-wider">
                        REPRESENTATIVE SPECIMEN // LIVE GL VIEW
                      </div>
                      <h4 className="text-xl sm:text-2xl font-bold text-[#161a22] font-serif">
                        Elena Rostova, ScD
                      </h4>
                      <div className="text-xs text-[#556377] font-mono-telemetry">
                        Global Quantum Computing Summit • CERT-2026-466DBC643C27
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2.5 border-t border-[#ece5d6] text-xs font-mono-telemetry">
                      <div className="p-2 rounded bg-[#fbf9f4] border border-[#e2dac9]">
                        <span className="text-[10px] text-[#7d8b9e] block">TYPOGRAPHY</span>
                        <span className="font-semibold text-[#161a22]">Archival Serif</span>
                      </div>
                      <div className="p-2 rounded bg-[#fbf9f4] border border-[#e2dac9]">
                        <span className="text-[10px] text-[#7d8b9e] block">SUBSTRATE</span>
                        <span className="font-semibold text-[#161a22]">280 GSM Ivory</span>
                      </div>
                      <div className="p-2 rounded bg-[#fbf9f4] border border-[#e2dac9] col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-[#7d8b9e] block">RESOLUTION</span>
                        <span className="font-semibold text-[#15803d]">1200 DPI Vector</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-telemetry pt-2 border-t border-[#ece5d6]">
                    <span className="text-[#15803d] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                      ZERO-DIVERGENCE PHYSICAL PARITY
                    </span>
                    <span className="text-[#7d8b9e]">PDF.JS / THREE.JS VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT V: THE ARCHIVE IS COMPLETED */}
            <div
              style={getActStyle(ACTS[4])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-2 rounded-[2rem] bg-black/15 backdrop-blur-md border border-black/10 shadow-2xl">
                <div className="p-7 sm:p-9 rounded-[calc(2rem-0.5rem)] bg-[#ffffff] border border-[#e2dac9] shadow-2xl space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#fbf9f4] border border-[#dcd3c1] text-[11px] font-mono-telemetry text-[#15803d] font-bold">
                      ACT V
                    </span>
                    <span className="text-xs font-mono-telemetry uppercase tracking-wider text-[#7d8b9e]">
                      Envelope Sealed // Archival Vault Complete
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161a22] font-serif leading-tight">
                      ACCUMULATED CERTIFICATE COLLECTION.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#556377] font-sans leading-relaxed">
                      The finished specimen docks securely into the midnight bookcloth presentation folio and is sealed shut with the embossed gold wax medallion. Batches resolve cleanly into indexed archival folios, downloadable as cryptographically deterministic ZIP packages with complete job audit ledgers.
                    </p>
                  </div>

                  {/* Completed Collection Dossier */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e2dac9] space-y-2.5 font-mono-telemetry text-xs shadow-sm">
                    <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-[#ece5d6]">
                      <span className="text-[#7d8b9e]">ARCHIVAL STATUS:</span>
                      <span className="text-[#15803d] font-bold bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                        500 / 500 COMPLETE
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#1f304d]" />
                        <span className="font-semibold text-[#161a22]">certificates_batch_quantum_2026.zip</span>
                      </div>
                      <span className="text-[10px] bg-[#f5efe4] text-[#1f304d] px-2 py-0.5 rounded border border-[#dcd3c1] font-bold">
                        STREAMING ZIP (FR-016)
                      </span>
                    </div>

                    <div className="text-[10px] text-[#7d8b9e] pt-1.5 border-t border-[#ece5d6]">
                      <span>CRYPTOGRAPHIC DETERMINISM (FR-021) // AUDITABLE RUNTIME</span>
                    </div>
                  </div>

                  {/* Final Dispatch CTAs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate('/jobs/new')}
                      className="rounded-full px-6 py-3 bg-[#1f304d] hover:bg-[#2d4263] text-white text-xs font-mono-telemetry uppercase tracking-wider shadow-md flex items-center justify-center gap-3 group cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Certificate Batch</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => navigate('/jobs')}
                      className="rounded-full px-6 py-3 text-xs font-mono-telemetry uppercase tracking-wider flex items-center justify-center gap-3 group cursor-pointer"
                    >
                      <span>View Job History</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AtelierProductionExperience;
