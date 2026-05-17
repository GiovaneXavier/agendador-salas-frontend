import { useCallback, useEffect, useRef, useState } from 'react'
import { extractGenWithDebug, getOCRWorker, type ExtractionResult } from '../lib/ocr'
import { playSuccessPing } from '../lib/audio'
import { Spinner } from './ui/Spinner'
import { ProgressRing } from './ocr/ProgressRing'
import { PipelineStepper } from './ocr/PipelineStepper'
import { FieldHighlights } from './ocr/FieldHighlights'
import { NameReveal } from './ocr/NameReveal'

interface KnoxOCRScannerProps {
  onScan: (knoxId: string) => void
  /** Intervalo entre tentativas de OCR (ms). Default 1500. */
  intervalMs?: number
}

type Mode = 'camera' | 'manual'
type CameraState = 'idle' | 'starting' | 'running' | 'error' | 'unsupported'
type OCRState = 'init' | 'idle' | 'scanning'

const hasCamera = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

export function KnoxOCRScanner({ onScan, intervalMs = 1500 }: KnoxOCRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onScanRef = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  const [mode, setMode] = useState<Mode>('camera')
  const [cameraState, setCameraState] = useState<CameraState>(() =>
    hasCamera() ? 'idle' : 'unsupported',
  )
  const [ocrState, setOcrState] = useState<OCRState>('init')

  const [manualValue, setManualValue] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [attempts, setAttempts] = useState(0)
  const [lastSeenText, setLastSeenText] = useState<string | null>(null)
  const [lastCandidate, setLastCandidate] = useState<string | null>(null)
  const [lastDebug, setLastDebug] = useState<ExtractionResult | null>(null)
  const [resolution, setResolution] = useState<string | null>(null)

  // ----- Camera lifecycle -----
  useEffect(() => {
    if (mode !== 'camera') return
    if (!hasCamera()) return
    const videoEl = videoRef.current
    if (!videoEl) return

    let cancelled = false
    let stream: MediaStream | null = null

    setCameraState('starting')
    setErrorMsg(null)

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        videoEl.srcObject = s
        videoEl.play().catch(() => {})
        setCameraState('running')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCameraState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Falha ao abrir a câmera')
      })

    return () => {
      cancelled = true
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      if (videoEl.srcObject) {
        const s = videoEl.srcObject as MediaStream
        s.getTracks().forEach((t) => t.stop())
        videoEl.srcObject = null
      }
    }
  }, [mode])

  // ----- OCR loop -----
  useEffect(() => {
    if (mode !== 'camera') return
    if (cameraState !== 'running') return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    async function tick() {
      if (cancelled) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.videoWidth === 0) {
        timeoutId = setTimeout(tick, 300)
        return
      }

      try {
        const worker = await getOCRWorker()
        if (cancelled) return

        // Snapshot do frame atual
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          timeoutId = setTimeout(tick, intervalMs)
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        setOcrState('scanning')
        const { data } = await worker.recognize(canvas)
        if (cancelled) return

        setAttempts((n) => n + 1)
        setLastSeenText(data.text)

        const debug = extractGenWithDebug(data)
        setLastDebug(debug)
        if (debug.value) {
          setLastCandidate(debug.value)
          playSuccessPing()
          // Atraso curto pra o usuário ver o "Olá, <Nome>!" antes de navegar
          setTimeout(() => {
            if (cancelled) return
            onScanRef.current(debug.value!)
          }, 1400)
          return // para o loop após sucesso
        }
        setOcrState('idle')
        timeoutId = setTimeout(tick, intervalMs)
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : 'Falha no OCR')
        setOcrState('idle')
        timeoutId = setTimeout(tick, intervalMs * 2)
      }
    }

    // Aguarda o worker carregar e dispara o primeiro tick
    // eslint-disable-next-line react-hooks/set-state-in-effect -- transição de status no lifecycle do hardware
    setOcrState('init')
    getOCRWorker()
      .then(() => {
        if (cancelled) return
        setOcrState('idle')
        tick()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : 'Falha ao inicializar OCR')
      })

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [mode, cameraState, intervalMs])

  // ----- HID scanner: leitor USB emulando teclado, mesmo em modo OCR -----
  const validate = useCallback(
    (value: string) => value.trim().length >= 3,
    [],
  )
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
          onScanRef.current(value)
        }
        return
      }
      if (e.key.length === 1) buffer += e.key
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, validate])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = manualValue.trim()
    if (!validate(value)) {
      setErrorMsg('Identificador precisa ter pelo menos 3 caracteres.')
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
            {/* Canvas escondido pra snapshots */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Field highlights — overlay SVG sobre o vídeo */}
            {cameraState === 'running' && lastDebug && (
              <FieldHighlights
                highlights={lastDebug.highlights}
                imageWidth={lastDebug.imageWidth}
                imageHeight={lastDebug.imageHeight}
              />
            )}

            {/* Aim frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[88%] max-w-3xl h-56 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>

            {/* Gauss badge + progress ring + debug */}
            {cameraState === 'running' && (
              <div className="absolute top-3 left-3 flex items-start gap-3">
                <ProgressRing attempts={attempts} cap={15} size={52} />
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1428a0]/85 text-[11px] tracking-widest uppercase text-white shadow-[0_4px_12px_rgba(20,40,160,0.45)]">
                    <span className="knox-gauss-pulse text-base leading-none">✦</span>
                    <span>
                      {ocrState === 'init'
                        ? 'Inicializando Gauss…'
                        : ocrState === 'scanning'
                        ? 'Lendo com Gauss…'
                        : 'Gauss pronto'}
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-black/55 text-[10px] font-mono text-white/90 flex gap-2">
                    {resolution && <span className="opacity-70">{resolution}</span>}
                    {lastDebug && (
                      <span className="opacity-80">
                        GEN:{lastDebug.genDetected ? '✓' : '✗'} {lastDebug.strategy}
                      </span>
                    )}
                  </div>
                  {lastCandidate && (
                    <div className="px-2 py-1 rounded-md bg-[#10b981]/90 text-[10px] font-mono text-white">
                      ✓ GEN {lastCandidate}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pipeline stepper — canto inferior esquerdo */}
            {cameraState === 'running' && (
              <div className="absolute bottom-16 left-3 max-w-[260px]">
                <PipelineStepper
                  attempts={attempts}
                  hasName={!!lastDebug?.name}
                  genDetected={!!lastDebug?.genDetected}
                  hasGenValue={!!lastCandidate}
                />
              </div>
            )}

            {/* Name reveal — aparece quando GEN é capturado */}
            {lastCandidate && lastDebug?.name && (
              <NameReveal fullName={lastDebug.name} />
            )}

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
                Aproxime o crachá — leitura automática
              </span>
            </div>

            <style>{`
              @keyframes knox-gauss-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%      { opacity: 0.6; transform: scale(1.15); }
              }
              .knox-gauss-pulse { animation: knox-gauss-pulse 1.4s ease-in-out infinite; display: inline-block; }
            `}</style>
          </div>

          {errorMsg && cameraState === 'running' && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {lastSeenText && attempts > 0 && (
            <details className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-[11px] text-gray-500 font-mono leading-snug">
              <summary className="text-gray-400 text-[10px] tracking-widest cursor-pointer select-none">
                OCR (clique pra expandir) · {lastSeenText.length} chars
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words max-h-48 overflow-auto text-gray-700">
                {lastSeenText}
              </pre>
            </details>
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
            <label className="text-[10px] tracking-widest text-gray-400 mb-2 block">
              IDENTIFICADOR (GEN OU KNOX ID)
            </label>
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              inputMode="none"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="w-full font-mono text-2xl font-bold text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              placeholder="22537320"
            />
            <p className="text-[11px] text-gray-400 mt-3">
              Use o leitor físico (HID) ou um teclado externo.
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
              onClick={() => {
                setMode('camera')
                setManualValue('')
                setErrorMsg(null)
              }}
              className="border border-gray-300 rounded-xl px-4 py-3 text-xs tracking-widest text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              ← VOLTAR PARA CÂMERA
            </button>
            <button
              type="submit"
              disabled={!validate(manualValue)}
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
