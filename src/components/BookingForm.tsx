import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DAY_START, DAY_END, VALID_DURATIONS, ValidDuration } from '../lib/constants'
import { CreateBookingPayload } from '../types/booking'
import { Button } from './ui/Button'
import { ErrorAlert } from './ui/ErrorAlert'

const schema = z.object({
  start_minute:     z.coerce.number().int().min(DAY_START).max(DAY_END - 30),
  duration_minutes: z.coerce.number().refine((v): v is ValidDuration =>
    (VALID_DURATIONS as readonly number[]).includes(v),
    { message: 'Duração deve ser 30, 60, 90 ou 120 min' }
  ),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100)
    .regex(/^[a-zA-Z0-9._\-]+$/, 'Apenas letras, números, pontos, hífens e underscores'),
})

type FormData = z.infer<typeof schema>

interface BookingFormProps {
  roomId: string
  date: string
  initialStartMinute: number
  onSubmit: (payload: CreateBookingPayload) => void
  isLoading: boolean
  apiError?: string
}

function minuteToLabel(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function BookingForm({ roomId, date, initialStartMinute, onSubmit, isLoading, apiError }: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { start_minute: initialStartMinute, duration_minutes: 30, username: '' },
  })

  const slots = Array.from(
    { length: (DAY_END - DAY_START) / 30 },
    (_, i) => DAY_START + i * 30
  )

  const submit = (data: FormData) => {
    onSubmit({
      room_id:          roomId,
      date,
      start_minute:     data.start_minute,
      duration_minutes: data.duration_minutes as ValidDuration,
      username:         data.username,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {apiError && <ErrorAlert message={apiError} />}

      <div>
        <label htmlFor="start_minute" className="block text-sm font-medium text-gray-700 mb-1">Horário de início</label>
        <select
          id="start_minute"
          {...register('start_minute')}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
        >
          {slots.map(m => (
            <option key={m} value={m}>{minuteToLabel(m)}</option>
          ))}
        </select>
        {errors.start_minute && <p className="text-xs text-red-500 mt-1">{errors.start_minute.message}</p>}
      </div>

      <div>
        <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
        <select
          id="duration_minutes"
          {...register('duration_minutes')}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
        >
          {VALID_DURATIONS.map(d => (
            <option key={d} value={d}>{d} minutos</option>
          ))}
        </select>
        {errors.duration_minutes && <p className="text-xs text-red-500 mt-1">{errors.duration_minutes.message}</p>}
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
        <input
          id="username"
          {...register('username')}
          placeholder="nome.sobrenome"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
        />
        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
      </div>

      <Button type="submit" loading={isLoading} className="w-full">
        Confirmar reserva
      </Button>
    </form>
  )
}
