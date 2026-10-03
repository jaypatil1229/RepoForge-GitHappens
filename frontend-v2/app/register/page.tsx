'use client';

import { ArrowRight, Check, Clock, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthShell } from '@/components/marketing/auth-shell';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Banner, Panel } from '@/components/ui/surface';
import type { RegisterResult } from '@/lib/data';
import { useDataClient } from '@/lib/demo/demo-provider';
import type { AccountRole, OrgDomain } from '@/lib/types';

const institutionDomains: { value: Extract<OrgDomain, 'college' | 'hospital' | 'bank' | 'employer'>; label: string; role: AccountRole }[] = [
  { value: 'college', label: 'College or university', role: 'COLLEGE' },
  { value: 'hospital', label: 'Hospital or health network', role: 'HOSPITAL' },
  { value: 'bank', label: 'Bank or financial institution', role: 'BANK' },
  { value: 'employer', label: 'Employer', role: 'EMPLOYER' },
];

type Mode = 'CITIZEN' | 'INSTITUTION';

export default function RegisterPage() {
  const router = useRouter();
  const client = useDataClient();

  const [mode, setMode] = useState<Mode>('CITIZEN');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgDomain, setOrgDomain] = useState<OrgDomain>('college');
  const [registrationRef, setRegistrationRef] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.trim().length < 8) next.password = 'Use at least 8 characters.';
    if (mode === 'INSTITUTION') {
      if (orgName.trim().length < 3) next.orgName = 'Enter the registered institution name.';
      if (orgCode.trim().length < 3) next.orgCode = 'Enter the institution registration code.';
    }
    setErrors(next);
    setError(null);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const role =
        mode === 'CITIZEN'
          ? 'CITIZEN'
          : (institutionDomains.find((item) => item.value === orgDomain)?.role ?? 'COLLEGE');
      const response = await client.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        requestedRole: role,
      });
      if (!response.success || !response.data) {
        setError(response.error ?? 'Registration failed.');
        return;
      }
      setResult(response.data);
    } catch {
      setError('The service could not be reached. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <AuthShell
        panelTitle="Nothing is issued automatically."
        panelPoints={[
          'A new account is created before any organization exists.',
          'An organization starts in PENDING until a network administrator approves it.',
          'Only an approved issuer with a matching credential type can sign a record.',
        ]}
        title={mode === 'CITIZEN' ? 'Account created' : 'Account created — one step remains'}
        description="This preview does not store a session or issue a token, so the next step is described rather than performed."
        footer={
          <p>
            <Link href="/login" className="font-medium text-forest-800 hover:text-forest-700">
              Back to sign in
            </Link>
          </p>
        }
      >
        <div className="flex flex-col gap-5">
          <Panel className="p-5">
            <p className="eyebrow">Account</p>
            <dl className="mt-3 flex flex-col gap-2 text-ui">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Name</dt>
                <dd className="text-ink-950">{result.user.fullName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Email</dt>
                <dd className="text-ink-950">{result.user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Role assigned</dt>
                <dd className="text-ink-950">{result.assignedRole}</dd>
              </div>
              {result.roleDowngraded ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Requested role</dt>
                  <dd className="text-ink-950 line-through">{result.requestedRole}</dd>
                </div>
              ) : null}
            </dl>
            {result.roleDowngraded ? (
              <p className="mt-3 text-micro leading-relaxed text-ink-500">
                The API downgrades a self-assigned ADMIN role to CITIZEN. Network administration is not obtainable
                through registration.
              </p>
            ) : null}
          </Panel>

          {mode === 'INSTITUTION' ? (
            <Panel className="p-5">
              <p className="eyebrow">Step 2 — Organization registration</p>
              <p className="mt-2 text-ui text-ink-600">
                In the connected build this call runs while authenticated and creates the organization in a
                <span className="font-medium text-ink-950"> PENDING </span>
                state. Nothing here is submitted.
              </p>
              <dl className="mt-4 flex flex-col gap-2 border-t border-line-200 pt-4 text-ui">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Institution</dt>
                  <dd className="text-ink-950">{orgName || 'Not provided'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Code</dt>
                  <dd className="text-ink-950">{orgCode ? orgCode.toUpperCase() : 'Not provided'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Domain</dt>
                  <dd className="text-ink-950">
                    {institutionDomains.find((item) => item.value === orgDomain)?.label}
                  </dd>
                </div>
                {registrationRef ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-600">Registration reference</dt>
                    <dd className="text-ink-950">{registrationRef}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-600">Verification status</dt>
                  <dd>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-700/25 bg-warning-50 px-2 py-0.5 text-micro font-medium text-warning-700">
                      <Clock aria-hidden className="size-3" />
                      Awaiting network approval
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-micro leading-relaxed text-ink-500">
                Until an administrator approves the organization and grants it issuer authorization, the institution
                cannot sign a credential. The portal explains this state instead of showing an empty dashboard.
              </p>
            </Panel>
          ) : (
            <Banner tone="info" icon={<Info aria-hidden className="size-4" />} title="What a citizen account can do">
              Hold records issued by institutions, review verification requests, approve or decline claim by claim, and
              withdraw an approval that is still usable. It cannot issue or revoke credentials.
            </Banner>
          )}

          <div className="flex flex-wrap gap-3">
            {mode === 'CITIZEN' ? (
              <Button size="lg" onClick={() => router.push('/login')}>
                Open the preview portal
                <ArrowRight aria-hidden className="size-4" />
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={() => router.push('/how-it-works')}>
                Read what happens after approval
              </Button>
            )}
            <Button size="lg" variant="tertiary" onClick={() => setResult(null)}>
              Start again
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      panelTitle="One account, then one approval."
      panelPoints={[
        'Registration creates the account first. An institution has no organization until a second step succeeds.',
        'Organizations always start in PENDING; an administrator approves or declines them.',
        'Issuer authorization is a separate grant from organization approval.',
      ]}
      title="Create an account"
      description="Registration runs against the mock data layer in this build. It demonstrates the real validation and role rules without creating anything persistent."
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-forest-800 hover:text-forest-700">
            Sign in
          </Link>
        </p>
      }
    >
      <div role="radiogroup" aria-label="Account type" className="grid gap-2 sm:grid-cols-2">
        {(
          [
            { value: 'CITIZEN' as Mode, title: 'Citizen', body: 'Hold and control records issued to you.' },
            { value: 'INSTITUTION' as Mode, title: 'Institution', body: 'Issue records and verify requests.' },
          ] satisfies { value: Mode; title: string; body: string }[]
        ).map((option) => {
          const selected = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(option.value)}
              className={
                'flex flex-col gap-1 rounded-panel border px-4 py-3 text-left transition-colors ' +
                (selected ? 'border-forest-800/40 bg-forest-50' : 'border-line-200 bg-paper-0 hover:border-line-300')
              }
            >
              <span className="flex items-center gap-2 text-ui font-medium text-ink-950">
                {selected ? <Check aria-hidden className="size-3.5 text-forest-800" /> : null}
                {option.title}
              </span>
              <span className="text-micro text-ink-600">{option.body}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <Field label="Full name" htmlFor="reg-name" error={errors.fullName}>
          <Input id="reg-name" value={fullName} invalid={Boolean(errors.fullName)} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email address" htmlFor="reg-email" error={errors.email}>
          <Input
            id="reg-email"
            type="email"
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="reg-password" error={errors.password} hint="At least 8 characters.">
          <Input
            id="reg-password"
            type="password"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="reg-phone" optional>
          <Input id="reg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>

        {mode === 'INSTITUTION' ? (
          <fieldset className="mt-2 flex flex-col gap-4 border-t border-line-200 pt-5">
            <legend className="eyebrow">Institution details</legend>
            <Field label="Institution name" htmlFor="reg-org" error={errors.orgName}>
              <Input id="reg-org" value={orgName} invalid={Boolean(errors.orgName)} onChange={(e) => setOrgName(e.target.value)} />
            </Field>
            <Field
              label="Registration code"
              htmlFor="reg-code"
              error={errors.orgCode}
              hint="The registry code your institution is known by, for example OX-0448."
            >
              <Input id="reg-code" value={orgCode} invalid={Boolean(errors.orgCode)} onChange={(e) => setOrgCode(e.target.value)} />
            </Field>
            <Field label="Institution type" htmlFor="reg-domain">
              <Select id="reg-domain" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value as OrgDomain)}>
                {institutionDomains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Registration reference" htmlFor="reg-ref" optional hint="Regulator or registry reference, if you have one.">
              <Input id="reg-ref" value={registrationRef} onChange={(e) => setRegistrationRef(e.target.value)} />
            </Field>
          </fieldset>
        ) : null}

        {error ? <Banner tone="danger" title={error} /> : null}

        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {pending ? 'Creating…' : mode === 'CITIZEN' ? 'Create citizen account' : 'Create institution account'}
        </Button>
      </form>
    </AuthShell>
  );
}