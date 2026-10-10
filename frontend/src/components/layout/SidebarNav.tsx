import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Globe, Layers } from 'lucide-react';

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
    <aside className="w-60 border-r-2 border-black bg-white p-3 flex flex-col justify-between shrink-0 select-none">
      <div className="space-y-4">
        {/* Ribbon Header Eyebrow in Tint Steel */}
        <div className="bg-[#a5b8c0] border border-black p-2 text-center">
          <div className="font-ui font-black text-xs uppercase tracking-wider text-black">
            OPERATIONAL CONSOLE
          </div>
          <div className="text-[10px] font-serif text-black">
            System Menu & Navigation
          </div>
        </div>

        {/* Navigation Item Stack */}
        <nav className="space-y-1.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-ui uppercase font-bold tracking-wider transition-none border ${
                    isActive
                      ? 'bg-black text-white border-black border-l-4 border-l-[#e91d2a]'
                      : 'bg-white text-black border-black hover:bg-[#b3bd95]/30'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Specifications Ribbon Card (Tint Sky) */}
        <div className="border border-black bg-[#9ab6c8]">
          <div className="bg-white border-b border-black px-2.5 py-1 text-[11px] font-ui font-bold uppercase text-black flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#e91d2a]" />
            <span>ATELIER SPECS</span>
          </div>
          <div className="p-2.5 text-xs font-serif text-black leading-relaxed">
            ReportLab vector compilation. Max 500 recipients per batch with atomic fault isolation.
          </div>
        </div>
      </div>

      {/* Authority Pipeline Ribbon (Tint Lime) */}
      <div className="border border-black bg-[#c0d4a7] p-2 space-y-1 text-[10px] font-ui uppercase font-bold">
        <div className="flex justify-between items-center text-black">
          <span>PIPELINE:</span>
          <span>REPORTLAB → 3D</span>
        </div>
        <div className="flex justify-between items-center text-black">
          <span>INTEGRITY:</span>
          <span className="bg-black text-white px-1">100% FAULT ISOLATION</span>
        </div>
      </div>
    </aside>
  );
};
