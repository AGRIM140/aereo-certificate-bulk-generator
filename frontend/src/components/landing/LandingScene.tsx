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
      className={`relative w-full h-full min-h-[440px] bg-white text-black overflow-hidden flex items-center justify-center select-none ${className}`}
      data-testid="landing-3d-stage"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      {/* 1996 Technical CAD Viewport Registration Overlays */}
      <div className="absolute top-3 left-4 pointer-events-none z-10 items-center gap-2 font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-wider hidden sm:flex">
        <span className="text-black font-extrabold">+</span>
        <span>STAGE: ATELIER WORKSTATION // ISO-1996</span>
      </div>
      <div className="absolute top-3 right-4 pointer-events-none z-10 items-center gap-2 font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-wider hidden sm:flex">
        <span>GRID: 32PX // 1200 DPI VECTOR</span>
        <span className="text-black font-extrabold">+</span>
      </div>
      <div className="absolute bottom-3 left-4 pointer-events-none z-10 items-center gap-2 font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-wider hidden sm:flex">
        <span className="text-black font-extrabold">+</span>
        <span>SYS: REPORTLAB • CELERY • SHA-256</span>
      </div>

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
          <div className="relative w-full max-w-[460px] aspect-[1.415] bg-white text-black rounded-none p-6 shadow-[6px_6px_0px_#000] border-4 border-black flex flex-col justify-between select-none">
            {/* Border filigree */}
            <div className="absolute inset-2 border border-black pointer-events-none" />

            <div className="flex justify-between items-center text-[10px] font-ui font-bold text-black z-10">
              <span className="uppercase">ARCHIVAL SPECIFICATION</span>
              <span className="bg-[#fcc20f] text-black px-1.5 py-0.2 border border-black">2D FALLBACK</span>
            </div>

            <div className="text-center space-y-1.5 my-auto z-10">
              <span className="text-[11px] font-ui uppercase tracking-widest text-black font-bold block">
                Certificate of Achievement
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-black tracking-tight">
                Dr. Elena Rostova
              </h3>
              <p className="text-xs text-neutral-800 font-serif max-w-xs mx-auto">
                Global Quantum Computing Summit 2026
              </p>
            </div>

            <div className="flex justify-between items-end text-[9px] font-mono text-black border-t border-black pt-2 z-10">
              <span>ID: CERT-2026-466DBC643C27</span>
              <span className="font-bold">VERIFIED ARCHIVE</span>
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-black hover:bg-neutral-800 border-2 border-black text-[10px] font-ui font-bold uppercase text-white shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Inspect sample record specifications"
            aria-label="Inspect sample record specifications"
          >
            <Info className="w-3 h-3 text-[#fcc20f]" />
            <span className="hidden sm:inline">Record Specs</span>
          </button>

          <button
            type="button"
            onClick={() => controllerRef.current?.resetView?.()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-black hover:bg-neutral-800 border-2 border-black text-[10px] font-ui font-bold uppercase text-white shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Reset 3D camera to default archival view (or double-click canvas)"
            aria-label="Reset 3D camera orientation"
          >
            <Compass className="w-3 h-3 text-[#fcc20f]" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Interactive Sample Metadata Modal / Flyout */}
      {showMetadataDrawer && (
        <div className="absolute inset-x-4 bottom-14 sm:inset-x-auto sm:right-4 sm:w-80 p-4 rounded-none bg-white border-2 border-black text-black shadow-[6px_6px_0px_#000] z-30 font-mono text-xs space-y-2.5">
          <div className="bg-[#a5b8c0] border-b-2 border-black -mt-4 -mx-4 px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-black font-ui font-bold uppercase text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DOCKET SPECIFICATION // ARCHIVE</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMetadataDrawer(false)}
              className="text-black hover:bg-black hover:text-white p-0.5 border border-black cursor-pointer"
              aria-label="Close specifications panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[10px] text-black">
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600 font-bold">RECIPIENT:</span>
              <span className="font-serif font-bold text-black">Dr. Elena Rostova</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600 font-bold">IDENTIFIER:</span>
              <span className="font-bold">CERT-2026-466DBC643C27</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600 font-bold">SEAL EMBOSS:</span>
              <span className="text-[#e91d2a] font-bold">CRIMSON WAX & GOLD CREST</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-1">
              <span className="text-neutral-600 font-bold">COMPOSITION:</span>
              <span>TRIPLE LAYER VELLUM DOCKET</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 font-bold">RASTER ENGINE:</span>
              <span>REPORTLAB VECTOR + PDF.JS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
