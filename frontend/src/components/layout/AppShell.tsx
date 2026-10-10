import React from 'react';
import { Outlet } from 'react-router-dom';
import { TelemetryHeader } from './TelemetryHeader';
import { SidebarNav } from './SidebarNav';

export const AppShell: React.FC = () => {
  return (
    <div className="dell-page-frame flex flex-col text-black relative z-10 selection:bg-black selection:text-white">
      {/* 1. Classic Dell Top Banner */}
      <TelemetryHeader />

      {/* 2. Main 2-Column Application Layout */}
      <div className="flex-1 flex overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. Authentic Dell 1996 Footer Band */}
      <footer className="border-t border-black bg-white px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-serif text-black select-none gap-2">
        <div className="flex items-center gap-3">
          <span className="font-ui font-bold uppercase text-[10px] bg-black text-white px-1.5 py-0.5">
            AUTHENTIC STATE
          </span>
          <span>Production Release <strong className="font-mono">v1.0.0</strong> (PostgreSQL + Celery)</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>This site is best viewed with browser versions 3.0 and higher.</span>
          <span className="text-black font-ui font-bold uppercase text-[10px]">
            © 1996-2026 BULK CERTIFICATE CORPORATION
          </span>
        </div>
      </footer>
    </div>
  );
};
