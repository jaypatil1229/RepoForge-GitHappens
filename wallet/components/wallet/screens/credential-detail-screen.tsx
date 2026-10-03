import { BadgeCheck, ChevronDown, Info, Landmark, ShieldCheck, Share2 } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { Card, DetailRow, PrimaryButton, ScreenBody, ScreenFooter, ScreenHeader, SectionTitle } from '../primitives'
import { useWallet } from '@/lib/wallet-context'
import { credentialClaims, formatDate } from '@/lib/format'

export function CredentialDetailScreen({ nav, id }: { nav: Nav; id: string }) {
  const { credentials } = useWallet()
  const credential = credentials.find((item) => item.id === id)
  if (!credential) {
    return (
      <>
        <ScreenHeader title="Credential" onBack={nav.back} />
        <ScreenBody className="flex flex-col items-center justify-center gap-3 text-center">
          <Info className="size-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-ink">Credential unavailable</h1>
          <p className="text-sm text-muted-foreground">It may have been revoked or removed. Refresh your wallet and try again.</p>
          <PrimaryButton onClick={nav.back}>Back to Wallet</PrimaryButton>
        </ScreenBody>
      </>
    )
  }
  const claims = credentialClaims(credential)
  const technical = [
    { label: 'Credential ID', value: credential.id },
    { label: 'Issuer DID', value: credential.issuer?.did || 'Not available' },
    { label: 'Status', value: credential.status },
    { label: 'Issuance Date', value: formatDate(credential.issuanceDate) },
  ]

  return (
    <>
      <ScreenHeader title="Credential" onBack={nav.back} />
      <ScreenBody className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink">{credential.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{credential.issuer?.name || 'Issuer unavailable'}</p>
        </div>

        <div className={`flex items-center gap-3.5 rounded-2xl p-4 ${credential.status === 'VALID' ? 'bg-success-soft' : 'bg-muted'}`}>
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-success text-primary-foreground">
            <BadgeCheck className="size-6" />
          </span>
          <div>
            <p className="font-semibold text-ink">{credential.status === 'VALID' ? 'Active credential' : 'Credential is not active'}</p>
            <p className="text-sm text-muted-foreground">Issued by {credential.issuer?.name || 'an authorized issuer'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5">
            <ShieldCheck className="size-5 text-success" />
            <p className="mt-2 text-xs text-muted-foreground">Credential Status</p>
            <p className={`text-sm font-semibold ${credential.status === 'VALID' ? 'text-success' : 'text-destructive'}`}>{credential.status}</p>
          </Card>
          <Card className="p-3.5">
            <Landmark className="size-5 text-success" />
            <p className="mt-2 text-xs text-muted-foreground">Domain</p>
            <p className="text-sm font-semibold text-ink">{credential.domain}</p>
          </Card>
        </div>

        <section>
          <SectionTitle>Credential claims</SectionTitle>
          <Card className="py-1">
            <dl className="divide-y divide-border">
              {claims.map((claim) => (
                <DetailRow key={claim.label} label={claim.label} value={claim.value} />
              ))}
            </dl>
          </Card>
        </section>

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted p-3.5 text-sm leading-relaxed text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Your credential details are loaded from your CredLink account. A credential is shared only after you approve a specific request.
          </p>
        </div>

        <details className="group rounded-2xl border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            Technical details
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <dl className="divide-y divide-border border-t border-border px-4">
            {technical.map((row) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={<span className="font-mono text-xs break-all">{row.value}</span>}
              />
            ))}
          </dl>
        </details>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={() => nav.push({ name: 'scan' })}>
          <Share2 className="size-4" />
          Scan a Request
        </PrimaryButton>
      </ScreenFooter>
    </>
  )
}
