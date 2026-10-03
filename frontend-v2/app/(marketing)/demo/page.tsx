import type { Metadata } from 'next';
import Link from 'next/link';

import { DemoPicker } from '@/components/marketing/demo-picker';
import { PageIntro } from '@/components/marketing/page-intro';
import { buttonStyles } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Preview contexts',
  description:
    'Open a citizen, institution or administrator context and browse the CredLink portal with synthetic data.',
};

const behaviour = [
  {
    title: 'No session is created',
    body: 'The context selector records which synthetic account you are browsing as. No token is minted, no credential is exchanged and no authentication service is called.',
  },
  {
    title: 'Data is deterministic',
    body: 'Every record, consent and verification result comes from fixed fixtures that mirror the verified API contracts. The same input always produces the same outcome.',
  },
  {
    title: 'Mutations stay isolated',
    body: 'Approvals, revocations and consent decisions update a local preview store that is shared across persona switches and reset on reload.',
  },
  {
    title: 'Real failure states are kept',
    body: 'A suspended account and a suspended-trust issuer are included so the 403 and rejection paths are exercised rather than hidden.',
  },
];

export default function DemoPage() {
  return (
    <>
      <PageIntro
        mark="Preview"
        title="Three roles, one network."
        support="Open a context and the portal scopes itself to that role. Nothing here is a session."
      />

      <section className="bg-paper-0">
        <div className="container-editorial py-16 lg:py-20">
          <DemoPicker />
        </div>
      </section>

      <section className="border-t border-line-200 bg-paper-50">
        <div className="container-editorial py-16 lg:py-24">
          <div className="max-w-xl">
            <p className="eyebrow">How this preview behaves</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">
              Honest about what is running.
            </h2>
          </div>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {behaviour.map((item) => (
              <div key={item.title} className="border-t border-line-300 pt-4">
                <dt className="text-body font-medium text-ink-950">{item.title}</dt>
                <dd className="mt-2 text-ui text-pretty text-ink-600">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line-200 bg-paper-0">
        <div className="container-editorial flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="type-display text-h2 text-balance text-ink-950">Need the institutional path?</h2>
            <p className="mt-2 max-w-measure text-body text-ink-600">
              Registration demonstrates the real role rules without creating anything persistent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={buttonStyles({ size: 'lg' })}>
              Register an institution
            </Link>
            <Link href="/login" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}