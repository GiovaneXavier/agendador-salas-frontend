import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Booking } from '../types/booking'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { ErrorAlert } from './ui/ErrorAlert'

const schema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(100),
})

type FormData = z.infer<typeof schema>

interface CancelModalProps {
  booking: Booking | null
  onClose: () => void
  onConfirm: (bookingId: string, username: string) => void
  isLoading: boolean
  apiError?: string
}

export function CancelModal({ booking, onClose, onConfirm, isLoading, apiError }: CancelModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const handleClose = () => {
    reset()
    onClose()
  }

  const submit = (data: FormData) => {
    if (!booking) return
    onConfirm(booking.id, data.username)
  }

  return (
    <Modal open={!!booking} onClose={handleClose} title="Cancelar reserva">
      {booking && (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <p className="text-sm text-gray-600">
            Reserva de <strong>{booking.username}</strong> —{' '}
            {booking.start_time} às {booking.end_time}
          </p>

          {apiError && <ErrorAlert message={apiError} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirme seu usuário
            </label>
            <input
              {...register('username')}
              placeholder="nome.sobrenome"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Voltar
            </Button>
            <Button type="submit" variant="danger" loading={isLoading}>
              Cancelar reserva
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
