import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Panel({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
}) {
  return <Tag className={cn('rounded-panel border border-line-200 bg-paper-0', className)}>{children}</Tag>;
}

export function PanelHeader({
  title,
  description,
  action,
  className,
  level = 2,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 border-b border-line-200 px-5 py-4', className)}>
      <div className="min-w-0">
        <Heading className="text-h4 text-ink-950">{title}</Heading>
        {description ? <p className="mt-1 max-w-prose text-ui text-ink-600">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-4 border-b border-line-200 pb-6', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="text-h2 text-balance text-ink-950">{title}</h1>
          {description ? <p className="mt-2 max-w-prose text-body text-ink-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{meta}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      {icon ? (
        <div className="flex size-10 items-center justify-center rounded-full border border-line-200 bg-paper-50 text-ink-500">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-h4 text-ink-950">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-ui text-ink-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

type BannerTone = 'info' | 'warning' | 'danger' | 'success' | 'neutral';

const bannerTones: Record<BannerTone, string> = {
  info: 'border-info-700/20 bg-info-50 text-info-700',
  warning: 'border-warning-700/25 bg-warning-50 text-warning-700',
  danger: 'border-danger-700/25 bg-danger-50 text-danger-700',
  success: 'border-success-700/20 bg-success-50 text-success-700',
  neutral: 'border-line-200 bg-paper-50 text-ink-600',
};

export function Banner({
  tone = 'neutral',
  icon,
  title,
  children,
  action,
  className,
}: {
  tone?: BannerTone;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 rounded-panel border px-4 py-3', bannerTones[tone], className)}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0 flex-1 text-ui">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn('text-ink-600', title && 'mt-0.5')}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-paper-100', className)} />;
}

export function DefinitionList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('divide-y divide-line-200', className)}>{children}</dl>;
}

export function DefinitionRow({
  label,
  children,
  mono,
  className,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-4', className)}>
      <dt className="text-ui font-medium text-ink-600">{label}</dt>
      <dd className={cn('text-ui text-ink-950', mono && 'mono-value break-all')}>{children}</dd>
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="text-micro font-medium uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <p className="tabular text-[1.75rem] font-semibold leading-none text-ink-950">{value}</p>
      {hint ? <p className="text-micro text-ink-500">{hint}</p> : null}
    </div>
  );
}