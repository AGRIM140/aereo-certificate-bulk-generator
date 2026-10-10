import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
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
      bg: 'bg-[#d77a7a] border-black text-black',
      icon: AlertCircle,
      iconColor: 'text-black',
      detailBorder: 'border-black',
      detailText: 'text-black',
    },
    warning: {
      bg: 'bg-[#fcc20f] border-black text-black',
      icon: AlertTriangle,
      iconColor: 'text-black',
      detailBorder: 'border-black',
      detailText: 'text-black',
    },
    info: {
      bg: 'bg-[#9ab6c8] border-black text-black',
      icon: Info,
      iconColor: 'text-black',
      detailBorder: 'border-black',
      detailText: 'text-black',
    },
    success: {
      bg: 'bg-[#c0d4a7] border-black text-black',
      icon: CheckCircle2,
      iconColor: 'text-black',
      detailBorder: 'border-black',
      detailText: 'text-black',
    },
  }[variant];

  const IconComponent = styles.icon;

  return (
    <div
      role="alert"
      className={`border border-black p-3 rounded-none shadow-[2px_2px_0px_#000000] flex gap-3 text-xs ${styles.bg} ${className}`}
    >
      <div className="shrink-0 mt-0.5">
        <IconComponent className={`w-4 h-4 ${styles.iconColor}`} aria-hidden="true" />
      </div>

      <div className="flex-1 space-y-1">
        {displayTitle && (
          <h4 className="font-ui font-bold uppercase tracking-wider text-xs text-black">
            {displayTitle}
          </h4>
        )}

        {displayMessage && (
          <p className="font-serif text-xs text-black leading-relaxed">
            {displayMessage}
          </p>
        )}

        {children && (
          <div className="font-serif text-xs text-black">
            {children}
          </div>
        )}

        {displayDetails && Object.keys(displayDetails).length > 0 && (
          <div className={`mt-2 pt-2 border-t border-black font-mono text-[11px] space-y-0.5`}>
            {Object.entries(displayDetails).map(([key, val]) => (
              <div key={key} className="flex gap-2">
                <span className="font-bold text-black uppercase">{key}:</span>
                <span className="text-black">{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        {action && <div className="mt-2">{action}</div>}
      </div>

      {handleDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 p-1 text-black hover:bg-black hover:text-white transition-none border border-black h-fit"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
