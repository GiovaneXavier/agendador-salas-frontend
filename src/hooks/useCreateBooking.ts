import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBooking } from '../api/bookings'
import type { CreateBookingPayload } from '../types/booking'

export function useCreateBooking(roomId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', roomId, date] }),
  })
}
