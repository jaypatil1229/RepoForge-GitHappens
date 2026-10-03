'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { Nav } from '../wallet-app'
import { CredLinkMark } from '../primitives'
import { cn } from '@/lib/utils'

const steps = ['Validating credential', 'Checking NIT issuer trust', 'Checking credential status', 'Recording consent']
const STEP_MS = 750

export function ProcessingScreen({ nav }: { nav: Nav }) {
  const [done, setDone] = useState(0)

  const finish = useEffectEvent(() => {
    nav.replaceRoot({ name: 'receipt', id: 'apex', fromShare: true }, 'forward')
  })

  useEffect(() => {
    if (done < steps.length) {
      const t = setTimeout(() => setDone((d) => d + 1), STEP_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => finish(), 450)
    return () => clearTimeout(t)
  }, [done])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <CredLinkMark size="lg" />
      <p className="mt-4 text-sm font-semibold tracking-tight text-ink">CredLink Wallet</p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Sharing securely</h1>
      <p className="mt-1 text-sm text-muted-foreground">Please keep the app open.</p>

      <ol className="mt-8 flex w-full flex-col gap-2.5 text-left" aria-live="polite">
        {steps.map((step, i) => {
          const isDone = i < done
          const isActive = i === done
          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors duration-300',
                isDone && 'border-transparent bg-success-soft font-medium text-ink',
                isActive && 'border-border bg-card font-medium text-ink',
                !isDone && !isActive && 'border-border text-muted-foreground',
              )}
            >
              {isDone ? (
                <CheckCircle2 className="size-5 shrink-0 text-success animate-in zoom-in-50" />
              ) : isActive ? (
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="size-5 shrink-0 rounded-full border-2 border-border" />
              )}
              {step}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
