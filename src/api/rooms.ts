import { apiClient } from '../lib/api-client'
import type { Room } from '../types/room'

export async function getRooms(): Promise<Room[]> {
  const { data } = await apiClient.get<{ data: Room[] }>('/rooms')
  return data.data
}
