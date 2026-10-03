'use client';

import { ArrowLeft, Plus, Stamp, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BlockedPanel, NoticeRow, PageBody } from '@/components/portal/parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { DomainMark, credentialDomainLabel, orgDomainLabel } from '@/components/ui/domain';
import { Field, Input, Select } from '@/components/ui/field';
import { Panel, PanelHeader, PageHeader } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { CREDENTIAL_DOMAIN_BY_ORG_DOMAIN } from '@/lib/data';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { CREDENTIAL_DOMAINS } from '@/lib/types';
import type { CredentialDomain } from '@/lib/types';

interface ClaimDraft {
  key: string;
  value: string;
}

const STARTER_CLAIMS: Record<CredentialDomain, ClaimDraft[]> = {
  education: [
    { key: 'programme', value: '' },
    { key: 'fieldOfStudy', value: '' },
    { key: 'award', value: '' },
    { key: 'graduationYear', value: '' },
  ],
  employment: [
    { key: 'jobTitle', value: '' },
    { key: 'employmentType', value: '' },
    { key: 'startDate', value: '' },
    { key: 'endDate', value: '' },
  ],
  finance: [
    { key: 'accountHolder', value: '' },
    { key: 'accountType', value: '' },
    { key: 'standing', value: '' },
  ],
  healthcare: [
    { key: 'immunisation', value: '' },
    { key: 'administeredOn', value: '' },
    { key: 'practitioner', value: '' },
  ],
};

export default function IssueCredentialPage() {
  const client = useDataClient();
  const { actor, organization, profile } = useDemo();
  const router = useRouter();
  const toast = useToast();

  const canIssue = Boolean(
    actor && (actor.role === 'ADMIN' || (organization?.isIssuer && organization.verificationStatus === 'APPROVED' && (actor.memberRole === 'ADMIN' || actor.memberRole === 'ISSUER'))),
  );

  const citizens = useQuery(() => client.listCitizens(), ['citizens']);
  const orgs = useQuery(() => client.listOrganizations({ verificationStatus: 'APPROVED', limit: 100 }), ['approved-orgs']);

  const [issuerOrgId, setIssuerOrgId] = useState<string>('');
  const [subjectId, setSubjectId] = useState('');
  const [domain, setDomain] = useState<CredentialDomain | ''>('');
  const [credentialType, setCredentialType] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [claims, setClaims] = useState<ClaimDraft[]>([{ key: '', value: '' }]);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const approvedIssuers = useMemo(() => {
    if (orgs.state.status !== 'ready') return [];
    return orgs.state.data.items.filter((item) => item.isIssuer);
  }, [orgs.state]);

  const effectiveOrg = useMemo(() => {
    if (actor?.role === 'ADMIN') return approvedIssuers.find((item) => item.id === issuerOrgId) ?? null;
    return organization;
  }, [actor?.role, approvedIssuers, issuerOrgId, organization]);

  useEffect(() => {
    if (actor?.role === 'ADMIN') return;
    if (organization) {
      const mapped = CREDENTIAL_DOMAIN_BY_ORG_DOMAIN[organization.domain];
      if (mapped) setDomain(mapped);
    }
  }, [actor?.role, organization]);

  useEffect(() => {
    if (!domain) return;
    setClaims(STARTER_CLAIMS[domain].map((claim) => ({ ...claim })));
    setCredentialType(effectiveOrg?.authorizedCredentialTypes[0] ?? '');
    // Reset the draft only when the domain itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const claimError = claims.some((claim) => !claim.key.trim() || !claim.value.trim());
  const invalid = !effectiveOrg || !subjectId || !domain || !credentialType.trim() || title.trim().length < 3 || claimError;

  if (!canIssue) {
    return (
      <PageBody>
        <Link href="/portal/credentials" className="inline-flex items-center gap-1.5 text-ui text-ink-600 hover:text-ink-950">
          <ArrowLeft aria-hidden className="size-4" /> Back to credentials
        </Link>
        <PageHeader eyebrow="Issuer workspace" title="Issue a credential" description="Sign a record on behalf of an approved issuer." />
        <BlockedPanel
          title={profile?.role === 'CITIZEN' ? 'Citizens cannot issue credentials' : 'Issuance is not available in this context'}
          description={
            profile?.role === 'CITIZEN'
              ? 'CredLink separates the people who hold records from the institutions that sign them. Your workspace is for reviewing your own records and deciding what to share.'
              : 'This organization is not an approved issuer, or your membership role does not allow signing. Approvals are granted by network governance.'
          }
          rule="POST /api/credentials requires an ACTIVE membership with role ADMIN or ISSUER where the organization has is_issuer = true and verification_status = APPROVED."
          action={<ButtonLink href="/portal/issuers" variant="secondary" size="sm">See the issuer directory</ButtonLink>}
        />
      </PageBody>
    );
  }

  async function submit() {
    setTouched(true);
    if (invalid || !effectiveOrg || !domain) {
      toast.push({ tone: 'error', title: 'Complete the required fields', description: 'Every claim needs a key and a value before signing.' });
      return;
    }
    setBusy(true);
    const response = await client.issueCredential({
      subjectId,
      issuerOrgId: effectiveOrg.id,
      domain: domain as CredentialDomain,
      credentialType: credentialType.trim(),
      title: title.trim(),
      claims: Object.fromEntries(claims.map((claim) => [claim.key.trim(), claim.value.trim()])),
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString() : undefined,
    });
    setBusy(false);
    if (response.success && response.data) {
      toast.push({ tone: 'success', title: 'Credential issued', description: 'The record was signed and added to the subject\u2019s account.' });
      router.push(`/portal/credentials/${response.data.id}`);
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Issuance rejected', description: response.details?.[0]?.message });
    }
  }

  return (
    <PageBody>
      <Link href="/portal/credentials" className="inline-flex items-center gap-1.5 text-ui text-ink-600 hover:text-ink-950">
        <ArrowLeft aria-hidden className="size-4" /> Back to credentials
      </Link>
      <PageHeader
        eyebrow="Issuer workspace"
        title="Issue a credential"
        description="Choose a person, describe the record, set the claims to sign, and publish it to their account. Only the claims you enter are signed."
        meta={effectiveOrg ? <StatusBadge tone="brand" label={`Signing as ${effectiveOrg.name}`} /> : null}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="1. Who is this record for?" description="The subject is the person whose account holds the credential." />
            <div className="flex flex-col gap-4 px-5 py-4">
              {actor?.role === 'ADMIN' ? (
                <Field label="Issuing organization" required hint="Network administrators may sign on behalf of any approved issuer.">
                  <Select value={issuerOrgId} onChange={(event) => setIssuerOrgId(event.target.value)}>
                    <option value="">Select an approved issuer</option>
                    {approvedIssuers.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} — {orgDomainLabel[option.domain]}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              <Field label="Subject" required hint="Only active citizen accounts can receive credentials.">
                <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                  <option value="">{citizens.state.status === 'loading' ? 'Loading people…' : 'Select a person'}</option>
                  {citizens.state.status === 'ready'
                    ? citizens.state.data.map((citizen) => (
                        <option key={citizen.id} value={citizen.id}>
                          {citizen.fullName} — {citizen.email}
                        </option>
                      ))
                    : null}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="2. What are you attesting?" description="The domain decides which claims are meaningful and which verification checks apply." />
            <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
              <Field label="Domain" required hint={actor?.role === 'ADMIN' ? undefined : 'Fixed by the organization category.'}>
                <Select value={domain} onChange={(event) => setDomain(event.target.value as CredentialDomain | '')} disabled={actor?.role !== 'ADMIN'}>
                  <option value="">Select a domain</option>
                  {CREDENTIAL_DOMAINS.map((item) => (
                    <option key={item} value={item}>
                      {credentialDomainLabel[item]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Credential type" required hint={effectiveOrg && effectiveOrg.authorizedCredentialTypes.length > 0 ? `Authorized: ${effectiveOrg.authorizedCredentialTypes.join(', ')}` : 'Must be an authorized type for the issuer.'}>
                {effectiveOrg && effectiveOrg.authorizedCredentialTypes.length > 0 ? (
                  <Select value={credentialType} onChange={(event) => setCredentialType(event.target.value)}>
                    <option value="">Select a type</option>
                    {effectiveOrg.authorizedCredentialTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input value={credentialType} onChange={(event) => setCredentialType(event.target.value)} placeholder="e.g. DegreeCredential" />
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Title" required hint="What the holder will see at the top of the record.">
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Bachelor of Science in Computer Science" />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              level={3}
              title="3. Claims to sign"
              description="Only these key–value pairs are signed, and only these can ever be shared."
              action={
                <Button variant="secondary" size="sm" onClick={() => setClaims((current) => [...current, { key: '', value: '' }])} icon={<Plus aria-hidden className="size-3.5" />}>
                  Add claim
                </Button>
              }
            />
            <div className="flex flex-col gap-3 px-5 py-4">
              {claims.map((claim, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                  <Input
                    value={claim.key}
                    onChange={(event) =>
                      setClaims((current) => current.map((item, i) => (i === index ? { ...item, key: event.target.value } : item)))
                    }
                    placeholder="claim key"
                    aria-label={`Claim ${index + 1} key`}
                    invalid={touched && !claim.key.trim()}
                  />
                  <Input
                    value={claim.value}
                    onChange={(event) =>
                      setClaims((current) => current.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))
                    }
                    placeholder="claim value"
                    aria-label={`Claim ${index + 1} value`}
                    invalid={touched && !claim.value.trim()}
                  />
                  <Button
                    variant="tertiary"
                    size="icon"
                    aria-label={`Remove claim ${index + 1}`}
                    disabled={claims.length === 1}
                    onClick={() => setClaims((current) => current.filter((_item, i) => i !== index))}
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                  </Button>
                </div>
              ))}
              <NoticeRow>
                Claim keys are the vocabulary a verifier asks for. Keep them stable and machine-readable; the citizen sees them rendered as labels.
              </NoticeRow>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="Preview" description="How the signed record will read." />
            <div className="flex flex-col gap-3 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-ui font-medium text-ink-950">{title.trim() || 'Untitled credential'}</p>
                <StatusBadge tone="positive" label="Will be VALID" />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-micro text-ink-500">
                {domain ? <DomainMark domain={domain} /> : <span>No domain selected</span>}
                <span>{credentialType.trim() || 'no type'}</span>
              </div>
              <ul className="divide-y divide-line-200 border-t border-line-200">
                {claims.filter((claim) => claim.key.trim()).length === 0 ? (
                  <li className="py-3 text-micro text-ink-500">No claims yet.</li>
                ) : (
                  claims
                    .filter((claim) => claim.key.trim())
                    .map((claim, index) => (
                      <li key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 py-2 text-micro">
                        <span className="truncate text-ink-500">{claim.key}</span>
                        <span className="truncate text-ink-950">{claim.value || '—'}</span>
                      </li>
                    ))
                )}
              </ul>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader level={3} title="Validity" description="Optional. Without an expiry the credential stays valid until it is revoked." />
            <div className="px-5 py-4">
              <Field label="Expires on" hint="Interpreted as the end of the chosen day, UTC.">
                <Input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
              </Field>
            </div>
          </Panel>

          <div className="flex flex-col gap-3 rounded-panel border border-line-200 bg-paper-50 px-5 py-4">
            <p className="text-ui text-ink-600">
              Signing is a real cryptographic operation in the live backend. In this preview the credential is written to the
              mock store only.
            </p>
            <Button onClick={submit} disabled={busy} icon={<Stamp aria-hidden className="size-4" />}>
              {busy ? 'Signing…' : 'Sign and issue'}
            </Button>
          </div>
        </div>
      </div>
    </PageBody>
  );
}