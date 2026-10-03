'use client'

import { useState } from 'react'
import { ChevronRight, Clock, GraduationCap, Inbox, Landmark } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { AppHeader, Card, InstitutionAvatar, PrimaryButton, ScreenBody, StatusBadge, VerifiedBadge } from '../primitives'
import { useWallet } from '@/lib/wallet-context'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { WalletConsent } from '@/lib/wallet-api'

const filters = ['All', 'PENDING', 'APPROVED', 'DENIED', 'REVOKED', 'EXPIRED'] as const
type Filter = (typeof filters)[number]

const statusTone: Record<WalletConsent['status'], 'success' | 'warning' | 'muted' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DENIED: 'danger',
  REVOKED: 'muted',
  EXPIRED: 'muted',
}

export function ActivityScreen({ nav }: { nav: Nav }) {
  const [filter, setFilter] = useState<Filter>('All')
  const { consents, dataError } = useWallet()
  const visible = consents.filter((consent) => filter === 'All' || consent.status === filter)

  return (
    <>
      <AppHeader subtitle="Sharing Activity" />
      <div className="shrink-0 px-5 pt-5 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sharing Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consent requests and decisions from your CredLink account.</p>
        <div className="mt-4 flex gap-2 overflow-x-auto" role="group" aria-label="Filter activity">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                filter === f
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {dataError && <p role="alert" className="mx-5 mb-3 rounded-xl bg-warning-soft p-3 text-sm text-foreground">{dataError}</p>}

      <ScreenBody className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="font-medium text-ink">No {filter.toLowerCase()} requests</p>
            <p className="text-sm text-muted-foreground">
              {dataError ? 'Activity could not be loaded. Check your connection and refresh.' : 'Requests you review will appear here.'}
            </p>
          </div>
        ) : (
          visible.map((consent) => {
            return (
              <Card key={consent.id} className="flex flex-col gap-3.5">
                <div className="flex items-start gap-3">
                  <InstitutionAvatar
                    icon={consent.requestingOrg?.name.toLowerCase().includes('bank')
                      ? <Landmark className="size-5" />
                      : <GraduationCap className="size-5" />}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-ink">{consent.requestingOrg?.name || 'Institution'}</h2>
                    <p className="text-sm text-muted-foreground">{consent.purpose}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {consent.status === 'APPROVED' && <VerifiedBadge>Decision saved</VerifiedBadge>}
                  <StatusBadge tone={statusTone[consent.status]}>{consent.status}</StatusBadge>
                </div>
                <dl className="flex flex-col gap-1.5 rounded-xl bg-muted p-3 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Approved claims:</dt>
                    <dd className="font-medium text-ink">
                      {consent.approvedClaims.length > 0 ? consent.approvedClaims.join(', ') : 'None'}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Requested:</dt>
                    <dd className="text-ink">{consent.requestedClaims.join(', ') || 'Not specified'}</dd>
                  </div>
                </dl>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {formatDate(consent.createdAt)}
                </span>
                <PrimaryButton onClick={() => nav.push({ name: 'receipt', id: consent.id })} className="h-11">
                  View Receipt
                  <ChevronRight className="size-4" />
                </PrimaryButton>
              </Card>
            )
          })
        )}
      </ScreenBody>
    </>
  )
}
