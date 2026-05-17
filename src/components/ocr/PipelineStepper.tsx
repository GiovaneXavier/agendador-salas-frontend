type StepStatus = 'pending' | 'active' | 'done'

interface Step {
  id: string
  label: string
  status: StepStatus
}

interface PipelineStepperProps {
  /** Frames analisados — ativa "Detectando crachá". */
  attempts: number
  /** Nome lido — ativa "Lendo dados pessoais". */
  hasName: boolean
  /** Label GEN detectado — ativa "Extraindo identificador". */
  genDetected: boolean
  /** Valor GEN extraído — ativa "Validando acesso". */
  hasGenValue: boolean
}

export function PipelineStepper({
  attempts,
  hasName,
  genDetected,
  hasGenValue,
}: PipelineStepperProps) {
  const steps: Step[] = [
    {
      id: 'detect',
      label: 'Crachá detectado',
      status: attempts > 0 ? 'done' : 'active',
    },
    {
      id: 'read',
      label: 'Lendo dados pessoais',
      status: hasName ? 'done' : attempts > 0 ? 'active' : 'pending',
    },
    {
      id: 'extract',
      label: 'Extraindo identificador',
      status: hasGenValue ? 'done' : genDetected ? 'active' : 'pending',
    },
    {
      id: 'validate',
      label: 'Validando acesso',
      status: hasGenValue ? 'active' : 'pending',
    },
  ]

  return (
    <div className="rounded-xl bg-black/55 backdrop-blur-sm px-3 py-2.5 space-y-1.5">
      {steps.map((s) => (
        <div key={s.id} className="flex items-center gap-2 text-white text-[12px]">
          <StepIcon status={s.status} />
          <span
            className={
              s.status === 'done'
                ? 'opacity-90'
                : s.status === 'active'
                ? 'opacity-100 font-semibold'
                : 'opacity-50'
            }
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4ade80] text-black text-[10px] font-bold">
        ✓
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className="relative inline-flex w-4 h-4">
        <span className="absolute inset-0 rounded-full bg-[#60a5fa] animate-ping opacity-75" />
        <span className="relative inline-block w-4 h-4 rounded-full bg-[#60a5fa]" />
      </span>
    )
  }
  return <span className="inline-block w-4 h-4 rounded-full border border-white/30" />
}
