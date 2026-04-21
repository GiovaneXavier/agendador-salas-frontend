import { useEffect, useRef, useState } from 'react'
import { STATUS_API_URL, STATUS_WS_URL } from '../lib/constants'
import type { RoomStatusData, RoomStatusMap } from '../types/roomStatus'

export function useRoomStatusMap(): RoomStatusMap {
  const [statusMap, setStatusMap] = useState<RoomStatusMap>({})
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetch(`${STATUS_API_URL}/rooms/status`)
      .then(r => r.json())
      .then((list: RoomStatusData[]) => {
        const map: RoomStatusMap = {}
        list.forEach(s => { map[s.room_id] = { ...s, type: 'room_status_update' } })
        setStatusMap(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(STATUS_WS_URL)
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const data: RoomStatusData = JSON.parse(e.data)
          if (data.type === 'room_status_update') {
            setStatusMap(prev => ({ ...prev, [data.room_id]: data }))
          }
        } catch {}
      }

      ws.onclose = () => {
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [])

  return statusMap
}
