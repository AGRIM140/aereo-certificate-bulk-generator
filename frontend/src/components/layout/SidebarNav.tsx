import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Layers, Globe } from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Archive Overview', to: '/', icon: Globe },
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Initialize Batch', to: '/jobs/new', icon: PlusCircle },
  { name: 'Job History', to: '/jobs', icon: History },
];

export const SidebarNav: React.FC = () => {
  return (
    <aside className="w-56 border-r border-[#e2dac9] bg-[#fcfaf4]/90 backdrop-blur-[2px] p-4 flex flex-col justify-between shrink-0 select-none relative">
      {/* Notebook margin ruler guide */}
      <div className="absolute top-0 bottom-0 left-3.5 w-px bg-[#b83a34] opacity-20 pointer-events-none" />

      <div className="space-y-6 relative z-10 pl-2">
        <div className="px-1 py-1">
          <div className="text-[10px] font-mono-telemetry uppercase tracking-wider text-[#717e91] font-bold mb-2.5">
            OPERATIONAL CONSOLE
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#ffffff] text-[#1f304d] border border-[#cfc4af] shadow-[0_1px_3px_rgba(30,20,10,0.06)] font-semibold'
                        : 'text-[#4b586c] hover:text-[#161a22] hover:bg-[#f3ece0]/70'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#1f304d]" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="px-3 py-2.5 bg-[#ffffff] border border-[#e2dac9] rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono-telemetry text-[#1f304d] font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-[#1f304d]" />
            <span>SPECIFICATIONS</span>
          </div>
          <p className="text-[11px] text-[#556377] leading-relaxed">
            Fixed template overlay with ReportLab. Maximum 500 recipients per batch.
          </p>
        </div>
      </div>

      <div className="p-3 bg-[#f7f3ea] border border-[#ded5c2] rounded text-[10px] font-mono-telemetry text-[#647287] space-y-1 relative z-10">
        <div className="flex justify-between">
          <span>PIPELINE:</span>
          <span className="text-[#2d3748] font-medium">PDF → CANVAS → 3D</span>
        </div>
        <div className="flex justify-between">
          <span>INTEGRITY:</span>
          <span className="text-[#15803d] font-bold">ZERO DIVERGENCE</span>
        </div>
      </div>
    </aside>
  );
};
