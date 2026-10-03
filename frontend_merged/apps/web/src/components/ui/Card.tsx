import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'outline' | 'health' | 'sage';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const base = 'rounded-lg border transition-colors duration-150';
  const variants = {
    default: 'bg-white border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800 shadow-xs',
    flat: 'bg-slate-50/70 border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/80',
    outline: 'bg-transparent border-slate-200 dark:border-slate-800',
    health: 'bg-teal-50/30 border-teal-200/70 dark:bg-teal-950/20 dark:border-teal-900/60 shadow-xs',
    sage: 'bg-forest-50/50 border-forest-100 dark:bg-forest-900/30 dark:border-forest-800/60 shadow-xs'
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}
