import React from 'react';
import { LandingHeader } from '../components/landing/LandingHeader';
import { AtelierProductionExperience } from '../components/landing/AtelierProductionExperience';
import { LandingWorkflow } from '../components/landing/LandingWorkflow';
import { LandingSpecs } from '../components/landing/LandingSpecs';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#161a22] selection:bg-[#1f304d]/15 selection:text-[#161a22] overflow-x-clip relative z-10">
      {/* 1. Header Navigation */}
      <LandingHeader />

      {/* 2. Cinematic Scroll-Driven Certificate Production Experience */}
      <main className="flex-1">
        <AtelierProductionExperience />

        {/* 3. 4-Stage Architectural Workflow */}
        <LandingWorkflow />

        {/* 4. Core Archival Technical Specifications */}
        <div id="engine-specifications">
          <LandingSpecs />
        </div>

        {/* 5. Grand Archival Proclamation & Dispatch Callout */}
        <section className="py-16 lg:py-24 border-t border-[#e2dac9] bg-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative rounded-2xl bg-[#ffffff] border-2 border-[#e2dac9] p-8 sm:p-12 lg:p-16 shadow-lg overflow-hidden flex flex-col items-center text-center space-y-6">
              {/* Corner crosshair markers */}
              <div className="absolute top-3 left-3 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">+</div>
              <div className="absolute top-3 right-3 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">+</div>
              <div className="absolute bottom-3 left-3 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">+</div>
              <div className="absolute bottom-3 right-3 text-[#b8a892] text-xs font-mono-telemetry select-none pointer-events-none">+</div>

              {/* Archival Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbf9f4] border border-[#dcd3c1] text-[11px] font-mono-telemetry text-[#161a22]">
                <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
                <span className="font-semibold uppercase tracking-wider">PRODUCTION ATELIER // DISPATCH READY</span>
              </div>

              {/* Editorial Proclamation Title */}
              <div className="space-y-3 max-w-3xl">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#161a22] font-serif leading-[1.12]">
                  PREPARED FOR IMMEDIATE PRODUCTION DISPATCH.
                </h2>
                <p className="text-xs sm:text-base text-[#556377] font-sans leading-relaxed max-w-2xl mx-auto">
                  Configure certificate event parameters, customize template typography, and queue up to 500 recipient records with atomic fault isolation, sub-second vector PDF compilation, and zero-divergence 3D inspection.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <a
                  href="/jobs/new"
                  className="bg-[#1f304d] hover:bg-[#2d4263] text-white px-7 py-3.5 rounded-lg font-mono-telemetry text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                >
                  <span>Dispatch Production Batch</span>
                  <span className="text-[#c5a059]">→</span>
                </a>

                <a
                  href="/dashboard"
                  className="bg-[#fbf9f4] hover:bg-[#ede6d6] text-[#161a22] border border-[#dcd3c1] px-6 py-3.5 rounded-lg font-mono-telemetry text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <span>Open Operational Console</span>
                </a>
              </div>

              {/* Telemetry Seal Strip */}
              <div className="pt-6 border-t border-[#ece5d6] flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono-telemetry text-[#7d8b9e]">
                <span>AUTHORITY COMMIT: cf5bb3d</span>
                <span>•</span>
                <span>REPORTLAB 4.x VECTOR COMPILER</span>
                <span>•</span>
                <span className="text-[#15803d] font-bold">100% FAULT ISOLATION</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Telemetry Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
