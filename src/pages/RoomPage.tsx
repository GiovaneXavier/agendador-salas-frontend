import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useRooms } from '../hooks/useRooms'
import { useBookings } from '../hooks/useBookings'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { useExtendBooking } from '../hooks/useExtendBooking'
import { useCancelBooking } from '../hooks/useCancelBooking'
import { TimelineGrid } from '../components/TimelineGrid'
import { DatePicker } from '../components/DatePicker'
import { BookingForm } from '../components/BookingForm'
import { CancelModal } from '../components/CancelModal'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { parseApiError } from '../lib/api-client'
import type { Booking, CreateBookingPayload } from '../types/booking'

export function RoomPage() {
  const { id: roomId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [createError, setCreateError] = useState<string>()
  const [cancelError, setCancelError] = useState<string>()
  const [extendingId, setExtendingId] = useState<string | null>(null)

  const { data: rooms } = useRooms()
  const room = rooms?.find(r => r.id === roomId)

  const { data: bookings = [], isLoading, isError } = useBookings(roomId, date)

  const createMutation  = useCreateBooking(roomId, date)
  const extendMutation  = useExtendBooking(roomId, date)
  const cancelMutation  = useCancelBooking(roomId, date)

  const handleCreate = (payload: CreateBookingPayload) => {
    setCreateError(undefined)
    createMutation.mutate(payload, {
      onSuccess: () => setSelectedSlot(null),
      onError: err => setCreateError(parseApiError(err)),
    })
  }

  const handleExtend = (id: string) => {
    setExtendingId(id)
    extendMutation.mutate(id, {
      onSettled: () => setExtendingId(null),
      onError: err => alert(parseApiError(err)),
    })
  }

  const handleCancel = (bookingId: string, username: string) => {
    setCancelError(undefined)
    cancelMutation.mutate(
      { id: bookingId, payload: { username } },
      {
        onSuccess: () => setCancelTarget(null),
        onError: err => setCancelError(parseApiError(err)),
      }
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
          aria-label="Voltar"
        >
          ←
        </button>
        {room && (
          <div
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: room.color_accent }}
          />
        )}
        <h1 className="text-xl font-semibold text-gray-800">
          {room?.name ?? 'Sala'}
        </h1>
      </div>

      {/* Seletor de data */}
      <div className="flex items-center justify-between mb-6">
        <DatePicker date={date} onChange={setDate} />
        <span className="text-sm text-gray-500">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Timeline */}
      {isLoading && (
        <div className="flex justify-center py-8"><Spinner size={24} /></div>
      )}
      {isError && <ErrorAlert message="Não foi possível carregar as reservas." />}

      {!isLoading && !isError && room && (
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: room.color_bg }}
        >
          <TimelineGrid
            bookings={bookings}
            accentColor={room.color_accent}
            bgColor={room.color_bg}
            onSlotClick={setSelectedSlot}
            onExtend={handleExtend}
            onCancel={setCancelTarget}
            extendingId={extendingId}
          />
        </div>
      )}

      {/* Modal criar reserva */}
      <Modal
        open={selectedSlot !== null}
        onClose={() => { setSelectedSlot(null); setCreateError(undefined) }}
        title="Nova reserva"
      >
        {selectedSlot !== null && room && (
          <BookingForm
            roomId={roomId}
            date={date}
            initialStartMinute={selectedSlot}
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            apiError={createError}
          />
        )}
      </Modal>

      {/* Modal cancelar reserva */}
      <CancelModal
        booking={cancelTarget}
        onClose={() => { setCancelTarget(null); setCancelError(undefined) }}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
        apiError={cancelError}
      />
    </div>
  )
}
