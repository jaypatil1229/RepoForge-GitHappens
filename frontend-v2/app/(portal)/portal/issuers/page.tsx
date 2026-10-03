'use client';

import { Building2, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ErrorBlock, LoadingBlock, NoticeRow, PageBody } from '@/components/portal/parts';
import { FilterChip, TBody, TD, TH, THead, TR, TableShell, Toolbar } from '@/components/portal/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DomainMark, orgDomainLabel } from '@/components/ui/domain';
import { SearchInput } from '@/components/ui/field';
import { EmptyState, PageHeader, Panel } from '@/components/ui/surface';
import { useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { orgStatusLabel, orgStatusTone } from '@/lib/format';
import { ORG_DOMAINS } from '@/lib/types';
import type { OrgDomain } from '@/lib/types';

const TRUST_TONE = { VERIFIED: 'positive', SUSPENDED: 'warning', REVOKED: 'danger' } as const;

export default function IssuerDirectoryPage() {
  const client = useDataClient();
  const [domain, setDomain] = useState<OrgDomain | null>(null);
  const [search, setSearch] = useState('');

  const orgs = useQuery(() => client.listOrganizations({ limit: 100, domain: domain ?? undefined, search: search || undefined }), [domain, search]);
  const trust = useQuery(() => client.listTrustRegistry({ limit: 100 }), ['directory-trust']);

  const organizations = orgs.state.status === 'ready' ? orgs.state.data.items : [];
  const trustByOrg = useMemo(() => {
    const map = new Map<string, { trustStatus: 'VERIFIED' | 'SUSPENDED' | 'REVOKED'; accreditedFor?: string }>();
    if (trust.state.status === 'ready') {
      for (const entry of trust.state.data.items) {
        map.set(entry.organizationId, { trustStatus: entry.trustStatus, accreditedFor: entry.verificationMetadata.accreditedFor });
      }
    }
    return map;
  }, [trust.state]);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Network"
        title="Issuer directory"
        description="Which institutions are part of the network, what they are authorised to attest, and whether their credentials are currently trusted."
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-line-200 px-5 py-4">
          <Toolbar className="py-0">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search institutions"
              aria-label="Search institutions"
              className="w-full sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {ORG_DOMAINS.filter((item) => item !== 'network_admin').map((item) => (
                <FilterChip key={item} active={domain === item} onClick={() => setDomain(domain === item ? null : item)}>
                  {orgDomainLabel[item]}
                </FilterChip>
              ))}
            </div>
          </Toolbar>
        </div>

        {orgs.state.status === 'loading' ? (
          <div className="px-5 py-6">
            <LoadingBlock rows={5} label="Loading institutions" />
          </div>
        ) : orgs.state.status === 'error' ? (
          <div className="px-5 py-6">
            <ErrorBlock message={orgs.state.error} transport={orgs.state.transport} onRetry={orgs.reload} />
          </div>
        ) : organizations.length === 0 ? (
          <EmptyState
            icon={search || domain ? <SearchX aria-hidden className="size-4" /> : <Building2 aria-hidden className="size-4" />}
            title={search || domain ? 'No institutions match these filters' : 'No institutions yet'}
            description={search || domain ? 'Clear the filters to see every institution.' : 'Institutions appear here once they register with the network.'}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setDomain(null);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <TableShell label="Institutions">
            <THead>
              <TH>Institution</TH>
              <TH>Domain</TH>
              <TH>Registration</TH>
              <TH>Issuer</TH>
              <TH align="right">Trust</TH>
            </THead>
            <TBody>
              {organizations.map((org) => {
                const entry = trustByOrg.get(org.id);
                return (
                  <TR key={org.id} className="relative">
                    <TD className="relative">
                      <Link href={`/portal/issuers/${org.id}`} className="block after:absolute after:inset-0">
                        <span className="block font-medium text-ink-950">{org.name}</span>
                        <span className="mt-0.5 block text-micro text-ink-500">{org.code}</span>
                      </Link>
                    </TD>
                    <TD><DomainMark domain={org.domain} variant="organization" /></TD>
                    <TD><StatusBadge tone={orgStatusTone[org.verificationStatus]} label={orgStatusLabel[org.verificationStatus]} /></TD>
                    <TD className="text-ink-600">
                      {org.isIssuer ? (
                        <span className="text-ui">
                          {org.authorizedCredentialTypes.length} authorised type{org.authorizedCredentialTypes.length === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className="text-micro text-ink-500">Verifier only</span>
                      )}
                    </TD>
                    <TD align="right">
                      {entry ? (
                        <StatusBadge tone={TRUST_TONE[entry.trustStatus]} label={entry.trustStatus.charAt(0) + entry.trustStatus.slice(1).toLowerCase()} />
                      ) : (
                        <span className="text-micro text-ink-500">Not registered</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Panel>

      <NoticeRow>
        Approval as an institution and registration in the trust registry are separate decisions. An approved organization still
        fails verification until it is registered and accredited for the credential domain.
      </NoticeRow>
    </PageBody>
  );
}