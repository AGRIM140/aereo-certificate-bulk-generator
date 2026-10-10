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
    bg: 'bg-[#fcc20f]',
    border: 'border-black',
    text: 'text-black',
    label: 'PENDING',
    icon: Clock,
  },
  PROCESSING: {
    bg: 'bg-[#9ab6c8]',
    border: 'border-black',
    text: 'text-black',
    label: 'PROCESSING',
    icon: RefreshCw,
    pulse: true,
  },
  COMPLETED: {
    bg: 'bg-[#c0d4a7]',
    border: 'border-black',
    text: 'text-black',
    label: 'COMPLETED',
    icon: CheckCircle2,
  },
  GENERATED: {
    bg: 'bg-[#c0d4a7]',
    border: 'border-black',
    text: 'text-black',
    label: 'GENERATED',
    icon: CheckCircle2,
  },
  COMPLETED_WITH_ERRORS: {
    bg: 'bg-[#e6915d]',
    border: 'border-black',
    text: 'text-black',
    label: 'COMPLETED W/ ERRORS',
    icon: AlertTriangle,
  },
  FAILED: {
    bg: 'bg-[#d77a7a]',
    border: 'border-black',
    text: 'text-black',
    label: 'FAILED',
    icon: XCircle,
  },
  INFO: {
    bg: 'bg-[#a5b8c0]',
    border: 'border-black',
    text: 'text-black',
    label: 'INFO',
    icon: RefreshCw,
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
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
  }[size];

  return (
    <span
      role="status"
      aria-label={`Status: ${displayLabel}`}
      className={`inline-flex items-center font-ui font-bold uppercase tracking-wider border rounded-none shadow-[1px_1px_0px_#000000] select-none ${config.bg} ${config.border} ${config.text} ${sizeStyles} ${className}`}
    >
      {showIcon && (
        <Icon
          className={`shrink-0 ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${
            config.pulse ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
