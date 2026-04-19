import { useQuery } from '@tanstack/react-query'
import { getBookings } from '../api/bookings'

export function useBookings(roomId: string, date: string) {
  return useQuery({
    queryKey: ['bookings', roomId, date],
    queryFn: () => getBookings(roomId, date),
    enabled: !!roomId && !!date,
    refetchInterval: 60_000,
  })
}
