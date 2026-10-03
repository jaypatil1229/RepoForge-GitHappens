'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ScanLine,
  Camera,
  CameraOff,
  Upload,
  X,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Building2,
  FileCheck,
  Clock,
  Loader2,
  SwitchCamera,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { cn } from '../../lib/utils';
import { apiClient } from '../../../../../packages/api-client';

// ── Types ───────────────────────────────────────────────────────────────────

type ScannerPhase =
  | 'idle'       // Before camera starts
  | 'scanning'   // Camera active, looking for QR
  | 'resolving'  // Valid QR found, fetching details from backend
  | 'review'     // Consent request details shown for citizen review
  | 'submitting' // Citizen is approving/denying
  | 'success'    // Action completed
  | 'error';     // Something went wrong

interface ResolvedRequest {
  id: string;
  status: string;
  alreadyProcessed: boolean;
  eligibility?: {
    isEligible: boolean;
    reason?: string;
    matchedCredential?: {
      id: string;
      title: string;
      credentialType: string;
      status: string;
      claims: string[];
    } | null;
    availableClaims: string[];
    missingClaims: string[];
  };
  requestingOrg: { id: string; name: string; code: string; domain?: string } | null;
  credential: { id: string; title: string; credentialType: string; status: string } | null;
  domain: string;
  purpose: string;
  requestedClaims: string[];
  expiresAt: string | null;
  createdAt: string;
  qrType: string;
}

// ── Main Component ──────────────────────────────────────────────────────────

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentComplete?: () => void;
  initialRequestId?: string | null;
}

export function QrScanner({ isOpen, onClose, onConsentComplete, initialRequestId }: QrScannerProps) {
  const [phase, setPhase] = useState<ScannerPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resolvedRequest, setResolvedRequest] = useState<ResolvedRequest | null>(null);
  const [lastScannedPayload, setLastScannedPayload] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [consentAction, setConsentAction] = useState<'approved' | 'denied' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerModuleRef = useRef<any>(null);

  // ── Cleanup ─────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Full reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPhase('idle');
      setError(null);
      setResolvedRequest(null);
      setLastScannedPayload(null);
      setConsentAction(null);
    }
  }, [isOpen, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Load html5-qrcode lazily (browser-only) ───────────────────────────

  const getScanner = useCallback(async () => {
    if (scannerModuleRef.current) return scannerModuleRef.current;
    const mod = await import('html5-qrcode');
    scannerModuleRef.current = mod;
    return mod;
  }, []);

  // ── QR Decode from ImageData ──────────────────────────────────────────

  const decodeFromVideo = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const mod = await getScanner();
      // html5-qrcode does not have a direct canvas decode method in all versions
      // We'll use the QrScanner from the html5-qrcode library for image-based decoding
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      if (!blob) return null;
      const file = new File([blob], 'frame.png', { type: 'image/png' });
      const result = await mod.Html5Qrcode.scanFile(file, false);
      return result || null;
    } catch {
      return null;
    }
  }, [getScanner]);

  // ── Resolve scanned payload ───────────────────────────────────────────

  const resolvePayload = useCallback(async (rawPayload: string) => {
    // Prevent duplicate processing
    if (rawPayload === lastScannedPayload) return;
    setLastScannedPayload(rawPayload);

    stopCamera();
    setPhase('resolving');
    setError(null);

    try {
      const res = await apiClient.resolveQrPayload(rawPayload);
      if (res.success && res.data) {
        setResolvedRequest(res.data as unknown as ResolvedRequest);
        setPhase('review');
      } else {
        setError(res.error || 'Failed to resolve QR code');
        setPhase('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve QR code. Please try again.');
      setPhase('error');
    }
  }, [lastScannedPayload, stopCamera]);

  // Auto-resolve initialRequestId when opened via direct request link
  useEffect(() => {
    if (isOpen && initialRequestId) {
      const payload = JSON.stringify({
        v: 1,
        type: 'consent_request',
        id: initialRequestId,
        ts: Math.floor(Date.now() / 1000),
      });
      resolvePayload(payload);
    }
  }, [isOpen, initialRequestId, resolvePayload]);

  // ── Start Camera ──────────────────────────────────────────────────────

  const startCamera = useCallback(async (cameraIndex?: number) => {
    setPhase('scanning');
    setError(null);
    setLastScannedPayload(null);

    try {
      // Enumerate cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoCams = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoCams);

      const idx = cameraIndex ?? activeCameraIdx;
      const constraints: MediaStreamConstraints = {
        video: videoCams.length > 0 && videoCams[idx]
          ? { deviceId: { exact: videoCams[idx].deviceId }, facingMode: 'environment' }
          : { facingMode: 'environment' },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start scanning interval
      scanIntervalRef.current = setInterval(async () => {
        const result = await decodeFromVideo();
        if (result) {
          resolvePayload(result);
        }
      }, 350);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device. You can use the image upload option instead.');
      } else {
        setError(`Camera error: ${err.message || 'Unable to start camera'}`);
      }
      setPhase('error');
    }
  }, [activeCameraIdx, decodeFromVideo, resolvePayload]);

  // ── Switch Camera ─────────────────────────────────────────────────────

  const switchCamera = useCallback(() => {
    if (cameras.length <= 1) return;
    const nextIdx = (activeCameraIdx + 1) % cameras.length;
    setActiveCameraIdx(nextIdx);
    stopCamera();
    startCamera(nextIdx);
  }, [cameras, activeCameraIdx, stopCamera, startCamera]);

  // ── Image Upload ──────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setPhase('resolving');
    setError(null);

    try {
      const mod = await getScanner();
      const result = await mod.Html5Qrcode.scanFile(file, false);
      if (result) {
        resolvePayload(result);
      } else {
        setError('No QR code found in the uploaded image.');
        setPhase('error');
      }
    } catch (err: any) {
      setError('Could not read QR code from image. Please try a clearer image.');
      setPhase('error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [getScanner, resolvePayload, stopCamera]);

  // ── Consent Actions ───────────────────────────────────────────────────

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const handleApprove = useCallback(async () => {
    if (!resolvedRequest || isSubmittingAction) return;
    setIsSubmittingAction(true);
    setError(null);

    try {
      const res = await apiClient.respondConsent(
        resolvedRequest.id,
        'APPROVE',
        resolvedRequest.requestedClaims
      );

      if (res.success) {
        setConsentAction('approved');
        setPhase('success');
        onConsentComplete?.();
      } else {
        const errorMsg = res.error || 'Failed to approve consent request';
        setError(errorMsg.toLowerCase().includes('token') ? 'Your session has expired. Please sign in again.' : errorMsg);
        setPhase('review');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit approval';
      if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('401')) {
        setError('Your authentication session has expired. Please sign in again.');
      } else {
        setError(errorMsg);
      }
      setPhase('review');
    } finally {
      setIsSubmittingAction(false);
    }
  }, [resolvedRequest, isSubmittingAction, onConsentComplete]);

  const handleDeny = useCallback(async () => {
    if (!resolvedRequest || isSubmittingAction) return;
    setIsSubmittingAction(true);
    setError(null);

    try {
      const res = await apiClient.respondConsent(
        resolvedRequest.id,
        'DENY'
      );

      if (res.success) {
        setConsentAction('denied');
        setPhase('success');
        onConsentComplete?.();
      } else {
        const errorMsg = res.error || 'Failed to deny consent request';
        setError(errorMsg.toLowerCase().includes('token') ? 'Your session has expired. Please sign in again.' : errorMsg);
        setPhase('review');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit denial';
      if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('401')) {
        setError('Your authentication session has expired. Please sign in again.');
      } else {
        setError(errorMsg);
      }
      setPhase('review');
    } finally {
      setIsSubmittingAction(false);
    }
  }, [resolvedRequest, isSubmittingAction, onConsentComplete]);

  // ── Retry ─────────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    setPhase('idle');
    setError(null);
    setResolvedRequest(null);
    setLastScannedPayload(null);
    setConsentAction(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  const getDomainLabel = (domain: string) => {
    const map: Record<string, string> = {
      education: 'Education',
      healthcare: 'Healthcare',
      finance: 'Finance',
      employment: 'Employment',
      all: 'All Domains',
    };
    return map[domain?.toLowerCase()] || domain;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Scan QR Code"
      description={phase === 'idle' ? 'Scan a verification request or credential QR code' : undefined}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* ── IDLE PHASE ─────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <ScanLine className="w-9 h-9 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Ready to Scan
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Point your camera at a CredLink verification request QR code. Camera access will be requested when you start scanning.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={() => startCamera()}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Start Camera Scan
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload QR Image
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Your camera feed stays on-device and is never recorded or transmitted.
            </p>
          </div>
        )}

        {/* ── SCANNING PHASE ─────────────────────────────────────────── */}
        {phase === 'scanning' && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] max-h-[300px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/50 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                  {/* Animated scan line */}
                  <div className="absolute inset-x-2 h-0.5 bg-teal-400/70 animate-scan-line" />
                </div>
              </div>
              {/* Bottom bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-white/70 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                  Scanning...
                </span>
                <div className="flex gap-1.5">
                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={() => { stopCamera(); setPhase('idle'); }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                    title="Stop Scanning"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Image Instead
              </Button>
            </div>
          </div>
        )}

        {/* ── RESOLVING PHASE ────────────────────────────────────────── */}
        {phase === 'resolving' && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Verifying QR code...
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Resolving request details through secure backend API
            </p>
          </div>
        )}

        {/* ── REVIEW PHASE ───────────────────────────────────────────── */}
        {phase === 'review' && resolvedRequest && (
          <div className="space-y-4">
            {/* Already processed notice */}
            {resolvedRequest.alreadyProcessed && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    Already Processed
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    This request has already been {resolvedRequest.status?.toLowerCase()}.
                    No further action is required.
                  </p>
                </div>
              </div>
            )}

            {/* Request details card */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Consent Request
                    </span>
                  </div>
                  <Badge
                    variant="neutral"
                    size="sm"
                    className={cn(
                      'text-[10px]',
                      resolvedRequest.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        : resolvedRequest.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    )}
                  >
                    {resolvedRequest.status}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Requesting Organization */}
                {resolvedRequest.requestingOrg && (
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        Requesting Organization
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {resolvedRequest.requestingOrg.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {resolvedRequest.requestingOrg.code}
                      </p>
                    </div>
                  </div>
                )}

                {/* Purpose */}
                <div className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                      Purpose
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-200">
                      {resolvedRequest.purpose}
                    </p>
                  </div>
                </div>

                {/* Domain */}
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                      Domain
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-200">
                      {getDomainLabel(resolvedRequest.domain)}
                    </p>
                  </div>
                </div>

                {/* Credential */}
                {resolvedRequest.credential && (
                  <div className="flex items-start gap-2.5">
                    <FileCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        Target Credential
                      </p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {resolvedRequest.credential.title}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {resolvedRequest.credential.credentialType} • {resolvedRequest.credential.status}
                      </p>
                    </div>
                  </div>
                )}

                {/* Requested Claims */}
                {resolvedRequest.requestedClaims && resolvedRequest.requestedClaims.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-1.5 ml-6.5">
                      Requested Information
                    </p>
                    <div className="flex flex-wrap gap-1.5 ml-6.5">
                      {resolvedRequest.requestedClaims.map((claim, idx) => (
                        <Badge
                          key={idx}
                          variant="neutral"
                          size="sm"
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        >
                          {claim}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expiry */}
                {resolvedRequest.expiresAt && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        Expires
                      </p>
                      <p className="text-xs text-slate-800 dark:text-slate-200">
                        {new Date(resolvedRequest.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Eligibility Assessment ── */}
            {resolvedRequest.eligibility && (
              <div
                className={cn(
                  'p-3 rounded-lg border text-xs flex items-start gap-2.5 text-left',
                  resolvedRequest.eligibility.isEligible
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                )}
              >
                {resolvedRequest.eligibility.isEligible ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      {resolvedRequest.eligibility.isEligible ? 'Eligible for Disclosure' : 'Ineligible for Approval'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {resolvedRequest.eligibility.isEligible
                      ? resolvedRequest.eligibility.matchedCredential
                        ? `Verified credential '${resolvedRequest.eligibility.matchedCredential.title}' in wallet satisfies requested claims.`
                        : 'You possess the required verified credentials and claims in your wallet.'
                      : resolvedRequest.eligibility.reason || 'Your citizen wallet does not possess the required credential or claims to approve this request.'}
                  </p>
                  {!resolvedRequest.eligibility.isEligible && resolvedRequest.eligibility.missingClaims?.length > 0 && (
                    <p className="text-[10px] text-rose-700 dark:text-rose-300 font-medium">
                      Missing Claim(s): {resolvedRequest.eligibility.missingClaims.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons (only if PENDING) */}
            {!resolvedRequest.alreadyProcessed && resolvedRequest.status === 'PENDING' && (
              <div className="space-y-2">
                {resolvedRequest.eligibility?.isEligible !== false ? (
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-[11px] text-blue-800 dark:text-blue-300 text-center">
                      By approving, you consent to share the requested verified information with{' '}
                      <strong>{resolvedRequest.requestingOrg?.name || 'the requesting organization'}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 text-center">
                      Approval is disabled because of missing or inactive credentials. You can safely reject this request.
                    </p>
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeny}
                    disabled={isSubmittingAction}
                    className="gap-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprove}
                    disabled={isSubmittingAction || resolvedRequest.eligibility?.isEligible === false}
                    isLoading={isSubmittingAction}
                    className="gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={resolvedRequest.eligibility?.isEligible === false ? resolvedRequest.eligibility.reason : ''}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Present
                  </Button>
                </div>
              </div>
            )}

            {resolvedRequest.alreadyProcessed && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                <Button variant="primary" size="sm" onClick={handleRetry}>
                  Scan Another
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMITTING PHASE ───────────────────────────────────────── */}
        {phase === 'submitting' && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Submitting your decision...
            </p>
          </div>
        )}

        {/* ── SUCCESS PHASE ──────────────────────────────────────────── */}
        {phase === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className={cn(
              'w-16 h-16 rounded-full mx-auto flex items-center justify-center',
              consentAction === 'approved'
                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                : 'bg-slate-100 dark:bg-slate-800'
            )}>
              <CheckCircle2 className={cn(
                'w-8 h-8',
                consentAction === 'approved'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400'
              )} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {consentAction === 'approved' ? 'Consent Granted' : 'Request Denied'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {consentAction === 'approved'
                  ? `You have approved the verification request from ${resolvedRequest?.requestingOrg?.name || 'the organization'}.`
                  : `You have denied the verification request.`
                }
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={handleRetry}>
                Scan Another
              </Button>
            </div>
          </div>
        )}

        {/* ── ERROR PHASE ────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Scan Error
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {error || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="primary" size="sm" onClick={handleRetry} className="gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Image
              </Button>
            </div>
          </div>
        )}

        {/* ── Manual Entry Fallback ──────────────────────────────────── */}
        {(phase === 'idle' || phase === 'error') && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
            <ManualPayloadEntry
              onSubmit={resolvePayload}
              disabled={false}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ── Manual Payload Entry Sub-Component ────────────────────────────────────

function ManualPayloadEntry({
  onSubmit,
  disabled,
}: {
  onSubmit: (payload: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1 mx-auto"
      >
        <span>{isExpanded ? 'Hide' : 'Manual entry'}</span>
        <span className="text-[10px]">(accessibility fallback)</span>
      </button>
      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Paste QR payload JSON here, e.g. {"v":1,"type":"consent_request","id":"...","ts":...}'
            className="w-full h-20 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            disabled={disabled}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" disabled={disabled || !value.trim()}>
              Resolve Payload
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
