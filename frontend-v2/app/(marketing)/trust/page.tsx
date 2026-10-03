import type { Metadata } from 'next';
import Link from 'next/link';

import { PageIntro } from '@/components/marketing/page-intro';
import { buttonStyles } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

export const metadata: Metadata = {
  title: 'Trust and verification',
  description:
    'The checks CredLink runs before it accepts a credential, and the limits this preview is honest about.',
};

const decisionOrder = [
  { step: 'Verify the signature', note: 'A missing or failing JWT fails here, before anything is read.' },
  { step: 'Read the identifier from the verified record', note: 'Client-supplied claims are never trusted.' },
  { step: 'Find the stored record', note: 'A missing archive entry is a rejection, not a transport error.' },
  { step: 'Look up the issuer in the trust registry', note: 'The issuer must be present and its status VERIFIED.' },
  { step: 'Match the accreditation domain', note: 'accredited_for must equal the credential domain exactly.' },
  { step: 'Check the lifecycle', note: 'Revoked or past expiry rejects even with a valid signature.' },
  { step: 'Consume the consent, when one is supplied', note: 'Claims are intersected before release, then the consent is spent.' },
];

const limits = [
  'No wallet, no citizen-held keys, no offline possession.',
  'No zero-knowledge proofs: approved claims are released in plaintext.',
  'No QR presentation or scanning, even though a payload is stored.',
  'No MFA, no email verification and no password reset.',
  'No immutability claim for the audit log.',
  'No notifications, email or webhook delivery.',
];

const gaps = [
  {
    id: 'F-01',
    finding: 'requireRole is defined and tested but not mounted on any route.',
    impact: 'Route-level guards are not assumed; authorization lives in service logic and RLS.',
  },
  {
    id: 'F-02',
    finding: '/api/demo/dashboard references tables and columns that do not exist.',
    impact: 'This frontend does not build on that endpoint.',
  },
  {
    id: 'F-06',
    finding: 'Consent CONSUMED is a response label; the stored status becomes EXPIRED.',
    impact: 'Interface copy never shows "consumed" as a persisted state.',
  },
  {
    id: 'F-07',
    finding: 'Registering as ADMIN silently yields CITIZEN.',
    impact: 'The register screen states the role that is actually assigned.',
  },
  {
    id: 'F-11',
    finding: 'share-access falls back to the full claim set when no approved key matches.',
    impact: 'The claim filter is described as intended behaviour, not perfect minimisation.',
  },
  {
    id: 'F-12',
    finding: 'Login resolves only the first active membership.',
    impact: 'The portal shows a single organization context.',
  },
];

export default function TrustPage() {
  return (
    <>
      <PageIntro
        mark="Trust"
        title="Trust is a set of checks, not a badge."
        support="The same order every time, and a report of every step that ran."
      >
        <ol className="grid gap-4 border-t border-line-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {['Credential present', 'Signature matches the issuer key', 'Issuer trusted for this domain', 'Credential is active'].map(
            (check, index) => (
              <li key={check} className="flex items-start gap-3">
                <span className="tabular mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-forest-800/30 bg-forest-50 text-micro text-forest-800">
                  {index + 1}
                </span>
                <span className="text-ui text-ink-800">{check}</span>
              </li>
            ),
          )}
        </ol>
      </PageIntro>

      <section className="bg-paper-0">
        <div className="container-editorial grid gap-12 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-24">
          <Reveal>
            <p className="eyebrow">Decision order</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">
              Every rejection is a specific outcome.
            </h2>
            <p className="mt-4 max-w-measure text-body-lg text-ink-600">
              Business rejections return a normal response, so a failed check is rendered as a result rather than an
              error.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <ol className="flex flex-col">
              {decisionOrder.map((item, index) => (
                <li
                  key={item.step}
                  className="grid gap-1 border-t border-line-200 py-4 sm:grid-cols-[minmax(0,26px)_minmax(0,1fr)] sm:gap-4"
                >
                  <span className="tabular pt-0.5 text-micro text-ink-500">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-body font-medium text-ink-950">{item.step}</span>
                    <span className="mt-1 block text-ui text-pretty text-ink-600">{item.note}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line-200 bg-forest-950 text-paper-0">
        <div className="container-editorial grid gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <Reveal>
            <p className="eyebrow text-paper-0/55">What we claim</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-paper-0">
              Signed, scoped and revocable.
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                'A real W3C verifiable credential, signed with Ed25519 over did:key.',
                'Claim-level selection, so a request receives only what was approved.',
                'Revocation and expiry are checked on every verification.',
                'Issuer trust and accreditation domain are checked separately from the signature.',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-body text-paper-0/80">
                  <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-forest-300" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow text-paper-0/55">What we do not claim</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-paper-0">
              The boundaries stay visible.
            </h2>
            <ul className="mt-6 flex flex-col">
              {limits.map((item) => (
                <li key={item} className="border-t border-paper-0/15 py-3 text-body text-paper-0/75">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper-50">
        <div className="container-editorial py-16 lg:py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Known gaps</p>
            <h2 className="type-display mt-3 text-h2 text-balance text-ink-950">
              What the backend actually does.
            </h2>
            <p className="mt-4 text-body-lg text-ink-600">
              Isolated and documented rather than hidden behind the interface.
            </p>
          </Reveal>

          <Reveal className="mt-10 overflow-hidden rounded-surface border border-line-200 bg-paper-0">`n            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Known backend findings and their frontend impact</caption>
              <thead>
                <tr className="border-b border-line-200 bg-paper-100/60">
                  <th scope="col" className="px-4 py-3 text-micro font-medium text-ink-600">
                    Ref
                  </th>
                  <th scope="col" className="px-4 py-3 text-micro font-medium text-ink-600">
                    Finding
                  </th>
                  <th scope="col" className="hidden px-4 py-3 text-micro font-medium text-ink-600 sm:table-cell">
                    Frontend impact
                  </th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((gap) => (
                  <tr key={gap.id} className="border-b border-line-200 last:border-b-0">
                    <td className="px-4 py-4 align-top">
                      <span className="mono-value">{gap.id}</span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="block text-ui text-pretty text-ink-950">{gap.finding}</span>
                      <span className="mt-1 block text-micro text-ink-600 sm:hidden">{gap.impact}</span>
                    </td>
                    <td className="hidden px-4 py-4 align-top text-ui text-pretty text-ink-600 sm:table-cell">
                      {gap.impact}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <p className="mt-6 text-micro text-ink-500">
            Source: FRONTEND_RECONNAISSANCE.md findings register, verified against the backend implementation.
          </p>
        </div>
      </section>

      <section className="border-t border-line-200 bg-paper-0">
        <div className="container-editorial flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <h2 className="type-display max-w-xl text-h2 text-balance text-ink-950">
            Walk the checks yourself.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo" className={buttonStyles({ size: 'lg' })}>
              Open the preview
            </Link>
            <Link href="/how-it-works" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              How it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}