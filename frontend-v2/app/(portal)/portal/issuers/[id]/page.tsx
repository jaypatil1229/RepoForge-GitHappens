'use client';

import { ArrowLeft, Ban, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ListRow, ListRowGroup } from '@/components/portal/list-row';
import { ErrorBlock, LoadingBlock, NoticeRow, PageBody, StatRow, StatTile } from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CopyableId } from '@/components/ui/copyable-id';
import { DomainMark, credentialDomainLabel } from '@/components/ui/domain';
import { EmptyState, Panel, PanelHeader, PageHeader, DefinitionList, DefinitionRow } from '@/components/ui/surface';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { credentialStatusLabel, credentialStatusTone, formatDate, formatRelative, orgStatusLabel, orgStatusTone } from '@/lib/format';

export default function IssuerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const client = useDataClient();
  const { profile } = useDemo();

  const orgQuery = useQuery(() => client.getOrganization(id), [id]);
  const trustQuery = useQuery(() => client.getTrustEntry(id), [id]);
  const credentialsQuery = useQuery(() => client.listCredentials({ issuerOrgId: id, limit: 50 }), [id]);

  if (orgQuery.state.status === 'loading') {
    return (
      <PageBody>
        <LoadingBlock rows={7} label="Loading institution" />
      </PageBody>
    );
  }

  if (orgQuery.state.status === 'error') {
    return (
      <PageBody>
        <Link href="/portal/issuers" className="inline-flex items-center gap-1.5 text-ui text-ink-600 hover:text-ink-950">
          <ArrowLeft aria-hidden className="size-4" /> Back to the directory
        </Link>
        <EmptyState
          icon={<Ban aria-hidden className="size-4" />}
          title="Institution not available"
          description="This organization does not exist, or the reference is not valid."
        />
      </PageBody>
    );
  }

  const org = orgQuery.state.data;
  const trust = trustQuery.state.status === 'ready' ? trustQuery.state.data : null;
  const credentials = credentialsQuery.state.status === 'ready' ? credentialsQuery.state.data.items : [];
  const isAdmin = profile?.role === 'ADMIN';

  return (
    <PageBody>
      <Link href="/portal/issuers" className="inline-flex items-center gap-1.5 text-ui text-ink-600 transition-colors hover:text-ink-950">
        <ArrowLeft aria-hidden className="size-4" /> Back to the directory
      </Link>

      <PageHeader
        eyebrow={<DomainMark domain={org.domain} variant="organization" />}
        title={org.name}
        description={`${org.code} — registered with the CredLink network. Membership here does not by itself make an issuer trusted.`}
        meta={
          <>
            <StatusBadge tone={orgStatusTone[org.verificationStatus]} label={orgStatusLabel[org.verificationStatus]} />
            <span className="flex items-center gap-1.5 text-micro text-ink-500">
              DID <CopyableId value={org.did} label="organization DID" truncate />
            </span>
          </>
        }
        actions={
          isAdmin && org.verificationStatus === 'PENDING' ? (
            <ButtonLink href="/portal/organizations">Review registration</ButtonLink>
          ) : null
        }
      />

      <StatRow>
        <StatTile label="Registration" value={orgStatusLabel[org.verificationStatus]} tone={org.verificationStatus === 'APPROVED' ? 'positive' : org.verificationStatus === 'DENIED' ? 'danger' : 'warning'} hint={`Registered ${formatDate(org.createdAt)}`} />
        <StatTile label="Issuer" value={org.isIssuer ? 'Yes' : 'No'} hint={org.isIssuer ? `${org.authorizedCredentialTypes.length} authorised types` : 'Verifier only'} icon={<Building2 aria-hidden className="size-4" />} />
        <StatTile
          label="Trust"
          value={trust ? (trust.trustStatus === 'VERIFIED' ? 'Verified' : trust.trustStatus === 'SUSPENDED' ? 'Suspended' : 'Revoked') : 'Unregistered'}
          tone={trust ? (trust.trustStatus === 'VERIFIED' ? 'positive' : trust.trustStatus === 'SUSPENDED' ? 'warning' : 'danger') : 'neutral'}
          hint={trust?.lastVerifiedAt ? `Last reviewed ${formatRelative(trust.lastVerifiedAt, DEMO_NOW)}` : 'No registry entry'}
          icon={<ShieldCheck aria-hidden className="size-4" />}
        />
        <StatTile label="Visible credentials" value={credentials.length} hint="Scope depends on your role" />
      </StatRow>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <PanelHeader title="Registration" description="What the network has recorded about this organization." />
          <DefinitionList className="px-5 py-2">
            <DefinitionRow label="Legal name">{org.name}</DefinitionRow>
            <DefinitionRow label="Code">{org.code}</DefinitionRow>
            <DefinitionRow label="Domain"><DomainMark domain={org.domain} variant="organization" /></DefinitionRow>
            <DefinitionRow label="Registration reference">{org.registrationRef ?? 'Not supplied'}</DefinitionRow>
            <DefinitionRow label="Registered on">{formatDate(org.createdAt)}</DefinitionRow>
            <DefinitionRow label="DID" mono><CopyableId value={org.did} label="organization DID" /></DefinitionRow>
          </DefinitionList>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Issuer authorisation" description="Only the types listed here can be signed on behalf of this organization." />
          {org.isIssuer ? (
            <>
              <div className="flex flex-wrap gap-2 px-5 py-4">
                {org.authorizedCredentialTypes.length === 0 ? (
                  <p className="text-ui text-ink-500">No credential types have been authorised yet.</p>
                ) : (
                  org.authorizedCredentialTypes.map((type) => (
                    <span key={type} className="rounded-full border border-forest-800/15 bg-forest-50 px-2.5 py-1 text-micro font-medium text-forest-800">
                      {type}
                    </span>
                  ))
                )}
              </div>
              <div className="px-5 pb-4">
                <NoticeRow>
                  An issuer can only sign a type in this list. A request for any other type is rejected with 403, even when the
                  organization is approved.
                </NoticeRow>
              </div>
            </>
          ) : (
            <div className="px-5 py-4">
              <p className="text-ui text-ink-600">
                This organization is a verifier. It can request consent and run verification, but it cannot sign credentials.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Trust registry entry"
          description="Trust is a separate decision from registration, and it is domain-specific."
          action={isAdmin ? <ButtonLink href="/portal/trust-registry" variant="tertiary" size="sm">Manage registry</ButtonLink> : null}
        />
        {trust ? (
          <DefinitionList className="px-5 py-2">
            <DefinitionRow label="Trust status"><StatusBadge tone={trust.trustStatus === 'VERIFIED' ? 'positive' : trust.trustStatus === 'SUSPENDED' ? 'warning' : 'danger'} label={trust.trustStatus.charAt(0) + trust.trustStatus.slice(1).toLowerCase()} /></DefinitionRow>
            <DefinitionRow label="Accredited for">
              {trust.verificationMetadata.accreditedFor ? credentialDomainLabel[trust.verificationMetadata.accreditedFor] : 'No domain recorded'}
            </DefinitionRow>
            <DefinitionRow label="Last verified">{trust.lastVerifiedAt ? formatRelative(trust.lastVerifiedAt, DEMO_NOW) : 'Never'}</DefinitionRow>
            <DefinitionRow label="Issuer identifier" mono><CopyableId value={trust.issuerIdentifier} label="issuer identifier" /></DefinitionRow>
          </DefinitionList>
        ) : (
          <div className="px-5 py-4">
            <p className="text-ui text-ink-600">
              This organization has no trust registry entry. Credentials attributed to it fail the trust check regardless of the
              signature.
            </p>
          </div>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Credentials attributed to this organization"
          description={
            isAdmin
              ? 'Every credential signed by this issuer.'
              : 'Records in scope for your role. A citizen sees only their own records; an issuer sees its own.'
          }
        />
        {credentialsQuery.state.status === 'loading' ? (
          <div className="px-5 py-4">
            <LoadingBlock rows={3} label="Loading credentials" />
          </div>
        ) : credentialsQuery.state.status === 'error' ? (
          <div className="px-5 py-4">
            <ErrorBlock message={credentialsQuery.state.error} onRetry={credentialsQuery.reload} />
          </div>
        ) : credentials.length === 0 ? (
          <p className="px-5 py-8 text-center text-ui text-ink-500">No credential in your scope was signed by this organization.</p>
        ) : (
          <ListRowGroup>
            {credentials.map((credential) => (
              <ListRow
                key={credential.id}
                href={`/portal/credentials/${credential.id}`}
                leading={<DomainMark domain={credential.domain} />}
                title={credential.title}
                meta={`${credential.subjectName ?? 'Unnamed subject'} · issued ${formatDate(credential.issuanceDate)}`}
                trailing={<StatusBadge tone={credentialStatusTone[credential.status]} label={credentialStatusLabel[credential.status]} />}
              />
            ))}
          </ListRowGroup>
        )}
      </Panel>
    </PageBody>
  );
}