'use client';

import { ArrowRight, Loader2, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthShell } from '@/components/marketing/auth-shell';
import { Banner } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input } from '@/components/ui/field';
import { previewAccounts, TransportError, type DemoAccountSeed } from '@/lib/data';
import { useDemo } from '@/lib/demo/demo-provider';
import type { AccountRole } from '@/lib/types';

const roleLabel: Record<AccountRole, string> = {
  CITIZEN: 'Citizen',
  COLLEGE: 'College',
  BANK: 'Bank',
  HOSPITAL: 'Hospital',
  EMPLOYER: 'Employer',
  ADMIN: 'Network admin',
};

interface Feedback {
  tone: 'danger' | 'warning' | 'info' | 'neutral';
  title: string;
  message?: string;
  details?: { field: string; message: string }[];
}

export default function LoginPage() {
  const router = useRouter();
  const { enter, signIn } = useDemo();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [offline, setOffline] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState(false);

  const openContext = (account: DemoAccountSeed) => {
    enter(account);
    router.push('/portal');
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter an email address in the format name@example.org.';
    }
    if (password.trim().length === 0) nextErrors.password = 'Enter a password.';
    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      // Always authenticate through the backend. Preview contexts are opt-in only,
      // via the explicit buttons below, and must never intercept a real sign-in.
      const result = await signIn({ email: email.trim(), password, simulateOffline: offline });
      if (!result.ok) {
        setFeedback({
          tone: 'danger',
          title: result.error ?? 'Sign-in failed.',
          message: result.details?.[0]?.message,
          details: result.details,
        });
        return;
      }
      router.push('/portal');
    } catch (error) {
      if (error instanceof TransportError) {
        setFeedback({
          tone: 'warning',
          title: 'The service could not be reached.',
          message: 'The API returns 503 in this situation. In the preview, the switch above produces the same state.',
        });
        return;
      }
      setFeedback({ tone: 'danger', title: 'Something went wrong.', message: 'Try again in a moment.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      panelTitle="Credentials that hold up at the next institution."
      panelPoints={[
        'Institutions issue signed records inside an allow-list of credential types.',
        'People see the requester, the purpose and the exact claims before deciding.',
        'Every verification reports the checks it ran and consumes the consent it used.',
      ]}
      title="Open the portal"
      description="Sign in with your CredLink account. Seeded preview contexts are also available below for a synthetic, non-authenticated walkthrough."
      footer={
        <p>
          Need an account?{' '}
          <Link href="/register" className="font-medium text-forest-800 hover:text-forest-700">
            Register a citizen or institutional account
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email address" htmlFor="login-email" error={errors.email}>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="citizen@credlink.org"
            value={email}
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="login-password"
          error={errors.password}
          hint="Preview accounts accept any password. Live accounts use your real credentials."
        >
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : 'login-password-hint'}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <label className="flex items-start gap-2.5 rounded-control border border-line-200 bg-paper-50 px-3 py-2.5 text-ui text-ink-600">
          <Checkbox
            className="mt-0.5"
            checked={offline}
            onChange={(event) => setOffline(event.target.checked)}
          />
          <span className="flex items-center gap-1.5">
            <WifiOff aria-hidden className="size-3.5" />
            Simulate an unreachable service (the API returns 503)
          </span>
        </label>

        {feedback ? (
          <Banner
            tone={feedback.tone === 'neutral' ? 'neutral' : feedback.tone}
            title={feedback.title}
            icon={<WifiOff aria-hidden className="size-4" />}
          >
            {feedback.message ? <p>{feedback.message}</p> : null}
          </Banner>
        ) : null}

        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {pending ? 'Checking…' : 'Continue'}
          {!pending ? <ArrowRight aria-hidden className="size-4" /> : null}
        </Button>
      </form>

      <section aria-labelledby="contexts-heading" className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="contexts-heading" className="text-ui font-semibold text-ink-950">
            Or open a preview context directly
          </h2>
          <span className="text-micro text-ink-500">Synthetic accounts</span>
        </div>
        <p className="mt-1 text-micro leading-relaxed text-ink-500">
          These are not sessions. Selecting one sets which synthetic account the portal is browsing as; no credential
          is exchanged.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {previewAccounts.map((account) => (
            <li key={account.key}>
              <button
                type="button"
                onClick={() => openContext(account)}
                className="group flex w-full flex-col gap-1 rounded-panel border border-line-200 bg-paper-0 px-3.5 py-3 text-left transition-colors hover:border-line-300 hover:bg-paper-50"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-ui font-medium text-ink-950">{account.fullName}</span>
                  <span className="shrink-0 rounded-full border border-line-200 bg-paper-50 px-2 py-0.5 text-micro text-ink-600">
                    {roleLabel[account.role]}
                  </span>
                </span>
                <span className="text-micro leading-relaxed text-ink-500">{account.headline}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AuthShell>
  );
}