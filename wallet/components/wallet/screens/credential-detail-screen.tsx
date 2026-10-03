import { BadgeCheck, ChevronDown, Info, Landmark, ShieldCheck, Share2 } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { Card, DetailRow, PrimaryButton, ScreenBody, ScreenFooter, ScreenHeader, SectionTitle } from '../primitives'
import { college, credentials, CREDENTIAL_STATUS } from '@/lib/wallet-data'

export function CredentialDetailScreen({ nav, id }: { nav: Nav; id: string }) {
  const credential = credentials.find((c) => c.id === id) ?? credentials[0]

  return (
    <>
      <ScreenHeader title="Credential" onBack={nav.back} />
      <ScreenBody className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink">{credential.fullTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{college.name}</p>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl bg-success-soft p-4">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-success text-primary-foreground">
            <BadgeCheck className="size-6" />
          </span>
          <div>
            <p className="font-semibold text-ink">Verified Education Issuer</p>
            <p className="text-sm text-forest">Issued by {college.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5">
            <ShieldCheck className="size-5 text-success" />
            <p className="mt-2 text-xs text-muted-foreground">Credential Status</p>
            <p className="text-sm font-semibold text-success">{CREDENTIAL_STATUS}</p>
          </Card>
          <Card className="p-3.5">
            <Landmark className="size-5 text-success" />
            <p className="mt-2 text-xs text-muted-foreground">Issuer Trust</p>
            <p className="text-sm font-semibold text-ink">Trusted for Education</p>
          </Card>
        </div>

        <section>
          <SectionTitle>Credential claims</SectionTitle>
          <Card className="py-1">
            <dl className="divide-y divide-border">
              {credential.claims.map((claim) => (
                <DetailRow key={claim.label} label={claim.label} value={claim.value} />
              ))}
            </dl>
          </Card>
        </section>

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted p-3.5 text-sm leading-relaxed text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            This academic credential was issued by NIT and is ready to be presented to authorized institutions.
          </p>
        </div>

        <details className="group rounded-2xl border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            Technical details
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <dl className="divide-y divide-border border-t border-border px-4">
            {credential.technical.map((row) => (
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
          Share When Requested
        </PrimaryButton>
      </ScreenFooter>
    </>
  )
}
