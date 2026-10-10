import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Home, Search, ShoppingCart, HelpCircle } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t-2 border-black bg-white py-8 px-4 sm:px-6 text-black select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Brand Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#e91d2a] border border-black flex items-center justify-center text-white">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-ui text-xs font-bold uppercase tracking-wider text-black">
              ARCHIVAL TELEMETRY // BULK CERTIFICATE GENERATOR
            </span>
          </div>
          <p className="text-xs font-serif text-black">
            High-volume document generation, asynchronous queuing, and zero-divergence 3D inspection.
          </p>
        </div>

        {/* Authentic Dell 1996 4-Icon Catalog Navigation linked by Green Rule */}
        <div className="pt-2">
          <div className="border-t-2 border-[#8e8a25] pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-10 text-xs font-ui">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-black hover:opacity-80 font-bold uppercase tracking-wide group"
            >
              <div className="w-7 h-7 bg-neutral-100 border border-black flex items-center justify-center text-black group-hover:bg-[#fcc20f]">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="text-[#0000ee] underline font-serif text-sm">HOME</span>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-black hover:opacity-80 font-bold uppercase tracking-wide group"
            >
              <div className="w-7 h-7 bg-neutral-100 border border-black flex items-center justify-center text-black group-hover:bg-[#fcc20f]">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <span className="text-[#0000ee] underline font-serif text-sm">Operational Console</span>
            </Link>

            <Link
              to="/jobs"
              className="flex items-center gap-1.5 text-black hover:opacity-80 font-bold uppercase tracking-wide group"
            >
              <div className="w-7 h-7 bg-neutral-100 border border-black flex items-center justify-center text-black group-hover:bg-[#fcc20f]">
                <Search className="w-3.5 h-3.5" />
              </div>
              <span className="text-[#0000ee] underline font-serif text-sm">Job Ledger & Archive</span>
            </Link>

            <Link
              to="/jobs/new"
              className="flex items-center gap-1.5 text-black hover:opacity-80 font-bold uppercase tracking-wide group"
            >
              <div className="w-7 h-7 bg-[#e91d2a] border border-black flex items-center justify-center text-white group-hover:bg-[#c81924]">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[#0000ee] underline font-serif text-sm">Initialize Batch</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Authority & Infrastructure Strip */}
        <div className="pt-4 border-t border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-mono text-black">
          <div>
            <span>PRODUCTION ENGINE: </span>
            <span className="bg-[#c0d4a7] text-black px-1.5 py-0.2 font-bold border border-black">RELEASE v1.0.0 (STABLE)</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span>PIPELINE: REPORTLAB + CELERY</span>
            <span>|</span>
            <span>STORAGE: POSTGRESQL + LOCAL MEDIA</span>
            <span>|</span>
            <span className="bg-black text-white px-1.5 py-0.2 font-ui font-bold uppercase text-[10px]">ZERO DIVERGENCE</span>
          </div>
        </div>

        {/* Classic Dell 1996 Copyright Small Print */}
        <div className="pt-2 text-[11px] font-serif text-black border-t border-neutral-300 flex flex-col sm:flex-row justify-between gap-2">
          <span>This site is best viewed with browser versions 3.0 and higher at 800x600 resolution.</span>
          <span>© 1996-2026 BULK CERTIFICATE CORPORATION. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
