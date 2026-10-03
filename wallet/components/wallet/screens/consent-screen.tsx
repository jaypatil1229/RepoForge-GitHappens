'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock, Landmark, MinusCircle, Target, Timer } from 'lucide-react'
import type { Nav } from '../wallet-app'
import {
  Card,
  InstitutionAvatar,
  PrimaryButton,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  SecondaryButton,
  SectionTitle,
  StatusBadge,
  VerifiedBadge,
} from '../primitives'
import { bank, consentRequest, notRequestedClaims, requestedClaims } from '@/lib/wallet-data'

function useCountdown(start: number) {
  const [seconds, setSeconds] = useState(start)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function ConsentScreen({ nav }: { nav: Nav }) {
  const remaining = useCountdown(consentRequest.expiresInSeconds)

  return (
    <>
      <ScreenHeader title="Consent Review" onBack={nav.back} />
      <ScreenBody className="flex flex-col gap-5 pt-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Bank Consent Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review who is asking and what they will receive.</p>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <InstitutionAvatar icon={<Landmark className="size-5" />} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{bank.name}</p>
              <p className="text-sm text-muted-foreground">{bank.division}</p>
            </div>
            <VerifiedBadge />
          </div>
          <dl className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <dt className="text-xs text-muted-foreground">Purpose</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{consentRequest.purpose}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Request type</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink" aria-live="off">
                <Clock className="size-3.5 text-warning" />
                {consentRequest.requestType} · Expires in{' '}
                <span className="text-warning tabular-nums">{remaining}</span>
              </dd>
            </div>
          </dl>
        </Card>

        <section>
          <SectionTitle>Requested academic claims</SectionTitle>
          <ul className="flex flex-col gap-2">
            {requestedClaims.map((claim) => (
              <li
                key={claim}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-medium text-ink"
              >
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                {claim}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle>Not requested</SectionTitle>
          <ul className="grid grid-cols-2 gap-2">
            {notRequestedClaims.map((claim) => (
              <li
                key={claim}
                className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground"
              >
                <MinusCircle className="size-4 shrink-0 text-destructive/70" />
                {claim}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft p-3.5 text-sm leading-relaxed text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            Apex Imperial Bank will receive only the academic claims listed above. This request cannot be reused
            after completion.
          </p>
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Trust details">
          <li>
            <VerifiedBadge>Requester: Verified</VerifiedBadge>
          </li>
          <li>
            <StatusBadge tone="muted">
              <Target className="size-3.5" />
              Purpose-bound request
            </StatusBadge>
          </li>
          <li>
            <StatusBadge tone="muted">
              <Timer className="size-3.5" />
              One-time access
            </StatusBadge>
          </li>
        </ul>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={() => nav.push({ name: 'processing' })}>Approve & Share</PrimaryButton>
        <SecondaryButton
          onClick={() =>
            nav.replaceRoot({ name: 'home', notice: 'Request from Apex Imperial Bank was denied. Nothing was shared.' })
          }
        >
          Deny Request
        </SecondaryButton>
      </ScreenFooter>
    </>
  )
}
