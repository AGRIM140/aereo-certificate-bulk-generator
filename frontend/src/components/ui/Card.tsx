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
    default: 'bg-white border border-black shadow-[2px_2px_0px_#000000]',
    elevated: 'bg-white border-2 border-black shadow-[3px_3px_0px_#000000]',
    subtle: 'bg-[#a5b8c0]/25 border border-black',
  }[variant];

  const interactiveStyles = interactive
    ? 'hover:bg-neutral-50 active:translate-x-px active:translate-y-px transition-none cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-none text-black ${bgStyles} ${interactiveStyles} ${className}`}
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
    className={`px-4 py-2.5 border-b border-black bg-white flex items-center justify-between gap-4 ${className}`}
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
    className={`text-xs font-bold tracking-wider text-black uppercase font-ui ${className}`}
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
  <p className={`text-xs text-neutral-700 font-serif leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-4 py-3 border-t border-black bg-neutral-50 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
);
