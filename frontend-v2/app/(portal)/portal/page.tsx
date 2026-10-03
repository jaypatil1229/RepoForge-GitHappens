'use client';

import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  FileWarning,
  Inbox,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { ListRow, ListRowGroup } from '@/components/portal/list-row';
import { BlockedPanel, LinkArrow, LoadingBlock, PageBody, StatRow, StatTile } from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { DomainMark } from '@/components/ui/domain';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/surface';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import {
  consentStatusLabel,
  consentStatusTone,
  credentialStatusLabel,
  credentialStatusTone,
  formatDate,
  formatRelative,
  orgStatusLabel,
  orgStatusTone,
} from '@/lib/format';
import { roleLabel } from '@/components/portal/nav';

export default function PortalOverviewPage() {
  const { profile } = useDemo();
  if (!profile) return null;
  if (profile.role === 'ADMIN') return <AdminOverview />;
  if (profile.role === 'CITIZEN') return <CitizenOverview />;
  return <InstitutionOverview />;
}

/* ------------------------------------------------------------------ citizen */

function CitizenOverview() {
  const client = useDataClient();
  const { profile } = useDemo();
  const credentials = useQuery(() => client.listCredentials({ limit: 50 }), ['citizen-credentials']);
  const consents = useQuery(() => client.listConsents({ limit: 50 }), ['citizen-consents']);

  const credentialItems = credentials.state.status === 'ready' ? credentials.state.data.items : [];
  const consentItems = consents.state.status === 'ready' ? consents.state.data.items : [];
  const pending = consentItems.filter((item) => item.status === 'PENDING');
  const approved = consentItems.filter((item) => item.status === 'APPROVED');
  const consumed = consentItems.filter((item) => item.status === 'EXPIRED' && item.consumedAt);
  const firstName = profile?.fullName.split(' ')[0] ?? 'there';

  return (
    <PageBody>
      <PageHeader
        eyebrow="Citizen workspace"
        title={`Good to see you, ${firstName}`}
        description="These are the records CredLink holds for you, and the decisions waiting on you. Nothing is shared without your approval, and you can withdraw an approval at any time."
        actions={
          pending.length > 0 ? (
            <ButtonLink href="/portal/verification" icon={<Inbox aria-hidden className="size-4" />}>
              Review {pending.length} request{pending.length === 1 ? '' : 's'}
            </ButtonLink>
          ) : (
            <ButtonLink href="/portal/credentials" variant="secondary">
              View my records
            </ButtonLink>
          )
        }
      />

      <StatRow>
        <StatTile label="Records held" value={credentialItems.length} hint="Across all institutions" icon={<BadgeCheck aria-hidden className="size-4" />} />
        <StatTile
          label="Awaiting you"
          value={pending.length}
          tone={pending.length > 0 ? 'warning' : 'neutral'}
          hint={pending.length > 0 ? 'Requests need a decision' : 'Nothing pending'}
          href="/portal/verification"
          icon={<Inbox aria-hidden className="size-4" />}
        />
        <StatTile label="Active approvals" value={approved.length} hint="Sharing currently allowed" tone="positive" icon={<ShieldCheck aria-hidden className="size-4" />} />
        <StatTile label="Shares used" value={consumed.length} hint="Already verified once" icon={<Stamp aria-hidden className="size-4" />} />
      </StatRow>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Needs your decision"
            description="A requester has asked for specific claims. Approve all, approve some, or decline."
            action={<LinkArrow href="/portal/verification">All requests</LinkArrow>}
          />
          {consents.state.status === 'loading' ? (
            <div className="px-5 py-4">
              <LoadingBlock rows={3} label="Loading requests" />
            </div>
          ) : pending.length === 0 ? (
            <p className="px-5 py-8 text-center text-ui text-ink-500">No requests are waiting on you right now.</p>
          ) : (
            <ListRowGroup>
              {pending.slice(0, 4).map((item) => (
                <ListRow
                  key={item.id}
                  href={`/portal/verification/${item.id}`}
                  leading={<DomainMark domain={item.domain === 'all' ? null : item.domain} />}
                  title={item.requestingOrg?.name ?? 'Unknown requester'}
                  meta={`${item.purpose} · asked ${formatRelative(item.createdAt, DEMO_NOW)}`}
                  trailing={
                    <StatusBadge tone={consentStatusTone[item.status]} label={consentStatusLabel[item.status]} />
                  }
                />
              ))}
            </ListRowGroup>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Records you hold"
            description="Issued and signed by the institution named on each record."
            action={<LinkArrow href="/portal/credentials">Open catalog</LinkArrow>}
          />
          {credentials.state.status === 'loading' ? (
            <div className="px-5 py-4">
              <LoadingBlock rows={4} label="Loading records" />
            </div>
          ) : credentialItems.length === 0 ? (
            <p className="px-5 py-8 text-center text-ui text-ink-500">No records have been issued to you yet.</p>
          ) : (
            <ListRowGroup>
              {credentialItems.slice(0, 5).map((item) => (
                <ListRow
                  key={item.id}
                  href={`/portal/credentials/${item.id}`}
                  leading={<DomainMark domain={item.domain} />}
                  title={item.title}
                  meta={`${item.issuer?.name ?? 'Unknown issuer'} · issued ${formatDate(item.issuanceDate)}`}
                  trailing={
                    <StatusBadge tone={credentialStatusTone[item.status]} label={credentialStatusLabel[item.status]} />
                  }
                />
              ))}
            </ListRowGroup>
          )}
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Approvals you have given"
          description="Each approval is bound to one organization, one purpose and a set of claims. Revoke one from its detail page."
        />
        {approved.length === 0 ? (
          <p className="px-5 py-8 text-center text-ui text-ink-500">You have not approved any sharing yet.</p>
        ) : (
          <ListRowGroup>
            {approved.map((item) => (
              <ListRow
                key={item.id}
                href={`/portal/verification/${item.id}`}
                title={item.requestingOrg?.name ?? 'Unknown requester'}
                meta={`${item.purpose} · ${item.approvedClaims.length} of ${item.requestedClaims.length} claims shared`}
                trailing={
                  item.expiresAt ? <span className="tabular text-micro text-ink-500">expires {formatDate(item.expiresAt)}</span> : null
                }
              />
            ))}
          </ListRowGroup>
        )}
      </Panel>
    </PageBody>
  );
}

/* -------------------------------------------------------------- institution */

function InstitutionOverview() {
  const client = useDataClient();
  const { profile, organization } = useDemo();
  const credentials = useQuery(() => client.listCredentials({ limit: 100 }), ['org-credentials']);
  const consents = useQuery(() => client.listConsents({ limit: 100 }), ['org-consents']);
  const audit = useQuery(() => client.listAuditLogs({ limit: 6 }), ['org-audit']);

  const credentialItems = credentials.state.status === 'ready' ? credentials.state.data.items : [];
  const consentItems = consents.state.status === 'ready' ? consents.state.data.items : [];
  const issued = credentialItems.filter((item) => item.issuerOrgId === organization?.id);
  const valid = credentialItems.filter((item) => item.status === 'VALID');
  const revoked = credentialItems.filter((item) => item.status === 'REVOKED');
  const pending = consentItems.filter((item) => item.status === 'PENDING');
  const approved = consentItems.filter((item) => item.status === 'APPROVED');
  const canIssue = Boolean(organization?.isIssuer && organization.verificationStatus === 'APPROVED');

  return (
    <PageBody>
      <PageHeader
        eyebrow={organization ? `${roleLabel[profile!.role]} workspace` : 'Workspace'}
        title={organization?.name ?? 'Organization workspace'}
        description="Records this organization issued or was given access to, the requests it has made, and what changed most recently."
        meta={
          organization ? (
            <>
              <span className="flex items-center gap-2 text-micro text-ink-600">
                <DomainMark domain={organization.domain} variant="organization" />
              </span>
              <StatusBadge tone={orgStatusTone[organization.verificationStatus]} label={orgStatusLabel[organization.verificationStatus]} />
              <span className="mono-value">{organization.code}</span>
            </>
          ) : null
        }
        actions={
          canIssue ? (
            <ButtonLink href="/portal/credentials/new" icon={<Stamp aria-hidden className="size-4" />}>
              Issue credential
            </ButtonLink>
          ) : (
            <ButtonLink href="/portal/verification/new" icon={<Inbox aria-hidden className="size-4" />}>
              Request consent
            </ButtonLink>
          )
        }
      />

      {organization && !canIssue ? (
        <BlockedPanel
          icon={organization.isIssuer ? <ShieldAlert aria-hidden className="size-4" /> : <Building2 aria-hidden className="size-4" />}
          title={organization.isIssuer ? 'Issuance is paused until the network approves this organization' : 'This organization is not an issuer'}
          description={
            organization.isIssuer
              ? 'The network has not approved this organization, so credentials cannot be signed on its behalf. Requesting consent and verification still work.'
              : 'CredLink only lets approved issuers sign credentials. You can still request consent for records issued by other institutions.'
          }
          rule="POST /api/credentials returns 403 unless the organization has is_issuer = true, verification_status = APPROVED, and the member role is ADMIN or ISSUER."
          action={<ButtonLink href="/portal/verification/new" variant="secondary" size="sm">Request consent instead</ButtonLink>}
        />
      ) : null}

      <StatRow>
        <StatTile label="Issued by you" value={issued.length} hint="All time" icon={<Stamp aria-hidden className="size-4" />} />
        <StatTile label="Valid" value={valid.length} hint="Usable today" tone="positive" />
        <StatTile label="Revoked" value={revoked.length} tone={revoked.length > 0 ? 'danger' : 'neutral'} hint="Rejected in verification" />
        <StatTile
          label="Awaiting citizen"
          value={pending.length}
          tone={pending.length > 0 ? 'warning' : 'neutral'}
          hint={`${approved.length} approved and ready`}
          href="/portal/verification"
        />
      </StatRow>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <PanelHeader title="Requests awaiting the citizen" description="Nothing can be read until the person approves specific claims." />
          {pending.length === 0 ? (
            <p className="px-5 py-8 text-center text-ui text-ink-500">No outstanding requests.</p>
          ) : (
            <ListRowGroup>
              {pending.slice(0, 4).map((item) => (
                <ListRow
                  key={item.id}
                  href={`/portal/verification/${item.id}`}
                  leading={<DomainMark domain={item.domain === 'all' ? null : item.domain} />}
                  title={item.citizenName ?? 'Citizen'}
                  meta={`${item.purpose} · ${item.requestedClaims.length} claims requested`}
                  trailing={<StatusBadge tone={consentStatusTone[item.status]} label={consentStatusLabel[item.status]} />}
                />
              ))}
            </ListRowGroup>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Recently issued" description="The most recent records signed by this organization." />
          {issued.length === 0 ? (
            <p className="px-5 py-8 text-center text-ui text-ink-500">No credentials issued yet.</p>
          ) : (
            <ListRowGroup>
              {issued.slice(0, 4).map((item) => (
                <ListRow
                  key={item.id}
                  href={`/portal/credentials/${item.id}`}
                  leading={<DomainMark domain={item.domain} />}
                  title={item.title}
                  meta={`${item.subjectName ?? 'Citizen'} · ${formatDate(item.issuanceDate)}`}
                  trailing={<StatusBadge tone={credentialStatusTone[item.status]} label={credentialStatusLabel[item.status]} />}
                />
              ))}
            </ListRowGroup>
          )}
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="What changed recently"
          description="Every issue, decision and verification outcome is recorded against this organization."
          action={<LinkArrow href="/portal/audit">Full audit trail</LinkArrow>}
        />
        {audit.state.status === 'loading' ? (
          <div className="px-5 py-4">
            <LoadingBlock rows={3} label="Loading activity" />
          </div>
        ) : audit.state.status !== 'ready' ? (
          <p className="px-5 py-8 text-center text-ui text-ink-500">Activity could not be loaded.</p>
        ) : (
          <ListRowGroup>
            {audit.state.data.items.map((event) => (
              <ListRow
                key={event.id}
                title={event.action}
                meta={`${event.actor} · ${formatRelative(event.timestamp, DEMO_NOW)}`}
                trailing={
                  <StatusBadge
                    tone={event.outcome === 'SUCCESS' ? 'positive' : event.outcome === 'FAILURE' ? 'danger' : 'neutral'}
                    label={event.outcome === 'SUCCESS' ? 'Recorded' : event.outcome === 'FAILURE' ? 'Failed' : 'Pending'}
                  />
                }
              />
            ))}
          </ListRowGroup>
        )}
      </Panel>
    </PageBody>
  );
}

/* -------------------------------------------------------------------- admin */

function AdminOverview() {
  const client = useDataClient();
  const organizations = useQuery(() => client.listOrganizations({ limit: 100 }), ['admin-orgs']);
  const trust = useQuery(() => client.listTrustRegistry({ limit: 100 }), ['admin-trust']);
  const credentials = useQuery(() => client.listCredentials({ limit: 100 }), ['admin-creds']);
  const audit = useQuery(() => client.listAuditLogs({ limit: 6 }), ['admin-audit']);

  const orgItems = organizations.state.status === 'ready' ? organizations.state.data.items : [];
  const trustItems = trust.state.status === 'ready' ? trust.state.data.items : [];
  const credentialItems = credentials.state.status === 'ready' ? credentials.state.data.items : [];
  const pendingOrgs = orgItems.filter((item) => item.verificationStatus === 'PENDING');
  const exceptions = trustItems.filter((item) => item.trustStatus !== 'VERIFIED');

  return (
    <PageBody>
      <PageHeader
        eyebrow="Network governance"
        title="Network overview"
        description="CredLink Network Governance approves institutions, governs issuer trust, and sees every recorded event across the domain."
        actions={
          <>
            <ButtonLink href="/portal/organizations" variant={pendingOrgs.length > 0 ? 'primary' : 'secondary'}>
              {pendingOrgs.length > 0 ? `Review ${pendingOrgs.length} pending` : 'Organizations'}
            </ButtonLink>
            <ButtonLink href="/portal/trust-registry" variant="secondary">
              Trust registry
            </ButtonLink>
          </>
        }
      />

      <StatRow>
        <StatTile label="Organizations" value={orgItems.length} hint={`${orgItems.filter((o) => o.verificationStatus === 'APPROVED').length} approved`} icon={<Building2 aria-hidden className="size-4" />} />
        <StatTile label="Pending approval" value={pendingOrgs.length} tone={pendingOrgs.length > 0 ? 'warning' : 'neutral'} hint="Waiting for a network decision" href="/portal/organizations" icon={<Users aria-hidden className="size-4" />} />
        <StatTile label="Trust exceptions" value={exceptions.length} tone={exceptions.length > 0 ? 'danger' : 'neutral'} hint="Suspended or revoked issuers" href="/portal/trust-registry" icon={<ShieldAlert aria-hidden className="size-4" />} />
        <StatTile label="Credentials" value={credentialItems.length} hint={`${credentialItems.filter((c) => c.status === 'VALID').length} valid`} href="/portal/credentials" />
      </StatRow>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="Awaiting a decision" description="New institutions cannot issue or verify until approved." action={<LinkArrow href="/portal/organizations">Open queue</LinkArrow>} />
          {pendingOrgs.length === 0 ? (
            <p className="px-5 py-8 text-center text-ui text-ink-500">No organizations are waiting.</p>
          ) : (
            <ListRowGroup>
              {pendingOrgs.map((org) => (
                <ListRow
                  key={org.id}
                  href={`/portal/issuers/${org.id}`}
                  leading={<DomainMark domain={org.domain} variant="organization" />}
                  title={org.name}
                  meta={`${org.code} · registered ${formatRelative(org.createdAt, DEMO_NOW)}`}
                  trailing={<StatusBadge tone={orgStatusTone[org.verificationStatus]} label={orgStatusLabel[org.verificationStatus]} />}
                />
              ))}
            </ListRowGroup>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Trust exceptions" description="Issuers whose trust status is not VERIFIED. Verification rejects their credentials." action={<LinkArrow href="/portal/trust-registry">Registry</LinkArrow>} />
          {exceptions.length === 0 ? (
            <p className="px-5 py-8 text-center text-ui text-ink-500">Every registered issuer is currently verified.</p>
          ) : (
            <ListRowGroup>
              {exceptions.map((entry) => (
                <ListRow
                  key={entry.id}
                  href="/portal/trust-registry"
                  leading={<FileWarning aria-hidden className="size-4 text-danger-700" />}
                  title={entry.organization?.name ?? entry.issuerIdentifier}
                  meta={`Accredited for ${entry.verificationMetadata.accreditedFor ?? 'no domain'}`}
                  trailing={<StatusBadge tone={entry.trustStatus === 'SUSPENDED' ? 'warning' : 'danger'} label={entry.trustStatus === 'SUSPENDED' ? 'Suspended' : 'Revoked'} />}
                />
              ))}
            </ListRowGroup>
          )}
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader title="Latest network activity" description="A read of the audit stream. Events are append-only through the API; they are not claimed to be immutable." action={<LinkArrow href="/portal/audit">Full audit trail</LinkArrow>} />
        {audit.state.status !== 'ready' ? (
          <div className="px-5 py-4">
            <LoadingBlock rows={4} label="Loading activity" />
          </div>
        ) : (
          <ListRowGroup>
            {audit.state.data.items.map((event) => (
              <ListRow
                key={event.id}
                title={event.action}
                meta={`${event.organization} · ${event.actor} · ${formatRelative(event.timestamp, DEMO_NOW)}`}
                trailing={
                  <StatusBadge
                    tone={event.outcome === 'SUCCESS' ? 'positive' : event.outcome === 'FAILURE' ? 'danger' : 'neutral'}
                    label={event.outcome === 'SUCCESS' ? 'Recorded' : event.outcome === 'FAILURE' ? 'Failed' : 'Pending'}
                  />
                }
              />
            ))}
          </ListRowGroup>
        )}
      </Panel>
    </PageBody>
  );
}