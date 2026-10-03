'use client';

import { FileText, SearchX, Stamp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { FilterChip, TBody, TD, TH, THead, TR, TableShell, Toolbar } from '@/components/portal/table';
import { EmptyState, PageHeader, Panel } from '@/components/ui/surface';
import { ErrorBlock, LoadingBlock, PageBody } from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { DomainMark, credentialDomainLabel } from '@/components/ui/domain';
import { SearchInput } from '@/components/ui/field';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { CREDENTIAL_DOMAINS } from '@/lib/types';
import type { CredentialDomain, CredentialStatus } from '@/lib/types';
import { credentialStatusLabel, credentialStatusTone, formatDate, truncateId } from '@/lib/format';

const STATUSES: CredentialStatus[] = ['VALID', 'REVOKED', 'EXPIRED'];
const PAGE_SIZE = 10;

export default function CredentialsPage() {
  const client = useDataClient();
  const { profile, organization } = useDemo();
  const [page, setPage] = useState(1);
  const [domain, setDomain] = useState<CredentialDomain | null>(null);
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [search, setSearch] = useState('');

  const query = useQuery(
    () => client.listCredentials({ page, limit: PAGE_SIZE, domain: domain ?? undefined, status: status ?? undefined, search: search || undefined }),
    [page, domain, status, search],
  );

  const role = profile?.role;
  const isCitizen = role === 'CITIZEN';
  const isAdmin = role === 'ADMIN';
  const canIssue = role !== 'CITIZEN' && Boolean(organization?.isIssuer && organization.verificationStatus === 'APPROVED');
  const items = query.state.status === 'ready' ? query.state.data.items : [];
  const pagination = query.state.status === 'ready' ? query.state.data.pagination : null;
  const filtersActive = Boolean(domain || status || search);

  const subtitle = useMemo(() => {
    if (isCitizen) return 'Records held in CredLink for you. Each one was signed by the institution named as its issuer.';
    if (isAdmin) return 'Every credential in the network. Records are shown with their subject and issuer so provenance stays traceable.';
    return 'Records this organization issued, plus any record it was granted access to through a consent decision.';
  }, [isCitizen, isAdmin]);

  const resetFilters = () => {
    setDomain(null);
    setStatus(null);
    setSearch('');
    setPage(1);
  };

  return (
    <PageBody>
      <PageHeader
        eyebrow={isCitizen ? 'Citizen workspace' : isAdmin ? 'Network governance' : 'Issuer workspace'}
        title={isCitizen ? 'My records' : isAdmin ? 'All credentials' : 'Credentials'}
        description={subtitle}
        actions={
          canIssue || isAdmin ? (
            <ButtonLink href="/portal/credentials/new" icon={<Stamp aria-hidden className="size-4" />}>
              Issue credential
            </ButtonLink>
          ) : null
        }
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-line-200 px-5 py-4">
          <Toolbar className="py-0">
            <SearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by title, type or identifier"
              aria-label="Search credentials"
              className="w-full sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {CREDENTIAL_DOMAINS.map((item) => (
                <FilterChip
                  key={item}
                  active={domain === item}
                  onClick={() => {
                    setDomain(domain === item ? null : item);
                    setPage(1);
                  }}
                >
                  {credentialDomainLabel[item]}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {STATUSES.map((item) => (
                <FilterChip
                  key={item}
                  active={status === item}
                  onClick={() => {
                    setStatus(status === item ? null : item);
                    setPage(1);
                  }}
                >
                  {credentialStatusLabel[item]}
                </FilterChip>
              ))}
            </div>
          </Toolbar>
        </div>

        {query.state.status === 'loading' ? (
          <div className="px-5 py-6">
            <LoadingBlock rows={6} label="Loading credentials" />
          </div>
        ) : query.state.status === 'error' ? (
          <div className="px-5 py-6">
            <ErrorBlock message={query.state.error} transport={query.state.transport} onRetry={query.reload} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={filtersActive ? <SearchX aria-hidden className="size-4" /> : <FileText aria-hidden className="size-4" />}
            title={filtersActive ? 'No records match these filters' : isCitizen ? 'No records yet' : 'No credentials yet'}
            description={
              filtersActive
                ? 'Clear the filters to see the full list again.'
                : isCitizen
                  ? 'When an institution issues a credential to you, it appears here with its claims and provenance.'
                  : 'Credentials signed by this organization will appear here as soon as the first one is issued.'
            }
            action={filtersActive ? <Button variant="secondary" size="sm" onClick={resetFilters}>Clear filters</Button> : null}
          />
        ) : (
          <TableShell label="Credentials">
            <THead>
              <TH>Record</TH>
              <TH>{isCitizen ? 'Issuer' : isAdmin ? 'Subject' : 'Subject'}</TH>
              <TH>Domain</TH>
              <TH>Status</TH>
              <TH>Issued</TH>
              <TH align="right">Expires</TH>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id} className="relative">
                  <TD className="relative">
                    <Link href={`/portal/credentials/${item.id}`} className="group block after:absolute after:inset-0">
                      <span className="block font-medium text-ink-950 group-hover:text-forest-800">{item.title}</span>
                      <span className="mt-0.5 block text-micro text-ink-500">
                        {item.credentialType} · <span className="mono-value">{truncateId(item.id)}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD className="text-ink-600">{isCitizen ? item.issuer?.name ?? 'Unknown issuer' : item.subjectName ?? 'Unknown subject'}</TD>
                  <TD>
                    <DomainMark domain={item.domain} />
                  </TD>
                  <TD>
                    <StatusBadge tone={credentialStatusTone[item.status]} label={credentialStatusLabel[item.status]} />
                  </TD>
                  <TD className="tabular text-ink-600">{formatDate(item.issuanceDate)}</TD>
                  <TD align="right" className="tabular text-ink-600">
                    {item.expirationDate ? formatDate(item.expirationDate) : 'No expiry'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableShell>
        )}

        {pagination && pagination.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-5 py-3">
            <p className="tabular text-micro text-ink-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous
              </Button>
              <span className="tabular text-micro text-ink-500">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              </span>
              <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>
    </PageBody>
  );
}