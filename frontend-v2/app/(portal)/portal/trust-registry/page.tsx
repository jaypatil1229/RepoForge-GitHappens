'use client';

import { Ban, CircleSlash, Plus, SearchX, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BlockedPanel, ErrorBlock, LoadingBlock, NoticeRow, PageBody, StatRow, StatTile } from '@/components/portal/parts';
import { FilterChip, TBody, TD, TH, THead, TR, TableShell, Toolbar } from '@/components/portal/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyableId } from '@/components/ui/copyable-id';
import { Dialog } from '@/components/ui/dialog';
import { DomainMark } from '@/components/ui/domain';
import { Field, SearchInput, Select, Textarea } from '@/components/ui/field';
import { EmptyState, PageHeader, Panel, PanelHeader } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { TrustStatus } from '@/lib/types';

const STATUS_TONE: Record<TrustStatus, 'positive' | 'warning' | 'danger'> = {
  VERIFIED: 'positive',
  SUSPENDED: 'warning',
  REVOKED: 'danger',
};

const STATUS_LABEL: Record<TrustStatus, string> = {
  VERIFIED: 'Verified',
  SUSPENDED: 'Suspended',
  REVOKED: 'Revoked',
};

export default function TrustRegistryPage() {
  const client = useDataClient();
  const { profile } = useDemo();
  const toast = useToast();
  const [status, setStatus] = useState<TrustStatus | null>(null);
  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerOrgId, setRegisterOrgId] = useState('');
  const [selected, setSelected] = useState<{ id: string; name: string; status: TrustStatus } | null>(null);
  const [nextStatus, setNextStatus] = useState<TrustStatus>('SUSPENDED');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = profile?.role === 'ADMIN';
  const trust = useQuery(() => client.listTrustRegistry({ limit: 100, trustStatus: status ?? undefined, search: search || undefined }), [status, search]);
  const orgs = useQuery(() => client.listOrganizations({ verificationStatus: 'APPROVED', limit: 100 }), ['registry-orgs']);

  const entries = trust.state.status === 'ready' ? trust.state.data.items : [];
  const approvedOrgs = orgs.state.status === 'ready' ? orgs.state.data.items : [];
  const registeredIds = useMemo(() => new Set(entries.map((entry) => entry.organizationId)), [entries]);
  const registrable = approvedOrgs.filter((org) => !registeredIds.has(org.id));

  if (!isAdmin) {
    return (
      <PageBody>
        <PageHeader eyebrow="Network governance" title="Trust registry" description="Register trusted issuers and govern their status." />
        <BlockedPanel
          title="Only network governance can change trust"
          description="Trust status decides whether an issuer's credentials are accepted. Reading the registry is open to every signed-in account; changing it is not."
          rule="POST /api/trust-registry/register and PATCH /api/trust-registry/:id/status are restricted to the ADMIN role in the service layer."
        />
      </PageBody>
    );
  }

  async function register() {
    if (!registerOrgId) {
      toast.push({ tone: 'error', title: 'Choose an organization' });
      return;
    }
    setBusy(true);
    const response = await client.registerTrustIssuer({ organizationId: registerOrgId });
    setBusy(false);
    if (response.success) {
      toast.push({ tone: 'success', title: 'Issuer registered', description: 'The entry starts as VERIFIED. Change it if the issuer should not be trusted immediately.' });
      setRegisterOpen(false);
      setRegisterOrgId('');
      trust.reload();
      orgs.reload();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Registration failed', description: response.details?.[0]?.message });
    }
  }

  async function changeStatus() {
    if (!selected) return;
    if (nextStatus !== 'VERIFIED' && reason.trim().length < 5) {
      toast.push({ tone: 'error', title: 'A reason is required', description: 'Suspending or revoking trust must record why.' });
      return;
    }
    setBusy(true);
    const response = await client.updateTrustStatus(selected.id, { trustStatus: nextStatus, reason: reason.trim() || undefined });
    setBusy(false);
    if (response.success) {
      toast.push({
        tone: nextStatus === 'VERIFIED' ? 'success' : 'info',
        title: `Trust status set to ${STATUS_LABEL[nextStatus]}`,
        description: nextStatus === 'VERIFIED' ? 'Credentials from this issuer now pass the trust check.' : 'Existing credentials from this issuer will fail the trust check from now on.',
      });
      setSelected(null);
      setReason('');
      trust.reload();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Update failed', description: response.details?.[0]?.message });
    }
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow="Network governance"
        title="Trust registry"
        description="A credential is only accepted if its issuer is registered here and its trust status is VERIFIED. Registration and accreditation are separate decisions."
        actions={
          <Button onClick={() => setRegisterOpen(true)} icon={<Plus aria-hidden className="size-4" />}>
            Register issuer
          </Button>
        }
      />

      <StatRow>
        <StatTile label="Registered" value={entries.length} hint="Issuers with an entry" icon={<ShieldQuestion aria-hidden className="size-4" />} />
        <StatTile label="Verified" value={entries.filter((e) => e.trustStatus === 'VERIFIED').length} tone="positive" hint="Accepted in verification" icon={<ShieldCheck aria-hidden className="size-4" />} />
        <StatTile label="Suspended" value={entries.filter((e) => e.trustStatus === 'SUSPENDED').length} tone="warning" hint="Rejected until restored" />
        <StatTile label="Revoked" value={entries.filter((e) => e.trustStatus === 'REVOKED').length} tone="danger" hint="Permanently rejected" icon={<Ban aria-hidden className="size-4" />} />
      </StatRow>

      <Panel className="overflow-hidden">
        <div className="border-b border-line-200 px-5 py-4">
          <Toolbar className="py-0">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by organization or identifier"
              aria-label="Search the trust registry"
              className="w-full sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {(['VERIFIED', 'SUSPENDED', 'REVOKED'] as TrustStatus[]).map((item) => (
                <FilterChip key={item} active={status === item} onClick={() => setStatus(status === item ? null : item)}>
                  {STATUS_LABEL[item]}
                </FilterChip>
              ))}
            </div>
          </Toolbar>
        </div>

        {trust.state.status === 'loading' ? (
          <div className="px-5 py-6">
            <LoadingBlock rows={5} label="Loading the trust registry" />
          </div>
        ) : trust.state.status === 'error' ? (
          <div className="px-5 py-6">
            <ErrorBlock message={trust.state.error} transport={trust.state.transport} onRetry={trust.reload} />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<SearchX aria-hidden className="size-4" />}
            title={search || status ? 'No entries match these filters' : 'No issuers are registered'}
            description={
              search || status
                ? 'Clear the filters to see the full registry.'
                : 'Register an approved organization to allow its credentials to pass the trust check.'
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus(null);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <TableShell label="Trust registry">
            <THead>
              <TH>Organization</TH>
              <TH>Accredited for</TH>
              <TH>Trust status</TH>
              <TH>Last verified</TH>
              <TH align="right">Action</TH>
            </THead>
            <TBody>
              {entries.map((entry) => (
                <TR key={entry.id}>
                  <TD>
                    <span className="block font-medium text-ink-950">{entry.organization?.name ?? entry.issuerIdentifier}</span>
                    <span className="mt-0.5 block max-w-[22rem] text-micro text-ink-500">
                      <CopyableId value={entry.issuerIdentifier} label="issuer identifier" truncate />
                    </span>
                  </TD>
                  <TD>{entry.verificationMetadata.accreditedFor ? <DomainMark domain={entry.verificationMetadata.accreditedFor} /> : <span className="text-micro text-ink-500">No domain</span>}</TD>
                  <TD>
                    <StatusBadge tone={STATUS_TONE[entry.trustStatus]} label={STATUS_LABEL[entry.trustStatus]} />
                  </TD>
                  <TD className="tabular text-ink-600">{entry.lastVerifiedAt ? formatRelative(entry.lastVerifiedAt, DEMO_NOW) : 'Never'}</TD>
                  <TD align="right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelected({ id: entry.id, name: entry.organization?.name ?? entry.issuerIdentifier, status: entry.trustStatus });
                        setNextStatus(entry.trustStatus === 'VERIFIED' ? 'SUSPENDED' : 'VERIFIED');
                        setReason('');
                      }}
                    >
                      Change status
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableShell>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title="Listed is not the same as authorised" description="How the checks combine, in the order the backend applies them." />
        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Signature', body: 'The JWT is verified against the network issuer key.' },
            { title: 'Trust status', body: 'The issuer must be registered and VERIFIED here.' },
            { title: 'Accreditation', body: 'The issuer must be accredited for the credential domain.' },
            { title: 'Consent', body: 'The citizen must have approved the specific claims.' },
          ].map((step, index) => (
            <div key={step.title} className="border-t border-line-200 pt-3">
              <p className="tabular text-micro text-ink-500">0{index + 1}</p>
              <p className="mt-1 text-ui font-medium text-ink-950">{step.title}</p>
              <p className="mt-1 text-micro leading-relaxed text-ink-600">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <NoticeRow>
            Some issuer organizations are approved institutions but not registered issuers, or are registered for a different
            domain. A credential from an institution that fails any check is rejected, not downgraded.
          </NoticeRow>
        </div>
      </Panel>

      <Dialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register an approved issuer"
        description="Only organizations that network governance has already approved can be registered."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegisterOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={register} disabled={busy || !registerOrgId}>
              {busy ? 'Registering…' : 'Register issuer'}
            </Button>
          </>
        }
      >
        <Field label="Organization" required hint={`${registrable.length} approved organization${registrable.length === 1 ? '' : 's'} not yet registered.`}>
          <Select value={registerOrgId} onChange={(event) => setRegisterOrgId(event.target.value)}>
            <option value="">Select an organization</option>
            {registrable.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} — {org.code}
              </option>
            ))}
          </Select>
        </Field>
        <p className="mt-3 text-micro text-ink-500">
          Registering sets trust status to VERIFIED and stamps a verification time. Suspend it afterwards if it should not be
          trusted yet.
        </p>
      </Dialog>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Change trust status"
        description={selected ? `Applies to ${selected.name}. Every verification of a credential from this issuer applies the new status immediately.` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={changeStatus} disabled={busy}>
              {busy ? 'Applying…' : 'Apply status'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="New status" required>
            <Select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as TrustStatus)}>
              <option value="VERIFIED">Verified — accepted</option>
              <option value="SUSPENDED">Suspended — rejected until restored</option>
              <option value="REVOKED">Revoked — rejected permanently</option>
            </Select>
          </Field>
          <Field label="Reason" required={nextStatus !== 'VERIFIED'} hint="Stored in the registry metadata and written to the audit trail.">
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="For example: accreditation lapsed pending re-review." />
          </Field>
          <NoticeRow tone={nextStatus === 'VERIFIED' ? 'info' : 'warning'}>
            {nextStatus === 'VERIFIED'
              ? 'Restoring trust does not re-verify the signature of credentials already issued; those checks run at verification time.'
              : 'Credentials from this issuer will fail verification from now on, including credentials issued while it was trusted.'}
            {selected?.status === 'REVOKED' && nextStatus === 'VERIFIED' ? (
              <span className="mt-1 block">You are restoring an entry that was previously revoked. Confirm this is intentional.</span>
            ) : null}
          </NoticeRow>
          <p className="text-micro text-ink-500">Last reviewed {formatDateTime(DEMO_NOW.toISOString())} in this preview.</p>
        </div>
      </Dialog>
    </PageBody>
  );
}