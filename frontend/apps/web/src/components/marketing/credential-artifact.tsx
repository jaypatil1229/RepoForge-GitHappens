import React from 'react';
import { cn } from '../../lib/utils';
import type { LandingCredential } from '../../lib/landing-content';

/**
 * The printed security-print texture. Purely decorative: it is hidden from
 * assistive technology and makes no claim about cryptography or security.
 */
function ImprintTexture({ className }: { className?: string }) {
  const rays = Array.from({ length: 22 }, (_, index) => index);
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 200 200"
      className={cn('pointer-events-none absolute', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    >
      {rays.map((ray) => {
        const angle = (ray / rays.length) * Math.PI * 2;
        const x = 100 + Math.cos(angle) * 96;
        const y = 100 + Math.sin(angle) * 96;
        return <line key={`ray-${ray}`} x1="100" y1="100" x2={x.toFixed(2)} y2={y.toFixed(2)} />;
      })}
      {[18, 30, 42, 54, 66, 78, 90].map((radius) => (
        <circle key={`ring-${radius}`} cx="100" cy="100" r={radius} />
      ))}
      <circle cx="100" cy="100" r="94" strokeDasharray="2 5" />
    </svg>
  );
}

function StatusChip({ tone, children }: { tone: 'active' | 'revoked' | 'pending'; children: React.ReactNode }) {
  const tones = {
    active: 'border-success-700/25 bg-success-50 text-success-700',
    revoked: 'border-danger-700/25 bg-danger-50 text-danger-700',
    pending: 'border-warning-700/25 bg-warning-50 text-warning-700',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro font-medium',
        tones[tone],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export interface CredentialArtifactProps {
  credential: LandingCredential;
  status?: 'active' | 'revoked' | 'pending';
  className?: string;
  /** Reveals the proof panel instead of the award panel. */
  showProof?: boolean;
  /** Replaces the default status word with the stage the record is in. */
  stateLabel?: string;
}

export function CredentialArtifact({
  credential,
  status = 'active',
  className,
  showProof = false,
  stateLabel,
}: CredentialArtifactProps) {
  const claims = credential.claims.filter((claim) => !claim.optional);

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-surface border border-line-200 bg-paper-0 text-ink-950',
        'shadow-artifact',
        className,
      )}
    >
      <ImprintTexture className="hidden -right-20 -top-20 size-60 text-forest-800/[0.13] sm:block" />
      <div className="relative border-b border-line-200 bg-paper-0 px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-micro text-ink-500">{credential.institutionKind}</p>
            <p className="mt-1 truncate text-ui font-semibold text-ink-950">{credential.institution}</p>
          </div>
          <StatusChip tone={status}>
            {stateLabel ?? (status === 'active' ? 'Active' : status === 'revoked' ? 'Revoked' : 'Pending')}
          </StatusChip>
        </div>
      </div>

      {showProof ? (
        <dl className="relative divide-y divide-line-200 px-5 py-1 sm:px-7">
          {[
            { label: 'Signature', value: 'Valid · EdDSA (Ed25519)' },
            { label: 'Issuer trust', value: 'Registered and accredited for education' },
            { label: 'Status', value: 'Active · no revocation recorded' },
            { label: 'Issued to', value: credential.holder },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[minmax(0,104px)_1fr] items-baseline gap-4 py-3.5">
              <dt className="text-micro text-ink-500">{row.label}</dt>
              <dd className="text-ui text-ink-950">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <p className="type-award text-[1.75rem] leading-[1.1] text-ink-950 sm:text-[2.1rem]">{credential.award}</p>
          <p className="mt-1.5 text-ui text-ink-600">{credential.field}</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {claims.map((claim) => (
              <div key={claim.key} className="min-w-0">
                <dt className="text-micro text-ink-500">{claim.label}</dt>
                <dd className="truncate text-ui text-ink-950">{claim.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line-200 bg-paper-50 px-5 py-3.5 sm:px-7">
        <div className="min-w-0">
          <p className="text-micro text-ink-500">Issued to</p>
          <p className="truncate text-ui text-ink-950">{credential.holder}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-micro text-ink-500">Issued {credential.issued}</p>
          <p className="mono-value truncate">{credential.identifier}</p>
        </div>
      </div>
    </article>
  );
}
