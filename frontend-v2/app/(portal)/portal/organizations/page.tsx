'use client';

import { Building2, Check, SearchX, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { BlockedPanel, ErrorBlock, LoadingBlock, NoticeRow, PageBody, StatRow, StatTile } from '@/components/portal/parts';
import { FilterChip, TBody, TD, TH, THead, TR, TableShell, Toolbar } from '@/components/portal/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DomainMark, orgDomainLabel } from '@/components/ui/domain';
import { Field, Input, SearchInput, Select } from '@/components/ui/field';
import { EmptyState, Panel, PanelHeader, PageHeader } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { formatRelative, orgStatusLabel, orgStatusTone } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrgVerificationStatus } from '@/lib/types';

const SUGGESTED_TYPES: Record<string, string[]> = {
  college: ['DegreeCredential', 'TranscriptCredential', 'EnrollmentCredential'],
  employer: ['EmploymentCredential', 'IncomeCredential'],
  bank: ['IncomeCredential', 'AccountStandingCredential'],
  hospital: ['ImmunizationCredential', 'MedicalRecordCredential'],
  network_admin: [],
};

export default function OrganizationsPage() {
  const client = useDataClient();
  const { profile } = useDemo();
  const toast = useToast();
  const [status, setStatus] = useState<OrgVerificationStatus | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; domain: string; status: OrgVerificationStatus; isIssuer: boolean; types: string[] } | null>(null);
  const [nextStatus, setNextStatus] = useState<OrgVerificationStatus>('APPROVED');
  const [isIssuer, setIsIssuer] = useState(false);
  const [types, setTypes] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = profile?.role === 'ADMIN';
  const orgs = useQuery(() => client.listOrganizations({ limit: 100, verificationStatus: status ?? undefined, search: search || undefined }), [status, search]);
  // A separate unfiltered read so the summary tiles and the decision queue do not move when a filter is applied.
  const allOrgs = useQuery(() => client.listOrganizations({ limit: 100 }), ['all-orgs']);

  const organizations = orgs.state.status === 'ready' ? orgs.state.data.items : [];
  const pending = allOrgs.state.status === 'ready' ? allOrgs.state.data.items.filter((org) => org.verificationStatus === 'PENDING') : [];
  const counts = useMemo(() => {
    if (allOrgs.state.status !== 'ready') return { total: 0, pending: 0, approved: 0, denied: 0 };
    const items = allOrgs.state.data.items;
    return {
      total: items.length,
      pending: items.filter((item) => item.verificationStatus === 'PENDING').length,
      approved: items.filter((item) => item.verificationStatus === 'APPROVED').length,
      denied: items.filter((item) => item.verificationStatus === 'DENIED').length,
    };
  }, [allOrgs.state]);

  if (!isAdmin) {
    return (
      <PageBody>
        <PageHeader eyebrow="Network governance" title="Organizations" description="Approve institutions and grant issuer authorization." />
        <BlockedPanel
          title="Only network governance can decide registrations"
          description="An institution cannot approve itself, and no organization can change another's status. You can read the issuer directory instead."
          rule="PATCH /api/organizations/:id/status is an ADMIN-only operation in the service layer."
        />
      </PageBody>
    );
  }

  function openEditor(org: (typeof organizations)[number]) {
    setEditing({ id: org.id, name: org.name, domain: org.domain, status: org.verificationStatus, isIssuer: org.isIssuer, types: org.authorizedCredentialTypes });
    setNextStatus(org.verificationStatus === 'DENIED' ? 'APPROVED' : org.verificationStatus);
    setIsIssuer(org.isIssuer);
    setTypes(org.authorizedCredentialTypes.join(', '));
  }

  async function submit() {
    if (!editing) return;
    const typeList = types
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (nextStatus === 'APPROVED' && isIssuer && typeList.length === 0) {
      toast.push({ tone: 'error', title: 'An approved issuer needs at least one authorised type', description: 'Otherwise every issuance attempt is rejected with 403.' });
      return;
    }
    setBusy(true);
    const response = await client.updateOrganizationStatus(editing.id, {
      verificationStatus: nextStatus,
      isIssuer,
      authorizedCredentialTypes: typeList,
    });
    setBusy(false);
    if (response.success) {
      toast.push({
        tone: nextStatus === 'DENIED' ? 'info' : 'success',
        title: nextStatus === 'APPROVED' ? 'Organization approved' : nextStatus === 'DENIED' ? 'Organization denied' : 'Organization updated',
        description:
          nextStatus === 'APPROVED' && isIssuer
            ? `${editing.name} may now sign ${typeList.length} credential type${typeList.length === 1 ? '' : 's'}. It still needs a trust registry entry to pass verification.`
            : `${editing.name} now reads as ${orgStatusLabel[nextStatus]}.`,
      });
      setEditing(null);
      orgs.reload();
      allOrgs.reload();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Update failed', description: response.details?.[0]?.message });
    }
  }

  const suggestions = editing ? SUGGESTED_TYPES[editing.domain] ?? [] : [];

  return (
    <PageBody>
      <PageHeader
        eyebrow="Network governance"
        title="Organizations"
        description="Approval lets an institution operate in the network. Issuer authorization is a separate grant, and trust registration is a third decision."
      />

      <StatRow>
        <StatTile label="Organizations" value={counts.total} hint="All registrations" icon={<Building2 aria-hidden className="size-4" />} />
        <StatTile label="Pending" value={counts.pending} tone={counts.pending > 0 ? 'warning' : 'neutral'} hint="Waiting for a decision" />
        <StatTile label="Approved" value={counts.approved} tone="positive" hint="Operating in the network" />
        <StatTile label="Denied" value={counts.denied} tone={counts.denied > 0 ? 'danger' : 'neutral'} hint="Not admitted" />
      </StatRow>

      {pending.length > 0 && !status && !search ? (
        <Panel className="overflow-hidden">
          <PanelHeader title="Awaiting a decision" description="A pending institution cannot issue, verify or appear in the trust registry." />
          <ul className="divide-y divide-line-200">
            {pending.map((org) => (
              <li key={org.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/portal/issuers/${org.id}`} className="text-ui font-medium text-ink-950 hover:text-forest-800">
                      {org.name}
                    </Link>
                    <StatusBadge tone={orgStatusTone[org.verificationStatus]} label={orgStatusLabel[org.verificationStatus]} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-micro text-ink-500">
                    <DomainMark domain={org.domain} variant="organization" />
                    <span>{org.code}</span>
                    <span>registered {formatRelative(org.createdAt, DEMO_NOW)}</span>
                    {org.registrationRef ? <span>ref {org.registrationRef}</span> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      openEditor(org);
                      setNextStatus('APPROVED');
                    }}
                    icon={<Check aria-hidden className="size-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      openEditor(org);
                      setNextStatus('DENIED');
                      setIsIssuer(false);
                    }}
                    icon={<X aria-hidden className="size-3.5" />}
                  >
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        <div className="border-b border-line-200 px-5 py-4">
          <Toolbar className="py-0">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search organizations"
              aria-label="Search organizations"
              className="w-full sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {(['PENDING', 'APPROVED', 'DENIED'] as OrgVerificationStatus[]).map((item) => (
                <FilterChip key={item} active={status === item} onClick={() => setStatus(status === item ? null : item)}>
                  {orgStatusLabel[item]}
                </FilterChip>
              ))}
            </div>
          </Toolbar>
        </div>

        {orgs.state.status === 'loading' ? (
          <div className="px-5 py-6">
            <LoadingBlock rows={5} label="Loading organizations" />
          </div>
        ) : orgs.state.status === 'error' ? (
          <div className="px-5 py-6">
            <ErrorBlock message={orgs.state.error} transport={orgs.state.transport} onRetry={orgs.reload} />
          </div>
        ) : organizations.length === 0 ? (
          <EmptyState
            icon={<SearchX aria-hidden className="size-4" />}
            title={search || status ? 'No organizations match these filters' : 'No organizations yet'}
            description={search || status ? 'Clear the filters to see every registration.' : 'Institutions appear here when they register.'}
          />
        ) : (
          <TableShell label="Organizations">
            <THead>
              <TH>Organization</TH>
              <TH>Domain</TH>
              <TH>Status</TH>
              <TH>Issuer</TH>
              <TH align="right">Manage</TH>
            </THead>
            <TBody>
              {organizations.map((org) => (
                <TR key={org.id}>
                  <TD>
                    <Link href={`/portal/issuers/${org.id}`} className="font-medium text-ink-950 hover:text-forest-800">
                      {org.name}
                    </Link>
                    <span className="mt-0.5 block text-micro text-ink-500">{org.code}</span>
                  </TD>
                  <TD><DomainMark domain={org.domain} variant="organization" /></TD>
                  <TD><StatusBadge tone={orgStatusTone[org.verificationStatus]} label={orgStatusLabel[org.verificationStatus]} /></TD>
                  <TD className="text-ink-600">{org.isIssuer ? `${org.authorizedCredentialTypes.length} types` : 'No'}</TD>
                  <TD align="right">
                    <Button variant="secondary" size="sm" onClick={() => openEditor(org)}>
                      Review
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableShell>
        )}
      </Panel>

      <NoticeRow>
        Granting issuer authorization here does not register the organization in the trust registry. Both steps are required before
        its credentials can pass verification.
      </NoticeRow>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Review ${editing.name}` : 'Review organization'}
        description="Approval, issuer authorization and trust registration are three separate controls."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy} icon={<Check aria-hidden className="size-4" />}>
              {busy ? 'Saving…' : 'Apply decision'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Registration status" required hint="A denied organization cannot operate in the network.">
            <Select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrgVerificationStatus)}>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
              <option value="PENDING">Keep pending</option>
            </Select>
          </Field>

          <div className="rounded-panel border border-line-200 bg-paper-50 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isIssuer}
                disabled={nextStatus !== 'APPROVED'}
                onChange={(event) => setIsIssuer(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-line-300 accent-[var(--forest-800)]"
              />
              <span>
                <span className="block text-ui font-medium text-ink-950">Grant issuer capability</span>
                <span className="mt-0.5 block text-micro text-ink-600">
                  Allows this organization to sign credentials of the types listed below. Verifier-only organizations should leave
                  this off.
                </span>
              </span>
            </label>
          </div>

          {isIssuer && nextStatus === 'APPROVED' ? (
            <Field label="Authorised credential types" required hint="Comma-separated. Keep the vocabulary stable; verifiers request these exact names.">
              <Input value={types} onChange={(event) => setTypes(event.target.value)} placeholder="DegreeCredential, TranscriptCredential" />
            </Field>
          ) : null}

          {isIssuer && nextStatus === 'APPROVED' && suggestions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-micro text-ink-500">Suggested for {orgDomainLabel[editing?.domain as 'college'] ?? 'this domain'}:</span>
              {suggestions.map((suggestion) => {
                const active = types.split(',').map((value) => value.trim()).includes(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      const current = types.split(',').map((value) => value.trim()).filter(Boolean);
                      const next = active ? current.filter((value) => value !== suggestion) : [...current, suggestion];
                      setTypes(next.join(', '));
                    }}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-micro transition-colors',
                      active ? 'border-forest-800/30 bg-forest-50 text-forest-800' : 'border-line-200 text-ink-600 hover:border-line-300',
                    )}
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          ) : null}

          <NoticeRow tone={nextStatus === 'DENIED' ? 'warning' : 'info'}>
            {nextStatus === 'DENIED'
              ? 'Denial is recorded on the audit trail. The institution can register again with corrected information.'
              : 'Approval alone does not make credentials verifiable. Register the issuer in the trust registry next.'}
          </NoticeRow>
        </div>
      </Dialog>
    </PageBody>
  );
}