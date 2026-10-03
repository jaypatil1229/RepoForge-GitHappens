import { Search } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

const controlBase =
  'w-full rounded-control border bg-paper-0 text-body text-ink-950 placeholder:text-ink-500/80 transition-colors duration-150 ease-settle focus:border-forest-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-paper-100 disabled:text-ink-500';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  optional,
  required,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3 text-ui font-medium text-ink-800">
        <span>
          {label}
          {required ? <span className='ml-0.5 text-danger-700'>*</span> : null}
        </span>
        {optional ? <span className="text-micro font-normal text-ink-500">Optional</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-micro leading-relaxed text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-micro font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...props }: ComponentPropsWithoutRef<'input'> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'h-10 px-3', invalid ? 'border-danger-700' : 'border-line-300 hover:border-ink-500', className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentPropsWithoutRef<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'min-h-24 resize-y px-3 py-2.5', invalid ? 'border-danger-700' : 'border-line-300 hover:border-ink-500', className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentPropsWithoutRef<'select'> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        'h-10 cursor-pointer appearance-none bg-[length:16px_16px] bg-[position:right_10px_center] bg-no-repeat px-3 pr-9',
        invalid ? 'border-danger-700' : 'border-line-300 hover:border-ink-500',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235F6D66' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-4 shrink-0 cursor-pointer rounded border-line-300 text-forest-800 accent-[var(--forest-800)] focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <Search aria-hidden className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400' />
      <input
        type="search"
        className={cn(controlBase, 'h-9 w-full border-line-300 pl-9 pr-3 text-ui hover:border-ink-500')}
        {...props}
      />
    </span>
  );
}