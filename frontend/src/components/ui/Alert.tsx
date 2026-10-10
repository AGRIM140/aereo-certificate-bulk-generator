import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ApiErrorEnvelope } from '../../types/api';
import { ApiClientError } from '../../api/client';

export interface AlertProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message?: string;
  error?: ApiErrorEnvelope | ApiClientError | Error | string | null;
  className?: string;
  onDismiss?: () => void;
  onClose?: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  message,
  error,
  className = '',
  onDismiss,
  onClose,
  action,
  children,
}) => {
  const handleDismiss = onDismiss || onClose;
  if (!message && !error && !title && !children) return null;

  let displayTitle = title;
  let displayMessage = message;
  let displayDetails: Record<string, unknown> | null = null;

  if (error) {
    if (error instanceof ApiClientError) {
      displayMessage = displayMessage || error.message;
      displayDetails = error.details;
      if (!displayTitle) displayTitle = `API Error [${error.code}]`;
    } else if (typeof error === 'object' && 'error' in error) {
      const envelope = error as ApiErrorEnvelope;
      displayMessage = displayMessage || envelope.error.message;
      displayDetails = (envelope.error.details as Record<string, unknown>) || null;
      if (!displayTitle) displayTitle = `API Error [${envelope.error.code}]`;
    } else if (error instanceof Error) {
      displayMessage = displayMessage || error.message;
      if (!displayTitle) displayTitle = 'Error';
    } else if (typeof error === 'string') {
      displayMessage = displayMessage || error;
      if (!displayTitle) displayTitle = 'Notice';
    }
  }

  const styles = {
    error: {
      bg: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]',
      icon: AlertCircle,
      iconColor: 'text-[#b83a34]',
      detailBorder: 'border-[#fca5a5]',
      detailText: 'text-[#991b1b]',
    },
    warning: {
      bg: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]',
      icon: AlertTriangle,
      iconColor: 'text-[#d97706]',
      detailBorder: 'border-[#fcd34d]',
      detailText: 'text-[#92400e]',
    },
    info: {
      bg: 'bg-[#edf3fa] border-[#ccdbeb] text-[#1e3a5f]',
      icon: Info,
      iconColor: 'text-[#2563eb]',
      detailBorder: 'border-[#bfdbfe]',
      detailText: 'text-[#1e3a5f]',
    },
    success: {
      bg: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]',
      icon: CheckCircle2,
      iconColor: 'text-[#16a34a]',
      detailBorder: 'border-[#86efac]',
      detailText: 'text-[#166534]',
    },
  }[variant];

  const IconComponent = styles.icon;

  return (
    <div
      role="alert"
      className={`rounded-md border p-3.5 text-xs font-sans shadow-sm ${styles.bg} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
        <div className="flex-1 space-y-1">
          {displayTitle && (
            <div className="font-semibold tracking-wide uppercase font-mono-telemetry">
              {displayTitle}
            </div>
          )}
          {displayMessage && <p className="leading-relaxed">{displayMessage}</p>}
          {children && <div className="leading-relaxed">{children}</div>}
          {displayDetails && Object.keys(displayDetails).length > 0 && (
            <div className={`mt-2 pt-2 border-t ${styles.detailBorder} space-y-1`}>
              {Object.entries(displayDetails).map(([key, value]) => (
                <div key={key} className={`font-mono-telemetry text-[11px] ${styles.detailText}`}>
                  <span className="font-semibold">{key}: </span>
                  <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                </div>
              ))}
            </div>
          )}
          {action && <div className="mt-2.5 pt-2 border-t border-current/10">{action}</div>}
        </div>
        {handleDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className="text-inherit opacity-60 hover:opacity-100 p-1 text-sm font-bold transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
