import { Bell, ChevronRight, Info, QrCode, ShieldCheck } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { AppHeader, Card, IconButton, InstitutionAvatar, PrimaryButton, ScreenBody, VerifiedBadge } from '../primitives'
import { college, credentials, CREDENTIAL_STATUS, GRADUATION_YEAR, student } from '@/lib/wallet-data'

export function HomeScreen({ nav, notice }: { nav: Nav; notice?: string }) {
  const [degree, transcript] = credentials

  return (
    <>
      <AppHeader
        action={
          <IconButton className="relative">
            <Bell className="size-[18px]" />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-success ring-2 ring-background" />
            <span className="sr-only">Notifications</span>
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

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back, {student.firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your credentials. Your control.</p>
        </div>

        <Card className="flex items-center gap-3.5">
          <span className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-success">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">2 Active Credentials</p>
            <p className="text-sm text-muted-foreground">Issued by {college.name}</p>
          </div>
        </Card>

        <section aria-labelledby="credentials-heading" className="flex flex-col gap-3">
          <h2 id="credentials-heading" className="sr-only">
            Your credentials
          </h2>

          <Card className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <InstitutionAvatar label={college.abbreviation} className="text-ink" />
              <VerifiedBadge>{CREDENTIAL_STATUS}</VerifiedBadge>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{degree.title}</h3>
            <p className="text-sm text-muted-foreground">{degree.subtitle}</p>
            <p className="mt-3 text-sm text-muted-foreground">{college.name}</p>
            <dl className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Domain</dt>
                <dd className="font-medium text-ink">COLLEGE</dd>
              </div>
              <div className="text-right">
                <dt className="text-muted-foreground">Graduation Year</dt>
                <dd className="font-medium text-ink">{GRADUATION_YEAR}</dd>
              </div>
            </dl>
            <PrimaryButton onClick={() => nav.push({ name: 'credential', id: degree.id })} className="mt-4 h-11">
              View Credential
              <ChevronRight className="size-4" />
            </PrimaryButton>
          </Card>

          <Card className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <InstitutionAvatar label={college.abbreviation} className="text-ink" />
              <VerifiedBadge>{CREDENTIAL_STATUS}</VerifiedBadge>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{transcript.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{college.name}</p>
            <PrimaryButton onClick={() => nav.push({ name: 'credential', id: transcript.id })} className="mt-4 h-11">
              View Credential
              <ChevronRight className="size-4" />
            </PrimaryButton>
          </Card>
        </section>

        <PrimaryButton onClick={() => nav.push({ name: 'scan' })} className="h-14 rounded-2xl text-base">
          <QrCode className="size-5" />
          Scan Verification Request
        </PrimaryButton>
      </ScreenBody>
    </>
  )
}
