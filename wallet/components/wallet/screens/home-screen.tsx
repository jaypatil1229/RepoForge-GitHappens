import { AlertCircle, Bell, ChevronRight, Info, QrCode, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { AppHeader, Card, IconButton, InstitutionAvatar, PrimaryButton, ScreenBody } from '../primitives'
import { useWallet } from '@/lib/wallet-context'
import { credentialClaims, formatDate } from '@/lib/format'
import { useState } from 'react'

export function HomeScreen({ nav, notice }: { nav: Nav; notice?: string }) {
  const wallet = useWallet()
  const [refreshing, setRefreshing] = useState(false)
  const fullName = wallet.user?.fullName || 'Citizen'
  const firstName = fullName.trim().split(/\s+/)[0]
  const activeCredentials = wallet.credentials.filter((credential) => credential.status === 'VALID')

  return (
    <>
      <AppHeader
        action={
          <IconButton
            aria-label="Refresh wallet data"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true)
              try {
                await wallet.refreshData()
              } catch {
                // refreshData stores the error in wallet state for the screen to show.
              } finally {
                setRefreshing(false)
              }
            }}
          >
            <RefreshCw className={`size-[18px] ${refreshing ? 'animate-spin' : ''}`} />
          </IconButton>
        }
      />

      <ScreenBody className="flex flex-col gap-5 pt-5">
        {notice && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-border bg-muted p-3 text-sm text-foreground"
          >
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {notice}
          </div>
        )}

        {wallet.dataError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{wallet.dataError}</span>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your credentials. Your control.</p>
        </div>

        <Card className="flex items-center gap-3.5">
          <span className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-success">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">{activeCredentials.length} Active Credentials</p>
            <p className="text-sm text-muted-foreground">
              Updates {wallet.syncState === 'realtime' ? 'live' : 'automatically'}
            </p>
          </div>
        </Card>

        <section aria-labelledby="credentials-heading" className="flex flex-col gap-3">
          <h2 id="credentials-heading" className="sr-only">
            Your credentials
          </h2>

          {wallet.credentials.length === 0 ? (
            <Card className="text-center text-sm text-muted-foreground">
              {wallet.dataLoading
                ? 'Loading credentials…'
                : wallet.dataError
                  ? 'Credentials could not be loaded.'
                  : 'No credentials have been issued to this account yet.'}
            </Card>
          ) : wallet.credentials.map((credential) => {
            return (
              <Card key={credential.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <InstitutionAvatar
                    label={(credential.issuer?.code || credential.domain || 'CL').slice(0, 4).toUpperCase()}
                    className="text-ink"
                  />
                  {credential.status === 'VALID'
                    ? <span className="rounded-full bg-success px-2.5 py-1 text-xs font-medium text-white">VALID</span>
                    : <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{credential.status}</span>}
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{credential.title}</h3>
                <p className="text-sm text-muted-foreground">{credential.credentialType}</p>
                <p className="mt-3 text-sm text-muted-foreground">{credential.issuer?.name || 'Issuer unavailable'}</p>
                <dl className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Domain</dt>
                    <dd className="font-medium text-ink">{credential.domain}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-muted-foreground">Issued</dt>
                    <dd className="font-medium text-ink">{formatDate(credential.issuanceDate)}</dd>
                  </div>
                </dl>
                <PrimaryButton onClick={() => nav.push({ name: 'credential', id: credential.id })} className="mt-4 h-11">
                  View Credential
                  <ChevronRight className="size-4" />
                </PrimaryButton>
              </Card>
            )
          })}
        </section>

        {wallet.consents.some((consent) => consent.status === 'PENDING') && (
          <Card className="flex items-center gap-3">
            <Bell className="size-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-ink">Pending verification request</p>
              <p className="text-sm text-muted-foreground">
                {wallet.consents.filter((consent) => consent.status === 'PENDING').length} request(s) waiting for your review.
              </p>
            </div>
          </Card>
        )}

        <PrimaryButton onClick={() => nav.push({ name: 'scan' })} className="h-14 rounded-2xl text-base">
          <QrCode className="size-5" />
          Scan Verification Request
        </PrimaryButton>
      </ScreenBody>
    </>
  )
}
