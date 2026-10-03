'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * A single-line record row for overview queues. Rows are links when a detail route
 * exists and plain containers otherwise, so nothing looks clickable that is not.
 */
export function ListRow({
  href,
  title,
  meta,
  trailing,
  leading,
  className,
}: {
  href?: string;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  leading?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ui font-medium text-ink-950">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-micro text-ink-500">{meta}</span> : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
      {href ? (
        <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-50 focus-visible:bg-paper-50',
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn('flex items-center gap-3 px-5 py-3', className)}>{body}</div>;
}

export function ListRowGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-line-200', className)}>{children}</div>;
}