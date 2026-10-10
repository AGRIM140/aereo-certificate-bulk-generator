import React, { useEffect, useRef, useState } from 'react';
import {
  createLandingScene,
  isWebGLAvailable,
  type LandingSceneController,
} from '../../lib/three/createLandingScene';
import { ShieldCheck, Compass, Info, X } from 'lucide-react';

interface LandingSceneProps {
  className?: string;
  scrollProgress?: number;
}

export const LandingScene: React.FC<LandingSceneProps> = ({ className = '', scrollProgress }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<LandingSceneController | null>(null);
  const scrollProgressRef = useRef<number | undefined>(scrollProgress);
  const [hasWebGLError, setHasWebGLError] = useState<boolean>(() => !isWebGLAvailable());
  const [showMetadataDrawer, setShowMetadataDrawer] = useState<boolean>(false);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
    if (scrollProgress !== undefined && controllerRef.current?.setScrollProgress) {
      controllerRef.current.setScrollProgress(scrollProgress);
    }
  }, [scrollProgress]);

  useEffect(() => {
    if (hasWebGLError || !containerRef.current) return;

    const reducedMotion =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    let ctrl: LandingSceneController | null = null;

    try {
      ctrl = createLandingScene({
        container: containerRef.current,
        reducedMotion,
      });
      controllerRef.current = ctrl;
      if (scrollProgressRef.current !== undefined && ctrl.setScrollProgress) {
        ctrl.setScrollProgress(scrollProgressRef.current);
      }
    } catch {
      queueMicrotask(() => {
        setHasWebGLError(true);
      });
      return;
    }

    // Media query listener
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      ctrl?.setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        mediaQuery.removeListener(handleMotionChange);
      }
      ctrl?.dispose();
      controllerRef.current = null;
    };
  }, [hasWebGLError]);

  return (
    <div
      className={`relative w-full h-full min-h-[440px] bg-gradient-to-b from-[#181d26] via-[#12161f] to-[#0c0e14] overflow-hidden flex items-center justify-center select-none ${className}`}
      data-testid="landing-3d-stage"
    >
      {/* 3D WebGL Canvas or 2D Static Archival Fallback */}
      {!hasWebGLError ? (
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'pan-y' }}
          title="Drag to inspect document stack in 3D • Double-click to reset"
        />
      ) : (
        /* Static 2D Archival Fallback */
        <div
          className="w-full h-full flex items-center justify-center p-6"
          data-testid="landing-2d-fallback"
        >
          <div className="relative w-full max-w-[460px] aspect-[1.415] bg-[#fbf8f0] text-slate-900 rounded-sm p-6 shadow-2xl border-4 border-[#2b3648] flex flex-col justify-between select-none">
            {/* Border filigree */}
            <div className="absolute inset-2 border border-[#c5a059] pointer-events-none" />

            <div className="flex justify-between items-center text-[10px] font-mono-telemetry text-slate-500 z-10">
              <span>ARCHIVAL SPECIFICATION</span>
              <span className="text-[#c5a059] font-bold">2D FALLBACK</span>
            </div>

            <div className="text-center space-y-1.5 my-auto z-10">
              <span className="text-[11px] font-mono-telemetry uppercase tracking-widest text-[#c5a059] block">
                Certificate of Achievement
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                Dr. Elena Rostova
              </h3>
              <p className="text-xs text-slate-600 font-serif max-w-xs mx-auto">
                Global Quantum Computing Summit 2026
              </p>
            </div>

            <div className="flex justify-between items-end text-[9px] font-mono-telemetry text-slate-500 border-t border-slate-300 pt-2 z-10">
              <span>ID: CERT-2026-466DBC643C27</span>
              <span>VERIFIED ARCHIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls Overlay (Bottom Right) */}
      {!hasWebGLError && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e2533]/90 hover:bg-[#283244] border border-[#3e4d66] text-[10px] font-mono-telemetry text-[#e2e8f0] transition-colors shadow-sm cursor-pointer"
            title="Inspect sample record specifications"
            aria-label="Inspect sample record specifications"
          >
            <Info className="w-3 h-3 text-[#c5a059]" />
            <span className="hidden sm:inline">Record Specs</span>
          </button>

          <button
            type="button"
            onClick={() => controllerRef.current?.resetView?.()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e2533]/90 hover:bg-[#283244] border border-[#3e4d66] text-[10px] font-mono-telemetry text-[#e2e8f0] transition-colors shadow-sm cursor-pointer"
            title="Reset 3D camera to default archival view (or double-click canvas)"
            aria-label="Reset 3D camera orientation"
          >
            <Compass className="w-3 h-3 text-[#c5a059]" />
            <span>Reset</span>
          </button>
        </div>
      )}


      {/* Interactive Sample Metadata Modal / Flyout */}
      {showMetadataDrawer && (
        <div className="absolute inset-x-4 bottom-14 sm:inset-x-auto sm:right-4 sm:w-80 p-4 rounded-lg bg-[#161b24]/95 backdrop-blur-md border border-[#3e4d66] text-[#e2e8f0] shadow-2xl z-30 font-mono-telemetry text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#2d384c] pb-2">
            <div className="flex items-center gap-1.5 text-[#c5a059] font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DOCKET SPECIFICATION // ARCHIVE</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMetadataDrawer(false)}
              className="text-[#94a3b8] hover:text-white p-0.5 rounded cursor-pointer"
              aria-label="Close specifications panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[10px] text-[#cbd5e1]">
            <div className="flex justify-between">
              <span className="text-[#8091a7]">RECIPIENT:</span>
              <span className="font-semibold text-white">Dr. Elena Rostova</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8091a7]">IDENTIFIER:</span>
              <span className="text-[#c5a059]">CERT-2026-466DBC643C27</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8091a7]">SEAL EMBOSS:</span>
              <span className="text-emerald-400">CRIMSON WAX & GOLD CREST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8091a7]">COMPOSITION:</span>
              <span>TRIPLE LAYER VELLUM DOCKET</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8091a7]">RASTER ENGINE:</span>
              <span>REPORTLAB VECTOR + PDF.JS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
