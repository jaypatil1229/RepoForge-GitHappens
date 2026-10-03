import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'size-7 relative shrink-0 rounded-md overflow-hidden bg-white p-0.5 border border-line-200 shadow-xs flex items-center justify-center',
        className
      )}
    >
      <Image
        src="/credlnkwhitebg.png"
        alt="CredLink"
        width={24}
        height={24}
        className="w-full h-full object-contain"
        priority
      />
    </div>
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
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'size-7 relative shrink-0 rounded-md overflow-hidden p-0.5 border shadow-xs flex items-center justify-center',
          tone === 'inverse' ? 'bg-white border-white/20' : 'bg-white border-line-200'
        )}
      >
        <Image
          src="/credlnkwhitebg.png"
          alt="CredLink"
          width={24}
          height={24}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showWordmark ? (
        <span
          className={cn(
            'text-[1.125rem] font-bold tracking-tight leading-none',
            tone === 'inverse' ? 'text-paper-0' : 'text-ink-950'
          )}
        >
          Cred<span className="text-forest-600 dark:text-emerald-400">Link</span>
        </span>
      ) : null}
    </span>
  );
}
