import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelBooking } from '../api/bookings'
import { CancelBookingPayload } from '../types/booking'

export function useCancelBooking(roomId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelBookingPayload }) =>
      cancelBooking(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', roomId, date] }),
  })
}
