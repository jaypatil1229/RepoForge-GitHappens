'use client'

import { useState } from 'react'
import { Fingerprint, Lightbulb, Lock, LogOut, Radio, RefreshCw } from 'lucide-react'
import { AppHeader, Card, CredLinkMark, InstitutionAvatar, PrimaryButton, ScreenBody, SectionTitle } from '../primitives'
import { useWallet } from '@/lib/wallet-context'

export function ProfileScreen() {
  const wallet = useWallet()
  const [signingOut, setSigningOut] = useState(false)
  const name = wallet.user?.fullName || 'Citizen'
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const issuers = Array.from(new Map(
    wallet.credentials.flatMap((credential) => credential.issuer ? [[credential.issuer.id, credential.issuer] as const] : []),
  ).values())

  async function signOut() {
    setSigningOut(true)
    try {
      await wallet.signOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      <AppHeader subtitle="Profile & Security" />
      <ScreenBody className="flex flex-col gap-6 pt-5">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
          >
            {initials || 'C'}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{name}</h1>
            <p className="truncate text-sm text-muted-foreground">{wallet.user?.email}</p>
          </div>
        </div>

        <section>
          <SectionTitle>Wallet status</SectionTitle>
          <Card className="divide-y divide-border py-0">
            <div className="flex items-center gap-3 py-3.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-success-soft text-success">
                <Lock className="size-[18px]" />
              </span>
              <span className="flex-1 text-sm text-foreground">Account session</span>
              <span className="text-sm font-semibold text-ink">Authenticated</span>
            </div>
            <div className="flex items-center gap-3 py-3.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-success-soft text-success">
                {wallet.syncState === 'realtime' ? <Radio className="size-[18px]" /> : <RefreshCw className="size-[18px]" />}
              </span>
              <span className="flex-1 text-sm text-foreground">Database updates</span>
              <span className="text-sm font-semibold text-ink">
                {wallet.syncState === 'realtime' ? 'Live' : wallet.syncState === 'offline' ? 'Offline' : 'Auto-refresh'}
              </span>
            </div>
            <div className="flex items-center gap-3 py-3.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Fingerprint className="size-[18px]" />
              </span>
              <span className="flex-1 text-sm text-foreground">Biometric unlock</span>
              <span className="text-sm font-semibold text-muted-foreground">Not configured</span>
            </div>
          </Card>
        </section>

        {issuers.length > 0 && (
          <section>
            <SectionTitle>Credential issuers</SectionTitle>
            <Card className="flex flex-col gap-3">
              {issuers.map((issuer) => (
                <div key={issuer.id} className="flex items-center gap-3">
                  <InstitutionAvatar label={(issuer.name || 'CL').slice(0, 3).toUpperCase()} />
                  <p className="min-w-0 flex-1 truncate font-semibold text-ink">{issuer.name}</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Issuer record</span>
                </div>
              ))}
            </Card>
          </section>
        )}

        <Card className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-ink">Protect your sign-in</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              This device stores the session needed to load your wallet. Sign out before sharing this device.
            </p>
          </div>
        </Card>

        <PrimaryButton disabled={signingOut} onClick={() => void signOut()}>
          <LogOut className="size-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </PrimaryButton>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CredLinkMark size="sm" className="size-6 rounded-md text-[9px]" />
          CredLink Wallet
        </div>
      </ScreenBody>
    </>
  )
}
