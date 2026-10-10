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
      <div className="w-full space-y-1 text-xs">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center justify-between font-ui uppercase tracking-wider text-[11px] font-bold text-black"
          >
            <span>
              {label}
              {requiredMark && <span className="text-[#e91d2a] ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-black pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full bg-white border border-black rounded-none px-3 py-1.5 text-black font-serif text-sm placeholder:text-neutral-500 transition-none focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:cursor-not-allowed ${
              error ? 'border-[#e91d2a] bg-[#d77a7a]/15 text-[#e91d2a]' : ''
            } ${leftIcon ? 'pl-8' : ''} ${rightIcon ? 'pr-8' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-2.5 text-black pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-[11px] font-ui font-bold text-[#e91d2a] flex items-center gap-1">
            <span>!</span>
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-[11px] text-neutral-600 font-serif">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
