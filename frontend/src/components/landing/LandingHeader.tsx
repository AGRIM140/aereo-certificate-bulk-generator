import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, PlusCircle, LayoutDashboard, History, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#e2dac9] bg-[#ffffff]/92 backdrop-blur-md sticky top-0 z-40 select-none shadow-[0_1px_3px_rgba(35,25,15,0.03)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f304d] rounded p-1"
        >
          <div className="w-8 h-8 rounded bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#15803d] group-hover:border-[#86efac] transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-telemetry text-sm font-bold tracking-wider text-[#161a22] group-hover:text-[#1f304d] transition-colors">
                ARCHIVAL TELEMETRY
              </span>
              <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-[#f5efe4] text-[#4b5563] border border-[#dcd3c1] font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-[#657388] tracking-tight hidden sm:block">
              High-Volume Document & Certificate Generation
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono-telemetry" aria-label="Main Navigation">
          <Link
            to="/dashboard"
            className="text-[#4b586c] hover:text-[#161a22] flex items-center gap-1.5 transition-colors font-medium"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#7d8b9e]" />
            <span>Operational Console</span>
          </Link>

          <Link
            to="/jobs"
            className="text-[#4b586c] hover:text-[#161a22] flex items-center gap-1.5 transition-colors font-medium"
          >
            <History className="w-3.5 h-3.5 text-[#7d8b9e]" />
            <span>Job Ledger</span>
          </Link>

          <div className="h-4 w-px bg-[#e2dac9]" />

          {/* Engine Status Tag */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-[#fbf9f4] border border-[#e2dac9] text-[11px] text-[#2d3748]">
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
            <span className="text-[#7d8b9e]">ENGINE:</span>
            <span className="text-[#15803d] font-semibold">cf5bb3d (POSTGRESQL + CELERY)</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/jobs/new')}
            className="text-xs font-mono-telemetry shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Initialize Batch
          </Button>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/jobs/new')}
            className="text-xs font-mono-telemetry"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Batch
          </Button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded border border-[#dcd3c1] bg-[#ffffff] text-[#2d3748] hover:text-[#161a22]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e2dac9] bg-[#ffffff] px-6 py-4 space-y-3 font-mono-telemetry text-xs shadow-lg">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f5efe4] text-[#2d3748]"
          >
            <LayoutDashboard className="w-4 h-4 text-[#15803d]" />
            <span>Operational Console</span>
          </Link>

          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f5efe4] text-[#2d3748]"
          >
            <History className="w-4 h-4 text-[#1f304d]" />
            <span>Job Ledger & Archive</span>
          </Link>

          <Link
            to="/jobs/new"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f5efe4] text-[#2d3748]"
          >
            <PlusCircle className="w-4 h-4 text-[#15803d]" />
            <span>Initialize Certificate Batch</span>
          </Link>

          <div className="pt-2 border-t border-[#e2dac9] flex items-center justify-between text-[11px] text-[#647287]">
            <span>ENGINE:</span>
            <span className="text-[#15803d] font-semibold">cf5bb3d (CELERY + REDIS)</span>
          </div>
        </div>
      )}
    </header>
  );
};
