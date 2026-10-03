import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full h-9.5 sm:h-9 rounded-md border bg-white px-3 text-sm text-slate-900 shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:focus:ring-slate-600/40',
              icon && 'pl-9',
              error ? 'border-rose-500 focus:ring-rose-400/40 dark:border-rose-600' : 'border-slate-200 dark:border-slate-800',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
