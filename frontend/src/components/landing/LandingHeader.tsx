import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, PlusCircle, LayoutDashboard, History, Menu, X, Phone } from 'lucide-react';
import { Button } from '../ui/Button';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b-2 border-black bg-black text-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand Identity / Top Banner Headline */}
      <Link
        to="/"
        className="flex items-center gap-3 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white p-1"
      >
        <div className="w-7 h-7 bg-[#e91d2a] border border-white flex items-center justify-center text-white">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-ui font-bold text-xs tracking-wider text-white uppercase">
              ARCHIVAL TELEMETRY
            </span>
            <span className="text-[10px] font-ui font-bold px-1.5 py-0.2 bg-[#fcc20f] text-black border border-black">
              1996 v1.0
            </span>
          </div>
          <p className="text-[10px] font-serif text-neutral-300 tracking-tight hidden sm:block">
            High-Volume Document & Certificate Generation
          </p>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-5 text-xs font-ui" aria-label="Main Navigation">
        <Link
          to="/dashboard"
          className="text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors font-bold uppercase tracking-wide"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400" />
          <span>Operational Console</span>
        </Link>

        <Link
          to="/jobs"
          className="text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors font-bold uppercase tracking-wide"
        >
          <History className="w-3.5 h-3.5 text-neutral-400" />
          <span>Job Ledger</span>
        </Link>

        <div className="h-4 w-px bg-neutral-700" />

        {/* Dell 1996 Signature Red Phone Callout */}
        <div className="flex items-center gap-1.5 bg-black text-[#e91d2a] border border-[#e91d2a] px-2 py-0.5 font-bold tracking-wider text-[11px]">
          <Phone className="w-3 h-3 text-[#e91d2a]" />
          <span>1-800-CERT-GEN</span>
        </div>

        {/* Engine Status Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-[10px] text-neutral-300 font-mono">
          <span className="w-2 h-2 bg-[#8e8a25]" />
          <span className="text-neutral-400">ENGINE:</span>
          <span className="text-emerald-400 font-semibold">RELEASE v1.0.0 (POSTGRESQL + CELERY)</span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/jobs/new')}
          className="dell-sticker-yellow text-black border border-black font-ui text-xs font-bold uppercase tracking-wider shadow-none hover:bg-yellow-400 rounded-none cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-1" />
          Initialize Batch
        </Button>
      </nav>

      {/* Mobile Hamburger Toggle */}
      <div className="flex md:hidden items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/jobs/new')}
          className="dell-sticker-yellow text-black border border-black text-xs font-ui font-bold uppercase rounded-none cursor-pointer px-2 py-1"
        >
          <PlusCircle className="w-3 h-3 mr-1" />
          Batch
        </Button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 border border-white bg-black text-white hover:bg-neutral-800 rounded-none cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 md:hidden border-b-2 border-black bg-black text-white px-6 py-4 space-y-3 font-ui text-xs shadow-2xl z-50">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 border border-neutral-800 hover:bg-neutral-900 text-white font-bold uppercase tracking-wider"
          >
            <LayoutDashboard className="w-4 h-4 text-[#e91d2a]" />
            <span>Operational Console</span>
          </Link>

          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 border border-neutral-800 hover:bg-neutral-900 text-white font-bold uppercase tracking-wider"
          >
            <History className="w-4 h-4 text-[#fcc20f]" />
            <span>Job Ledger & Archive</span>
          </Link>

          <Link
            to="/jobs/new"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 border border-neutral-800 bg-[#fcc20f] text-black font-bold uppercase tracking-wider"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Initialize Certificate Batch</span>
          </Link>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>ENGINE:</span>
            <span className="text-emerald-400 font-semibold">RELEASE v1.0.0 (CELERY + REDIS)</span>
          </div>
        </div>
      )}
    </header>
  );
};
