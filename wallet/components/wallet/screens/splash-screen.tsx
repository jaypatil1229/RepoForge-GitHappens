import { ArrowRight } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { CredLinkMark, PrimaryButton } from '../primitives'

export function SplashScreen({ nav }: { nav: Nav }) {
  return (
    <div className="flex flex-1 flex-col px-6 pt-16 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <CredLinkMark size="xl" />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-ink">CredLink Wallet</h1>
        <p className="mt-2 text-base font-medium text-ink">Your credentials. Your control.</p>
        <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Unified Citizen Digital Identity
        </p>
        <p className="mt-5 max-w-72 text-sm leading-relaxed text-pretty text-muted-foreground">
          Securely store and selectively share your verified academic credentials.
        </p>
      </div>
      <div className="flex flex-col gap-5">
        <PrimaryButton onClick={() => nav.replaceRoot({ name: 'home' }, 'forward')}>
          Open Wallet
          <ArrowRight className="size-4" />
        </PrimaryButton>
        <p className="text-center text-xs text-muted-foreground">Part of the CredLink Network</p>
      </div>
    </div>
  )
}
