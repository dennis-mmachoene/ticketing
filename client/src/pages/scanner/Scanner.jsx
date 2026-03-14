import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, LayoutDashboard, Users, Camera, CameraOff
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { scannerAPI } from '../../services/api'
import { formatDateTime } from '../../utils/helpers'

const RESULT_STYLES = {
  VALID: {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    title: 'Entry Granted',
    titleColor: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  ALREADY_USED: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    title: 'Already Used',
    titleColor: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  INVALID: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-400',
    title: 'Invalid Ticket',
    titleColor: 'text-red-400',
    dot: 'bg-red-400',
  },
}

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [validating, setValidating] = useState(false)
  const scannerRef = useRef(null)
  const scannerInstanceRef = useRef(null)
  const hasScannedRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop()
        }
        scannerInstanceRef.current.clear()
      } catch (e) {
        // ignore cleanup errors
      }
      scannerInstanceRef.current = null
    }
    setScanning(false)
  }, [])

  const handleScanSuccess = useCallback(async (decodedText) => {
    if (hasScannedRef.current || validating) return
    hasScannedRef.current = true

    await stopScanner()
    setValidating(true)

    try {
      const res = await scannerAPI.validate({ token: decodedText })
      setScanResult(res.data)
    } catch (e) {
      setScanResult({
        result: 'INVALID',
        message: e.response?.data?.message || 'Validation failed.',
        ticket: null,
      })
    } finally {
      setValidating(false)
    }
  }, [validating, stopScanner])

  const startScanner = useCallback(async () => {
    setScanResult(null)
    setCameraError('')
    hasScannedRef.current = false

    await stopScanner()

    try {
      const instance = new Html5Qrcode('qr-reader')
      scannerInstanceRef.current = instance

      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      )
      setScanning(true)
    } catch (err) {
      if (err?.toString().includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else {
        setCameraError('Could not access camera. Make sure you are using HTTPS or localhost.')
      }
      setScanning(false)
    }
  }, [handleScanSuccess, stopScanner])

  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  const handleScanAnother = () => {
    setScanResult(null)
    startScanner()
  }

  const style = scanResult ? RESULT_STYLES[scanResult.result] || RESULT_STYLES.INVALID : null

  return (
    <AppLayout>
      <div className="max-w-md mx-auto">
        <div className="page-header text-center">
          <h1 className="page-title">Ticket Scanner</h1>
          <p className="page-subtitle">Point camera at QR code to validate entry</p>
        </div>

        {/* Result Panel */}
        {scanResult && style && (
          <div className={`card p-6 mb-6 border animate-slide-up ${style.bg}`}>
            <div className="text-center mb-5">
              <div className="relative inline-block mb-4">
                <style.icon className={`w-16 h-16 ${style.iconColor}`} />
                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${style.dot} border-2 border-ink-800`} />
              </div>
              <h2 className={`text-2xl font-extrabold mb-1 ${style.titleColor}`}>{style.title}</h2>
              <p className="text-ink-400 text-sm">{scanResult.message}</p>
            </div>

            {scanResult.ticket && (
              <div className="bg-ink-900 rounded-xl p-4 space-y-3 mb-5">
                <div>
                  <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Ticket Holder</div>
                  <div className="text-ink-100 font-bold text-lg">{scanResult.ticket.holderName}</div>
                  {scanResult.ticket.holderEmail && (
                    <div className="text-ink-400 text-xs">{scanResult.ticket.holderEmail}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Ticket ID</div>
                    <div className="font-mono text-xs text-amber-400">{scanResult.ticket.ticketId}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Ticket Type</div>
                    <div className="text-ink-200 text-sm font-semibold">{scanResult.ticket.tierName}</div>
                  </div>
                </div>
                {scanResult.ticket.eventName && (
                  <div>
                    <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Event</div>
                    <div className="text-ink-200 text-sm">{scanResult.ticket.eventName}</div>
                  </div>
                )}
                {scanResult.ticket.usedAt && (
                  <div>
                    <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Scanned At</div>
                    <div className="text-ink-400 text-xs">{formatDateTime(scanResult.ticket.usedAt)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleScanAnother} className="btn-primary flex-1 justify-center">
                <RotateCcw className="w-4 h-4" /> Scan Another
              </button>
              <Link to="/dashboard" className="btn-secondary flex-1 justify-center">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Camera viewfinder */}
        {!scanResult && (
          <div className="card overflow-hidden mb-4">
            <div className="relative bg-ink-950 aspect-square">
              <div id="qr-reader" className="w-full h-full" />

              {!scanning && !cameraError && !validating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950">
                  <div className="w-20 h-20 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center">
                    <Camera className="w-9 h-9 text-ink-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-ink-300 font-semibold mb-1">Camera is off</p>
                    <p className="text-ink-600 text-sm">Tap Start Scanner to begin</p>
                  </div>
                </div>
              )}

              {validating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/90 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-xl border-2 border-amber-DEFAULT border-t-transparent rounded-full animate-spin" />
                  <p className="text-amber-DEFAULT font-semibold text-sm">Validating ticket...</p>
                </div>
              )}

              {scanning && !validating && (
                <>
                  {/* Corner guides */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-52 h-52">
                      {/* Corners */}
                      {[
                        'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                        'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                        'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                        'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 border-amber-DEFAULT ${cls}`} />
                      ))}
                      {/* Scan line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-amber-DEFAULT/70 top-1/2 animate-scan-line" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className="bg-ink-900/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-ink-300 font-medium">Scanning...</span>
                    </div>
                  </div>
                </>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950 p-6 text-center">
                  <CameraOff className="w-12 h-12 text-red-400" />
                  <p className="text-red-300 font-semibold text-sm">Camera Error</p>
                  <p className="text-ink-500 text-xs">{cameraError}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-ink-700 flex gap-2">
              {!scanning ? (
                <button onClick={startScanner} className="btn-primary flex-1 justify-center">
                  <ScanLine className="w-4 h-4" /> Start Scanner
                </button>
              ) : (
                <button onClick={stopScanner} className="btn-danger flex-1 justify-center">
                  <CameraOff className="w-4 h-4" /> Stop Scanner
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/scanner/attendees" className="card-hover p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink-700 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-amber-DEFAULT" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-200">Attendees</div>
              <div className="text-xs text-ink-500">View list</div>
            </div>
          </Link>
          <Link to="/dashboard" className="card-hover p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink-700 flex items-center justify-center">
              <LayoutDashboard className="w-4.5 h-4.5 text-amber-DEFAULT" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-200">Dashboard</div>
              <div className="text-xs text-ink-500">Overview</div>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
