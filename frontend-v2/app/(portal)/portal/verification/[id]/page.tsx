'use client';

import { ArrowLeft, BadgeCheck, Ban, Check, FileKey2, Fingerprint, Inbox, ScrollText, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ListRow, ListRowGroup } from '@/components/portal/list-row';
import { BlockedPanel, ClaimsTable, ErrorBlock, LoadingBlock, NoticeRow, PageBody, Timeline, type TimelineItem } from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox, Field, Select } from '@/components/ui/field';
import { CopyableId } from '@/components/ui/copyable-id';
import { Dialog } from '@/components/ui/dialog';
import { DomainMark } from '@/components/ui/domain';
import { EmptyState, Panel, PanelHeader, PageHeader, DefinitionList, DefinitionRow } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { DEMO_NOW } from '@/lib/data';
import { consentStatusLabel, consentStatusTone, credentialStatusLabel, credentialStatusTone, formatDateTime, formatRelative } from '@/lib/format';
import { claimEntries, claimLabel } from '@/lib/claims';
import type { ConsentRecord, CredentialRecord, VerificationCheck } from '@/lib/types';

export default function VerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const client = useDataClient();
  const query = useQuery(() => client.getConsent(id), [id]);

  if (query.state.status === 'loading') {
    return (
      <PageBody>
        <LoadingBlock rows={8} label="Loading request" />
      </PageBody>
    );
  }

  if (query.state.status === 'error') {
    const notFound = query.state.error.toLowerCase().includes('not found');
    return (
      <PageBody>
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={<Ban aria-hidden className="size-4" />}
            title="Request not available"
            description="This request does not exist, or it is outside the scope of the current context."
          />
        ) : (
          <ErrorBlock message={query.state.error} transport={query.state.transport} onRetry={query.reload} />
        )}
      </PageBody>
    );
  }

  return <ConsentWorkspace consent={query.state.data} onChanged={query.reload} />;
}

function BackLink() {
  return (
    <Link href="/portal/verification" className="inline-flex items-center gap-1.5 text-ui text-ink-600 transition-colors hover:text-ink-950">
      <ArrowLeft aria-hidden className="size-4" /> Back to verification center
    </Link>
  );
}

function ConsentWorkspace({ consent, onChanged }: { consent: ConsentRecord; onChanged: () => void }) {
  const client = useDataClient();
  const { actor } = useDemo();
  const toast = useToast();

  const credentialQuery = useQuery(
    () => (consent.credentialId ? client.getCredential(consent.credentialId) : Promise.resolve({ success: false as const, error: 'no-credential', timestamp: '' })),
    [consent.credentialId],
  );
  const credential = credentialQuery.state.status === 'ready' ? credentialQuery.state.data : null;

  const isCitizen = actor?.role === 'CITIZEN';
  const isRequester = Boolean(actor?.organizationId && actor.organizationId === consent.requestingOrgId);
  const isAdmin = actor?.role === 'ADMIN';
  const canDecide = (isCitizen && consent.citizenId === actor?.userId) || isAdmin;
  const canVerify = (isRequester || isAdmin) && consent.status === 'APPROVED' && Boolean(consent.credentialId);

  const [selected, setSelected] = useState<Set<string>>(new Set(consent.requestedClaims));
  const [expiryDays, setExpiryDays] = useState('30');
  const [busy, setBusy] = useState(false);
  const [verification, setVerification] = useState<VerificationCheck | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    setSelected(new Set(consent.requestedClaims));
  }, [consent.id, consent.requestedClaims]);

  const claimEntriesForRecord = useMemo(() => {
    if (credential) return claimEntries(credential.claims);
    return consent.requestedClaims.map((key) => ({ key, label: claimLabel(key), value: 'Hidden until approval' }));
  }, [credential, consent.requestedClaims]);

  const valueByKey = useMemo(() => new Map(claimEntriesForRecord.map((entry) => [entry.key, entry.value])), [claimEntriesForRecord]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [
      {
        id: 'created',
        title: 'Request created',
        meta: formatDateTime(consent.createdAt),
        tone: 'brand',
        body: `${consent.requestingOrg?.name ?? 'A requester'} asked for ${consent.requestedClaims.length} claims. Purpose: ${consent.purpose}`,
      },
    ];
    if (consent.status !== 'PENDING') {
      items.push({
        id: 'decision',
        title: consent.status === 'DENIED' ? 'Citizen declined the request' : consent.status === 'REVOKED' ? 'Approval withdrawn' : 'Citizen approved sharing',
        meta: formatDateTime(consent.grantedAt ?? consent.updatedAt),
        tone: consent.status === 'DENIED' || consent.status === 'REVOKED' ? 'danger' : 'positive',
        body: `${consent.approvedClaims.length} of ${consent.requestedClaims.length} claims shared.`,
      });
    }
    if (consent.consumedAt) {
      items.push({
        id: 'consumed',
        title: 'Verification completed',
        meta: formatDateTime(consent.consumedAt),
        tone: 'neutral',
        body: 'A successful verification consumed this consent, so it can no longer be reused.',
      });
    }
    if (consent.expiresAt && consent.status === 'EXPIRED' && !consent.consumedAt) {
      items.push({ id: 'expired', title: 'Consent expired', meta: formatDateTime(consent.expiresAt), tone: 'warning' });
    }
    return items;
  }, [consent]);

  async function decide(action: 'APPROVE' | 'DENY', approvedClaims?: string[]) {
    setBusy(true);
    const response = await client.respondConsent(consent.id, {
      action,
      approvedClaims,
      expiresAt:
        action === 'APPROVE'
          ? new Date(DEMO_NOW.getTime() + Number(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
    });
    setBusy(false);
    if (response.success) {
      toast.push({
        tone: 'success',
        title: action === 'APPROVE' ? 'Sharing approved' : 'Request declined',
        description:
          action === 'APPROVE'
            ? `${approvedClaims?.length ?? consent.requestedClaims.length} claims are now visible to ${consent.requestingOrg?.name ?? 'the requester'}.`
            : 'The requester cannot read any claim from this record.',
      });
      setConfirmDecline(false);
      onChanged();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Decision failed', description: response.details?.[0]?.message });
    }
  }

  async function withdraw() {
    setBusy(true);
    const response = await client.revokeConsent(consent.id);
    setBusy(false);
    if (response.success) {
      toast.push({ tone: 'success', title: 'Approval withdrawn', description: 'Access is revoked immediately and recorded on the audit trail.' });
      setConfirmRevoke(false);
      onChanged();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Withdrawal failed' });
    }
  }

  async function runVerification() {
    if (!consent.credentialId) return;
    setBusy(true);
    setVerification(null);
    const response = await client.verifyCredential({ credentialId: consent.credentialId, consentId: consent.id });
    setBusy(false);
    if (response.success && response.data) {
      setVerification(response.data);
      if (response.data.verificationResult === 'APPROVED') {
        toast.push({ tone: 'success', title: 'Verification approved', description: 'Signature, issuer trust, domain accreditation, lifecycle and consent all passed.' });
      } else {
        toast.push({ tone: 'error', title: 'Verification rejected', description: response.data.reason ?? undefined });
      }
      onChanged();
      credentialQuery.reload();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Verification failed', description: response.details?.[0]?.message });
    }
  }

  const toggleClaim = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <PageBody>
      <BackLink />

      <PageHeader
        eyebrow={isCitizen ? 'Sharing request' : 'Verification request'}
        title={consent.purpose}
        description={`${consent.requestingOrg?.name ?? 'A requester'} asked ${consent.citizenName ?? 'a citizen'} for specific claims from ${consent.credential?.title ?? 'a linked record'}.`}
        meta={
          <>
            <StatusBadge tone={consentStatusTone[consent.status]} label={consentStatusLabel[consent.status]} />
            {consent.domain === 'all' ? null : <DomainMark domain={consent.domain} />}
            <span className="flex items-center gap-1.5 text-micro text-ink-500">
              Request <CopyableId value={consent.id} label="request identifier" truncate />
            </span>
          </>
        }
        actions={
          canVerify ? (
            <Button onClick={runVerification} disabled={busy} icon={<ShieldCheck aria-hidden className="size-4" />}>
              {busy ? 'Verifying…' : 'Run verification'}
            </Button>
          ) : null
        }
      />

      {consent.status === 'PENDING' && isRequester ? (
        <NoticeRow tone="warning">
          This request is waiting on the citizen. No claim from the linked record can be read until a decision is recorded.
        </NoticeRow>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Claims requested"
              description={
                canDecide && consent.status === 'PENDING'
                  ? 'Every claim starts selected. Clear the ones you do not want to share.'
                  : 'The intersection of what was signed, requested, and approved.'
              }
              action={canDecide && consent.status === 'PENDING' ? <span className="tabular text-micro text-ink-500">{selected.size} of {consent.requestedClaims.length} selected</span> : null}
            />
            {canDecide && consent.status === 'PENDING' ? (
              <ul className="divide-y divide-line-200">
                {consent.requestedClaims.map((key) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-paper-50">
                      <Checkbox checked={selected.has(key)} onChange={() => toggleClaim(key)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-ui font-medium text-ink-950">{claimLabel(key)}</span>
                        <span className="mt-0.5 block truncate text-micro text-ink-500">{valueByKey.get(key) ?? 'Value hidden until approval'}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <ClaimsTable
                claims={Object.fromEntries(claimEntriesForRecord.map((entry) => [entry.key, valueByKey.get(entry.key) ?? '' ]))}
                selected={new Set(consent.approvedClaims.length > 0 ? consent.approvedClaims : consent.requestedClaims)}
              />
            )}
          </Panel>

          {verification ? <VerificationReport result={verification} /> : null}

          <Panel className="overflow-hidden">
            <PanelHeader title="Activity" description="Decisions and verification outcomes recorded for this request." />
            <Timeline items={timeline} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          {canDecide && consent.status === 'PENDING' ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="Your decision" description="Approval is bound to this organization, this purpose and the claims you keep selected." />
              <div className="flex flex-col gap-4 px-5 py-4">
                <Field label="Approval valid for" hint="Expiry is applied lazily and is enforced when a verifier tries to use the consent.">
                  <Select value={expiryDays} onChange={(event) => setExpiryDays(event.target.value)}>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </Select>
                </Field>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => decide('APPROVE', Array.from(selected))} disabled={busy || selected.size === 0} icon={<Check aria-hidden className="size-4" />}>
                    {selected.size === consent.requestedClaims.length ? 'Approve all claims' : `Approve ${selected.size} claim${selected.size === 1 ? '' : 's'}`}
                  </Button>
                  {selected.size < consent.requestedClaims.length ? (
                    <Button variant="secondary" onClick={() => setSelected(new Set(consent.requestedClaims))} disabled={busy}>
                      Select all {consent.requestedClaims.length} claims
                    </Button>
                  ) : null}
                  <Button variant="tertiary" onClick={() => setConfirmDecline(true)} disabled={busy} icon={<X aria-hidden className="size-4" />}>
                    Decline the request
                  </Button>
                </div>
                <NoticeRow>
                  Approving a claim lets this organization read exactly that value. It does not hand over the whole record, and it can be withdrawn.
                </NoticeRow>
              </div>
            </Panel>
          ) : null}

          {consent.status === 'APPROVED' ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="Approved, not yet verified" description="An approval only permits reading claims. Verification is a separate, recorded check." />
              <div className="flex flex-col gap-3 px-5 py-4">
                {canVerify ? (
                  <Button onClick={runVerification} disabled={busy} icon={<ShieldCheck aria-hidden className="size-4" />}>
                    {busy ? 'Verifying…' : 'Verify the credential'}
                  </Button>
                ) : (
                  <p className="text-ui text-ink-600">
                    {isCitizen
                      ? 'This organization may now verify the record. You will see the outcome on the activity trail.'
                      : 'Waiting for the requesting organization to run verification.'}
                  </p>
                )}
                <NoticeRow>
                  A successful verification consumes the consent and records the event. The consent then reports as expired with a consumed timestamp, because the API stores it that way (finding F-10).
                </NoticeRow>
              </div>
            </Panel>
          ) : null}

          <Panel className="overflow-hidden">
            <PanelHeader title="Request details" />
            <DefinitionList className="px-5 py-2">
              <DefinitionRow label="Requesting organization">{consent.requestingOrg?.name ?? 'Unknown'}</DefinitionRow>
              <DefinitionRow label="Organization code">{consent.requestingOrg?.code ?? 'Not set'}</DefinitionRow>
              <DefinitionRow label="Citizen">{consent.citizenName ?? 'Unknown'}</DefinitionRow>
              <DefinitionRow label="Purpose">{consent.purpose}</DefinitionRow>
              <DefinitionRow label="Requested">{formatDateTime(consent.createdAt)}</DefinitionRow>
              <DefinitionRow label="Granted">{consent.grantedAt ? formatDateTime(consent.grantedAt) : 'Not granted'}</DefinitionRow>
              <DefinitionRow label="Expires">{consent.expiresAt ? formatDateTime(consent.expiresAt) : 'No expiry'}</DefinitionRow>
              <DefinitionRow label="Consumed">{consent.consumedAt ? formatDateTime(consent.consumedAt) : 'Not consumed'}</DefinitionRow>
            </DefinitionList>
          </Panel>

          {consent.credential ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="Linked credential" description="The record this request is scoped to." />
              <ListRowGroup>
                <ListRow
                  href={credential ? `/portal/credentials/${credential.id}` : undefined}
                  leading={<DomainMark domain={credential?.domain ?? null} />}
                  title={consent.credential.title}
                  meta={consent.credential.credentialType}
                  trailing={<StatusBadge tone={credentialStatusTone[consent.credential.status]} label={credentialStatusLabel[consent.credential.status]} />}
                />
              </ListRowGroup>
            </Panel>
          ) : null}

          {isCitizen && consent.status === 'APPROVED' ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="Withdraw this approval" description="Withdrawal takes effect immediately and is recorded." />
              <div className="px-5 py-4">
                <Button variant="danger" onClick={() => setConfirmRevoke(true)} disabled={busy} icon={<Ban aria-hidden className="size-4" />}>
                  Withdraw approval
                </Button>
              </div>
            </Panel>
          ) : null}

          {isCitizen && consent.status === 'EXPIRED' && !consent.consumedAt ? (
            <BlockedPanel
              icon={<Inbox aria-hidden className="size-4" />}
              title="This request expired"
              description="The approval window closed before it was used. Ask the organization to raise a new request if you still want to share."
            />
          ) : null}
        </div>
      </div>

      <Dialog
        open={confirmDecline}
        onClose={() => setConfirmDecline(false)}
        title="Decline this request"
        description="The requesting organization will not be able to read any claim from the linked record."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDecline(false)} disabled={busy}>
              Keep reviewing
            </Button>
            <Button variant="danger" onClick={() => decide('DENY')} disabled={busy}>
              {busy ? 'Declining…' : 'Decline request'}
            </Button>
          </>
        }
      >
        <p className="text-ui text-ink-600">
          A decline is recorded on the audit trail under the event type CONSENT_REVOKED, which is how the current API stores a
          denial. Nothing about the record is shared.
        </p>
      </Dialog>

      <Dialog
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        title="Withdraw your approval"
        description="Access ends immediately. Any later verification attempt fails the consent check."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRevoke(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={withdraw} disabled={busy}>
              {busy ? 'Withdrawing…' : 'Withdraw approval'}
            </Button>
          </>
        }
      >
        <p className="text-ui text-ink-600">
          This is a preview action against synthetic data. It does not change a real consent record.
        </p>
      </Dialog>
    </PageBody>
  );
}

function CheckRow({ ok, title, detail, icon }: { ok: boolean | 'info'; title: string; detail: string; icon: React.ReactNode }) {
  const tone = ok === true ? 'text-success-700' : ok === false ? 'text-danger-700' : 'text-ink-500';
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span className={`mt-0.5 shrink-0 ${tone}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-ui font-medium text-ink-950">
          {title}
          <span className={`text-micro font-semibold uppercase tracking-[0.1em] ${tone}`}>
            {ok === true ? 'Passed' : ok === false ? 'Failed' : 'Info'}
          </span>
        </span>
        <span className="mt-0.5 block text-ui text-ink-600">{detail}</span>
      </span>
    </li>
  );
}

function VerificationReport({ result }: { result: VerificationCheck }) {
  const approved = result.verificationResult === 'APPROVED';
  const crypto = result.cryptographicCheck;
  const trust = result.trustRegistryCheck;
  const lifecycle = result.lifecycleCheck;
  const consent = result.consentDetails;

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title="Verification report"
        description="Five independent checks must pass before any claim is released."
        action={<StatusBadge tone={approved ? 'positive' : 'danger'} label={approved ? 'Approved' : 'Rejected'} />}
      />
      {result.reason ? (
        <div className={`border-b border-line-200 px-5 py-3 text-ui ${approved ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
          {result.reason}
        </div>
      ) : null}
      <ul className="divide-y divide-line-200">
        <CheckRow
          ok={crypto ? crypto.signatureValid : 'info'}
          icon={crypto?.signatureValid ? <BadgeCheck aria-hidden className="size-4" /> : <Fingerprint aria-hidden className="size-4" />}
          title="Cryptographic signature"
          detail={crypto ? `Algorithm ${crypto.algorithm}. Verified ${crypto.verifiedAt ? formatDateTime(crypto.verifiedAt) : 'now'}.` : 'No signature check was returned.'}
        />
        <CheckRow
          ok={trust ? trust.isTrusted : 'info'}
          icon={<ShieldCheck aria-hidden className="size-4" />}
          title="Issuer trust status"
          detail={trust ? `${trust.issuerName ?? 'Issuer'} is ${trust.trustStatus} in the trust registry.` : 'No trust entry was returned.'}
        />
        <CheckRow
          ok={trust ? trust.accreditedFor === trust.requiredDomain : 'info'}
          icon={<ScrollText aria-hidden className="size-4" />}
          title="Domain accreditation"
          detail={trust ? `Accredited for ${trust.accreditedFor ?? 'no domain'}; this credential is in ${trust.requiredDomain ?? 'an unknown domain'}.` : 'No accreditation data was returned.'}
        />
        <CheckRow
          ok={lifecycle ? !lifecycle.isRevoked && !lifecycle.isExpired : 'info'}
          icon={<FileKey2 aria-hidden className="size-4" />}
          title="Lifecycle"
          detail={lifecycle ? `Status ${lifecycle.status}. ${lifecycle.isRevoked ? 'Revoked. ' : ''}${lifecycle.isExpired ? 'Expired. ' : ''}${!lifecycle.isRevoked && !lifecycle.isExpired ? 'Valid at the time of checking.' : ''}` : 'No lifecycle data was returned.'}
        />
        <CheckRow
          ok={consent ? true : 'info'}
          icon={<Check aria-hidden className="size-4" />}
          title="Consent"
          detail={consent ? `Consent ${consent.consentId} was ${consent.status.toLowerCase()} at ${formatDateTime(consent.consumedAt)} for "${consent.purpose}".` : 'Sharing claims without a consent record does not release claim values.'}
        />
      </ul>
      {result.allowedClaims ? (
        <div className="border-t border-line-200">
          <p className="eyebrow px-5 pt-4">Claims released</p>
          <ClaimsTable claims={result.allowedClaims} className="mt-1" />
        </div>
      ) : null}
      <div className="border-t border-line-200 px-5 py-3">
        <p className="text-micro text-ink-500">
          Recorded {result.credentialSummary ? `against credential ${result.credentialSummary.id}` : 'without a credential summary'} ·
          {' '}
          <span className="mono-value">{result.mode ?? 'BASIC_VERIFICATION'}</span>
        </p>
      </div>
    </Panel>
  );
}