import { BadgeCheck, CheckCircle2, History, MinusCircle } from 'lucide-react'
import type { Nav } from '../wallet-app'
import {
  Card,
  DetailRow,
  PrimaryButton,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  SecondaryButton,
  StatusBadge,
  VerifiedBadge,
} from '../primitives'
import { activities } from '@/lib/wallet-data'

export function ReceiptScreen({ nav, id, fromShare }: { nav: Nav; id: string; fromShare?: boolean }) {
  const activity = activities.find((a) => a.id === id) ?? activities[0]

  return (
    <>
      <ScreenHeader
        title={fromShare ? 'Share Complete' : 'Consent Receipt'}
        onBack={fromShare ? undefined : nav.back}
      />
      <ScreenBody className="flex flex-col gap-5 pt-5">
        {fromShare && (
          <div className="flex flex-col items-center pt-4 text-center">
            <span className="inline-flex size-20 items-center justify-center rounded-full bg-success text-primary-foreground animate-in zoom-in-50 duration-500">
              <CheckCircle2 className="size-10" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-ink">Credential Shared</h1>
            <VerifiedBadge className="mt-3">Verified &amp; Approved</VerifiedBadge>
          </div>
        )}

        <Card className="py-1">
          <div className="flex items-center justify-between border-b border-border py-3">
            <h2 className="text-sm font-semibold text-ink">Consent receipt</h2>
            <StatusBadge tone={activity.status === 'Completed' ? 'success' : 'muted'}>{activity.status}</StatusBadge>
          </div>
          <dl className="divide-y divide-border">
            <DetailRow label="Requester" value={activity.requester} />
            <DetailRow label="Purpose" value={activity.purpose} />
            <div className="py-3">
              <dt className="text-sm text-muted-foreground">Shared</dt>
              <dd>
                <ul className="mt-2 flex flex-col gap-2">
                  {activity.shared.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm font-medium text-ink">
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                      {c}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-sm text-muted-foreground">Not Shared</dt>
              <dd>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {activity.notShared.map((c) => (
                    <li
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      <MinusCircle className="size-3 text-destructive/70" />
                      {c}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <DetailRow label="Access" value={activity.access} />
            <DetailRow label="Status" value={activity.status} />
            <DetailRow label="Timestamp" value={activity.date} />
          </dl>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          This frontend prototype displays a simulated verification result.
        </p>
      </ScreenBody>
      {fromShare && (
        <ScreenFooter>
          <PrimaryButton onClick={() => nav.replaceRoot({ name: 'activity' }, 'forward')}>
            <History className="size-4" />
            View Activity
          </PrimaryButton>
          <SecondaryButton onClick={() => nav.replaceRoot({ name: 'home' })}>Back to Wallet</SecondaryButton>
        </ScreenFooter>
      )}
    </>
  )
}
