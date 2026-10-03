'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Renders an identifier in mono with a copy affordance. Long values are shown in
 * full but wrap, so nothing is hidden behind a truncation the reader cannot undo.
 */
export function CopyableId({
  value,
  label,
  className,
  truncate = false,
}: {
  value: string | null | undefined;
  label?: string;
  className?: string;
  truncate?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  if (!value) return <span className="text-ui text-ink-500">Not assigned</span>;

  return (
    <span className={cn('group inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className={cn('mono-value min-w-0', truncate && 'truncate')} title={value}>
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={label ? `Copy ${label}` : 'Copy identifier'}
        className="rounded p-1 text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-950"
      >
        {copied ? <Check aria-hidden className="size-3.5 text-success-700" /> : <Copy aria-hidden className="size-3.5" />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </span>
  );
}