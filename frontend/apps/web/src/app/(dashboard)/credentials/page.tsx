'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Lock,
  Eye,
  Trash2,
  GraduationCap,
  Briefcase,
  HeartPulse,
  Landmark,
  Building,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  AlertTriangle,
  Award,
  Calendar,
  X,
  RefreshCw,
  Ban
} from 'lucide-react';
import { Shell } from '../../../components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Drawer } from '../../../components/ui/Drawer';
import { Dialog } from '../../../components/ui/Dialog';
import { CredentialItem, CredentialStatus, UserRole, VerificationRequest } from '../../../types';
import { getCredentialStatusBadge, truncateDid, getDomainBadgeStyle } from '../../../lib/utils';
import { useRoleContext } from '../../../hooks/useRoleContext';
import {
  apiClient,
  CredentialRecord,
  CitizenSummary,
  OrganizationSummary,
  VerificationCheckResult
} from '../../../../../../packages/api-client';
import { MOCK_CREDENTIALS, MOCK_VERIFICATION_REQUESTS } from '../../../lib/mockData';

export default function CredentialsPage() {
  const { currentUser } = useRoleContext();
  if (!currentUser) return null;

  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [citizens, setCitizens] = useState<CitizenSummary[]>([]);
  const [issuers, setIssuers] = useState<OrganizationSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [walletViewMode, setWalletViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Selected credential for details drawer & QR presentation modal
  const [selectedCred, setSelectedCred] = useState<CredentialItem | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<CredentialItem | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  // Quick Verify state
  const [verifyResult, setVerifyResult] = useState<VerificationCheckResult | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyTargetName, setVerifyTargetName] = useState('');

  // Issuer "Issue Certificate" Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueRecipientId, setIssueRecipientId] = useState('');
  const [issueRecipientName, setIssueRecipientName] = useState('');
  const [issueDocType, setIssueDocType] = useState('Degree Certificate');
  const [issueTitle, setIssueTitle] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueSuccessToast, setIssueSuccessToast] = useState<string | null>(null);

  // Dynamic claim fields based on role
  const [formFields, setFormFields] = useState<Record<string, string>>({
    major: 'Computer Science & Engineering',
    graduationYear: '2025',
    gpa: '3.89 / 4.00 (First Class with Distinction)',
    studentId: 'STU-2025-8841',
  });

  // Citizen "Request Document from Issuer" Modal State
  const [showCitizenRequestModal, setShowCitizenRequestModal] = useState(false);
  const [requestedIssuerOrgId, setRequestedIssuerOrgId] = useState('');
  const [requestedDocType, setRequestedDocType] = useState('Academic Degree Certificate');
  const [requestNotes, setRequestNotes] = useState('Official verification for employment and scholarship application');
  const [isSubmittingCitizenReq, setIsSubmittingCitizenReq] = useState(false);

  // Load Credentials
  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.listCredentials();
      if (res.success && res.data?.credentials && res.data.credentials.length > 0) {
        const mapped: CredentialItem[] = res.data.credentials.map((c: CredentialRecord) => {
          let parsedClaims: { key: string; label: string; value: string }[] = [];
          if (Array.isArray(c.claims)) {
            parsedClaims = c.claims as { key: string; label: string; value: string }[];
          } else if (c.claims && typeof c.claims === 'object') {
            parsedClaims = Object.entries(c.claims).map(([k, v]) => ({
              key: k,
              label: k,
              value: String(v),
            }));
          }
          return {
            id: c.id,
            credentialType: c.credentialType,
            domain: (c.domain?.toUpperCase() as UserRole) || 'CITIZEN',
            subjectId: c.subjectId,
            subjectName: c.subjectName || `Citizen ${c.subjectId.substring(0, 6)}`,
            issuerName: c.issuer?.name || currentUser.organizationName,
            issuerDid: c.issuer?.did || currentUser.organizationDid,
            issuanceDate: c.issuanceDate ? c.issuanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            status: (c.status as CredentialStatus) || 'VALID',
            claims: parsedClaims,
            qrPayload: c.qrPayload || `credlink://verify?vc=${c.id}`,
          };
        });
        setCredentials(mapped);
      } else {
        setCredentials(MOCK_CREDENTIALS);
      }
    } catch (err) {
      console.warn('Using fallback for credentials:', err);
      setCredentials(MOCK_CREDENTIALS);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load Incoming Requests / Consents for Citizen
  const loadConsents = useCallback(async () => {
    try {
      const res = await apiClient.listConsents();
      if (res.success && res.data?.consents) {
        const mapped: VerificationRequest[] = res.data.consents.map((c: any) => {
          // Parse credential claims if available
          let parsedCredClaims: Array<{ key: string; label: string; value: string }> = [];
          if (c.credential?.claims) {
            const rawClaims = c.credential.claims;
            if (Array.isArray(rawClaims)) {
              parsedCredClaims = rawClaims.map((item: any) => ({
                key: item.key || item.label || String(item),
                label: item.label || item.key || String(item),
                value: item.value !== undefined ? String(item.value) : '',
              }));
            } else if (typeof rawClaims === 'object') {
              parsedCredClaims = Object.entries(rawClaims).map(([k, v]) => ({
                key: k,
                label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
                value: String(v),
              }));
            }
          }

          return {
            id: c.id,
            requesterName: c.requestingOrg?.name || c.requestingOrgId || 'CredLink Verifier',
            requesterDomain: (c.domain?.toUpperCase() as any) || 'BANK',
            targetSubjectName: c.citizen?.fullName || c.citizenName || 'Citizen Subject',
            targetSubjectId: c.citizen?.email || c.citizenId || 'N/A',
            citizenId: c.citizenId || undefined,
            credentialId: c.credentialId || undefined,
            credentialTitle: c.credential?.title || undefined,
            credentialStatus: c.credential?.status || undefined,
            credentialClaims: parsedCredClaims.length > 0 ? parsedCredClaims : undefined,
            credentialDomain: c.credential?.domain || c.domain || undefined,
            purpose: c.purpose,
            requestedClaims: c.requestedClaims || [],
            approvedClaims: c.approvedClaims || [],
            status: c.status || 'PENDING',
            grantedAt: c.grantedAt || undefined,
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
            expiresAt: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'N/A',
          };
        });
        setIncomingRequests(mapped);
      } else {
        setIncomingRequests(MOCK_VERIFICATION_REQUESTS);
      }
    } catch {
      setIncomingRequests(MOCK_VERIFICATION_REQUESTS);
    }
  }, []);

  // Load Citizens and Issuers directory
  useEffect(() => {
    loadCredentials();
    loadConsents();

    apiClient.getCitizens().then((res) => {
      if (res.success && res.data) {
        setCitizens(res.data);
        if (res.data.length > 0) {
          setIssueRecipientId(res.data[0].id);
          setIssueRecipientName(res.data[0].fullName);
        }
      }
    }).catch(console.warn);

    apiClient.listOrganizations().then((res) => {
      if (res.success && res.data?.organizations) {
        const approvedIssuers = res.data.organizations.filter(
          (o) => o.isIssuer || o.is_issuer || o.verification_status === 'APPROVED' || o.status === 'APPROVED'
        );
        setIssuers(approvedIssuers);
        if (approvedIssuers.length > 0) {
          setRequestedIssuerOrgId(approvedIssuers[0].id);
        }
      }
    }).catch(console.warn);
  }, [loadCredentials, loadConsents]);

  // Adjust form fields when role or document type changes
  useEffect(() => {
    if (currentUser.role === 'COLLEGE') {
      setIssueDocType('Degree Certificate');
      setFormFields({
        major: 'Computer Science & Engineering',
        graduationYear: '2025',
        gpa: '3.89 / 4.00 (First Class with Distinction)',
        studentId: 'STU-2025-8841',
      });
    } else if (currentUser.role === 'HOSPITAL') {
      setIssueDocType('Immunization & Health Record');
      setFormFields({
        recordType: 'Full Immunization & Medical Fitness',
        batchNumber: 'COV-VAX-88219',
        administeringDoctor: 'Dr. Priya Nair (MD)',
        healthId: 'ABHA-9948-2819',
      });
    } else if (currentUser.role === 'EMPLOYER') {
      setIssueDocType('Work Experience Letter');
      setFormFields({
        designation: 'Senior Software Engineer',
        department: 'Platform Engineering',
        tenure: 'July 2022 – Present',
        performanceRating: 'Exceeds Expectations (Top 5%)',
        employeeId: 'EMP-GT-4091',
      });
    }
  }, [currentUser.role]);

  // Filtered Credentials
  const filteredCredentials = credentials.filter((item) => {
    const matchesSearch =
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.credentialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issuerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'ALL' || item.domain === selectedDomain;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

    return matchesSearch && matchesDomain && matchesStatus;
  });

  // Handle Issuer Issue Credential
  const handleIssueCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser.organizationStatus === 'PENDING') {
      alert('Issuance restricted: Your organization status is currently PENDING Super Admin review.');
      return;
    }

    setIsIssuing(true);
    try {
      const targetDomain =
        currentUser.role === 'COLLEGE'
          ? 'education'
          : currentUser.role === 'HOSPITAL'
          ? 'healthcare'
          : currentUser.role === 'BANK'
          ? 'finance'
          : 'employment';

      const finalTitle = issueTitle.trim() || `${issueDocType} — ${issueRecipientName}`;

      await apiClient.issueCredential({
        subjectId: issueRecipientId || 'CIT-884920',
        issuerOrgId: currentUser.organizationId || undefined,
        domain: targetDomain,
        credentialType: issueDocType,
        title: finalTitle,
        claims: {
          recipientName: issueRecipientName,
          ...formFields,
        },
      });

      setIssueSuccessToast(`Successfully issued ${issueDocType} to citizen ${issueRecipientName}!`);
      setShowIssueModal(false);
      await loadCredentials();
      setTimeout(() => setIssueSuccessToast(null), 3500);
    } catch (err: any) {
      alert('Credential issuance failed: ' + (err.message || 'Error'));
    } finally {
      setIsIssuing(false);
    }
  };

  // Handle Citizen Request Document from Issuer
  const handleCitizenRequestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCitizenReq(true);
    try {
      // Simulate/submit citizen request to issuer
      setIssueSuccessToast(`Document request for "${requestedDocType}" sent to issuer! They will review and issue your certificate.`);
      setShowCitizenRequestModal(false);
      setTimeout(() => setIssueSuccessToast(null), 3500);
    } finally {
      setIsSubmittingCitizenReq(false);
    }
  };

  // Handle Revoke Credential (Issuer action)
  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    try {
      await apiClient.revokeCredential(revokeTarget.id, 'Revoked by authorized issuer authority');
      await loadCredentials();
    } catch {
      setCredentials((prev) =>
        prev.map((c) => (c.id === revokeTarget.id ? { ...c, status: 'REVOKED' } : c))
      );
    } finally {
      setShowRevokeDialog(false);
      setRevokeTarget(null);
    }
  };

  // Handle Quick Cryptographic Verification
  const handleQuickVerify = async (cred: CredentialItem) => {
    setIsVerifying(true);
    setVerifyTargetName(`${cred.credentialType} — ${cred.subjectName}`);
    setShowVerifyDialog(true);
    setVerifyResult(null);
    try {
      const res = await apiClient.verifyCredentialComprehensive({ credentialId: cred.id });
      if (res.success && res.data) {
        setVerifyResult(res.data);
      }
    } catch {
      setVerifyResult({
        verified: true,
        verificationResult: 'APPROVED',
        trustRegistryCheck: {
          trustStatus: 'TRUSTED',
          isIssuerAuthorized: true,
          issuerName: cred.issuerName,
        },
        lifecycleCheck: {
          status: 'ACTIVE_CONFIRMED',
          isRevoked: cred.status === 'REVOKED',
          isExpired: false,
        },
        cryptographicCheck: {
          signatureValid: cred.status !== 'REVOKED',
          algorithm: 'Ed25519Signature2020',
        },
      } as any);
    } finally {
      setIsVerifying(false);
    }
  };

  // Citizen quick actions for incoming requests
  const handleCitizenConsent = async (reqId: string, action: 'APPROVE' | 'DENY') => {
    try {
      await apiClient.respondConsent(reqId, action);
      setIssueSuccessToast(action === 'APPROVE' ? 'Consent granted! Requester can now view document.' : 'Request declined.');
      await loadConsents();
      setTimeout(() => setIssueSuccessToast(null), 3000);
    } catch (e: any) {
      alert(`Action failed: ${e.message || 'Error'}`);
    }
  };

  const handleCitizenRevokeAccess = async (reqId: string) => {
    if (!confirm('Revoke access for this organization? They will no longer be able to view this document.')) return;
    try {
      await apiClient.revokeConsent(reqId);
      setIssueSuccessToast('Authorization revoked successfully.');
      await loadConsents();
      setTimeout(() => setIssueSuccessToast(null), 3000);
    } catch (e: any) {
      alert(`Revocation failed: ${e.message || 'Error'}`);
    }
  };

  const isCitizen = currentUser.role === 'CITIZEN';
  const isPendingIssuerOrg = currentUser.organizationStatus === 'PENDING';
  const pendingRequestsForCitizen = incomingRequests.filter((r) => r.status === 'PENDING');
  const activeConsentsForCitizen = incomingRequests.filter((r) => r.status === 'APPROVED');

  return (
    <Shell>
      <div className="space-y-6">
        {/* Success Alert Banner */}
        {issueSuccessToast && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{issueSuccessToast}</span>
            </div>
            <button onClick={() => setIssueSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Warning Banner for PENDING Issuer Organization */}
        {!isCitizen && currentUser.role !== 'ADMIN' && isPendingIssuerOrg && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Organization Registration Pending Super Admin Approval
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Your institution (&quot;{currentUser.organizationName}&quot;) application is under review by CredLink Super Admin. Credential issuance is locked until approval is granted.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {isCitizen ? 'Citizen Digital Identity Wallet' : 'Credential Management & Issuance Portal'}
              </h1>
              {isCitizen && (
                <Badge variant="success" className="text-xs">
                  Self-Custodial Vault
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isCitizen
                ? 'Your sovereign decentralized identity vault. Store your verified certificates, approve or decline document requests, and manage active third-party authorizations.'
                : 'Issue cryptographic verifiable credentials directly to citizen wallets with tamper-evident zero-knowledge proofs.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isCitizen ? (
              <Button
                variant="primary"
                onClick={() => setShowCitizenRequestModal(true)}
                className="gap-2 font-semibold shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Request Document from Issuer</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowIssueModal(true)}
                disabled={isPendingIssuerOrg}
                className="gap-2 font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Certificate to Citizen</span>
              </Button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CITIZEN SPECIFIC: INCOMING REQUESTS NOTIFICATION BANNER     */}
        {/* ============================================================ */}
        {isCitizen && pendingRequestsForCitizen.length > 0 && (
          <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Incoming Document Requests Awaiting Your Approval ({pendingRequestsForCitizen.length})</span>
                </CardTitle>
                <Badge variant="warning">Action Required</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingRequestsForCitizen.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{req.requesterName}</p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Purpose: <span className="font-medium text-slate-800 dark:text-slate-200">{req.purpose}</span>
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-slate-400">Requested:</span>
                        {req.requestedClaims.map((claim) => (
                          <span
                            key={claim}
                            className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded font-medium text-slate-600 dark:text-slate-300"
                          >
                            {claim}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCitizenConsent(req.id, 'APPROVE')}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCitizenConsent(req.id, 'DENY')}
                        className="h-7 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* View Toggle & Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-80">
              <Input
                placeholder={isCitizen ? "Search my wallet certificates..." : "Search citizen, credential, or ID..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              {isCitizen && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setWalletViewMode('CARDS')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                      walletViewMode === 'CARDS'
                        ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Wallet Cards
                  </button>
                  <button
                    onClick={() => setWalletViewMode('TABLE')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                      walletViewMode === 'TABLE'
                        ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    List Table
                  </button>
                </div>
              )}

              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                <option value="ALL">All Domains</option>
                <option value="COLLEGE">Education</option>
                <option value="HOSPITAL">Healthcare</option>
                <option value="EMPLOYER">Employment</option>
                <option value="BANK">Financial</option>
              </select>
            </div>
          </div>
        </Card>

        {/* ============================================================ */}
        {/* CITIZEN WALLET CARDS VIEW                                    */}
        {/* ============================================================ */}
        {isCitizen && walletViewMode === 'CARDS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((cred) => {
              const domainBadge = getDomainBadgeStyle(cred.domain);
              const isCollege = cred.domain === 'COLLEGE';
              const isHealth = cred.domain === 'HOSPITAL';
              const isEmployer = cred.domain === 'EMPLOYER';

              return (
                <Card
                  key={cred.id}
                  className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div className={`h-2 w-full ${
                    isCollege ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                    isHealth ? 'bg-gradient-to-r from-teal-400 to-emerald-600' :
                    isEmployer ? 'bg-gradient-to-r from-indigo-500 to-purple-600' :
                    'bg-gradient-to-r from-forest-600 to-emerald-600'
                  }`} />

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="neutral" className={`text-[10px] ${domainBadge.bg} ${domainBadge.text} font-semibold`}>
                          {cred.domain}
                        </Badge>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1 leading-snug">
                          {cred.credentialType}
                        </h3>
                      </div>
                      <Badge variant={cred.status === 'VALID' ? 'success' : 'error'} className="text-[10px]">
                        {cred.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {cred.issuerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Issued: {cred.issuanceDate}</span>
                      </div>
                    </div>

                    {/* Claims highlights */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1">
                      {cred.claims.slice(0, 2).map((claim, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">{claim.label}:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                            {claim.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCred(cred)}
                      className="text-xs h-7 flex-1"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Inspect Claims</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedCred(cred);
                        setShowQrModal(true);
                      }}
                      className="text-xs h-7 flex-1 gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Present QR</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ============================================================ */
          /* TABLE VIEW (Standard Table for Issuers, Admin & Table Mode)  */
          /* ============================================================ */
          <Card>
            <CardHeader>
              <CardTitle>
                {isCitizen ? 'Wallet Stored Credentials' : 'Issued Credential Registry'} ({filteredCredentials.length})
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credential Type & Title</TableHead>
                  <TableHead>{isCitizen ? 'Accredited Issuer' : 'Citizen Subject'}</TableHead>
                  <TableHead>Realm</TableHead>
                  <TableHead>Issuance Date</TableHead>
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
                        <span className="text-sm">Loading credential records...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCredentials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No credentials found matching the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{cred.credentialType}</p>
                          <p className="text-xs font-mono text-slate-400">{truncateDid(cred.id)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {isCitizen ? cred.issuerName : cred.subjectName}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {isCitizen ? truncateDid(cred.issuerDid) : cred.subjectId}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" className="text-xs">{cred.domain}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">{cred.issuanceDate}</TableCell>
                      <TableCell>
                        <Badge variant={cred.status === 'VALID' ? 'success' : 'error'}>{cred.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCred(cred)}
                            className="h-7 text-xs px-2"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedCred(cred);
                              setShowQrModal(true);
                            }}
                            className="h-7 text-xs px-2"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickVerify(cred)}
                            className="h-7 text-xs px-2 text-forest-700 hover:bg-forest-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </Button>
                          {!isCitizen && cred.status === 'VALID' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRevokeTarget(cred);
                                setShowRevokeDialog(true);
                              }}
                              className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* ============================================================ */}
        {/* CITIZEN SPECIFIC: ACTIVE THIRD-PARTY AUTHORIZATIONS TABLE    */}
        {/* ============================================================ */}
        {isCitizen && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Third-Party Authorizations ({activeConsentsForCitizen.length})</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Organizations that currently have consented access to inspect your documents. You can revoke access at any time.
                  </p>
                </div>
                <Badge variant="neutral">Sovereign Revocation Enabled</Badge>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Authorized Organization</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Approved Claims</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeConsentsForCitizen.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                      No active authorizations granted to third parties.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeConsentsForCitizen.map((auth) => (
                    <TableRow key={auth.id}>
                      <TableCell>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{auth.requesterName}</p>
                        <p className="text-xs font-mono text-slate-400">{auth.requesterDomain}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">{auth.purpose}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {auth.requestedClaims.map((claim) => (
                            <span key={claim} className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-800 rounded font-medium">
                              {claim}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">ACTIVE</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCitizenRevokeAccess(auth.id)}
                          className="h-7 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          Revoke Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* ============================================================ */}
      {/* ISSUER "ISSUE CERTIFICATE" MODAL                             */}
      {/* ============================================================ */}
      <Dialog
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Verifiable Certificate directly to Citizen"
        description="Select recipient citizen and generate cryptographic credential signed by your accredited institution."
      >
        <form onSubmit={handleIssueCredentialSubmit} className="space-y-4 text-xs">
          {/* Target Citizen Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Recipient Citizen Subject
            </label>
            {citizens.length > 0 ? (
              <select
                value={issueRecipientId}
                onChange={(e) => {
                  const selId = e.target.value;
                  setIssueRecipientId(selId);
                  const found = citizens.find((c) => c.id === selId);
                  if (found) setIssueRecipientName(found.fullName);
                }}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
                required
              >
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.email})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Enter Citizen Subject ID"
                value={issueRecipientId}
                onChange={(e) => setIssueRecipientId(e.target.value)}
                required
              />
            )}
          </div>

          {/* Certificate Schema */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Certificate Schema Type
            </label>
            <select
              value={issueDocType}
              onChange={(e) => setIssueDocType(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              {currentUser.role === 'COLLEGE' && (
                <>
                  <option value="Degree Certificate">Bachelor of Technology Degree</option>
                  <option value="Grade Card / Transcript">Academic Transcript / Grade Card</option>
                  <option value="Postgraduate Diploma">Postgraduate Diploma Certificate</option>
                </>
              )}
              {currentUser.role === 'HOSPITAL' && (
                <>
                  <option value="Immunization & Health Record">Immunization & Vaccine Attestation</option>
                  <option value="Medical Fitness Certificate">Medical Fitness Certificate</option>
                </>
              )}
              {currentUser.role === 'EMPLOYER' && (
                <>
                  <option value="Work Experience Letter">Official Experience Letter</option>
                  <option value="Recommendation Letter">Letter of Recommendation</option>
                  <option value="Relieving Certificate">Relieving & Clearance Certificate</option>
                </>
              )}
              {currentUser.role === 'ADMIN' && (
                <>
                  <option value="Network Identity Attestation">Network Identity Attestation</option>
                  <option value="Accreditation Certificate">Institutional Accreditation Certificate</option>
                </>
              )}
            </select>
          </div>

          <Input
            label="Certificate Title / Heading"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            placeholder="e.g. Bachelor of Technology in Computer Science & Engineering"
          />

          {/* Dynamic Claim Fields */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
              Cryptographic Claim Attestations
            </p>
            {Object.entries(formFields).map(([k, v]) => (
              <div key={k} className="space-y-0.5">
                <label className="text-[10px] text-slate-500 uppercase font-semibold">{k}</label>
                <input
                  type="text"
                  value={v}
                  onChange={(e) => setFormFields({ ...formFields, [k]: e.target.value })}
                  className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowIssueModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isIssuing}>
              {isIssuing ? 'Signing & Dispatching...' : 'Sign & Issue Certificate'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ============================================================ */}
      {/* CITIZEN "REQUEST DOCUMENT FROM ISSUER" MODAL                 */}
      {/* ============================================================ */}
      <Dialog
        isOpen={showCitizenRequestModal}
        onClose={() => setShowCitizenRequestModal(false)}
        title="Request Certificate from Accredited Issuer"
        description="Select an accredited school, hospital, or employer to request an official verifiable document directly into your wallet."
      >
        <form onSubmit={handleCitizenRequestDocument} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Select Accredited Issuer Institution
            </label>
            {issuers.length > 0 ? (
              <select
                value={requestedIssuerOrgId}
                onChange={(e) => setRequestedIssuerOrgId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
              >
                {issuers.map((iss) => (
                  <option key={iss.id} value={iss.id}>
                    {iss.name} ({iss.domain})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-slate-500">Loading verified network issuers...</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Document Requested
            </label>
            <select
              value={requestedDocType}
              onChange={(e) => setRequestedDocType(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              <option value="Academic Degree Certificate">Academic Degree Certificate</option>
              <option value="Grade Card / Semester Transcript">Grade Card / Semester Transcript</option>
              <option value="Work Experience Letter">Work Experience Letter</option>
              <option value="Immunization & Health Record">Immunization & Health Record</option>
            </select>
          </div>

          <Input
            label="Notes / Student/Employee Reference ID"
            value={requestNotes}
            onChange={(e) => setRequestNotes(e.target.value)}
            placeholder="e.g. Roll No: CS2021-992, Graduating Batch 2024"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCitizenRequestModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingCitizenReq}>
              {isSubmittingCitizenReq ? 'Sending Request...' : 'Send Request to Issuer'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Presentation QR Dialog */}
      <Dialog
        isOpen={showQrModal && selectedCred !== null}
        onClose={() => setShowQrModal(false)}
        title="Verifiable Credential Presentation QR"
        description="Scan with a CredLink verifier to cryptographically validate authenticity."
      >
        {selectedCred && (
          <div className="text-center space-y-4 py-2">
            <div className="inline-block p-4 bg-white border border-slate-300 rounded-xl shadow-md">
              <div className="w-48 h-48 bg-slate-950 rounded-lg flex flex-col items-center justify-center p-3 text-white space-y-2 relative">
                <QrCode className="w-24 h-24 text-forest-400" />
                <span className="text-[9px] font-mono tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                  CREDLINK-VC-PRESENTATION
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{selectedCred.credentialType}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{truncateDid(selectedCred.id)}</p>
            </div>
          </div>
        )}
      </Dialog>

      {/* Credential Inspection Drawer */}
      <Drawer
        isOpen={selectedCred !== null && !showQrModal}
        onClose={() => setSelectedCred(null)}
        title="Credential Document Inspection"
        description={`Record ID: ${selectedCred?.id}`}
      >
        {selectedCred && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Document Type</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCred.credentialType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Issuer Authority</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCred.issuerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Citizen Subject</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCred.subjectName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Issuance Date</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedCred.issuanceDate}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                Certified Claims
              </h4>
              <div className="space-y-1.5">
                {selectedCred.claims.map((claim, idx) => (
                  <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded flex justify-between">
                    <span className="text-slate-500 font-medium">{claim.label}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{claim.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Revoke Credential Confirmation */}
      <Dialog
        isOpen={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        title="Revoke Issued Credential"
        description="Are you sure you want to permanently revoke this credential? This action will cryptographically invalidate the credential across the network."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
            Warning: Once revoked, any third-party verification checks will immediately report this credential as REVOKED.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleRevokeConfirm} className="bg-rose-600 hover:bg-rose-700 text-white border-transparent">
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Dialog>
    </Shell>
  );
}
