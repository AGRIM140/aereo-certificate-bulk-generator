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
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentText) && (
        <div className="flex justify-between items-center mb-1 text-xs font-ui uppercase font-bold text-black">
          {label && <span>{label}</span>}
          {showPercentText && (
            <span className="font-bold text-black ml-auto">
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
        className={`w-full bg-[#dfdfdf] rounded-none overflow-hidden border border-black ${heightClasses}`}
      >
        <div
          className={`h-full bg-black transition-none rounded-none relative ${
            isProcessing ? 'bg-[#8e8a25]' : 'bg-black'
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
};
