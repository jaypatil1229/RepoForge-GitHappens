'use client';

import { ArrowLeft, Inbox, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BlockedPanel, NoticeRow, PageBody } from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { DomainMark } from '@/components/ui/domain';
import { Panel, PanelHeader, PageHeader, DefinitionList, DefinitionRow } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { claimEntries, claimLabel } from '@/lib/claims';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type Mode = 'known' | 'reference';

export default function NewRequestPage() {
  const client = useDataClient();
  const { actor, profile, organization } = useDemo();
  const router = useRouter();
  const toast = useToast();

  const canRequest = Boolean(actor && actor.organizationId && actor.memberRole && actor.memberRole !== 'MEMBER');

  const credentials = useQuery(() => client.listCredentials({ limit: 100 }), ['request-credentials']);
  const citizens = useQuery(() => client.listCitizens(), ['request-citizens']);

  const [mode, setMode] = useState<Mode>('known');
  const [credentialId, setCredentialId] = useState('');
  const [manualCredentialId, setManualCredentialId] = useState('');
  const [manualCitizenId, setManualCitizenId] = useState('');
  const [manualClaims, setManualClaims] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const records = credentials.state.status === 'ready' ? credentials.state.data.items : [];
  const selectedRecord = mode === 'known' ? records.find((item) => item.id === credentialId) ?? null : null;
  const recordClaims = useMemo(() => claimEntries(selectedRecord?.claims), [selectedRecord]);

  useEffect(() => {
    setSelectedClaims(new Set(recordClaims.map((entry) => entry.key)));
  }, [recordClaims]);

  const manualClaimList = manualClaims
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const effectiveCitizenId = mode === 'known' ? selectedRecord?.subjectId ?? '' : manualCitizenId;
  const effectiveCredentialId = mode === 'known' ? credentialId : manualCredentialId.trim();
  const effectiveClaims = mode === 'known' ? Array.from(selectedClaims) : manualClaimList;
  const invalid = !effectiveCitizenId || !effectiveCredentialId || effectiveClaims.length === 0 || purpose.trim().length < 12;

  if (!canRequest) {
    return (
      <PageBody>
        <Link href="/portal/verification" className="inline-flex items-center gap-1.5 text-ui text-ink-600 hover:text-ink-950">
          <ArrowLeft aria-hidden className="size-4" /> Back to verification center
        </Link>
        <PageHeader eyebrow="Verification workspace" title="New request" description="Ask a person for a specific set of claims, bound to one purpose." />
        <BlockedPanel
          title={profile?.role === 'CITIZEN' ? 'Citizens do not raise requests' : profile?.role === 'ADMIN' ? 'A network administrator has no organization to request from' : 'Requesting is not available in this context'}
          description={
            profile?.role === 'CITIZEN'
              ? 'Requests flow the other way: an organization asks you, and you decide. Your workspace lists the requests waiting for a decision.'
              : profile?.role === 'ADMIN'
                ? 'Requests are always raised by an organization that wants a claim. Network governance has no organization of its own, so it does not raise them. It can read every request from the verification center.'
                : 'Only an active member of an organization can raise a consent request. A MEMBER role cannot raise requests.'
          }
          rule="POST /api/consents/request requires an ACTIVE organization membership; a MEMBER role cannot raise requests."
          action={<ButtonLink href="/portal/verification" variant="secondary" size="sm">Back to requests</ButtonLink>}
        />
      </PageBody>
    );
  }

  async function submit() {
    if (invalid) {
      toast.push({ tone: 'error', title: 'A few fields are missing', description: 'Choose a record, list at least one claim, and describe the purpose in a sentence.' });
      return;
    }
    setBusy(true);
    const response = await client.requestConsent({
      citizenId: effectiveCitizenId,
      credentialId: effectiveCredentialId,
      purpose: purpose.trim(),
      requestedClaims: effectiveClaims,
      expiresAt: new Date(DEMO_NOW.getTime() + Number(expiryDays) * 24 * 60 * 60 * 1000).toISOString(),
    });
    setBusy(false);
    if (response.success && response.data) {
      toast.push({ tone: 'success', title: 'Request sent', description: 'The citizen now decides which of the requested claims to share.' });
      router.push(`/portal/verification/${response.data.id}`);
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'The request was rejected', description: response.details?.[0]?.message });
    }
  }

  return (
    <PageBody>
      <Link href="/portal/verification" className="inline-flex items-center gap-1.5 text-ui text-ink-600 hover:text-ink-950">
        <ArrowLeft aria-hidden className="size-4" /> Back to verification center
      </Link>
      <PageHeader
        eyebrow="Verification workspace"
        title="New request"
        description="Name the record, the exact claims you need and why. The citizen decides what to release, claim by claim."
        meta={organization ? <StatusBadge tone="brand" label={`Requesting as ${organization.name}`} /> : null}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader
              level={3}
              title="1. Which record?"
              description="Records your organization can reference appear here. A request always targets exactly one credential."
            />
            <div className="flex flex-col gap-4 px-5 py-4">
              <div role="tablist" aria-label="How to choose the record" className="inline-flex w-fit gap-1 rounded-control border border-line-200 bg-paper-50 p-1">
                {(['known', 'reference'] as Mode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={mode === item}
                    onClick={() => setMode(item)}
                    className={cn(
                      'rounded-[7px] px-3 py-1.5 text-ui transition-colors',
                      mode === item ? 'bg-paper-0 font-medium text-ink-950 shadow-hairline' : 'text-ink-600 hover:text-ink-950',
                    )}
                  >
                    {item === 'known' ? 'Choose a known record' : 'Enter a reference'}
                  </button>
                ))}
              </div>

              {mode === 'known' ? (
                credentials.state.status === 'loading' ? (
                  <p className="text-ui text-ink-500">Loading records…</p>
                ) : records.length === 0 ? (
                  <NoticeRow tone="warning">
                    No record from a citizen is visible to this organization yet. Switch to “Enter a reference” and paste the
                    credential identifier the person shared with you.
                  </NoticeRow>
                ) : (
                  <Field label="Record" required hint="The subject is derived from the record, so a mismatch cannot happen.">
                    <Select value={credentialId} onChange={(event) => setCredentialId(event.target.value)}>
                      <option value="">Select a record</option>
                      {records.map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.title} — {record.subjectName ?? 'Unknown subject'}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Citizen" required hint="The record must belong to this person, or the API returns 404.">
                    <Select value={manualCitizenId} onChange={(event) => setManualCitizenId(event.target.value)}>
                      <option value="">Select a person</option>
                      {citizens.state.status === 'ready'
                        ? citizens.state.data.map((citizen) => (
                            <option key={citizen.id} value={citizen.id}>
                              {citizen.fullName} — {citizen.email}
                            </option>
                          ))
                        : null}
                    </Select>
                  </Field>
                  <Field label="Credential reference" required hint="The identifier the citizen shared out of band.">
                    <Input value={manualCredentialId} onChange={(event) => setManualCredentialId(event.target.value)} placeholder="cred-…" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Claim keys" required hint="Comma-separated, exactly as the record defines them.">
                      <Input value={manualClaims} onChange={(event) => setManualClaims(event.target.value)} placeholder="degreeName, graduationYear" />
                    </Field>
                  </div>
                </div>
              )}

              {selectedRecord ? (
                <div className="rounded-panel border border-line-200 bg-paper-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-ui font-medium text-ink-950">{selectedRecord.title}</p>
                    <StatusBadge tone="neutral" label={selectedRecord.subjectName ?? 'Unknown subject'} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-micro text-ink-500">
                    <DomainMark domain={selectedRecord.domain} />
                    <span>{selectedRecord.credentialType}</span>
                    <span>{selectedRecord.issuer?.name ?? 'Unknown issuer'}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              level={3}
              title="2. Which claims?"
              description={mode === 'known' ? 'Everything starts selected. Request only what the purpose genuinely requires.' : 'Claims are listed from the reference you entered.'}
              action={mode === 'known' ? <span className="tabular text-micro text-ink-500">{selectedClaims.size} selected</span> : null}
            />
            <div className="px-5 py-4">
              {mode === 'known' ? (
                recordClaims.length === 0 ? (
                  <p className="text-ui text-ink-500">Choose a record to see its claims.</p>
                ) : (
                  <ul className="divide-y divide-line-200 border-y border-line-200">
                    {recordClaims.map((entry) => (
                      <li key={entry.key}>
                        <label className="flex cursor-pointer items-start gap-3 py-3 transition-colors hover:bg-paper-50">
                          <Checkbox
                            className="mt-0.5"
                            checked={selectedClaims.has(entry.key)}
                            onChange={() =>
                              setSelectedClaims((current) => {
                                const next = new Set(current);
                                if (next.has(entry.key)) next.delete(entry.key);
                                else next.add(entry.key);
                                return next;
                              })
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-ui font-medium text-ink-950">{entry.label}</span>
                            <span className="mt-0.5 block text-micro text-ink-500">
                              the citizen sees this value before deciding
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="text-ui text-ink-600">
                  {manualClaimList.length === 0
                    ? 'No claim keys entered yet.'
                    : `${manualClaimList.length} claim${manualClaimList.length === 1 ? '' : 's'} requested: ${manualClaimList.map(claimLabel).join(', ')}.`}
                </p>
              )}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="3. Why is it needed?" description="The purpose is shown to the citizen and stored on the audit trail." />
            <div className="flex flex-col gap-4 px-5 py-4">
              <Field label="Purpose" required hint="One or two sentences. Avoid vague wording such as “verification purposes”.">
                <Textarea
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  rows={3}
                  placeholder="For example: to confirm the degree required for a graduate engineering offer."
                />
              </Field>
              <Field label="Request expires after" hint="The approval window. Expiry is enforced when a verifier tries to use the consent.">
                <Select value={expiryDays} onChange={(event) => setExpiryDays(event.target.value)}>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </Select>
              </Field>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="What you are asking for" />
            <DefinitionList className="px-5 py-2">
              <DefinitionRow label="Record">{selectedRecord?.title ?? (mode === 'reference' ? 'Reference supplied' : 'Not chosen')}</DefinitionRow>
              <DefinitionRow label="Citizen">
                {selectedRecord?.subjectName ??
                  (citizens.state.status === 'ready' ? citizens.state.data.find((c) => c.id === manualCitizenId)?.fullName ?? 'Not chosen' : 'Not chosen')}
              </DefinitionRow>
              <DefinitionRow label="Claims">{effectiveClaims.length === 0 ? 'None selected' : effectiveClaims.map(claimLabel).join(', ')}</DefinitionRow>
              <DefinitionRow label="Expires">
                {formatDate(new Date(DEMO_NOW.getTime() + Number(expiryDays) * 24 * 60 * 60 * 1000).toISOString())}
              </DefinitionRow>
            </DefinitionList>
            <div className="flex flex-col gap-3 border-t border-line-200 px-5 py-4">
              <Button onClick={submit} disabled={busy} icon={<Send aria-hidden className="size-4" />}>
                {busy ? 'Sending…' : 'Send request to the citizen'}
              </Button>
              <NoticeRow>
                Sending a request does not grant access. Nothing can be read until the citizen approves, and an approval is
                still not a verification.
              </NoticeRow>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="What happens next" />
            <ol className="flex flex-col gap-3 px-5 py-4 text-ui text-ink-600">
              <li className="flex gap-3">
                <Inbox aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                <span>The citizen sees each claim and approves all, some or none.</span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                <span>You run verification: signature, trust, accreditation, lifecycle and consent are checked in order.</span>
              </li>
              <li className="flex gap-3">
                <Send aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                <span>Only the approved claims are released, and the whole sequence is recorded.</span>
              </li>
            </ol>
          </Panel>
        </div>
      </div>
    </PageBody>
  );
}