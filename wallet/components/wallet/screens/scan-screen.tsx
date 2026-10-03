'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Camera, ImageUp, Loader2, ScanLine } from 'lucide-react'
import type { Html5Qrcode } from 'html5-qrcode'
import type { Nav } from '../wallet-app'
import { PrimaryButton, ScreenBody, ScreenHeader, SecondaryButton } from '../primitives'
import { useWallet } from '@/lib/wallet-context'

const READER_ID = 'credlink-wallet-qr-reader'

export function ScanScreen({ nav }: { nav: Nav }) {
  const wallet = useWallet()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handledRef = useRef(false)
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'scanning' | 'resolving'>('idle')
  const [error, setError] = useState<string | null>(null)

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } catch (stopError) {
      console.error('Could not stop the wallet QR scanner cleanly.', stopError)
    }
  }, [])

  useEffect(() => () => { void stopScanner() }, [stopScanner])

  const handlePayload = useCallback(async (raw: string) => {
    if (handledRef.current) return
    handledRef.current = true
    setCameraState('resolving')
    setError(null)
    await stopScanner()
    try {
      const request = await wallet.scanPayload(raw)
      if (!request.eligibility?.isEligible && request.status === 'PENDING') {
        setError(request.eligibility?.reason || 'Your account is not eligible for this request. You can still review or deny it.')
      }
      nav.push({ name: 'consent', requestId: request.id })
    } catch (scanError) {
      handledRef.current = false
      setCameraState('idle')
      setError(scanError instanceof Error ? scanError.message : 'Could not read this QR request.')
    }
  }, [nav, stopScanner, wallet.scanPayload])

  const startCamera = useCallback(async () => {
    setCameraState('starting')
    setError(null)
    handledRef.current = false
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(READER_ID, { verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decodedText) => { void handlePayload(decodedText) },
        () => undefined,
      )
      setCameraState('scanning')
    } catch (cameraError) {
      await stopScanner()
      setCameraState('idle')
      setError(cameraError instanceof Error
        ? `Could not start the camera. Allow camera access and use HTTPS or localhost. ${cameraError.message}`
        : 'Could not start the camera. Allow camera access and use HTTPS or localhost.')
    }
  }, [handlePayload, stopScanner])

  const scanImage = useCallback(async (file: File) => {
    setCameraState('resolving')
    setError(null)
    handledRef.current = false
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      await stopScanner()
      const scanner = new Html5Qrcode(READER_ID, { verbose: false })
      let payload: string
      try {
        payload = await scanner.scanFile(file, false)
      } finally {
        scanner.clear()
      }
      await handlePayload(payload)
    } catch (scanError) {
      handledRef.current = false
      setCameraState('idle')
      setError(scanError instanceof Error ? scanError.message : 'Could not decode a QR code from that image.')
    }
  }, [handlePayload, stopScanner])

  return (
    <>
      <ScreenHeader title="Scan Request" onBack={nav.back} />
      <ScreenBody className="flex flex-col gap-5 pt-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Scan a consent request</h1>
          <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
            Scan the QR code shown by an institution. The backend checks that the request is addressed to your account.
          </p>
        </div>

        <div className="relative min-h-64 overflow-hidden rounded-3xl bg-ink">
          <div id={READER_ID} className="min-h-64 w-full [&_video]:h-64 [&_video]:w-full [&_video]:object-cover" />
          {cameraState !== 'scanning' && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink text-center text-white">
              {cameraState === 'resolving' ? <Loader2 className="size-10 animate-spin" /> : <ScanLine className="size-12 opacity-50" />}
              <p className="text-sm">{cameraState === 'resolving' ? 'Checking request securely…' : 'Camera preview appears here'}</p>
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <PrimaryButton onClick={() => void startCamera()} disabled={cameraState === 'starting' || cameraState === 'resolving'}>
            {cameraState === 'starting' ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {cameraState === 'scanning' ? 'Camera is scanning…' : 'Start camera'}
          </PrimaryButton>
          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted">
            <ImageUp className="size-4" />
            Scan a QR image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={cameraState === 'starting' || cameraState === 'resolving'}
              onChange={(event) => {
                const image = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (image) void scanImage(image)
              }}
            />
          </label>
          {cameraState === 'scanning' && (
            <SecondaryButton onClick={() => { void stopScanner(); setCameraState('idle') }}>
              Stop camera
            </SecondaryButton>
          )}
        </div>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Your camera is used only to read the QR code. Review the requester and claims before approving.
        </p>
      </ScreenBody>
    </>
  )
}
