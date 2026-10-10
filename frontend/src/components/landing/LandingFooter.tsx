import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowUpRight } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#e2dac9] bg-[#ffffff]/92 backdrop-blur-sm py-12 text-[#647287] select-none shadow-[0_-1px_3px_rgba(35,25,15,0.02)]">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#15803d]">
                <Terminal className="w-3 h-3" />
              </div>
              <span className="font-mono-telemetry text-xs font-bold text-[#161a22]">
                ARCHIVAL TELEMETRY // BULK CERTIFICATE GENERATOR
              </span>
            </div>
            <p className="text-xs text-[#647287] font-mono-telemetry">
              High-volume document generation, asynchronous queuing, and zero-divergence 3D inspection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono-telemetry">
            <Link
              to="/dashboard"
              className="text-[#4b586c] hover:text-[#161a22] flex items-center gap-1 transition-colors font-medium"
            >
              <span>Operational Console</span>
              <ArrowUpRight className="w-3 h-3 text-[#7d8b9e]" />
            </Link>

            <Link
              to="/jobs"
              className="text-[#4b586c] hover:text-[#161a22] flex items-center gap-1 transition-colors font-medium"
            >
              <span>Job Ledger & Archive</span>
              <ArrowUpRight className="w-3 h-3 text-[#7d8b9e]" />
            </Link>

            <Link
              to="/jobs/new"
              className="text-[#4b586c] hover:text-[#161a22] flex items-center gap-1 transition-colors font-medium"
            >
              <span>Initialize Batch</span>
              <ArrowUpRight className="w-3 h-3 text-[#7d8b9e]" />
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-[#ece5d6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] font-mono-telemetry text-[#7d8b9e]">
          <div>
            <span>SOURCE COMMIT: </span>
            <span className="text-[#15803d] font-bold">cf5bb3d (FROZEN BACKEND)</span>
          </div>

          <div className="flex items-center gap-4">
            <span>PIPELINE: REPORTLAB + CELERY</span>
            <span className="text-[#dcd3c1]">|</span>
            <span>STORAGE: POSTGRESQL + LOCAL MEDIA</span>
            <span className="text-[#dcd3c1]">|</span>
            <span className="text-[#15803d] font-bold">ZERO DIVERGENCE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
