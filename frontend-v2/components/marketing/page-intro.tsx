import type { ReactNode } from 'react';

export function PageIntro({
  mark,
  title,
  support,
  children,
}: {
  mark: string;
  title: ReactNode;
  support: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line-200 bg-paper-0">
      <div className="container-editorial py-16 lg:py-20">
        <p className="eyebrow">{mark}</p>
        <h1 className="type-display mt-3 max-w-3xl text-h1 text-balance text-ink-950">{title}</h1>
        <p className="mt-5 max-w-measure text-body-lg text-pretty text-ink-600">{support}</p>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}