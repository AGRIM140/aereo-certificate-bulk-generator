import React from 'react';
import type { CertificateStatus } from '../../types/api';

export type FilterStatus = 'ALL' | CertificateStatus;

interface CertificateStatusFilterProps {
  activeStatus: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  counts?: {
    total?: number;
    generated?: number;
    pending?: number;
    failed?: number;
  };
  disabled?: boolean;
}

const filterOptions: Array<{
  value: FilterStatus;
  label: string;
  getCountKey: 'total' | 'generated' | 'pending' | 'failed';
}> = [
  { value: 'ALL', label: 'ALL', getCountKey: 'total' },
  { value: 'GENERATED', label: 'GENERATED', getCountKey: 'generated' },
  { value: 'PENDING', label: 'PENDING', getCountKey: 'pending' },
  { value: 'FAILED', label: 'FAILED', getCountKey: 'failed' },
];

export const CertificateStatusFilter: React.FC<CertificateStatusFilterProps> = ({
  activeStatus,
  onStatusChange,
  counts,
  disabled = false,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Filter certificates by generation status"
      className="inline-flex items-center gap-1 p-1 bg-white border border-black shadow-[1px_1px_0px_#000000] text-xs flex-wrap"
    >
      {filterOptions.map((opt) => {
        const isActive = activeStatus === opt.value;
        const count = counts ? counts[opt.getCountKey] : undefined;

        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onStatusChange(opt.value)}
            className={`px-3 py-1 font-ui font-bold uppercase tracking-wider text-xs transition-none flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border ${
              isActive
                ? 'bg-[#fcc20f] border-black text-black shadow-[1px_1px_0px_#000000]'
                : 'bg-white hover:bg-[#b3bd95]/20 text-black border-transparent'
            }`}
          >
            <span>{opt.label}</span>
            {typeof count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 border border-black font-mono font-bold ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-black'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
