import type { ReactNode } from 'react'

interface DoorOverlayShellProps {
  eyebrow: string
  title: string
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
}

export function DoorOverlayShell({ eyebrow, title, onClose, children, footer }: DoorOverlayShellProps) {
  return (
    <div className="fixed inset-0 z-40 bg-[#f5f3ef] flex flex-col select-none">
      <header className="px-10 py-6 flex items-start justify-between border-b border-gray-200">
        <div>
          <p className="text-[10px] tracking-widest text-gray-400">{eyebrow}</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">{title}</h1>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-12 h-12 rounded-xl border border-gray-300 text-gray-500 text-xl hover:bg-gray-100 cursor-pointer"
          >
            ×
          </button>
        )}
      </header>

      <main className="flex-1 px-10 py-6 overflow-hidden min-h-0">{children}</main>

      {footer && <footer className="px-10 py-5 border-t border-gray-100">{footer}</footer>}
    </div>
  )
}
