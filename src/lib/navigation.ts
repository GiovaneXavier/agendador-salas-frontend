import type { Room } from '../types/room'
import type { Booking, ValidDuration } from '../types/booking'

export type AppScreen =
  | { kind: 'home' }
  | { kind: 'booking-details'; booking: Booking; room: Room }
  | { kind: 'book-step1'; room: Room; date: string; startMinute: number }
  | { kind: 'book-step2'; room: Room; date: string; startMinute: number; duration: ValidDuration }
  | { kind: 'cancel-confirm'; booking: Booking; room: Room }
  | {
      kind: 'confirmation'
      variant: 'created' | 'cancelled' | 'extended'
      roomName: string
      startTime: string
      endTime: string
      date: string
      fullName?: string
    }
