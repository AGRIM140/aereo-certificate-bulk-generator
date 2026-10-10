import React from 'react';
import { Outlet } from 'react-router-dom';
import { TelemetryHeader } from './TelemetryHeader';
import { SidebarNav } from './SidebarNav';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#161a22] relative z-10">
      <TelemetryHeader />
      <div className="flex-1 flex overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-transparent">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
      <footer className="h-8 border-t border-[#e2dac9] bg-[#ffffff]/85 backdrop-blur-sm px-6 flex items-center justify-between text-[11px] font-mono-telemetry text-[#647287] select-none shadow-[0_-1px_2px_rgba(35,25,15,0.02)]">
        <div>
          <span>SESSION: </span>
          <span className="text-[#2d3748] font-medium">AUTHORITATIVE POSTGRESQL STATE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>SOURCE COMMIT: cf5bb3d</span>
          <span>REPORTLAB RASTER: 1468×1071</span>
        </div>
      </footer>
    </div>
  );
};
