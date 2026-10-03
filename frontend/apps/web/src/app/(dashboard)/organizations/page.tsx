'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Search,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Filter,
  Eye,
  AlertTriangle,
  Plus,
  Clock,
  Ban,
  Check,
  Building,
  GraduationCap,
  HeartPulse,
  Landmark,
  Briefcase,
  Shield,
  FileCheck2,
  X
} from 'lucide-react';
import { Shell } from '../../../components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Drawer } from '../../../components/ui/Drawer';
import { Dialog } from '../../../components/ui/Dialog';
import { Organization, OrgStatus } from '../../../types';
import { getOrgStatusBadge, truncateDid, getDomainBadgeStyle } from '../../../lib/utils';
import { useRoleContext } from '../../../hooks/useRoleContext';
import { apiClient, OrganizationSummary } from '../../../../../../packages/api-client';
import { MOCK_ORGANIZATIONS } from '../../../lib/mockData';

export default function IssuersPage() {
  const { currentUser } = useRoleContext();
  if (!currentUser) return null;

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED'>('ALL');

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [approveTarget, setApproveTarget] = useState<Organization | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Organization Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regDomain, setRegDomain] = useState('education');
  const [regRef, setRegRef] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Domain → default credential types mapping
  const domainCredentialTypes: Record<string, string[]> = {
    COLLEGE: ['DegreeCredential', 'TranscriptCredential', 'AcademicAttestation'],
    HOSPITAL: ['MedicalHealthRecord', 'VaccinationCredential', 'DoctorFitAttestation'],
    BANK: ['FinancialStandingCredential', 'CreditTierAttestation'],
    EMPLOYER: ['WorkExperienceCredential', 'RecommendationCredential', 'RelievingAttestation'],
  };

  const loadIssuers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.listOrganizations();
      if (res.success && res.data?.organizations && res.data.organizations.length > 0) {
        const mapped: Organization[] = res.data.organizations.map((o: OrganizationSummary) => ({
          id: o.id,
          name: o.name,
          code: o.code,
          domain: (o.domain?.toUpperCase() as Organization['domain']) || 'ADMIN',
          did: o.did,
          status: ((o.verification_status || o.status) as OrgStatus) || 'APPROVED',
          authorizedCredentialTypes: o.authorizedCredentialTypes || o.authorized_credential_types || ['Verifiable Credentials'],
          issuedCount: 0,
          verifiedCount: 0,
          createdAt: o.createdAt || new Date().toISOString(),
        }));
        setOrgs(mapped);
      } else {
        setOrgs(MOCK_ORGANIZATIONS);
      }
    } catch (err) {
      console.warn('Using demo fallback for issuers:', err);
      setOrgs(MOCK_ORGANIZATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssuers();
  }, [loadIssuers]);

  // Handle Organization Application Submission
  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReg(true);
    try {
      const res = await apiClient.createOrganization({
        name: regName,
        code: regCode.toUpperCase(),
        domain: regDomain,
        registrationRef: regRef || `REG-${Date.now().toString().slice(-6)}`,
      });

      if (res.success) {
        setToastMessage(`Application submitted for "${regName}". Status: PENDING Super Admin Review.`);
        setShowRegisterModal(false);
        setRegName('');
        setRegCode('');
        setRegRef('');
        await loadIssuers();
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Registration failed: ' + (err.message || 'Error submitting application'));
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Super Admin Approve Organization
  const handleApproveOrg = async () => {
    if (!approveTarget) return;
    if (currentUser.role !== 'ADMIN') {
      alert('Forbidden: Only Network Super Admin can approve organization registrations.');
      return;
    }
    try {
      const credTypes = domainCredentialTypes[approveTarget.domain] || ['VerifiableCredential'];
      await apiClient.updateOrganizationStatus(approveTarget.id, {
        verificationStatus: 'APPROVED',
        isIssuer: true,
        authorizedCredentialTypes: credTypes,
      });
      setToastMessage(`Approved "${approveTarget.name}". Issuer status is now ACTIVE.`);
      await loadIssuers();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      alert('Approval failed: ' + (e.message || 'Error'));
    } finally {
      setApproveTarget(null);
    }
  };

  // Super Admin Deny / Reject Organization
  const handleDenyOrg = async (org: Organization) => {
    if (currentUser.role !== 'ADMIN') {
      alert('Forbidden: Only Network Super Admin can deny organization registrations.');
      return;
    }
    if (!confirm(`Reject issuer registration for "${org.name}"?`)) return;
    try {
      await apiClient.updateOrganizationStatus(org.id, {
        verificationStatus: 'DENIED',
      });
      setToastMessage(`Registration for "${org.name}" has been DENIED.`);
      await loadIssuers();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      alert('Denial failed: ' + (e.message || 'Error'));
    }
  };

  // Filter organizations
  const filteredOrgs = orgs.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.did.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'ALL' || o.domain === selectedDomain;
    const matchesStatus =
      statusTab === 'ALL' ||
      (statusTab === 'PENDING' && o.status === 'PENDING') ||
      (statusTab === 'APPROVED' && (o.status === 'APPROVED' || o.status === 'ACTIVE')) ||
      (statusTab === 'DENIED' && (o.status === 'DENIED' || o.status === 'REJECTED'));

    return matchesSearch && matchesDomain && matchesStatus;
  });

  const pendingCount = orgs.filter((o) => o.status === 'PENDING').length;
  const approvedCount = orgs.filter((o) => o.status === 'APPROVED' || o.status === 'ACTIVE').length;
  const deniedCount = orgs.filter((o) => o.status === 'DENIED' || o.status === 'REJECTED').length;

  return (
    <Shell>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {currentUser.role === 'ADMIN' ? 'Issuers & Network Governance Console' : 'Verified Issuers Directory'}
              </h1>
              {currentUser.role === 'ADMIN' && (
                <Badge variant="info" className="text-xs">
                  Super Admin Authority
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {currentUser.role === 'ADMIN'
                ? 'Review and approve new issuer organizations, manage cryptographic trust registries, and supervise authorized credential schemas across the network.'
                : 'Browse accredited schools, hospitals, financial institutions, and employers verified on the CredLink network.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="primary"
              onClick={() => setShowRegisterModal(true)}
              className="gap-2 font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Issuer Organization</span>
            </Button>
          </div>
        </div>

        {/* Super Admin Notice if Pending Applications Exist */}
        {currentUser.role === 'ADMIN' && pendingCount > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  {pendingCount} Organization Application(s) Awaiting Review
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  New institutions have registered and are requesting authorization to issue credentials on the platform.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatusTab('PENDING')}
              className="border-amber-400 text-amber-900 hover:bg-amber-100 text-xs shrink-0"
            >
              Review Pending Applications
            </Button>
          </div>
        )}

        {/* Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className={`p-3.5 cursor-pointer transition-all ${
              statusTab === 'ALL' ? 'ring-2 ring-forest-600' : 'hover:border-slate-300'
            }`}
            onClick={() => setStatusTab('ALL')}
          >
            <p className="text-xs font-medium text-slate-500">Total Registered Orgs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{orgs.length}</p>
          </Card>
          <Card
            className={`p-3.5 cursor-pointer transition-all ${
              statusTab === 'PENDING' ? 'ring-2 ring-amber-500' : 'hover:border-slate-300'
            }`}
            onClick={() => setStatusTab('PENDING')}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Review</p>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </Card>
          <Card
            className={`p-3.5 cursor-pointer transition-all ${
              statusTab === 'APPROVED' ? 'ring-2 ring-emerald-600' : 'hover:border-slate-300'
            }`}
            onClick={() => setStatusTab('APPROVED')}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Approved Issuers</p>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
          </Card>
          <Card
            className={`p-3.5 cursor-pointer transition-all ${
              statusTab === 'DENIED' ? 'ring-2 ring-rose-500' : 'hover:border-slate-300'
            }`}
            onClick={() => setStatusTab('DENIED')}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Rejected Applications</p>
              <Ban className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{deniedCount}</p>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search institution name, DID, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <option value="ALL">All Realms</option>
                <option value="COLLEGE">Education</option>
                <option value="HOSPITAL">Healthcare</option>
                <option value="BANK">Financial</option>
                <option value="EMPLOYER">Employer</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Organization Directory Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusTab === 'PENDING' ? 'Pending Issuer Applications' : 'Authorized Issuer Directory'} ({filteredOrgs.length})
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution Name & Code</TableHead>
                <TableHead>Decentralized Identifier (DID)</TableHead>
                <TableHead>Realm</TableHead>
                <TableHead>Authorized Schemas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading issuer network directory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No organizations found matching the current criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((org) => {
                  const statusStyle = getOrgStatusBadge(org.status);
                  const domainBadge = getDomainBadgeStyle(org.domain);
                  const isPending = org.status === 'PENDING';

                  return (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{org.name}</p>
                          <span className="font-mono text-xs text-slate-400">{org.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {truncateDid(org.did)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" className={`text-xs ${domainBadge.bg} ${domainBadge.text}`}>
                          {org.domain}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {org.authorizedCredentialTypes.slice(0, 2).map((type) => (
                            <span
                              key={type}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded font-medium text-slate-700 dark:text-slate-300"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyle.bg}>{statusStyle.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Super Admin Approve / Reject Buttons */}
                          {currentUser.role === 'ADMIN' && isPending ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setApproveTarget(org)}
                                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDenyOrg(org)}
                                className="h-7 text-xs px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                              >
                                <span>Reject</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrg(org)}
                              className="h-7 text-xs px-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* REGISTER NEW ISSUER ORGANIZATION MODAL                       */}
      {/* ============================================================ */}
      <Dialog
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Organization as CredLink Issuer"
        description="Submit your school, hospital, or enterprise for accreditation. Super Admin will review and authorize credential issuance."
      >
        <form onSubmit={handleRegisterOrg} className="space-y-4 text-xs">
          <Input
            label="Institution / Organization Legal Name"
            placeholder="e.g. Oxford Academic Trust or General Health Center"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Organization Code (3-6 chars)"
              placeholder="e.g. OXF-EDU"
              value={regCode}
              onChange={(e) => setRegCode(e.target.value.toUpperCase())}
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Institutional Realm
              </label>
              <select
                value={regDomain}
                onChange={(e) => setRegDomain(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <option value="education">Education (College / University)</option>
                <option value="healthcare">Healthcare (Hospital / Clinic)</option>
                <option value="employment">Employment (Corporate / Enterprise)</option>
                <option value="finance">Finance (Bank / Trust)</option>
              </select>
            </div>
          </div>

          <Input
            label="Registration Reference / Document Ref"
            placeholder="e.g. REG-GOV-2025-9941"
            value={regRef}
            onChange={(e) => setRegRef(e.target.value)}
          />

          <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Note: Once submitted, your organization status will be set to <strong>PENDING</strong>. Super Admin will review the accreditation details before issuing credentials is activated.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRegisterModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingReg}>
              {isSubmittingReg ? 'Submitting Registration...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ============================================================ */}
      {/* SUPER ADMIN APPROVAL CONFIRMATION DIALOG                     */}
      {/* ============================================================ */}
      <Dialog
        isOpen={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        title="Approve Issuer Organization Application"
        description="Verify the organization credentials and grant authorized issuer status on the network."
      >
        {approveTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-slate-100">{approveTarget.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">DID: {approveTarget.did}</p>
              <p className="text-slate-600 dark:text-slate-300">
                Realm: <strong>{approveTarget.domain}</strong>
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1 text-emerald-800 dark:text-emerald-300">
              <p className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authorization Granted:
              </p>
              <p>• Verification Status will change from PENDING to APPROVED</p>
              <p>• Issuer permission flag activated</p>
              <p>• Authorized schemas: {(domainCredentialTypes[approveTarget.domain] || ['VerifiableCredential']).join(', ')}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setApproveTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApproveOrg} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm & Activate Issuer
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Inspect Issuer Drawer */}
      <Drawer
        isOpen={selectedOrg !== null}
        onClose={() => setSelectedOrg(null)}
        title="Issuer Institutional Record"
        description={`DID: ${selectedOrg?.did}`}
      >
        {selectedOrg && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Institution Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedOrg.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Code</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedOrg.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Realm</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrg.domain}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trust Status</span>
                <Badge className={getOrgStatusBadge(selectedOrg.status).bg}>
                  {selectedOrg.status}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                Authorized Credential Types
              </h4>
              <div className="space-y-1.5">
                {selectedOrg.authorizedCredentialTypes.map((t) => (
                  <div key={t} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded flex items-center gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-forest-700" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </Shell>
  );
}
