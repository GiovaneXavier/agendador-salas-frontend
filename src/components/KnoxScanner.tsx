import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { Spinner } from './ui/Spinner'

// Crachá Knox = CODE-128. QR_CODE como fallback útil pra testes.
const SCAN_FORMATS = [BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE]

function buildHints() {
  const hints = new Map<DecodeHintType, unknown>()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMATS)
  hints.set(DecodeHintType.TRY_HARDER, true)
  return hints
}

// DEV: regex frouxo pra testar com qualquer código de barras.
// Em produção, restringir de volta a /^[a-zA-Z0-9._-]+$/.
const KNOX_PATTERN = /.+/

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
  const [detectFlash, setDetectFlash] = useState(false)
  const [detectCount, setDetectCount] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [notFoundCount, setNotFoundCount] = useState(0)
  const [otherErrorCount, setOtherErrorCount] = useState(0)
  const [lastRead, setLastRead] = useState<string | null>(null)
  const [lastErrorKind, setLastErrorKind] = useState<string | null>(null)
  const [resolution, setResolution] = useState<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Camera lifecycle — usa decodeFromConstraints (gerencia o stream internamente)
  // mas força a cleanup a derrubar qualquer stream zumbi atrelado ao <video>,
  // o que evita o problema de "câmera não inicia na primeira abertura" no StrictMode.
  useEffect(() => {
    if (mode !== 'camera') return
    if (!hasCamera()) return
    const videoEl = videoRef.current
    if (!videoEl) return

    let cancelled = false
    let localControls: IScannerControls | null = null

    setCameraState('starting')
    setErrorMsg(null)

    // O 2º argumento é um objeto `options`, NÃO um número de intervalo
    // (foi mudança de API em versões recentes de @zxing/browser).
    const reader = new BrowserMultiFormatReader(buildHints(), {
      delayBetweenScanAttempts: 80,
      delayBetweenScanSuccess: 80,
    })
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment',
      },
    }

    reader
      .decodeFromConstraints(constraints, videoEl, (result, err, controls) => {
        if (cancelled) return
        setCameraState((prev) => (prev === 'running' ? prev : 'running'))
        setFrameCount((n) => n + 1)
        if (err) {
          const name = err.constructor?.name ?? 'Error'
          if (name === 'NotFoundException' || name === 'NotFoundException2') {
            setNotFoundCount((n) => n + 1)
          } else {
            setOtherErrorCount((n) => n + 1)
            setLastErrorKind(name)
          }
        }
        if (result) {
          setDetectFlash(true)
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
          flashTimerRef.current = setTimeout(() => setDetectFlash(false), 350)

          const value = result.getText().trim()
          setDetectCount((cnt) => cnt + 1)
          setLastRead(value)
          handleDecoded(value)
          if (autoSubmitRef.current) controls.stop()
        }
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
      if (localControls) {
        localControls.stop()
        localControls = null
      }
      controlsRef.current = null
      // Cinto + suspensório: se decodeFromConstraints já atribuiu um stream ao
      // <video> mas ainda não retornou os controls, derruba os tracks aqui.
      if (videoEl.srcObject) {
        const s = videoEl.srcObject as MediaStream
        s.getTracks().forEach((t) => t.stop())
        videoEl.srcObject = null
      }
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
              onLoadedMetadata={(e) => {
                const v = e.currentTarget
                setResolution(`${v.videoWidth}×${v.videoHeight}`)
              }}
              className="w-full h-full object-cover"
            />

            {/* Aim frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[88%] max-w-3xl h-56 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] overflow-hidden">
                {cameraState === 'running' && (
                  <div className="knox-scan-line absolute left-3 right-3 h-0.5 bg-[#4ade80] shadow-[0_0_12px_#4ade80]" />
                )}
              </div>
            </div>

            {/* CAM ATIVA badge */}
            {cameraState === 'running' && (
              <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/60 text-[10px] tracking-widest uppercase text-[#4ade80]">
                  <span className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80] knox-cam-pulse" />
                  CAM ATIVA · {frameCount}f · {notFoundCount} sem código · {otherErrorCount} erro · {detectCount} ok
                  {resolution && <span className="opacity-70">· {resolution}</span>}
                </div>
                {lastErrorKind && (
                  <div className="px-2 py-1 rounded-md bg-amber-500/80 text-[10px] font-mono text-black max-w-xs truncate">
                    ⚠ {lastErrorKind}
                  </div>
                )}
                {lastRead && (
                  <div className="px-2 py-1 rounded-md bg-black/60 text-[10px] font-mono text-white max-w-xs truncate">
                    ↳ {lastRead}
                  </div>
                )}
              </div>
            )}

            {/* Flash quando o ZXing entrega qualquer leitura */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{
                background: '#4ade80',
                opacity: detectFlash ? 0.28 : 0,
              }}
            />

            <style>{`
              @keyframes knox-scan-line {
                0%, 100% { transform: translateY(0); }
                50%      { transform: translateY(210px); }
              }
              .knox-scan-line {
                top: 0;
                animation: knox-scan-line 2.4s ease-in-out infinite;
              }
              @keyframes knox-cam-pulse {
                0%, 100% { opacity: 1; }
                50%      { opacity: 0.35; }
              }
              .knox-cam-pulse { animation: knox-cam-pulse 1.4s ease-in-out infinite; }
            `}</style>

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
