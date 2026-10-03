import { cn } from '@/lib/utils';

export function SectionMark({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'inverse' }) {
  return (
    <p className={cn('eyebrow', tone === 'inverse' && 'text-paper-0/60')}>{children}</p>
  );
}

export function SectionLead({
  mark,
  title,
  support,
  tone = 'default',
  align = 'start',
  className,
  id,
}: {
  mark?: string;
  title: React.ReactNode;
  support?: React.ReactNode;
  tone?: 'default' | 'inverse';
  align?: 'start' | 'center';
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {mark ? <SectionMark tone={tone}>{mark}</SectionMark> : null}
      <h2
        id={id}
        className={cn(
          'type-display mt-3 text-h2 text-balance',
          tone === 'inverse' ? 'text-paper-0' : 'text-ink-950',
        )}
      >
        {title}
      </h2>
      {support ? (
        <p
          className={cn(
            'mt-3.5 max-w-measure text-body-lg text-pretty',
            tone === 'inverse' ? 'text-paper-0/70' : 'text-ink-600',
          )}
        >
          {support}
        </p>
      ) : null}
    </div>
  );
}
