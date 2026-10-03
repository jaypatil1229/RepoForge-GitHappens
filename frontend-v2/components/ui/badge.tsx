import type { ReactNode } from 'react';

import type { ToneKey } from '@/lib/format';
import { cn } from '@/lib/utils';

const tones: Record<ToneKey, string> = {
  neutral: 'border-line-300 bg-paper-100 text-ink-600',
  positive: 'border-success-700/20 bg-success-50 text-success-700',
  warning: 'border-warning-700/20 bg-warning-50 text-warning-700',
  danger: 'border-danger-700/20 bg-danger-50 text-danger-700',
  info: 'border-info-700/20 bg-info-50 text-info-700',
  brand: 'border-forest-800/15 bg-forest-50 text-forest-800',
};

const dotTones: Record<ToneKey, string> = {
  neutral: 'bg-ink-500',
  positive: 'bg-success-700',
  warning: 'bg-warning-700',
  danger: 'bg-danger-700',
  info: 'bg-info-700',
  brand: 'bg-forest-700',
};

export function StatusBadge({
  tone,
  label,
  showDot = true,
  className,
}: {
  tone: ToneKey;
  label: string;
  showDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium',
        tones[tone],
        className,
      )}
    >
      {showDot ? <span aria-hidden className={cn('size-1.5 rounded-full', dotTones[tone])} /> : null}
      {label}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line-200 bg-paper-50 px-2 py-0.5 text-micro font-medium text-ink-600',
        className,
      )}
    >
      {children}
    </span>
  );
}