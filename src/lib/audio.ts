// Sons curtos via Web Audio API — zero asset, zero dependência.
// Cada call cria uma AudioContext nova porque alguns browsers suspendem
// contextos depois de idle. Pra totem com ações esparsas, é OK.

type AudioContextCtor = typeof AudioContext
const Ctx: AudioContextCtor | undefined =
  typeof window !== 'undefined'
    ? (window.AudioContext ??
       (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext)
    : undefined

function play(frequency: number, durationMs: number, type: OscillatorType = 'sine'): void {
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    osc.connect(gain)
    gain.connect(ctx.destination)
    // Envelope sutil pra não estourar (ataque/decay rápidos)
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01)
    gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000)
    osc.start(now)
    osc.stop(now + durationMs / 1000 + 0.02)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    // Ignora — som não é crítico
  }
}

/** Tom curto de sucesso (~A5 + E5 em rápida sucessão, tipo "confirmado"). */
export function playSuccessPing(): void {
  play(880, 100, 'sine') // A5
  setTimeout(() => play(1318.5, 120, 'sine'), 80) // E6
}

/** Beep sutil pra cada frame processado (não use — é pra teste). */
export function playTick(): void {
  play(600, 40, 'square')
}
