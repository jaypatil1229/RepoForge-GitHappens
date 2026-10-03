import { Landmark, Lock, QrCode } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { PrimaryButton, ScreenBody, ScreenHeader } from '../primitives'

const corners = [
  'top-5 left-5 border-t-[3px] border-l-[3px] rounded-tl-2xl',
  'top-5 right-5 border-t-[3px] border-r-[3px] rounded-tr-2xl',
  'bottom-5 left-5 border-b-[3px] border-l-[3px] rounded-bl-2xl',
  'bottom-5 right-5 border-b-[3px] border-r-[3px] rounded-br-2xl',
]

export function ScanScreen({ nav }: { nav: Nav }) {
  return (
    <>
      <ScreenHeader title="Scan Request" onBack={nav.back} />
      <ScreenBody className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Scan QR Request</h1>
          <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
            Scan a verification request QR code from an authorized institution.
          </p>
        </div>

        <div
          role="img"
          aria-label="Camera viewfinder (demo)"
          className="relative aspect-square w-full overflow-hidden rounded-3xl bg-ink"
        >
          {corners.map((c) => (
            <span key={c} className={`absolute size-12 border-white ${c}`} />
          ))}
          <QrCode className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-white/15" />
          <span className="animate-scan-line absolute inset-x-8 h-0.5 rounded-full bg-success" />
        </div>

        <p className="text-center text-sm font-medium text-foreground">Point your camera at a CredLink QR code</p>

        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Demo only</p>
          <PrimaryButton onClick={() => nav.push({ name: 'consent' })}>
            <Landmark className="size-4" />
            Simulate Apex Imperial Bank QR
          </PrimaryButton>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted p-3.5 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-ink" />
          <p>
            CredLink Wallet shows the requester, purpose, and requested information before anything is shared.
          </p>
        </div>
      </ScreenBody>
    </>
  )
}
