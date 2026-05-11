import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { Spinner } from './ui/Spinner'

const KNOX_PATTERN = /^[a-zA-Z0-9._-]+$/

interface KnoxScannerProps {
  onScan: (knoxId: string) => void
  pattern?: RegExp
  autoSubmitOnDecode?: boolean
}

type Mode = 'camera' | 'manual'
type CameraState = 'idle' | 'starting' | 'running' | 'error' | 'unsupported'

const hasCamera = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

export function KnoxScanner({
  onScan,
  pattern = KNOX_PATTERN,
  autoSubmitOnDecode = true,
}: KnoxScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const lastDecodeRef = useRef<{ value: string; at: number }>({ value: '', at: 0 })
  const onScanRef = useRef(onScan)
  const autoSubmitRef = useRef(autoSubmitOnDecode)

  useEffect(() => { onScanRef.current = onScan }, [onScan])
  useEffect(() => { autoSubmitRef.current = autoSubmitOnDecode }, [autoSubmitOnDecode])

  const [mode, setMode] = useState<Mode>('camera')
  const [cameraState, setCameraState] = useState<CameraState>(() =>
    hasCamera() ? 'idle' : 'unsupported',
  )
  const [manualValue, setManualValue] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const validate = useCallback(
    (value: string) => value.length >= 3 && pattern.test(value),
    [pattern],
  )

  const handleDecoded = useCallback((value: string) => {
    const now = Date.now()
    if (value === lastDecodeRef.current.value && now - lastDecodeRef.current.at < 1500) return
    lastDecodeRef.current = { value, at: now }

    if (!validate(value)) {
      setErrorMsg(`Código inválido: "${value}"`)
      return
    }
    setErrorMsg(null)
    onScanRef.current(value)
  }, [validate])

  // Simulate via URL: ?scan=g.xavier
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sim = params.get('scan')
    if (sim && validate(sim)) {
      const t = setTimeout(() => onScanRef.current(sim), 250)
      return () => clearTimeout(t)
    }
  }, [validate])

  // HID scanner: USB/BT barcode reader that emulates a keyboard
  useEffect(() => {
    if (mode !== 'camera') return

    let buffer = ''
    let lastKeyAt = 0

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const now = Date.now()
      if (now - lastKeyAt > 80) buffer = ''
      lastKeyAt = now

      if (e.key === 'Enter') {
        const value = buffer.trim()
        buffer = ''
        if (validate(value)) {
          e.preventDefault()
          handleDecoded(value)
        }
        return
      }

      if (e.key.length === 1) buffer += e.key
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, validate, handleDecoded])

  // Camera lifecycle
  useEffect(() => {
    if (mode !== 'camera') return
    if (!hasCamera()) return

    let cancelled = false
    let localControls: IScannerControls | null = null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hardware lifecycle transition
    setCameraState('starting')
    setErrorMsg(null)

    const reader = new BrowserMultiFormatReader()

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        if (cancelled) return
        setCameraState((prev) => (prev === 'running' ? prev : 'running'))
        if (result) {
          const value = result.getText().trim()
          handleDecoded(value)
          if (autoSubmitRef.current) controls.stop()
        }
        // per-frame NotFoundException errors are normal when no code is visible
      })
      .then((controls) => {
        if (cancelled) {
          controls?.stop()
          return
        }
        if (controls) {
          localControls = controls
          controlsRef.current = controls
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCameraState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Falha ao abrir a câmera')
      })

    return () => {
      cancelled = true
      localControls?.stop()
      controlsRef.current = null
    }
  }, [mode, handleDecoded])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = manualValue.trim()
    if (!validate(value)) {
      setErrorMsg('Knox ID deve ter pelo menos 3 caracteres válidos (a-z, 0-9, . _ -).')
      return
    }
    setErrorMsg(null)
    onScanRef.current(value)
  }

  return (
    <div className="flex flex-col h-full select-none">
      {mode === 'camera' ? (
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-gray-900 min-h-64 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Aim frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 max-w-md h-32 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>

            {/* Status overlay */}
            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/70 text-white">
                <Spinner size={28} />
                <p className="text-sm tracking-wider">INICIANDO CÂMERA…</p>
              </div>
            )}
            {cameraState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/80 text-white text-center px-6">
                <p className="text-sm font-semibold">Câmera indisponível</p>
                <p className="text-xs opacity-80">{errorMsg ?? 'Verifique permissão ou hardware'}</p>
              </div>
            )}
            {cameraState === 'unsupported' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/80 text-white text-center px-6">
                <p className="text-sm font-semibold">Sem suporte a câmera</p>
                <p className="text-xs opacity-80">Use a opção manual abaixo.</p>
              </div>
            )}

            {/* Hint footer */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className="bg-black/55 text-white text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full">
                Aproxime o crachá do leitor
              </span>
            </div>
          </div>

          {errorMsg && cameraState === 'running' && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMode('manual')}
            className="text-[11px] tracking-widest text-gray-500 hover:text-gray-800 underline underline-offset-2 self-end cursor-pointer"
          >
            DIGITAR MANUALMENTE →
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="flex-1 flex flex-col gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <label className="text-[10px] tracking-widest text-gray-400 mb-2 block">KNOX ID</label>
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              inputMode="none"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="w-full font-mono text-2xl font-bold text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              placeholder="nome.sobrenome"
            />
            <p className="text-[11px] text-gray-400 mt-3">
              Use um leitor físico (HID), ou digite com teclado externo.
              <br />O teclado virtual não será aberto.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2 mt-auto">
            <button
              type="button"
              onClick={() => { setMode('camera'); setManualValue(''); setErrorMsg(null) }}
              className="border border-gray-300 rounded-xl px-4 py-3 text-xs tracking-widest text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              ← VOLTAR PARA CÂMERA
            </button>
            <button
              type="submit"
              disabled={!validate(manualValue.trim())}
              className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 text-xs tracking-widest hover:bg-gray-700 cursor-pointer disabled:opacity-40"
            >
              CONFIRMAR →
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
