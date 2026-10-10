import React, { useEffect, useRef, useState } from 'react';
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

  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setIsReducedMotion(event.matches);
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  // Continuous Scroll Observer
  useEffect(() => {
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
      const containerTop = scrollY + containerRef.current.getBoundingClientRect().top;
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
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

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
      behavior: isReducedMotion ? 'auto' : 'smooth',
    });
  };

  /**
   * Calculates continuous opacity and translation with strict mutual exclusion.
   * Guarantees zero overlapping text between adjacent acts.
   */
  const getActStyle = (act: ActMeta): { opacity: number; transform: string; pointerEvents: 'auto' | 'none'; visibility: 'visible' | 'hidden'; zIndex: number } => {
    if (isReducedMotion) {
      const visible = activeAct === act.id;
      return {
        opacity: visible ? 1 : 0,
        transform: 'none',
        pointerEvents: visible ? 'auto' : 'none',
        visibility: visible ? 'visible' : 'hidden',
        zIndex: visible ? 20 : 10,
      };
    }
    // Transition boundary points between Acts [I-II, II-III, III-IV, IV-V]
    const boundaries = [0.20, 0.42, 0.66, 0.88];
    const halfWidth = 0.012; // 0.024 tight clean crossfade window
    const p = scrollProgress;
    const actIndex = ACTS.findIndex((a) => a.id === act.id);
    const isActive = activeAct === act.id;

    // Entry phase (acts after Act I)
    if (actIndex > 0) {
      const entryCenter = boundaries[actIndex - 1];
      const entryStart = entryCenter - halfWidth;
      const entryEnd = entryCenter + halfWidth;

      if (p < entryStart) {
        return {
          opacity: 0,
          transform: 'translate3d(0, 16px, 0) scale(0.98)',
          pointerEvents: 'none',
          visibility: 'hidden',
          zIndex: 10,
        };
      }

      if (p <= entryEnd) {
        const t = (p - entryStart) / (entryEnd - entryStart);
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
        const scale = 0.98 + 0.02 * ease;
        const y = (1 - ease) * 16;
        return {
          opacity: ease,
          transform: `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
          pointerEvents: ease > 0.6 ? 'auto' : 'none',
          visibility: ease > 0.01 ? 'visible' : 'hidden',
          zIndex: isActive ? 20 : 10,
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
          transform: 'translate3d(0, -16px, 0) scale(0.98)',
          pointerEvents: 'none',
          visibility: 'hidden',
          zIndex: 10,
        };
      }

      if (p >= exitStart) {
        const t = (p - exitStart) / (exitEnd - exitStart);
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
        const opacity = 1 - ease;
        const scale = 0.98 + 0.02 * opacity;
        const y = -ease * 16;
        return {
          opacity,
          transform: `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
          pointerEvents: opacity > 0.6 ? 'auto' : 'none',
          visibility: opacity > 0.01 ? 'visible' : 'hidden',
          zIndex: isActive ? 20 : 10,
        };
      }
    }

    // Fully active interior window
    return {
      opacity: 1.0,
      transform: 'translate3d(0, 0px, 0) scale(1.0)',
      pointerEvents: 'auto',
      visibility: 'visible',
      zIndex: 20,
    };
  };

  return (
    <section
      id="atelier-experience"
      ref={containerRef}
      className="relative min-h-[450vh] bg-white text-black select-none"
      data-testid="atelier-production-experience"
    >
      {/* 1. STICKY FULL-VIEWPORT 3D LIVE CINEMATIC THEATRE */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden z-0 bg-white">
        <LandingScene scrollProgress={scrollProgress} className="w-full h-full" />

        {/* Floating Master Navigation Island (Dell 1996 Catalog Ribbon Bar) */}
        <div className="absolute top-4 inset-x-0 mx-auto w-[92%] max-w-4xl z-30 pointer-events-auto">
          <div className="p-0.5 rounded-none bg-black shadow-[4px_4px_0px_#000]">
            <div className="bg-white rounded-none px-4 sm:px-5 py-2 flex items-center justify-between border-2 border-black text-xs font-ui">
              {/* Active Stage Indicator */}
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-black hidden sm:flex items-center gap-1.5 uppercase">
                  <Terminal className="w-3.5 h-3.5 text-black" />
                  ATELIER
                </span>
                <span className="hidden sm:inline text-neutral-400">/</span>
                <span className="text-black font-bold flex items-center gap-1.5 text-[11px] uppercase">
                  <span className="w-2 h-2 bg-[#e91d2a]" />
                  {ACTS.find((a) => a.id === activeAct)?.badge}
                </span>
              </div>

              {/* Interactive Stage Scrub Tabs */}
              <div className="flex items-center gap-1">
                {ACTS.map((act) => {
                  const isActive = activeAct === act.id;
                  return (
                    <button
                      type="button"
                      key={act.id}
                      onClick={() => scrollToAct(act.id)}
                      className={`px-2.5 py-1 rounded-none text-[11px] font-bold border border-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 uppercase ${
                        isActive
                          ? 'bg-black text-white shadow-none'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      <span>{act.id}</span>
                      <span className="hidden md:inline font-mono text-[10px] opacity-75">• {act.navLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Telemetry */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold font-mono text-black">
                <span className="w-2 h-2 bg-[#fcc20f] border border-black" />
                <span>{Math.round(scrollProgress * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Interaction Guide (Bottom Center) */}
        <div className="absolute bottom-4 inset-x-0 mx-auto w-max z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-black border-2 border-black text-[10px] font-ui font-bold text-white shadow-[3px_3px_0px_#000]">
          <Compass className="w-3.5 h-3.5 text-[#fcc20f] animate-spin-slow" />
          <span>DRAG 360° TO INSPECT 1996 CAD WORKSTATION</span>
          <span className="text-neutral-500">|</span>
          <span className="text-[#fcc20f]">SCROLL ADVANCES PRODUCTION STAGES</span>
        </div>

        {/* 2. CHOREOGRAPHED PINNED EDITORIAL NARRATIVE ACTS (Smooth In-Place Crossfade) */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[48%] xl:w-[44%] flex items-center px-4 sm:px-8 lg:px-10 pointer-events-none z-20">
          <div className="relative w-full max-w-xl min-h-[460px] flex items-center">
            {/* ACT I: THE ARCHIVAL FOLIO OPENS */}
            <div
              style={getActStyle(ACTS[0])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-1 rounded-none bg-black shadow-[6px_6px_0px_#000]">
                <div className="p-6 sm:p-8 rounded-none bg-white border-2 border-black space-y-4">
                  {/* Ribbon Header Strip (Steel) */}
                  <div className="bg-[#a5b8c0] border-b-2 border-black -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-4 py-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-ui text-black font-bold uppercase tracking-wider">
                      <span className="w-2.5 h-2.5 bg-[#e91d2a]" />
                      <span>ARCHIVE → PAPER → DATA → CERTIFICATE</span>
                    </div>
                    <span className="font-ui text-[10px] bg-[#fcc20f] text-black border border-black font-bold px-1.5 py-0.2 uppercase">
                      SPECIFICATION v1.0
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display-dell font-black tracking-tight text-black leading-[1.05] uppercase">
                      HIGH-VOLUME ARCHIVAL CERTIFICATE GENERATION.
                    </h1>
                    <p className="text-xs sm:text-sm text-black font-serif leading-relaxed">
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
                      className="rounded-none border-2 border-black px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-ui font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Initialize Certificate Batch</span>
                      <PlusCircle className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => navigate('/jobs')}
                      className="rounded-none border-2 border-black px-6 py-2.5 bg-white hover:bg-neutral-100 text-black text-xs font-ui font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>View Job Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-black flex items-center justify-between text-xs font-mono text-black">
                    <span>SYSTEM STATUS:</span>
                    <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">READY // 500 RECIPIENTS / BATCH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT II: RECIPIENT DATA INTAKE */}
            <div
              style={getActStyle(ACTS[1])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-1 rounded-none bg-black shadow-[6px_6px_0px_#000]">
                <div className="p-6 sm:p-8 rounded-none bg-white border-2 border-black space-y-4">
                  {/* Ribbon Header Strip (Sage) */}
                  <div className="bg-[#b3bd95] border-b-2 border-black -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.2 bg-black text-white text-[10px] font-ui font-bold uppercase">
                        ACT II
                      </span>
                      <span className="font-ui text-xs font-bold uppercase tracking-wider text-black">
                        Recipient Data Intake // Feeder Chute
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-display-dell font-black tracking-tight text-black leading-tight uppercase">
                      STRUCTURED RECIPIENT INGESTION.
                    </h2>
                    <p className="text-xs sm:text-sm text-black font-serif leading-relaxed">
                      Recipient rosters enter the atelier through CSV or JSON imports. Every record is sanitized against RFC 5322 rules, assigned deterministic identifiers, and queued for the mechanical press.
                    </p>
                  </div>

                  {/* Specimen Roster Table */}
                  <div className="border-2 border-black rounded-none overflow-hidden font-serif text-xs bg-white">
                    <div className="bg-[#a5b8c0] px-3 py-1.5 border-b-2 border-black flex items-center justify-between text-black font-ui font-bold text-xs uppercase">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
                        <span>SPECIMEN ROSTER // CHUTE QUEUE</span>
                      </div>
                      <span className="text-[10px] font-mono">3 SAMPLE RECORDS</span>
                    </div>

                    <table className="dell-table w-full">
                      <tbody>
                        <tr>
                          <td>
                            <strong className="text-black font-serif">Elena Rostova, ScD</strong>
                            <div className="text-[10px] text-neutral-600 font-mono">Global Quantum Computing Summit</div>
                          </td>
                          <td className="text-right">
                            <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#c0d4a7] text-black border border-black uppercase">
                              RFC 5322 VALID
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong className="text-black font-serif">Marcus Vance, PE</strong>
                            <div className="text-[10px] text-neutral-600 font-mono">Advanced Aerospace Symposium</div>
                          </td>
                          <td className="text-right">
                            <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#c0d4a7] text-black border border-black uppercase">
                              RFC 5322 VALID
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong className="text-black font-serif">Aria Chen</strong>
                            <div className="text-[10px] text-neutral-600 font-mono">Distributed Cryptography</div>
                          </td>
                          <td className="text-right">
                            <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#c0d4a7] text-black border border-black uppercase">
                              RFC 5322 VALID
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-black text-black">
                    <span>FEEDER MECHANISM:</span>
                    <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">CHUTE ENGAGED // PAPERS ADVANCING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT III: ATELIER PRESS & COMPILATION REACTOR */}
            <div
              style={getActStyle(ACTS[2])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-1 rounded-none bg-black shadow-[6px_6px_0px_#000]">
                <div className="p-6 sm:p-8 rounded-none bg-white border-2 border-black space-y-4">
                  {/* Ribbon Header Strip (Salmon) */}
                  <div className="bg-[#d77a7a] border-b-2 border-black -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.2 bg-black text-white text-[10px] font-ui font-bold uppercase">
                        ACT III
                      </span>
                      <span className="font-ui text-xs font-bold uppercase tracking-wider text-black">
                        Active Atelier Press // Mechanical Compilation
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-display-dell font-black tracking-tight text-black leading-tight uppercase">
                      ASYNCHRONOUS COMPILATION REACTOR.
                    </h2>
                    <p className="text-xs sm:text-sm text-black font-serif leading-relaxed">
                      Django <code className="text-black font-mono font-bold bg-neutral-200 px-1 border border-black">on_commit</code> hooks guarantee tasks enter Redis only after database state commits. Dedicated Celery workers execute atomic row-level try/catch blocks, calling ReportLab to compile 1200 DPI vector PDFs with embedded typography.
                    </p>
                  </div>

                  {/* 4 Pipeline Stations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-ui">
                    <div className="p-2.5 rounded-none bg-white border border-black space-y-0.5">
                      <div className="flex items-center justify-between text-black font-bold">
                        <span>STAGE I</span>
                        <span className="text-[10px] font-mono text-neutral-600">INGESTION</span>
                      </div>
                      <h3 className="font-bold text-black uppercase text-[11px]">DATA INGESTION PROTOCOL</h3>
                      <p className="text-[11px] text-black font-serif">CSV/JSON validation with RFC 5322 sanitization.</p>
                    </div>

                    <div className="p-2.5 rounded-none bg-white border border-black space-y-0.5">
                      <div className="flex items-center justify-between text-black font-bold">
                        <span>STAGE II</span>
                        <span className="text-[10px] font-mono text-neutral-600">TRANSACTION</span>
                      </div>
                      <h3 className="font-bold text-black uppercase text-[11px]">QUEUE DISPATCH</h3>
                      <p className="text-[11px] text-black font-serif">HTTP 202 queue allocation via Celery over Redis.</p>
                    </div>

                    <div className="p-2.5 rounded-none bg-white border border-black space-y-0.5">
                      <div className="flex items-center justify-between text-black font-bold">
                        <span>STAGE III</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">ACTIVE</span>
                      </div>
                      <h3 className="font-bold text-black uppercase text-[11px]">VECTOR COMPILER</h3>
                      <p className="text-[11px] text-black font-serif">142 certs/sec raster rate with fault containment.</p>
                    </div>

                    <div className="p-2.5 rounded-none bg-white border border-black space-y-0.5">
                      <div className="flex items-center justify-between text-black font-bold">
                        <span>STAGE IV</span>
                        <span className="text-[10px] font-mono text-neutral-600">DELIVERY</span>
                      </div>
                      <h3 className="font-bold text-black uppercase text-[11px]">STREAMING VAULT</h3>
                      <p className="text-[11px] text-black font-serif">Authoritative PDF texture and bulk ZIP export.</p>
                    </div>
                  </div>

                  {/* Machinery Telemetry Box */}
                  <div className="p-2.5 rounded-none bg-white border border-black space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center text-black text-[11px] pb-1 border-b border-black">
                      <span>REACTOR STATUS</span>
                      <span className="text-black font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#e91d2a] animate-pulse" />
                        BRASS ROLLERS SPINNING // ~142 CERTS/SEC
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-700">FAULT CONTAINMENT:</span>
                      <span className="text-black font-semibold">ATOMIC ROW TRY/CATCH SAFETIES</span>
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
              <div className="pointer-events-auto p-1 rounded-none bg-black shadow-[6px_6px_0px_#000]">
                <div className="p-6 sm:p-8 rounded-none bg-white border-2 border-black space-y-4">
                  {/* Ribbon Header Strip (Lime) */}
                  <div className="bg-[#c0d4a7] border-b-2 border-black -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.2 bg-black text-white text-[10px] font-ui font-bold uppercase">
                        ACT IV
                      </span>
                      <span className="font-ui text-xs font-bold uppercase tracking-wider text-black">
                        Specimen Emergence // Physical Reveal
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-display-dell font-black tracking-tight text-black leading-tight uppercase">
                      PHYSICALLY ACCURATE SPECIMEN REVELATION.
                    </h2>
                    <p className="text-xs sm:text-sm text-black font-serif leading-relaxed">
                      As the rendering cycle completes, each certificate glides forward out of the rollers into prominent inspection view. Curved vellum deflection, layered paper shadow, and reactive studio lighting bring tactile authenticity to the digital document.
                    </p>
                  </div>

                  {/* Emergence Specimen Box */}
                  <div className="p-3.5 rounded-none bg-white border-2 border-black space-y-2.5 relative">
                    <div className="flex items-center justify-between pb-1 border-b border-black">
                      <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
                        REPRESENTATIVE SPECIMEN // LIVE GL VIEW
                      </div>
                      <div className="dell-sticker-yellow px-2 py-0.5 text-[10px] font-ui font-bold uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-black" />
                        <span>EMBOSSED SEAL VERIFIED</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xl sm:text-2xl font-bold text-black font-serif">
                        Elena Rostova, ScD
                      </h4>
                      <div className="text-xs text-neutral-700 font-mono">
                        Global Quantum Computing Summit • CERT-2026-466DBC643C27
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-black text-xs font-mono">
                      <div className="p-1.5 rounded-none bg-neutral-50 border border-black">
                        <span className="text-[10px] text-neutral-600 block">TYPOGRAPHY</span>
                        <span className="font-semibold text-black">Archival Serif</span>
                      </div>
                      <div className="p-1.5 rounded-none bg-neutral-50 border border-black">
                        <span className="text-[10px] text-neutral-600 block">SUBSTRATE</span>
                        <span className="font-semibold text-black">280 GSM Ivory</span>
                      </div>
                      <div className="p-1.5 rounded-none bg-neutral-50 border border-black col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-neutral-600 block">RESOLUTION</span>
                        <span className="font-semibold text-black">1200 DPI Vector</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-black">
                    <span className="text-black font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#e91d2a]" />
                      ZERO-DIVERGENCE PHYSICAL PARITY
                    </span>
                    <span className="text-neutral-600">PDF.JS / THREE.JS VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT V: THE ARCHIVE IS COMPLETED */}
            <div
              style={getActStyle(ACTS[4])}
              className="absolute inset-x-0 transition-transform duration-75 will-change-transform"
            >
              <div className="pointer-events-auto p-1 rounded-none bg-black shadow-[6px_6px_0px_#000]">
                <div className="p-6 sm:p-8 rounded-none bg-white border-2 border-black space-y-4">
                  {/* Ribbon Header Strip (Peach) */}
                  <div className="bg-[#e6915d] border-b-2 border-black -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.2 bg-black text-white text-[10px] font-ui font-bold uppercase">
                        ACT V
                      </span>
                      <span className="font-ui text-xs font-bold uppercase tracking-wider text-black">
                        Envelope Sealed // Archival Vault Complete
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-display-dell font-black tracking-tight text-black leading-tight uppercase">
                      ACCUMULATED CERTIFICATE COLLECTION.
                    </h2>
                    <p className="text-xs sm:text-sm text-black font-serif leading-relaxed">
                      The finished specimen docks securely into the midnight bookcloth presentation folio and is sealed shut with the embossed gold wax medallion. Batches resolve cleanly into indexed archival folios, downloadable as cryptographically deterministic ZIP packages with complete job audit ledgers.
                    </p>
                  </div>

                  {/* Completed Collection Dossier */}
                  <div className="p-3 rounded-none bg-white border border-black space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-[11px] pb-1 border-b border-black">
                      <span className="text-neutral-700">ARCHIVAL STATUS:</span>
                      <span className="text-black font-bold bg-[#c0d4a7] px-2 py-0.5 border border-black">
                        500 / 500 COMPLETE
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-black" />
                        <span className="font-semibold text-black">certificates_batch_quantum_2026.zip</span>
                      </div>
                      <span className="text-[10px] bg-[#fcc20f] text-black px-1.5 py-0.2 border border-black font-bold">
                        STREAMING ZIP (FR-016)
                      </span>
                    </div>

                    <div className="text-[10px] text-neutral-600 pt-1 border-t border-black">
                      <span>CRYPTOGRAPHIC DETERMINISM (FR-021) // AUDITABLE RUNTIME</span>
                    </div>
                  </div>

                  {/* Final Dispatch CTAs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate('/jobs/new')}
                      className="rounded-none border-2 border-black px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-ui font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Certificate Batch</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => navigate('/jobs')}
                      className="rounded-none border-2 border-black px-6 py-2.5 bg-white hover:bg-neutral-100 text-black text-xs font-ui font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
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
