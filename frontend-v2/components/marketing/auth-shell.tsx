import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from '@/components/ui/logo';

/**
 * Split shell for the authentication screens. The credential story stays on the
 * evergreen side; the working form keeps a quiet paper surface.
 */
export function AuthShell({
  panelTitle,
  panelPoints,
  title,
  description,
  footer,
  children,
}: {
  panelTitle: string;
  panelPoints: string[];
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper-0 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-forest-950 text-paper-0 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:64px_64px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 size-[520px] rounded-full bg-forest-700/25 blur-3xl"
        />

        <Link href="/" aria-label="CredLink home" className="relative w-fit rounded-control">
          <Logo tone="inverse" />
        </Link>

        <div className="relative max-w-md py-12">
          <h2 className="type-display text-h2 text-balance text-paper-0">{panelTitle}</h2>
          <ul className="mt-8 flex flex-col">
            {panelPoints.map((point, index) => (
              <li key={point} className="relative flex gap-4 pb-6 last:pb-0">
                {index < panelPoints.length - 1 ? (
                  <span aria-hidden className="absolute left-[11px] top-6 h-full w-px bg-paper-0/15" />
                ) : null}
                <span
                  aria-hidden
                  className="relative z-10 mt-1 grid size-[23px] shrink-0 place-items-center rounded-full border border-paper-0/30 bg-forest-950"
                >
                  <span className="size-1.5 rounded-full bg-forest-300" />
                </span>
                <span className="text-ui leading-relaxed text-paper-0/75">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-micro text-paper-0/60">
          Design preview &middot; synthetic records &middot; no live backend
        </p>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-8 lg:px-14 lg:py-12">
        <Link href="/" aria-label="CredLink home" className="w-fit rounded-control lg:hidden">
          <Logo />
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="type-display text-h2 text-balance text-ink-950">{title}</h1>
          <p className="mt-3 text-body text-pretty text-ink-600">{description}</p>
          <div className="mt-8">{children}</div>
        </div>

        {footer ? (
          <div className="mx-auto w-full max-w-md text-ui text-ink-600">{footer}</div>
        ) : null}
      </main>
    </div>
  );
}