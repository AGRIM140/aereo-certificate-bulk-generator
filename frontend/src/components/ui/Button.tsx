import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm border border-emerald-700/80 active:translate-y-px',
  secondary:
    'bg-[#ffffff] hover:bg-[#fbf8f2] text-[#1e2633] border border-[#dcd3c1] shadow-[0_1px_2px_rgba(30,20,10,0.04)] hover:border-[#c5b9a4] active:translate-y-px',
  outline:
    'bg-transparent hover:bg-[#f5eee2]/70 text-[#2d3748] border border-[#dcd3c1] active:translate-y-px',
  ghost:
    'bg-transparent hover:bg-[#ece3d4]/60 text-[#3b4759] border border-transparent',
  danger:
    'bg-[#fef2f2] hover:bg-[#fee2e2] text-[#b83a34] border border-[#b83a34]/40 shadow-sm active:translate-y-px',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded',
  md: 'px-3.5 py-1.5 text-sm gap-2 rounded-md',
  lg: 'px-5 py-2.5 text-base gap-2.5 rounded-md',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f304d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f3eb] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
