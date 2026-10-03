import Link from 'next/link';

import { MarketingShell } from '@/components/marketing/marketing-shell';
import { buttonStyles } from '@/components/ui/button';

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="bg-paper-0">
        <div className="container-editorial flex min-h-[60vh] flex-col items-start justify-center py-20">
          <p className="eyebrow">Not found</p>
          <h1 className="type-display mt-3 max-w-2xl text-h1 text-balance text-ink-950">
            That record is not on this path.
          </h1>
          <p className="mt-4 max-w-measure text-body-lg text-ink-600">
            The page may have moved, or the link may belong to an earlier draft.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className={buttonStyles({ size: 'lg' })}>
              Back to the overview
            </Link>
            <Link href="/demo" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Open the preview
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}