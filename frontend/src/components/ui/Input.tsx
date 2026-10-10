import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredMark?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      requiredMark = false,
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full space-y-1.5 text-xs">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center justify-between font-mono-telemetry uppercase tracking-wider text-[11px] font-semibold text-[#2b3545]"
          >
            <span>
              {label}
              {requiredMark && <span className="text-[#b83a34] ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#758295] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full bg-[#ffffff] border rounded-md px-3 py-2 text-[#161a22] placeholder:text-[#9aa5b6] transition-colors focus:outline-none focus:ring-1 ${
              error
                ? 'border-[#b83a34] focus:border-[#b83a34] focus:ring-[#b83a34]/30'
                : 'border-[#dcd3c1] focus:border-[#1f304d] focus:ring-[#1f304d]/30 hover:border-[#c5b9a4]'
            } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${
              disabled ? 'opacity-50 cursor-not-allowed bg-[#f5efe4]' : ''
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-[#758295] pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-[#b83a34] font-mono-telemetry text-[11px] mt-1">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-[#657388] text-[11px] mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
