'use client';

import { ChevronDown, SearchX, ScrollText } from 'lucide-react';
import { Fragment, useState } from 'react';

import { ErrorBlock, LoadingBlock, NoticeRow, PageBody } from '@/components/portal/parts';
import { FilterChip, TBody, TD, TH, THead, TR, TableShell, Toolbar } from '@/components/portal/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DomainMark } from '@/components/ui/domain';
import { SearchInput, Select } from '@/components/ui/field';
import { EmptyState, PageHeader, Panel } from '@/components/ui/surface';
import { DEMO_NOW } from '@/lib/data';
import { useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { formatDateTime, formatRelative } from '@/lib/format';
import { CREDENTIAL_DOMAINS } from '@/lib/types';
import type { AuditEventType, CredentialDomain } from '@/lib/types';
import { cn } from '@/lib/utils';

const EVENT_TYPES: AuditEventType[] = [
  'CREDENTIAL_ISSUED',
  'CREDENTIAL_REVOKED',
  'VERIFICATION_REQUESTED',
  'VERIFICATION_APPROVED',
  'ORGANIZATION_STATUS_CHANGED',
  'CONSENT_GRANTED',
  'CONSENT_REVOKED',
];

const EVENT_LABEL: Record<AuditEventType, string> = {
  CREDENTIAL_ISSUED: 'Credential issued',
  CREDENTIAL_REVOKED: 'Credential revoked',
  VERIFICATION_REQUESTED: 'Verification requested',
  VERIFICATION_APPROVED: 'Verification attempted',
  ORGANIZATION_STATUS_CHANGED: 'Organization status changed',
  CONSENT_GRANTED: 'Consent granted',
  CONSENT_REVOKED: 'Consent revoked or denied',
};

const OUTCOME_LABEL = { SUCCESS: 'Recorded', FAILURE: 'Failed', PENDING: 'Pending' } as const;

export default function AuditPage() {
  const client = useDataClient();
  const [domain, setDomain] = useState<CredentialDomain | null>(null);
  const [eventType, setEventType] = useState<AuditEventType | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const query = useQuery(
    () =>
      client.listAuditLogs({
        page,
        limit: 25,
        domain: domain ?? undefined,
        eventType: eventType || undefined,
        search: search || undefined,
      }),
    [page, domain, eventType, search],
  );

  const records = query.state.status === 'ready' ? query.state.data.items : [];
  const pagination = query.state.status === 'ready' ? query.state.data.pagination : null;
  const filtersActive = Boolean(domain || eventType || search);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Network"
        title="Audit trail"
        description="Every issue, decision, verification and status change is written as an event. The trail is append-only through the API; it is not claimed to be cryptographically immutable."
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
              placeholder="Search actor, organization or detail"
              aria-label="Search the audit trail"
              className="w-full sm:w-72"
            />
            <Select
              value={eventType}
              onChange={(event) => {
                setEventType(event.target.value as AuditEventType | '');
                setPage(1);
              }}
              aria-label="Filter by event type"
              className="w-full sm:w-56"
            >
              <option value="">All event types</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EVENT_LABEL[type]}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {CREDENTIAL_DOMAINS.map((item) => (
                <FilterChip
                  key={item}
                  active={domain === item}
                  onClick={() => {
                    setDomain(domain === item ? null : item);
                    setPage(1);
                  }}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </FilterChip>
              ))}
            </div>
          </Toolbar>
        </div>

        {query.state.status === 'loading' ? (
          <div className="px-5 py-6">
            <LoadingBlock rows={8} label="Loading the audit trail" />
          </div>
        ) : query.state.status === 'error' ? (
          <div className="px-5 py-6">
            <ErrorBlock message={query.state.error} transport={query.state.transport} onRetry={query.reload} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={filtersActive ? <SearchX aria-hidden className="size-4" /> : <ScrollText aria-hidden className="size-4" />}
            title={filtersActive ? 'No events match these filters' : 'Nothing recorded yet'}
            description={
              filtersActive
                ? 'Clear the filters to see the full stream for your scope.'
                : 'Events appear here as soon as the first credential, consent or decision is recorded.'
            }
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDomain(null);
                    setEventType('');
                    setSearch('');
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <TableShell label="Audit events">
            <THead>
              <TH>Time</TH>
              <TH>Event</TH>
              <TH>Actor</TH>
              <TH>Organization</TH>
              <TH>Domain</TH>
              <TH>Outcome</TH>
              <TH align="right">Detail</TH>
            </THead>
            <TBody>
              {records.map((event) => {
                const open = expanded === event.id;
                return (
                  <Fragment key={event.id}>
                    <TR>
                      <TD className="tabular whitespace-nowrap text-ink-600">{formatRelative(event.timestamp, DEMO_NOW)}</TD>
                      <TD>
                        <span className="block font-medium text-ink-950">{EVENT_LABEL[event.eventType]}</span>
                        <span className="mt-0.5 block max-w-[20rem] truncate text-micro text-ink-500">{event.action}</span>
                      </TD>
                      <TD className="text-ink-600">{event.actor}</TD>
                      <TD className="text-ink-600">{event.organization}</TD>
                      <TD>{CREDENTIAL_DOMAINS.includes(event.domain as CredentialDomain) ? <DomainMark domain={event.domain} /> : <span className='text-micro text-ink-500'>{event.domain}</span>}</TD>
                      <TD>
                        <StatusBadge
                          tone={event.outcome === 'SUCCESS' ? 'positive' : event.outcome === 'FAILURE' ? 'danger' : 'neutral'}
                          label={OUTCOME_LABEL[event.outcome]}
                        />
                      </TD>
                      <TD align="right">
                        <Button
                          variant="tertiary"
                          size="sm"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : event.id)}
                          icon={<ChevronDown aria-hidden className={cn('size-3.5 transition-transform', open && 'rotate-180')} />}
                        >
                          {open ? 'Hide' : 'Show'}
                        </Button>
                      </TD>
                    </TR>
                    {open ? (
                      <tr className="bg-paper-50">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <div>
                              <p className="eyebrow">Recorded detail</p>
                              <p className="mt-1.5 text-ui text-ink-950">{event.details}</p>
                              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-micro">
                                <div>
                                  <dt className="text-ink-500">Timestamp</dt>
                                  <dd className="tabular text-ink-950">{formatDateTime(event.timestamp)}</dd>
                                </div>
                                <div>
                                  <dt className="text-ink-500">Event type</dt>
                                  <dd className="mono-value">{event.eventType}</dd>
                                </div>
                                <div>
                                  <dt className="text-ink-500">Actor</dt>
                                  <dd className="text-ink-950">{event.actor}</dd>
                                </div>
                                <div>
                                  <dt className="text-ink-500">Target</dt>
                                  <dd className="mono-value break-all">{event.targetResourceId ?? 'Not recorded'}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <p className="eyebrow">Metadata</p>
                              <pre className="mt-1.5 max-h-48 overflow-auto rounded-control border border-line-200 bg-paper-0 p-3 text-[0.6875rem] leading-relaxed text-ink-600">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
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

      <NoticeRow>
        Two vocabulary quirks are visible in this stream. A denied consent is recorded as CONSENT_REVOKED, and a rejected
        verification is recorded under VERIFICATION_APPROVED with a FAILURE outcome. Filters follow the stored values, and the
        labels above say what actually happened.
      </NoticeRow>
    </PageBody>
  );
}