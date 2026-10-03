import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'health' | 'forest';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] rounded-md';

    const variants = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-xs',
      forest: 'bg-forest-800 text-white hover:bg-forest-900 dark:bg-sage-100 dark:text-forest-900 dark:hover:bg-white shadow-xs',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80',
      outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80',
      ghost: 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 shadow-xs',
      health: 'bg-health-600 text-white hover:bg-health-700 dark:bg-health-600 dark:hover:bg-health-700 shadow-xs'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-10 px-5 text-base gap-2.5'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
