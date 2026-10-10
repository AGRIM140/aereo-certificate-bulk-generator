import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  const bgStyles = {
    default: 'bg-[#ffffff] border-[#e2dac9] shadow-[0_1px_3px_rgba(35,25,15,0.04)]',
    elevated: 'bg-[#ffffff] border-[#ded4c1] shadow-[0_4px_16px_-2px_rgba(35,25,15,0.07),_0_2px_4px_rgba(35,25,15,0.03)]',
    subtle: 'bg-[#f9f5ec]/90 border-[#e6dece]',
  }[variant];

  const interactiveStyles = interactive
    ? 'hover:border-[#c5b9a4] hover:shadow-[0_6px_20px_-2px_rgba(35,25,15,0.09)] transition-all duration-150 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-lg border text-[#161a22] ${bgStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-5 py-4 border-b border-[#ece5d6] flex items-center justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3
    className={`text-sm font-semibold tracking-wide text-[#161a22] uppercase font-mono-telemetry ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-[#5a6678] mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-5 py-3 border-t border-[#ece5d6] bg-[#fbf9f4] flex items-center justify-between rounded-b-lg text-xs text-[#647287] ${className}`}
    {...props}
  >
    {children}
  </div>
);
