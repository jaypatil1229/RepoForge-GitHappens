import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'inverse' | 'outline' | 'ghost' | 'forest' | 'health';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const baseStyles =
  'inline-flex select-none items-center justify-center font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-settle disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-forest-800 text-white hover:bg-forest-700 active:bg-forest-900 shadow-xs',
  secondary: 'border border-line-300 bg-paper-0 text-ink-950 hover:border-ink-500 hover:bg-paper-50',
  tertiary: 'text-ink-800 hover:bg-forest-50 hover:text-forest-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 shadow-xs',
  inverse: 'bg-paper-0 text-ink-950 hover:bg-paper-100',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80',
  ghost: 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200',
  forest: 'bg-forest-800 text-white hover:bg-forest-900 dark:bg-sage-100 dark:text-forest-900 dark:hover:bg-white shadow-xs',
  health: 'bg-health-600 text-white hover:bg-health-700 dark:bg-health-600 dark:hover:bg-health-700 shadow-xs',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-ui gap-1.5',
  md: 'h-10 px-4 text-ui gap-2',
  lg: 'h-11 px-5 text-body gap-2.5',
  icon: 'size-9 p-0',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={disabled || isLoading}
        className={buttonStyles({ variant, size, className })}
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
          <>
            {icon}
            {children}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, className, icon, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
