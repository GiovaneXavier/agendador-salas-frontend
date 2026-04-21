export type RoomStatusKind = 'LIVRE' | 'RESERVADO' | 'OCUPADO' | 'USO_NAO_AGENDADO'

export interface ActiveBookingInfo {
  booking_id: string
  username: string
  start_time: string
  end_time: string
}

export interface RoomStatusData {
  type: string
  room_id: string
  status: RoomStatusKind
  color: string
  label: string
  presence: boolean
  active_booking: ActiveBookingInfo | null
}

export type RoomStatusMap = Record<string, RoomStatusData>
