'use client';

import { ArrowLeft, Ban, FileSignature, KeyRound, ShieldCheck, Stamp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ListRow, ListRowGroup } from '@/components/portal/list-row';
import {
  BlockedPanel,
  ClaimsTable,
  ErrorBlock,
  LoadingBlock,
  NoticeRow,
  PageBody,
  Timeline,
  type TimelineItem,
} from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { CopyableId } from '@/components/ui/copyable-id';
import { Dialog } from '@/components/ui/dialog';
import { DomainMark } from '@/components/ui/domain';
import { Field, Textarea } from '@/components/ui/field';
import { EmptyState, Panel, PanelHeader, PageHeader, DefinitionList, DefinitionRow } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import {
  consentStatusLabel,
  consentStatusTone,
  credentialStatusLabel,
  credentialStatusTone,
  formatDate,
  formatDateTime,
  formatRelative,
  truncateId,
} from '@/lib/format';
import { claimEntries } from '@/lib/claims';

export default function CredentialDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const client = useDataClient();
  const { actor, organization } = useDemo();
  const toast = useToast();

  const credential = useQuery(() => client.getCredential(id), [id]);
  const consents = useQuery(() => client.listConsents({ credentialId: id, limit: 20 }), [id]);

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const record = credential.state.status === 'ready' ? credential.state.data : null;

  const canRevoke = useMemo(() => {
    if (!record || !actor) return false;
    if (record.status !== 'VALID') return false;
    if (actor.role === 'ADMIN') return true;
    if (actor.role === 'CITIZEN') return false;
    const roleOk = actor.memberRole === 'ADMIN' || actor.memberRole === 'ISSUER';
    return roleOk && record.issuerOrgId === actor.organizationId;
  }, [record, actor]);

  const isIssuerOfRecord = Boolean(record && organization && record.issuerOrgId === organization.id);
  const lockedBecauseIssuedElsewhere = Boolean(record && actor && actor.role !== 'ADMIN' && actor.role !== 'CITIZEN' && !isIssuerOfRecord);

  const relatedConsents = consents.state.status === 'ready' ? consents.state.data.items : [];

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!record) return [];
    const items: TimelineItem[] = [
      {
        id: 'issued',
        title: 'Credential issued and signed',
        meta: formatDateTime(record.issuanceDate),
        tone: 'brand',
        body: `Signed by ${record.issuer?.name ?? 'the issuer'} with the network Ed25519 issuer key. The full signed payload never leaves the API.`,
      },
    ];
    for (const consent of relatedConsents) {
      items.push({
        id: consent.id,
        title:
          consent.status === 'APPROVED'
            ? `Sharing approved with ${consent.requestingOrg?.name ?? 'a requester'}`
            : consent.status === 'PENDING'
              ? `Consent requested by ${consent.requestingOrg?.name ?? 'a requester'}`
              : consent.status === 'DENIED'
                ? `Sharing declined for ${consent.requestingOrg?.name ?? 'a requester'}`
                : consent.status === 'REVOKED'
                  ? `Approval withdrawn from ${consent.requestingOrg?.name ?? 'a requester'}`
                  : `Consent expired for ${consent.requestingOrg?.name ?? 'a requester'}`,
        meta: formatDateTime(consent.updatedAt),
        tone:
          consent.status === 'APPROVED' ? 'positive' : consent.status === 'PENDING' ? 'warning' : consent.status === 'DENIED' || consent.status === 'REVOKED' ? 'danger' : 'neutral',
        body: `${consent.purpose} · ${consent.approvedClaims.length} of ${consent.requestedClaims.length} claims`,
      });
    }
    if (record.status === 'REVOKED') {
      items.push({
        id: 'revoked',
        title: 'Credential revoked',
        meta: record.revokedAt ? formatDateTime(record.revokedAt) : undefined,
        tone: 'danger',
        body: record.revocationReason ?? 'No reason was recorded on the audit entry.',
      });
    }
    return items;
  }, [record, relatedConsents]);

  async function submitRevoke() {
    if (!record) return;
    if (!reason.trim()) {
      toast.push({ tone: 'error', title: 'A reason is required', description: 'The API records the revocation reason on the audit trail.' });
      return;
    }
    setBusy(true);
    const response = await client.revokeCredential(record.id, reason.trim());
    setBusy(false);
    if (response.success) {
      toast.push({ tone: 'success', title: 'Credential revoked', description: 'Subsequent verifications will now be rejected on the lifecycle check.' });
      setRevokeOpen(false);
      setReason('');
      credential.reload();
      consents.reload();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Revocation failed', description: response.details?.[0]?.message });
    }
  }

  if (credential.state.status === 'loading') {
    return (
      <PageBody>
        <LoadingBlock rows={8} label="Loading credential" />
      </PageBody>
    );
  }

  if (credential.state.status === 'error') {
    const notFound = credential.state.error.toLowerCase().includes('not found');
    return (
      <PageBody>
        <Link href="/portal/credentials" className="inline-flex items-center gap-1.5 text-ui text-ink-600 hover:text-ink-950">
          <ArrowLeft aria-hidden className="size-4" /> Back to credentials
        </Link>
        {notFound ? (
          <EmptyState
            icon={<Ban aria-hidden className="size-4" />}
            title="Record not available"
            description="This record does not exist, or it is outside the scope of the current context. Out-of-scope records are hidden rather than disclosed."
          />
        ) : (
          <ErrorBlock message={credential.state.error} transport={credential.state.transport} onRetry={credential.reload} />
        )}
      </PageBody>
    );
  }

  if (!record) return null;
  const entries = claimEntries(record.claims);

  return (
    <PageBody>
      <Link href="/portal/credentials" className="inline-flex items-center gap-1.5 text-ui text-ink-600 transition-colors hover:text-ink-950">
        <ArrowLeft aria-hidden className="size-4" /> Back to credentials
      </Link>

      <PageHeader
        eyebrow={<DomainMark domain={record.domain} />}
        title={record.title}
        description={`${record.credentialType} issued by ${record.issuer?.name ?? 'an unknown issuer'}.`}
        meta={
          <>
            <StatusBadge tone={credentialStatusTone[record.status]} label={credentialStatusLabel[record.status]} />
            <span className="flex items-center gap-1.5 text-micro text-ink-500">
              ID <CopyableId value={record.id} label="credential identifier" truncate />
            </span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setSignatureOpen(true)} icon={<FileSignature aria-hidden className="size-4" />}>
              Signed proof
            </Button>
            {canRevoke ? (
              <Button variant="danger" onClick={() => setRevokeOpen(true)} icon={<Ban aria-hidden className="size-4" />}>
                Revoke
              </Button>
            ) : record.status === 'VALID' && lockedBecauseIssuedElsewhere ? (
              <Button variant="secondary" disabled title="Only the issuing organization can revoke this credential.">
                Revoke unavailable
              </Button>
            ) : null}
          </>
        }
      />

      {record.status === 'REVOKED' ? (
        <div className="rounded-panel border border-danger-700/20 bg-danger-50 px-5 py-4">
          <p className="flex items-center gap-2 text-ui font-semibold text-danger-700">
            <Ban aria-hidden className="size-4" /> This credential was revoked
          </p>
          <p className="mt-1 text-ui text-ink-600">
            {record.revocationReason ?? 'No reason was recorded.'}
            {record.revokedAt ? ` Recorded ${formatRelative(record.revokedAt, DEMO_NOW)}.` : ''}
          </p>
          <p className="mt-2 text-micro text-ink-500">
            The reason is read from the audit trail, because the revocation columns on the credential row are not written by the API.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader title="Claims on this credential" description={`${entries.length} claim${entries.length === 1 ? '' : 's'} signed by the issuer. A verifier only ever sees the claims a citizen approves.`} />
            <ClaimsTable claims={record.claims} />
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="Lifecycle" description="Issue, consent and revocation events in order." />
            <Timeline items={timelineItems} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader title="Provenance" description="Who signed it, for whom, and until when." />
            <DefinitionList className="px-5 py-2">
              <DefinitionRow label="Issuer">{record.issuer?.name ?? 'Unknown issuer'}</DefinitionRow>
              <DefinitionRow label="Issuer DID" mono>
                <CopyableId value={record.issuer?.did ?? null} label="issuer DID" />
              </DefinitionRow>
              <DefinitionRow label="Subject">{record.subjectName ?? 'Unnamed subject'}</DefinitionRow>
              <DefinitionRow label="Domain"><DomainMark domain={record.domain} /></DefinitionRow>
              <DefinitionRow label="Issued">{formatDateTime(record.issuanceDate)}</DefinitionRow>
              <DefinitionRow label="Expires">{record.expirationDate ? formatDateTime(record.expirationDate) : 'No expiry set'}</DefinitionRow>
              <DefinitionRow label="Signature"><span className="text-ui">Ed25519 JWT proof, issued through Veramo</span></DefinitionRow>
            </DefinitionList>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="Related sharing" description="Consent records that reference this credential." />
            {relatedConsents.length === 0 ? (
              <p className="px-5 py-6 text-ui text-ink-500">No consent record references this credential.</p>
            ) : (
              <ListRowGroup>
                {relatedConsents.map((consent) => (
                  <ListRow
                    key={consent.id}
                    href={`/portal/verification/${consent.id}`}
                    title={consent.requestingOrg?.name ?? 'Requester'}
                    meta={`${consent.purpose} · updated ${formatRelative(consent.updatedAt, DEMO_NOW)}`}
                    trailing={<StatusBadge tone={consentStatusTone[consent.status]} label={consentStatusLabel[consent.status]} />}
                  />
                ))}
              </ListRowGroup>
            )}
          </Panel>

          {record.status === 'VALID' && !canRevoke ? (
            <BlockedPanel
              icon={<ShieldCheck aria-hidden className="size-4" />}
              title="This record is valid"
              description={
                actor?.role === 'CITIZEN'
                  ? 'Only the institution that issued a record can revoke it. If something on this record is wrong, ask the issuer to correct it.'
                  : 'Only the issuing organization can withdraw this record.'
              }
              rule="POST /api/credentials/:id/revoke requires an ACTIVE membership with role ADMIN or ISSUER in the issuing organization."
              action={
                actor?.role === 'CITIZEN' ? (
                  <Button variant="secondary" size="sm" disabled title="There is no correction endpoint in the current API.">
                    Request a correction
                  </Button>
                ) : null
              }
            />
          ) : null}
        </div>
      </div>

      <Dialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        title="Signed proof"
        description="The API returns a W3C credential as a signed JWT. This preview shows a deterministic sample signature; no credential is exchanged."
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-panel border border-line-200 bg-paper-50 px-4 py-3">
            <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-600" />
            <div className="text-ui text-ink-600">
              <p className="font-medium text-ink-950">Signed by the network issuer key</p>
              <p className="mt-0.5">
                Algorithm Ed25519 over a W3C Verifiable Credential, produced by Veramo. The issuer identity is a single
                server-side did:key; there is no per-organization key rotation in this build.
              </p>
            </div>
          </div>
          <NoticeRow>
            Sample content for the design preview. Real signed payloads are only returned to an authenticated caller and are
            never displayed on a public surface.
          </NoticeRow>
          <div>
            <p className="eyebrow mb-2">Issuer DID</p>
            <CopyableId value={record.issuer?.did ?? null} label="issuer DID" />
          </div>
          <div>
            <p className="eyebrow mb-2">Signature (truncated sample)</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-panel border border-line-200 bg-paper-50 p-4 text-[0.6875rem] leading-relaxed text-ink-600">
              {record.issuerSignature ?? 'No signature attached in this preview.'}
            </pre>
          </div>
          <p className="text-micro text-ink-500">
            Credential reference <span className="mono-value">{truncateId(record.id, 12, 6)}</span>
          </p>
        </div>
      </Dialog>

      <Dialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        title="Revoke this credential"
        description="Revocation is recorded, not deleted. Verification will reject the credential on the lifecycle check from then on."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevokeOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitRevoke} disabled={busy || reason.trim().length === 0}>
              {busy ? 'Revoking…' : 'Revoke credential'}
            </Button>
          </>
        }
      >
        <Field
          label="Reason"
          hint="Stored on the audit entry and shown to anyone who later attempts verification."
          required
        >
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="For example: issued in error after a duplicate enrolment record."
          />
        </Field>
        <p className="mt-3 flex items-start gap-2 text-micro text-ink-500">
          <Stamp aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          This is a preview action against synthetic data. It does not change any real credential.
        </p>
      </Dialog>
    </PageBody>
  );
}