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
      className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-[#ffffff] border border-[#e2dac9] shadow-sm text-xs font-mono-telemetry flex-wrap"
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
            className={`px-3 py-1.5 rounded transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-[#edf3fa] border border-[#ccdbeb] text-[#1f304d] font-bold shadow-sm'
                : 'text-[#647287] hover:text-[#161a22] hover:bg-[#f5efe4] border border-transparent'
            }`}
          >
            <span>{opt.label}</span>
            {typeof count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-[#dbeafe] text-[#1e40af]'
                    : 'bg-[#f5efe4] text-[#647287]'
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
