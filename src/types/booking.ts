import type { ValidDuration } from '../lib/constants'
export type { ValidDuration }

export interface Booking {
  id: string
  room_id: string
  date: string
  start_minute: number
  duration_minutes: ValidDuration
  end_minute: number
  start_time: string
  end_time: string
  username: string
  full_name: string
  created_at: string
}

export interface CreateBookingPayload {
  room_id: string
  date: string
  start_minute: number
  duration_minutes: ValidDuration
  username: string
}

export interface CancelBookingPayload {
  username: string
}
