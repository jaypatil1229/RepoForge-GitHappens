'use client'

import { useState } from 'react'
import { ChevronRight, Clock, GraduationCap, Inbox, Landmark } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { AppHeader, Card, InstitutionAvatar, PrimaryButton, ScreenBody, StatusBadge, VerifiedBadge } from '../primitives'
import { activities, type ActivityStatus } from '@/lib/wallet-data'
import { cn } from '@/lib/utils'

const filters = ['All', 'Completed', 'Active', 'Expired'] as const
type Filter = (typeof filters)[number]

const statusTone: Record<ActivityStatus, 'success' | 'warning' | 'muted'> = {
  Completed: 'success',
  Active: 'warning',
  Expired: 'muted',
}

export function ActivityScreen({ nav }: { nav: Nav }) {
  const [filter, setFilter] = useState<Filter>('All')
  const visible = activities.filter((a) => filter === 'All' || a.status === filter)

  return (
    <>
      <AppHeader subtitle="Sharing Activity" />
      <div className="shrink-0 px-5 pt-5 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sharing Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every time you share, a consent receipt is saved here.</p>
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

      <ScreenBody className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="font-medium text-ink">No {filter.toLowerCase()} requests</p>
            <p className="text-sm text-muted-foreground">Requests you approve will appear here.</p>
          </div>
        ) : (
          visible.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3.5">
              <div className="flex items-start gap-3">
                <InstitutionAvatar
                  icon={a.id === 'apex' ? <Landmark className="size-5" /> : <GraduationCap className="size-5" />}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-ink">{a.requester}</h2>
                  <p className="text-sm text-muted-foreground">{a.purpose}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.result && <VerifiedBadge>{a.result}</VerifiedBadge>}
                <StatusBadge tone={statusTone[a.status]}>{a.status}</StatusBadge>
              </div>
              <dl className="flex flex-col gap-1.5 rounded-xl bg-muted p-3 text-sm">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Shared:</dt>
                  <dd className="font-medium text-ink">{a.sharedSummary}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Access:</dt>
                  <dd className="text-ink">{a.access}</dd>
                </div>
              </dl>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {a.date}
              </span>
              <PrimaryButton onClick={() => nav.push({ name: 'receipt', id: a.id })} className="h-11">
                View Receipt
                <ChevronRight className="size-4" />
              </PrimaryButton>
            </Card>
          ))
        )}
      </ScreenBody>
    </>
  )
}
