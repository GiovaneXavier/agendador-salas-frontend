export const DAY_START = 420   // 07:00
export const DAY_END   = 1200  // 20:00
export const VALID_DURATIONS = [30, 60, 90, 120] as const
export type ValidDuration = typeof VALID_DURATIONS[number]

export const TOTAL_SLOTS = (DAY_END - DAY_START) / 30 // 26 slots de 30min

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export const STATUS_API_URL = import.meta.env.VITE_STATUS_API_URL ?? 'http://localhost:9000'
export const STATUS_WS_URL = STATUS_API_URL.replace(/^http/, 'ws') + '/ws'
