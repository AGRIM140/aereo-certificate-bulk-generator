import React from 'react';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { JobStatus, CertificateStatus } from '../../types/api';

export type BadgeStatus = JobStatus | CertificateStatus | 'INFO';

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  BadgeStatus,
  {
    bg: string;
    border: string;
    text: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    pulse?: boolean;
  }
> = {
  PENDING: {
    bg: 'bg-[#fffbeb]',
    border: 'border-[#f59e0b]/40',
    text: 'text-[#92400e]',
    label: 'PENDING',
    icon: Clock,
  },
  PROCESSING: {
    bg: 'bg-[#edf3fa]',
    border: 'border-[#3b82f6]/40',
    text: 'text-[#1e3a5f]',
    label: 'PROCESSING',
    icon: RefreshCw,
    pulse: true,
  },
  COMPLETED: {
    bg: 'bg-[#f0fdf4]',
    border: 'border-[#16a34a]/40',
    text: 'text-[#15803d]',
    label: 'COMPLETED',
    icon: CheckCircle2,
  },
  GENERATED: {
    bg: 'bg-[#f0fdf4]',
    border: 'border-[#16a34a]/40',
    text: 'text-[#15803d]',
    label: 'GENERATED',
    icon: CheckCircle2,
  },
  COMPLETED_WITH_ERRORS: {
    bg: 'bg-[#fff7ed]',
    border: 'border-[#ea580c]/40',
    text: 'text-[#c2410c]',
    label: 'COMPLETED W/ ERRORS',
    icon: AlertTriangle,
  },
  FAILED: {
    bg: 'bg-[#fef2f2]',
    border: 'border-[#b83a34]/40',
    text: 'text-[#b83a34]',
    label: 'FAILED',
    icon: XCircle,
  },
  INFO: {
    bg: 'bg-[#f5efe4]',
    border: 'border-[#dcd3c1]',
    text: 'text-[#334155]',
    label: 'INFO',
    icon: Clock,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const config = statusConfig[status] || statusConfig.INFO;
  const IconComponent = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      role="status"
      aria-label={`Status: ${displayLabel}`}
      className={`inline-flex items-center font-mono-telemetry font-semibold uppercase tracking-wider rounded border shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors ${config.bg} ${config.border} ${config.text} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <IconComponent
          className={`shrink-0 ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} ${
            config.pulse ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
