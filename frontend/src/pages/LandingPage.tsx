import React from 'react';
import { LandingHeader } from '../components/landing/LandingHeader';
import { AtelierProductionExperience } from '../components/landing/AtelierProductionExperience';
import { LandingWorkflow } from '../components/landing/LandingWorkflow';
import { LandingSpecs } from '../components/landing/LandingSpecs';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="dell-page-frame flex flex-col text-black selection:bg-black selection:text-white overflow-x-clip relative z-10">
      {/* 1. Classic Dell Top Banner Header */}
      <LandingHeader />

      {/* 2. Cinematic Scroll-Driven Certificate Production Experience */}
      <main className="flex-1 bg-white">
        <AtelierProductionExperience />

        {/* 3. 4-Stage Architectural Workflow */}
        <LandingWorkflow />

        {/* 4. Core Archival Technical Specifications */}
        <div id="engine-specifications">
          <LandingSpecs />
        </div>

        {/* 5. Dell 1996 Catalog Proclamation & Dispatch Callout */}
        <section className="py-12 lg:py-16 border-t-2 border-black bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="relative rounded-none bg-white border-2 border-black p-6 sm:p-10 lg:p-12 shadow-[6px_6px_0px_#000] overflow-hidden flex flex-col items-center text-center space-y-6">
              {/* Ribbon Header Strip */}
              <div className="w-full bg-[#a5b8c0] border-b-2 border-black -mt-6 sm:-mt-10 lg:-mt-12 -mx-6 sm:-mx-10 lg:-mx-12 px-6 py-2.5 flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#e91d2a]" />
                  <span className="font-ui font-bold text-xs uppercase tracking-wider text-black">
                    OFFICIAL DISPATCH AUTHORIZATION // CATALOG BULLETIN
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-800 hidden sm:inline">
                  ORDER DIRECT: 1-800-CERT-GEN
                </span>
              </div>

              {/* Archival Badge / Yellow Sticker */}
              <div className="dell-sticker-yellow px-3 py-1 text-xs font-ui font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#000]">
                <span className="bg-[#6a26a4] text-white px-1.5 py-0.2 text-[10px] font-bold">1996</span>
                <span>PRODUCTION ATELIER // DISPATCH READY</span>
              </div>

              {/* Editorial Proclamation Title */}
              <div className="space-y-3 max-w-3xl">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display-dell font-black tracking-tight text-black leading-[1.05] uppercase">
                  PREPARED FOR IMMEDIATE PRODUCTION DISPATCH.
                </h2>
                <p className="text-sm sm:text-base text-black font-serif leading-relaxed max-w-2xl mx-auto">
                  Configure certificate event parameters, customize template typography, and queue up to 500 recipient records with atomic fault isolation, sub-second vector PDF compilation, and zero-divergence 3D inspection.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <a
                  href="/jobs/new"
                  className="bg-[#e91d2a] hover:bg-[#c81924] text-white px-8 py-3.5 border-2 border-black font-ui text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  <span>Dispatch Production Batch</span>
                  <span>→</span>
                </a>

                <a
                  href="/dashboard"
                  className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-7 py-3.5 font-ui text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  <span>Open Operational Console</span>
                </a>
              </div>

              {/* Telemetry Seal Strip */}
              <div className="pt-4 border-t border-black w-full flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono text-black">
                <span>PRODUCTION RELEASE: <strong>v1.0.0</strong></span>
                <span>•</span>
                <span>REPORTLAB 4.x VECTOR COMPILER</span>
                <span>•</span>
                <span className="bg-[#c0d4a7] text-black px-1.5 py-0.5 font-bold border border-black">100% FAULT ISOLATION</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Authentic Dell 1996 Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
