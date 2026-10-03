import { cn } from '@/lib/utils';

/**
 * CredLink mark: two open links interlock to form a chain, with a single solid
 * node where they meet. The gap reads as a link still open to being made, the
 * node as the record being carried across it.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={cn('size-6', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M10.9 6.55A6.05 6.05 0 1 0 10.9 17.45" />
      <path d="M13.1 6.55A6.05 6.05 0 1 1 13.1 17.45" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Logo({
  className,
  tone = 'default',
  showWordmark = true,
}: {
  className?: string;
  tone?: 'default' | 'inverse';
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={tone === 'inverse' ? 'text-paper-0' : 'text-forest-800'} />
      {showWordmark ? (
        <span
          className={cn(
            'text-[1.0625rem] font-semibold tracking-[-0.03em]',
            tone === 'inverse' ? 'text-paper-0' : 'text-ink-950',
          )}
        >
          CredLink
        </span>
      ) : null}
    </span>
  );
}
