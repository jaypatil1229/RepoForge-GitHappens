'use client'

import { BadgeCheck, CheckCircle2, History, MinusCircle } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { Card, DetailRow, PrimaryButton, ScreenBody, ScreenFooter, ScreenHeader, StatusBadge, VerifiedBadge } from '../primitives'
import { useWallet } from '@/lib/wallet-context'
import { formatDate } from '@/lib/format'

export function ReceiptScreen({ nav, id, fromShare }: { nav: Nav; id: string; fromShare?: boolean }) {
  const { consents, refreshData } = useWallet()
  const consent = consents.find((item) => item.id === id)

  return (
    <>
      <ScreenHeader
        title={fromShare ? 'Decision Saved' : 'Consent Receipt'}
        onBack={fromShare ? undefined : nav.back}
      />
      <ScreenBody className="flex flex-col gap-5 pt-5">
        {fromShare && consent?.status === 'APPROVED' && (
          <div className="flex flex-col items-center pt-4 text-center">
            <span className="inline-flex size-20 items-center justify-center rounded-full bg-success text-primary-foreground animate-in zoom-in-50 duration-500">
              <CheckCircle2 className="size-10" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-ink">Consent approved</h1>
            <VerifiedBadge className="mt-3">Decision confirmed by backend</VerifiedBadge>
          </div>
        )}

        {!consent ? (
          <Card className="flex flex-col gap-3 text-center">
            <p className="font-semibold text-ink">Receipt details are not loaded</p>
            <p className="text-sm text-muted-foreground">Refresh your activity to retrieve the saved decision.</p>
            <PrimaryButton onClick={() => void refreshData().catch(() => {})}>Refresh activity</PrimaryButton>
          </Card>
        ) : (
          <Card className="py-1">
            <div className="flex items-center justify-between border-b border-border py-3">
              <h2 className="text-sm font-semibold text-ink">Consent receipt</h2>
              <StatusBadge tone={consent.status === 'APPROVED' ? 'success' : consent.status === 'PENDING' ? 'warning' : 'muted'}>
                {consent.status}
              </StatusBadge>
            </div>
            <dl className="divide-y divide-border">
              <DetailRow label="Requester" value={consent.requestingOrg?.name || 'Institution'} />
              <DetailRow label="Purpose" value={consent.purpose} />
              <div className="py-3">
                <dt className="text-sm text-muted-foreground">Approved claims</dt>
                <dd>
                  <ul className="mt-2 flex flex-col gap-2">
                    {consent.approvedClaims.length > 0
                      ? consent.approvedClaims.map((claim) => (
                        <li key={claim} className="flex items-center gap-2 text-sm font-medium text-ink">
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                          {claim}
                        </li>
                      ))
                      : <li className="text-sm text-muted-foreground">No claims were shared.</li>}
                  </ul>
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted-foreground">Not approved</dt>
                <dd>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {consent.requestedClaims
                      .filter((claim) => !consent.approvedClaims.includes(claim))
                      .map((claim) => (
                        <li key={claim} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          <MinusCircle className="size-3 text-destructive/70" />
                          {claim}
                        </li>
                      ))}
                    {consent.requestedClaims.every((claim) => consent.approvedClaims.includes(claim)) && (
                      <li className="text-sm text-muted-foreground">None</li>
                    )}
                  </ul>
                </dd>
              </div>
              <DetailRow label="Request domain" value={consent.domain} />
              <DetailRow label="Created" value={formatDate(consent.createdAt)} />
              <DetailRow label="Decision recorded" value={formatDate(consent.grantedAt || consent.updatedAt)} />
              <DetailRow label="Expires" value={formatDate(consent.expiresAt)} />
            </dl>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          This receipt reflects the consent record returned by CredLink. It does not replace the signed credential.
        </p>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={() => nav.replaceRoot({ name: 'activity' }, 'forward')}>
          <History className="size-4" />
          View Activity
        </PrimaryButton>
        <PrimaryButton onClick={() => nav.replaceRoot({ name: 'home' })}>
          <BadgeCheck className="size-4" />
          Back to Wallet
        </PrimaryButton>
      </ScreenFooter>
    </>
  )
}
