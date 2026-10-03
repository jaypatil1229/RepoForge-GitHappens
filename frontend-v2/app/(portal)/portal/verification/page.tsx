'use client';

import { Inbox, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ErrorBlock, LoadingBlock, PageBody } from '@/components/portal/parts';
import { FilterChip, TBody, TD, TH, THead, TR, TableShell } from '@/components/portal/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { DomainMark, credentialDomainLabel } from '@/components/ui/domain';
import { SearchInput } from '@/components/ui/field';
import { EmptyState, PageHeader, Panel } from '@/components/ui/surface';
import { DEMO_NOW } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { consentStatusLabel, consentStatusTone, formatDate, formatRelative, truncateId } from '@/lib/format';
import { CREDENTIAL_DOMAINS } from '@/lib/types';
import type { ConsentDomain, ConsentStatus } from '@/lib/types';

const STATUSES: ConsentStatus[] = ['PENDING', 'APPROVED', 'DENIED', 'REVOKED', 'EXPIRED'];
const PAGE_SIZE = 10;

export default function VerificationPage() {
  const client = useDataClient();
  const { profile, actor } = useDemo();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [domain, setDomain] = useState<ConsentDomain | null>(null);
  const [search, setSearch] = useState('');

  const query = useQuery(
    () =>
      client.listConsents({
        page,
        limit: PAGE_SIZE,
        status: status ?? undefined,
        domain: domain ?? undefined,
        search: search || undefined,
      }),
    [page, status, domain, search],
  );

  const role = profile?.role;
  const isCitizen = role === 'CITIZEN';
  const isAdmin = role === 'ADMIN';
  const canRequest = Boolean(actor?.organizationId && actor.memberRole && actor.memberRole !== 'MEMBER');
  const items = query.state.status === 'ready' ? query.state.data.items : [];
  const pagination = query.state.status === 'ready' ? query.state.data.pagination : null;
  const filtersActive = Boolean(status || domain || search);

  return (
    <PageBody>
      <PageHeader
        eyebrow={isCitizen ? 'Citizen workspace' : isAdmin ? 'Network governance' : 'Verification workspace'}
        title={isCitizen ? 'Sharing requests' : isAdmin ? 'All requests' : 'Verification center'}
        description={
          isCitizen
            ? 'Each request names one organization, one purpose and the exact claims they want. Approve all, approve some, or decline. An approval can be withdrawn later.'
            : isAdmin
              ? 'Every consent record in the network, with the requesting organization and the citizen who decides it.'
              : 'Requests this organization has made, and the state of each one. Approved is not the same as verified: run the verification to check the signature, trust and lifecycle.'
        }
        actions={canRequest && !isAdmin ? <ButtonLink href="/portal/verification/new" icon={<Inbox aria-hidden className="size-4" />}>New request</ButtonLink> : null}
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-line-200 px-5 py-4">
          <div className="flex flex-col gap-3 py-0 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={isCitizen ? 'Search by organization or purpose' : 'Search by person or purpose'}
              aria-label="Search requests"
              className="w-full lg:w-72"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUSES.map((item) => (
                <FilterChip
                  key={item}
                  active={status === item}
                  onClick={() => {
                    setStatus(status === item ? null : item);
                    setPage(1);
                  }}
                >
                  {consentStatusLabel[item]}
                </FilterChip>
              ))}
            </div>
            {isCitizen ? null : (
              <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
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
            )}
          </div>
        </div>

        {query.state.status === 'loading' ? (
          <div className="px-5 py-6">
            <LoadingBlock rows={6} label="Loading requests" />
          </div>
        ) : query.state.status === 'error' ? (
          <div className="px-5 py-6">
            <ErrorBlock message={query.state.error} transport={query.state.transport} onRetry={query.reload} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={filtersActive ? <SearchX aria-hidden className="size-4" /> : <Inbox aria-hidden className="size-4" />}
            title={filtersActive ? 'No requests match these filters' : isCitizen ? 'No one has asked for your records' : 'No requests yet'}
            description={
              filtersActive
                ? 'Clear the filters to see every request again.'
                : isCitizen
                  ? 'When an organization asks to see specific claims, the request appears here for you to decide.'
                  : 'Create a request that names the claims you need and the purpose they will be used for.'
            }
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatus(null);
                    setDomain(null);
                    setSearch('');
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : canRequest ? (
                <ButtonLink href="/portal/verification/new" size="sm">
                  New request
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          <TableShell label="Verification requests">
            <THead>
              <TH>{isCitizen ? 'Requested by' : 'Citizen'}</TH>
              <TH>Purpose</TH>
              <TH>Claims</TH>
              <TH>Domain</TH>
              <TH>Status</TH>
              <TH align="right">Updated</TH>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id} className="relative">
                  <TD className="relative">
                    <Link href={`/portal/verification/${item.id}`} className="block after:absolute after:inset-0">
                      <span className="block font-medium text-ink-950">
                        {isCitizen ? item.requestingOrg?.name ?? 'Unknown requester' : item.citizenName ?? 'Citizen'}
                      </span>
                      <span className="mt-0.5 block text-micro text-ink-500">
                        {item.credential?.title ?? 'No credential linked'} · <span className="mono-value">{truncateId(item.id)}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD className="max-w-[22rem] text-ink-600">
                    <span className="line-clamp-2">{item.purpose}</span>
                  </TD>
                  <TD className="tabular text-ink-600">
                    <span className="text-ink-950">{item.approvedClaims.length}</span> / {item.requestedClaims.length}
                  </TD>
                  <TD>
                    {item.domain === 'all' ? <span className="text-micro text-ink-500">All domains</span> : <DomainMark domain={item.domain} />}
                  </TD>
                  <TD>
                    <StatusBadge tone={consentStatusTone[item.status]} label={consentStatusLabel[item.status]} />
                  </TD>
                  <TD align="right" className="tabular text-ink-600">
                    {formatRelative(item.updatedAt, DEMO_NOW)}
                    {item.expiresAt ? <span className="mt-0.5 block text-micro text-ink-500">expires {formatDate(item.expiresAt)}</span> : null}
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