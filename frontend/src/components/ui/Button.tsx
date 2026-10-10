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
    'bg-black bg-emerald-600 hover:bg-neutral-800 text-white font-ui font-bold uppercase tracking-wider border border-black active:translate-y-px rounded-none',
  secondary:
    'bg-white hover:bg-neutral-100 text-black font-ui font-bold uppercase tracking-wider border border-black active:translate-y-px rounded-none shadow-[1px_1px_0px_#000000]',
  outline:
    'bg-transparent hover:bg-neutral-100 text-black font-ui font-bold uppercase tracking-wider border border-black active:translate-y-px rounded-none',
  ghost:
    'bg-transparent hover:bg-neutral-200 text-black font-ui font-bold uppercase tracking-wider border border-transparent rounded-none',
  danger:
    'bg-[#e91d2a] hover:bg-red-700 text-white font-ui font-bold uppercase tracking-wider border border-black active:translate-y-px rounded-none shadow-[1px_1px_0px_#000000]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-4 py-1.5 text-xs gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2.5',
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
        className={`inline-flex items-center justify-center transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
