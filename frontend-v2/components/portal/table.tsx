import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Data tables stay in a bordered shell with a deliberate overflow strategy: the
 * shell scrolls horizontally when a table genuinely needs the width, rather than
 * squeezing columns into an unreadable shape.
 */
export function TableShell({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-panel border border-line-200 bg-paper-0', className)}>
      <div className="overflow-x-auto">
        <table aria-label={label} className="w-full min-w-[720px] border-collapse text-left">
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-paper-50">
      <tr className="border-b border-line-200">{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  className,
  align = 'left',
  width,
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
  width?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={cn(
        'whitespace-nowrap px-4 py-2.5 text-micro font-semibold uppercase tracking-[0.1em] text-ink-500',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line-200">{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('transition-colors hover:bg-paper-50/70', className)}>{children}</tr>;
}

export function TD({
  children,
  className,
  align = 'left',
  mono,
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle text-ui text-ink-950',
        align === 'right' && 'text-right',
        mono && 'mono-value',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 py-4', className)}>{children}</div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
  count,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-ui transition-colors',
        active
          ? 'border-forest-800/30 bg-forest-50 font-medium text-forest-800'
          : 'border-line-200 text-ink-600 hover:border-line-300 hover:text-ink-950',
      )}
    >
      {children}
      {typeof count === 'number' ? <span className="tabular text-micro text-ink-500">{count}</span> : null}
    </button>
  );
}