import React from 'react';

/**
 * Dell 1996 Inspired Canvas Background
 * A clean, period-accurate white catalog canvas with subtle structural guides.
 * Zero blurry ambient blobs or heavy gradients.
 */
export const DynamicPaperBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-white"
    >
      {/* 1. Pure White Surface Base */}
      <div className="absolute inset-0 bg-[#ffffff]" />

      {/* 2. Authentic Catalog Structural Ledger Lines (faint 24px vertical / horizontal rule) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
