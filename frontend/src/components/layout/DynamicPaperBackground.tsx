import React, { useEffect, useRef } from 'react';

/**
 * Shared Dynamic Paper Background — Living Archive Edition
 * Persists continuously across all application routes without remounting.
 * Composed of:
 * 1. Warm ivory & cream parchment radial base (#f8f5ed to #ede4d1)
 * 2. Fine horizontal ruled notebook lines (28px pitch)
 * 3. Understated technical grid pattern (56px ledger pitch)
 * 4. Distinctive rust-red vertical notebook margin guideline (dual rule)
 * 5. Low-contrast procedural SVG paper grain texture (cold-pressed vellum tooth)
 * 6. Slow ambient light/shadow drift with subtle pointer-responsive parallax
 * 7. Non-intrusive archival registration crosshairs
 * 
 * pointer-events-none ensures zero interference with scrolling, clicks, or selection.
 */
export const DynamicPaperBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Subtle pointer parallax updating CSS custom properties directly without React re-renders
    let rafId: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const isReducedMotion = () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onPointerMove = (e: PointerEvent) => {
      if (isReducedMotion()) return;
      targetX = ((e.clientX / window.innerWidth) * 2 - 1) * 14;
      targetY = ((e.clientY / window.innerHeight) * 2 - 1) * 14;
    };

    const updateParallax = () => {
      if (containerRef.current && !isReducedMotion()) {
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;
        containerRef.current.style.setProperty('--light-shift-x', `${currentX.toFixed(2)}px`);
        containerRef.current.style.setProperty('--light-shift-y', `${currentY.toFixed(2)}px`);
      }
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#f8f5ed]"
      style={{
        // Default zero shift before pointer moves
        ['--light-shift-x' as string]: '0px',
        ['--light-shift-y' as string]: '0px',
      }}
    >
      {/* 1. Base Warm Ivory & Cream Parchment Radial Gradient */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#fffefc] via-[#f7f3ea] to-[#eee5d3] opacity-95"
      />

      {/* 2. Slow Ambient Light & Desk Lamp Vignette Movement with Subtle Parallax */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[125vw] h-[125vh] rounded-full blur-3xl opacity-45 bg-[radial-gradient(circle_at_center,_rgba(255,249,235,0.85)_0%,_rgba(242,233,212,0.35)_40%,_transparent_72%)] animate-ambient-paper"
        style={{
          transform: 'translate(var(--light-shift-x), var(--light-shift-y))',
          transition: 'transform 0.1s ease-out',
        }}
      />
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[105vw] h-[105vh] rounded-full blur-3xl opacity-35 bg-[radial-gradient(circle_at_center,_rgba(238,225,200,0.65)_0%,_rgba(224,208,182,0.22)_50%,_transparent_75%)] animate-ambient-paper"
        style={{
          animationDirection: 'reverse',
          animationDuration: '38s',
          transform: 'translate(calc(var(--light-shift-x) * -0.6), calc(var(--light-shift-y) * -0.6))',
          transition: 'transform 0.1s ease-out',
        }}
      />

      {/* 3. Understated Technical Grid & Ruled Notebook Lines */}
      <div
        className="absolute inset-0 opacity-65"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(31, 48, 77, 0.04) 27px, rgba(31, 48, 77, 0.04) 28px),
            repeating-linear-gradient(to right, transparent, transparent 55px, rgba(31, 48, 77, 0.02) 55px, rgba(31, 48, 77, 0.02) 56px)
          `,
          backgroundSize: '56px 28px',
        }}
      />

      {/* 4. Notebook Margin Guideline: Restrained Rust-Red Ruled Margin Accent */}
      <div className="absolute top-0 bottom-0 left-6 sm:left-12 lg:left-16 w-px bg-[#b83a34] opacity-30" />
      <div className="absolute top-0 bottom-0 left-[26px] sm:left-[50px] lg:left-[66px] w-px bg-[#b83a34] opacity-15" />

      {/* Archival Technical Registration Crosshair Marks in Margins */}
      <div className="absolute top-8 left-6 sm:left-12 lg:left-16 -translate-x-1/2 w-3 h-3 flex items-center justify-center opacity-30 text-[#b83a34]">
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5">
          <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" />
          <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="absolute bottom-8 left-6 sm:left-12 lg:left-16 -translate-x-1/2 w-3 h-3 flex items-center justify-center opacity-30 text-[#b83a34]">
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5">
          <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" />
          <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      </div>

      {/* 5. Procedural Paper Grain (Cold-Pressed Vellum Texture) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.038] mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="archival-paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#archival-paper-grain)" />
      </svg>
    </div>
  );
};

