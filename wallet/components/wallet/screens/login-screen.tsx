'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Loader2, LockKeyhole } from 'lucide-react'
import { CredLinkMark, PrimaryButton, ScreenHeader, ScreenBody } from '../primitives'
import type { Nav } from '../wallet-app'

export function LoginScreen({
  nav,
  onSignIn,
}: {
  nav: Nav
  onSignIn: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSignIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ScreenHeader title="Citizen sign in" onBack={nav.back} />
      <ScreenBody className="flex flex-1 flex-col justify-center gap-6">
        <div className="flex flex-col items-center text-center">
          <CredLinkMark size="lg" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Open your wallet</h1>
          <p className="mt-2 max-w-72 text-sm leading-relaxed text-muted-foreground">
            Sign in with your CredLink citizen account to load your credentials and consent history.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Email
            <input
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Password
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-xl border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={submitting} className="mt-1">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
            {submitting ? 'Signing in…' : 'Sign in securely'}
            {!submitting && <ArrowRight className="size-4" />}
          </PrimaryButton>
        </form>
      </ScreenBody>
    </>
  )
}
