'use client';

import { Building2, Check, Info, KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { NoticeRow, PageBody } from '@/components/portal/parts';
import { roleLabel } from '@/components/portal/nav';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Panel, PanelHeader, PageHeader, DefinitionList, DefinitionRow } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { useDemo, useDataClient } from '@/lib/demo/demo-provider';
import { useQuery } from '@/lib/demo/use-query';
import { formatDate } from '@/lib/format';
import { initials } from '@/lib/utils';

export default function ProfilePage() {
  const client = useDataClient();
  const { profile, organization, account, leave, client: dataClient } = useDemo();
  const router = useRouter();
  const toast = useToast();

  const query = useQuery(() => dataClient.getProfile(), []);
  const record = query.state.status === 'ready' ? query.state.data : profile;

  const [fullName, setFullName] = useState(record?.fullName ?? '');
  const [phone, setPhone] = useState(record?.phone ?? '');
  const [busy, setBusy] = useState(false);

  // Sync the form once the scoped profile read resolves, without clobbering edits made meanwhile.
  useEffect(() => {
    if (query.state.status !== 'ready') return;
    setFullName(query.state.data.fullName);
    setPhone(query.state.data.phone ?? '');
  }, [query.state]);

  async function save() {
    if (fullName.trim().length < 2) {
      toast.push({ tone: 'error', title: 'A name is required', description: 'The API rejects an empty or one-character name.' });
      return;
    }
    setBusy(true);
    const response = await client.updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
    setBusy(false);
    if (response.success) {
      toast.push({ tone: 'success', title: 'Profile saved', description: 'Your name and contact number were updated in the preview store.' });
      query.reload();
    } else {
      toast.push({ tone: 'error', title: response.error ?? 'Save failed', description: response.details?.[0]?.message });
    }
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your identity in CredLink. Name and phone number can be changed; role, email and account status are controlled by the network."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <PanelHeader title="Your details" description="What other participants see when they interact with you." />
          {query.state.status === 'loading' ? (
            <div className="px-5 py-6">
              <p className="text-ui text-ink-500">Loading your profile…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-5 py-4">
              <Field label="Full name" required>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              </Field>
              <Field label="Phone number" optional hint="Stored as supplied. CredLink does not verify phone numbers in this build.">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98000 00000" autoComplete="tel" />
              </Field>
              <div className="flex items-center gap-3">
                <Button onClick={save} disabled={busy} icon={<Check aria-hidden className="size-4" />}>
                  {busy ? 'Saving…' : 'Save changes'}
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => {
                    setFullName(record?.fullName ?? '');
                    setPhone(record?.phone ?? '');
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel className="overflow-hidden">
            <PanelHeader title="Account" description="Read-only fields. These are set by the network, not by you." />
            <div className="flex items-center gap-3 border-b border-line-200 px-5 py-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest-800 text-ui font-semibold text-white">
                {record ? initials(record.fullName) : '—'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-ui font-medium text-ink-950">{record?.fullName ?? 'Unknown'}</p>
                <p className="truncate text-micro text-ink-500">{record?.email ?? 'No email'}</p>
              </div>
              <span className="ml-auto">
                <StatusBadge
                  tone={record?.accountStatus === 'ACTIVE' ? 'positive' : 'danger'}
                  label={record?.accountStatus === 'ACTIVE' ? 'Active' : 'Suspended'}
                />
              </span>
            </div>
            <DefinitionList className="px-5 py-2">
              <DefinitionRow label="Email">{record?.email ?? 'Not set'}</DefinitionRow>
              <DefinitionRow label="Role">{record ? roleLabel[record.role] : 'Unknown'}</DefinitionRow>
              <DefinitionRow label="Organization">{organization?.name ?? 'No organization in this context'}</DefinitionRow>
              <DefinitionRow label="Membership role">{account?.memberRole ?? 'Not a member of an organization'}</DefinitionRow>
              <DefinitionRow label="Organization DID" mono>{organization?.did ?? '—'}</DefinitionRow>
              <DefinitionRow label="Member since">{record ? formatDate(record.createdAt) : '—'}</DefinitionRow>
            </DefinitionList>
            <div className="px-5 pb-4">
              <NoticeRow>
                PATCH /api/profiles/me rejects role, email and account status. A role change is a governance decision, not a profile
                setting.
              </NoticeRow>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="This preview context" description="What is and is not happening in this build." />
            <div className="flex flex-col gap-3 px-5 py-4">
              <ul className="flex flex-col gap-3 text-ui text-ink-600">
                <li className="flex gap-3">
                  <UserRound aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                  <span>You are browsing as a synthetic account. No password was checked, and no token was issued.</span>
                </li>
                <li className="flex gap-3">
                  <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                  <span>Data comes from a typed mock store behind the same interface the live API client will implement.</span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                  <span>Authorization scoping is modelled on the backend, so a citizen cannot reach institution data.</span>
                </li>
                <li className="flex gap-3">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                  <span>Nothing in this build contacts the backend or writes to any database.</span>
                </li>
              </ul>
              <div className="flex flex-wrap items-center gap-2 border-t border-line-200 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    leave();
                    router.push('/login');
                  }}
                  icon={<LogOut aria-hidden className="size-4" />}
                >
                  Switch preview context
                </Button>
                <Button variant="tertiary" onClick={() => router.push('/portal')} icon={<Building2 aria-hidden className="size-4" />}>
                  Back to overview
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageBody>
  );
}