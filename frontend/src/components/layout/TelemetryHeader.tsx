import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Phone } from 'lucide-react';

export const TelemetryHeader: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 border-b-2 border-black bg-black text-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
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
            High-Volume Vector Document Production & Archive Facility
          </p>
        </div>
      </Link>

      {/* Right Action & Phone Callout Anchor */}
      <div className="flex items-center gap-3 sm:gap-5 text-xs font-ui">
        {/* Dell 1996 Signature Red Phone Callout */}
        <div className="flex items-center gap-1.5 bg-black text-[#e91d2a] border border-[#e91d2a] px-2 py-0.5 font-bold tracking-wider text-[11px] sm:text-xs">
          <Phone className="w-3 h-3 text-[#e91d2a]" />
          <span>1-800-CERT-GEN</span>
        </div>

        {/* Engine status indicator & Clock */}
        <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-[10px] text-neutral-300 font-mono">
          <span className="w-2 h-2 bg-[#8e8a25]" />
          <span>ENGINE: RELEASE v1.0.0</span>
          {currentTime && <span className="text-neutral-500">| {currentTime}</span>}
        </div>

        {/* Yellow 'NEW BATCH' Tab Sticker */}
        <Link
          to="/jobs/new"
          className="dell-sticker-yellow px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-yellow-400"
        >
          <span className="bg-[#6a26a4] text-white px-1 text-[9px] font-bold">NEW</span>
          <span>DISPATCH</span>
        </Link>
      </div>
    </header>
  );
};
