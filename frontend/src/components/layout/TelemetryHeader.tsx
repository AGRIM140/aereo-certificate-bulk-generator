import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Terminal } from 'lucide-react';

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
    <header className="h-14 border-b border-[#e2dac9] bg-[#ffffff]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(35,25,15,0.03)]">
      <Link
        to="/"
        className="flex items-center gap-3 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f304d] rounded p-1"
      >
        <div className="w-7 h-7 rounded bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#15803d]">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-telemetry text-xs font-bold tracking-wider text-[#161a22]">
              ARCHIVAL TELEMETRY
            </span>
            <span className="text-[10px] font-mono-telemetry px-1.5 py-0.2 rounded bg-[#f5efe4] text-[#4b5563] border border-[#dcd3c1] font-medium">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-[#657388] tracking-tight">
            High-Volume Document & Certificate Generation
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-4 text-xs font-mono-telemetry">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#fbf9f4] border border-[#e2dac9] text-[#2d3748]">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-[#647287]">ENGINE:</span>
          <span className="text-[#15803d] font-semibold">cf5bb3d (POSTGRESQL + CELERY)</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fbf9f4] border border-[#e2dac9] text-[#4a5568]">
          <Activity className="w-3.5 h-3.5 text-[#1f304d]" />
          <span>{currentTime || 'SYNCHRONIZING...'}</span>
        </div>
      </div>
    </header>
  );
};
