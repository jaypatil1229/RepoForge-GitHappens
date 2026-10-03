'use client';

import { AlertTriangle, ArrowRight, Info, Lock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/surface';
import { claimEntries } from '@/lib/claims';
import { cn } from '@/lib/utils';

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-6', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ metrics */

export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line-200 bg-line-200 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  href,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'brand';
  href?: string;
  icon?: ReactNode;
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-danger-700'
      : tone === 'warning'
        ? 'text-warning-700'
        : tone === 'positive'
          ? 'text-success-700'
          : tone === 'brand'
            ? 'text-forest-800'
            : 'text-ink-950';

  const inner = (
    <div className="flex h-full flex-col justify-between gap-3 bg-paper-0 px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-micro font-medium uppercase tracking-[0.1em] text-ink-500">{label}</p>
        {icon ? <span className="text-ink-400">{icon}</span> : null}
      </div>
      <div>
        <p className={cn('tabular text-[1.6rem] font-semibold leading-none tracking-[-0.01em]', toneClass)}>{value}</p>
        {hint ? <p className="mt-1.5 text-micro text-ink-500">{hint}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group relative block bg-paper-0 transition-colors hover:bg-paper-50 focus-visible:z-10"
      >
        {inner}
        <ArrowRight
          aria-hidden
          className="absolute right-4 top-4 size-3.5 text-ink-400 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </Link>
    );
  }
  return inner;
}

/* ------------------------------------------------------------------ states */

export function LoadingBlock({ label = 'Loading', rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
      <p className="sr-only">{label}</p>
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_value, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function ErrorBlock({
  message,
  transport,
  onRetry,
  title = 'This view could not load',
}: {
  message: string;
  transport?: boolean;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-panel border border-danger-700/20 bg-danger-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger-700" />
        <div>
          <p className="text-ui font-semibold text-danger-700">{title}</p>
          <p className="mt-0.5 text-ui text-ink-600">
            {message}
            {transport ? ' The service is unreachable from this build; retry when it is available.' : ''}
          </p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw aria-hidden className="size-3.5" />}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A blocked action always states the rule that blocks it. This mirrors the backend,
 * which returns 403 with the same explanation rather than hiding the capability.
 */
export function BlockedPanel({
  title,
  description,
  rule,
  action,
  icon,
}: {
  title: string;
  description: ReactNode;
  rule?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-line-300 bg-paper-50 px-5 py-5">
      <div className="flex items-start gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-300 bg-paper-0 text-ink-600">
          {icon ?? <Lock aria-hidden className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-h4 text-ink-950">{title}</p>
          <div className="mt-1.5 max-w-prose text-ui text-ink-600">{description}</div>
          {rule ? (
            <p className="mt-3 border-t border-line-200 pt-3 text-micro leading-relaxed text-ink-500">
              <span className="font-semibold uppercase tracking-[0.1em]">Server rule </span>
              {rule}
            </p>
          ) : null}
          {action ? <div className="mt-4 flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function NoticeRow({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-control border px-3 py-2 text-micro leading-relaxed',
        tone === 'warning'
          ? 'border-warning-700/20 bg-warning-50 text-warning-700'
          : 'border-line-200 bg-paper-50 text-ink-600',
      )}
    >
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ claims */

export function ClaimsTable({
  claims,
  selected,
  className,
}: {
  claims: unknown;
  selected?: Set<string>;
  className?: string;
}) {
  const entries = claimEntries(claims as never);
  if (entries.length === 0) {
    return <p className="px-5 py-4 text-ui text-ink-500">This record carries no claims.</p>;
  }
  return (
    <dl className={cn('divide-y divide-line-200', className)}>
      {entries.map((entry) => {
        const isSelected = selected ? selected.has(entry.key) : true;
        return (
          <div
            key={entry.key}
            className={cn(
              'grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[minmax(0,190px)_1fr] sm:gap-4',
              selected && !isSelected && 'opacity-40',
            )}
          >
            <dt className="flex items-center gap-2 text-ui font-medium text-ink-600">
              {selected ? (
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    isSelected ? 'bg-forest-700' : 'bg-line-300',
                  )}
                />
              ) : null}
              {entry.label}
            </dt>
            <dd className="break-words text-ui text-ink-950">{entry.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/* ------------------------------------------------------------------ timeline */

export interface TimelineItem {
  id: string;
  title: string;
  meta?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'brand';
  body?: ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="px-5 py-4 text-ui text-ink-500">No recorded events yet.</p>;
  }
  const dotTone: Record<NonNullable<TimelineItem['tone']>, string> = {
    neutral: 'bg-line-300',
    positive: 'bg-success-700',
    warning: 'bg-warning-700',
    danger: 'bg-danger-700',
    brand: 'bg-forest-700',
  };
  return (
    <ol className="px-5 py-4">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3.5 pb-5 last:pb-0">
          {index !== items.length - 1 ? (
            <span aria-hidden className="absolute left-[5px] top-3 h-full w-px bg-line-200" />
          ) : null}
          <span
            aria-hidden
            className={cn('relative mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-paper-0', dotTone[item.tone ?? 'neutral'])}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <p className="text-ui font-medium text-ink-950">{item.title}</p>
              {item.meta ? <p className="tabular text-micro text-ink-500">{item.meta}</p> : null}
            </div>
            {item.body ? <div className="mt-1 text-ui text-ink-600">{item.body}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LinkArrow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <ButtonLink href={href} variant="tertiary" size="sm" icon={<ArrowRight aria-hidden className="size-3.5" />}>
      {children}
    </ButtonLink>
  );
}