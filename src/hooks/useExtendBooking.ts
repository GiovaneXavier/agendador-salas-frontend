import { useMutation, useQueryClient } from '@tanstack/react-query'
import { extendBooking } from '../api/bookings'

export function useExtendBooking(roomId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => extendBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', roomId, date] }),
  })
}
