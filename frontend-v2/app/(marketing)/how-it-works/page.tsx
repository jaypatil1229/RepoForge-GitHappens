import type { Metadata } from 'next';
import Link from 'next/link';

import { CredentialArtifact } from '@/components/marketing/credential-artifact';
import { PageIntro } from '@/components/marketing/page-intro';
import { buttonStyles } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { demoCredential } from '@/lib/landing-content';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Issue, hold, consent, verify — how a CredLink record moves between an institution, its holder and a verifier.',
};

const moves = [
  { title: 'Institution issues', body: 'An approved issuer signs the record with its own key.' },
  { title: 'Person holds', body: 'The record appears in their CredLink account, source attached.' },
  { title: 'Person consents', body: 'Only the claims a request needs are released.' },
  { title: 'Verifier checks', body: 'Signature, issuer trust and status are confirmed independently.' },
];

const roles = [
  {
    label: 'Institution',
    headline: 'Issues and verifies inside its own domain.',
    points: [
      'Registration, then network approval before any record is signed.',
      'Issuer authorization is a separate grant from organization approval.',
      'Can request consent and read only the claims that were approved.',
    ],
  },
  {
    label: 'Person',
    headline: 'Holds the record and makes the decision.',
    points: [
      'Sees the requester, the purpose and the exact claims before responding.',
      'Can approve, deny or revoke a consent at any time.',
      'Can grant access directly to an institution without a request.',
    ],
  },
  {
    label: 'Verifier',
    headline: 'Checks the proof rather than trusting a copy.',
    points: [
      'Runs cryptographic verification before reading anything from the record.',
      'Checks issuer trust and the accreditation domain for the credential.',
      'Reports each step separately, so a valid signature is never the whole story.',
    ],
  },
];

const insideRecord = [
  { label: 'Award and field', body: 'The plain-language outcome the institution attests to.' },
  { label: 'Claims', body: 'Structured values. Claim-level selection decides which ones move.' },
  { label: 'Signature', body: 'Ed25519 over a JWT verifiable credential, issued via did:key.' },
  { label: 'Issuer identity', body: 'The DID the trust registry is keyed by.' },
  { label: 'Lifecycle', body: 'Valid, revoked or past expiry. Status is checked, not assumed.' },
  { label: 'Consent link', body: 'When a consent is used, it is consumed and audited.' },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        mark="How it works"
        title="Four moves, one record."
        support="The same record, seen from each side of the exchange."
      >
        <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {moves.map((move, index) => (
            <li key={move.title} className="relative border-t border-line-300 pt-4">
              <span aria-hidden className="absolute -top-[3px] left-0 size-[5px] rounded-full bg-forest-800" />
              <p className="tabular text-micro text-ink-500">0{index + 1}</p>
              <p className="mt-1.5 text-body font-medium text-ink-950">{move.title}</p>
              <p className="mt-1.5 text-ui text-pretty text-ink-600">{move.body}</p>
            </li>
          ))}
        </ol>
      </PageIntro>

      <section className="bg-paper-50">
        <div className="container-editorial py-16 lg:py-24">
          <Reveal className="max-w-xl">
            <p className="eyebrow">Who does what</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">
              Three sides, different permissions.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
            {roles.map((role, index) => (
              <Reveal key={role.label} delay={index * 0.06} className="border-t border-line-300 pt-5">
                <p className="tabular text-micro text-ink-500">{role.label}</p>
                <h3 className="mt-2 text-h4 text-balance text-ink-950">{role.headline}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {role.points.map((point) => (
                    <li key={point} className="flex gap-3 text-ui text-pretty text-ink-600">
                      <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-forest-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line-200 bg-paper-0">
        <div className="container-editorial grid gap-12 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:py-24">
          <Reveal>
            <CredentialArtifact credential={demoCredential} />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow">Inside the record</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">
              What actually travels with a credential.
            </h2>
            <dl className="mt-8 divide-y divide-line-200 border-t border-line-200">
              {insideRecord.map((row) => (
                <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-6">
                  <dt className="text-ui font-medium text-ink-950">{row.label}</dt>
                  <dd className="text-ui text-pretty text-ink-600">{row.body}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line-200 bg-paper-50">
        <div className="container-editorial grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">Scope</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">
              What this build does not do.
            </h2>
            <p className="mt-4 max-w-measure text-body-lg text-ink-600">
              The record archive is server-side. There is no wallet, no key custody and no QR presentation.
            </p>
            <Link href="/trust" className={buttonStyles({ variant: 'secondary', size: 'md', className: 'mt-6' })}>
              Read the trust boundaries
            </Link>
          </div>
          <ul className="grid gap-x-8 gap-y-4 self-center sm:grid-cols-2">
            {[
              'No citizen-held wallet or offline possession',
              'No zero-knowledge proofs',
              'No QR scanning or presentation',
              'No MFA, email verification or password reset',
              'No audit-log immutability claim',
              'No notification, email or webhook delivery',
            ].map((item) => (
              <li key={item} className="border-t border-line-300 pt-3 text-ui text-ink-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-forest-900 text-paper-0">
        <div className="container-editorial flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <h2 className="type-display max-w-lg text-h2 text-balance">See it move for yourself.</h2>
          <Link href="/demo" className={buttonStyles({ variant: 'inverse', size: 'lg' })}>
            Open the preview
          </Link>
        </div>
      </section>
    </>
  );
}