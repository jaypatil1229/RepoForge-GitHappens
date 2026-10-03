'use client'

import { useState } from 'react'
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock, Landmark, Loader2, MinusCircle } from 'lucide-react'
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
} from '../primitives'
import { useWallet } from '@/lib/wallet-context'
import { formatDate } from '@/lib/format'

export function ConsentScreen({ nav, requestId }: { nav: Nav; requestId: string }) {
  const wallet = useWallet()
  const request = wallet.currentRequest?.id === requestId ? wallet.currentRequest : null
  const [selectedClaims, setSelectedClaims] = useState<string[]>(request?.requestedClaims || [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!request) {
    return (
      <>
        <ScreenHeader title="Consent Review" onBack={nav.back} />
        <ScreenBody className="flex flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="size-8 text-warning" />
          <h1 className="text-xl font-semibold text-ink">Request details unavailable</h1>
          <p className="text-sm text-muted-foreground">Scan the institution’s QR code again to load the request.</p>
          <PrimaryButton onClick={() => nav.replaceRoot({ name: 'scan' })}>Scan again</PrimaryButton>
        </ScreenBody>
      </>
    )
  }

  const consentRequest = request
  const canApprove = consentRequest.status === 'PENDING' && !consentRequest.alreadyProcessed && consentRequest.eligibility?.isEligible === true

  async function respond(action: 'APPROVE' | 'DENY') {
    setSubmitting(true)
    setError(null)
    try {
      await wallet.respond(consentRequest.id, action, action === 'APPROVE' ? selectedClaims : [])
      nav.replaceRoot({ name: 'receipt', id: consentRequest.id, fromShare: action === 'APPROVE' })
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : 'Your response could not be saved. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ScreenHeader title="Consent Review" onBack={nav.back} />
      <ScreenBody className="flex flex-col gap-5 pt-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Review this request</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nothing is shared until you approve.</p>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <InstitutionAvatar icon={<Landmark className="size-5" />} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{request.requestingOrg?.name || 'Unknown institution'}</p>
              <p className="text-sm text-muted-foreground">{request.requestingOrg?.code || 'Requester details unavailable'}</p>
            </div>
            {request.requestingOrg && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Request loaded</span>
            )}
          </div>
          <dl className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <dt className="text-xs text-muted-foreground">Purpose</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{request.purpose}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Request domain</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{request.domain || 'All'}</dd>
            </div>
            {request.expiresAt && (
              <div>
                <dt className="text-xs text-muted-foreground">Expires</dt>
                <dd className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Clock className="size-3.5 text-warning" />
                  {formatDate(request.expiresAt)}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <section>
          <SectionTitle>Claims requested</SectionTitle>
          {request.requestedClaims.length === 0 ? (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">The institution did not list specific claims.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {request.requestedClaims.map((claim) => {
                const checked = selectedClaims.includes(claim)
                return (
                  <li key={claim}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canApprove || submitting}
                        onChange={(event) => setSelectedClaims((current) => (
                          event.target.checked
                            ? [...current, claim]
                            : current.filter((item) => item !== claim)
                        ))}
                        className="size-4 accent-primary"
                      />
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                      <span className="flex-1">{claim}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {request.eligibility?.matchedCredential && (
          <Card className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Credential that can satisfy this request</p>
            <p className="font-semibold text-ink">{request.eligibility.matchedCredential.title}</p>
            <p className="text-sm text-muted-foreground">{request.eligibility.matchedCredential.credentialType}</p>
          </Card>
        )}

        {request.eligibility?.reason && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft p-3.5 text-sm leading-relaxed text-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>{request.eligibility.reason}</p>
          </div>
        )}

        {request.alreadyProcessed && (
          <StatusBadge tone="muted">This request was already {request.status.toLowerCase()}.</StatusBadge>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted p-3.5 text-sm leading-relaxed text-foreground">
          <MinusCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>Only the claims you select will be approved. Your decision is saved to the CredLink backend.</p>
        </div>

        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
      </ScreenBody>
      {!request.alreadyProcessed && request.status === 'PENDING' && (
        <ScreenFooter>
          <PrimaryButton
            disabled={!canApprove || submitting || (consentRequest.requestedClaims.length > 0 && selectedClaims.length === 0)}
            onClick={() => void respond('APPROVE')}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
            Approve & Share Selected Claims
          </PrimaryButton>
          <SecondaryButton disabled={submitting} onClick={() => void respond('DENY')}>
            {submitting ? 'Saving…' : 'Deny Request'}
          </SecondaryButton>
        </ScreenFooter>
      )}
    </>
  )
}
