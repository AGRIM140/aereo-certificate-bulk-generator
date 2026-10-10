import React from 'react';

export interface ProgressBarProps {
  percent: number;
  label?: string;
  isProcessing?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  label,
  isProcessing = false,
  className = '',
  size = 'md',
  showPercentText = true,
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const roundedPercent = clampedPercent.toFixed(1);

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentText) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-mono-telemetry text-[#2b3545]">
          {label && <span className="font-medium">{label}</span>}
          {showPercentText && (
            <span className="font-bold text-[#166534] ml-auto">
              {roundedPercent}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${roundedPercent}%`}
        className={`w-full bg-[#ede5d4] rounded-full overflow-hidden border border-[#dcd3c1] shadow-inner ${heightClasses}`}
      >
        <div
          className={`h-full bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#22c55e] transition-all duration-300 ease-out rounded-full relative ${
            isProcessing ? 'after:absolute after:inset-0 after:bg-white/30 after:animate-pulse' : ''
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
};
