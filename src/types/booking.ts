import { ValidDuration } from '../lib/constants'

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

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
