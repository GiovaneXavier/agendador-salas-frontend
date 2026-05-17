interface NameRevealProps {
  fullName: string
}

/** Pega o primeiro nome do `fullName` capitalizado. */
function firstName(full: string): string {
  const first = full.trim().split(/\s+/)[0] ?? full
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export function NameReveal({ fullName }: NameRevealProps) {
  return (
    <div className="knox-name-reveal pointer-events-none absolute inset-x-0 bottom-20 flex justify-center">
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl bg-[#1428a0]/35 blur-xl" />
        <div className="relative px-6 py-3 rounded-2xl bg-[#1428a0]/85 backdrop-blur-md shadow-[0_8px_28px_rgba(20,40,160,0.55)] text-white text-center">
          <div className="text-[10px] tracking-[0.24em] uppercase text-white/70">
            ✦ Identificado por Gauss
          </div>
          <div className="font-script text-3xl leading-tight mt-1">
            Olá, {firstName(fullName)}!
          </div>
          <div className="text-[11px] tracking-wider text-white/70 mt-1 font-mono uppercase">
            Confirmando reserva…
          </div>
        </div>
      </div>
      <style>{`
        @keyframes knox-name-reveal {
          0%   { opacity: 0; transform: translateY(12px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .knox-name-reveal {
          animation: knox-name-reveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
