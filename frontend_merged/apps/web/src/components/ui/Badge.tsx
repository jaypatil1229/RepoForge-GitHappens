import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'health' | 'sage';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'neutral', size = 'sm', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center font-medium border rounded-md tracking-tight transition-colors duration-150';
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5'
  };

  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60',
    error: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60',
    health: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/60',
    sage: 'bg-forest-100 text-forest-800 border-forest-200 dark:bg-forest-900/50 dark:text-forest-100 dark:border-forest-700'
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
