import { Fingerprint, Lightbulb, Lock, Smartphone } from 'lucide-react'
import { AppHeader, Card, CredLinkMark, InstitutionAvatar, ScreenBody, SectionTitle, VerifiedBadge } from '../primitives'
import { college, student } from '@/lib/wallet-data'

const security = [
  { icon: Lock, label: 'Wallet Status', value: 'Protected' },
  { icon: Fingerprint, label: 'Biometric Access', value: 'Enabled' },
  { icon: Smartphone, label: 'Current Device', value: 'This Phone' },
]

export function ProfileScreen() {
  return (
    <>
    <AppHeader subtitle="Profile & Security" />
    <ScreenBody className="flex flex-col gap-6 pt-5">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="inline-flex size-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
        >
          {student.initials}
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{student.name}</h1>
          <p className="text-sm text-muted-foreground">Student · {college.name}</p>
        </div>
      </div>

      <section>
        <SectionTitle>Security</SectionTitle>
        <Card className="divide-y divide-border py-0">
          {security.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-3.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-success-soft text-success">
                <Icon className="size-[18px]" />
              </span>
              <span className="flex-1 text-sm text-foreground">{label}</span>
              <span className="text-sm font-semibold text-ink">{value}</span>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle>Trusted issuer</SectionTitle>
        <Card className="flex items-center gap-3">
          <InstitutionAvatar label={college.abbreviation} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{college.name}</p>
            <p className="text-sm text-muted-foreground">Trusted for Education</p>
          </div>
          <VerifiedBadge>Active</VerifiedBadge>
        </Card>
      </section>

      <Card className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-semibold text-ink">Recovery (not yet available)</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Lost-device recovery and trusted guardian recovery are planned for the production version.
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CredLinkMark size="sm" className="size-6 rounded-md text-[9px]" />
        CredLink Wallet · Part of CredLink Network
      </div>
    </ScreenBody>
    </>
  )
}
