import { apiClient } from '../lib/api-client'
import type { Booking, CancelBookingPayload, CreateBookingPayload } from '../types/booking'

export async function getBookings(roomId: string, date: string): Promise<Booking[]> {
  const { data } = await apiClient.get<{ data: Booking[] }>('/bookings', {
    params: { room_id: roomId, date },
  })
  return data.data
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const { data } = await apiClient.post<{ data: Booking }>('/bookings', payload)
  return data.data
}

export async function extendBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<{ data: Booking }>(`/bookings/${id}/extend`)
  return data.data
}

export async function cancelBooking(id: string, payload: CancelBookingPayload): Promise<void> {
  await apiClient.delete(`/bookings/${id}`, { data: payload })
}
