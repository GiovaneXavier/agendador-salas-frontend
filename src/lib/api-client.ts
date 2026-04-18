import axios from 'axios'
import { API_BASE_URL } from './constants'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 409) return 'Horário já está ocupado. Escolha outro slot.'
    if (status === 403) return 'Usuário não autorizado a cancelar esta reserva.'
    if (status === 404) return data?.message ?? 'Recurso não encontrado.'
    if (status === 422 && data?.errors) {
      const first = Object.values(data.errors as Record<string, string[]>)[0]
      return first?.[0] ?? 'Dados inválidos.'
    }
    return data?.message ?? 'Erro inesperado. Tente novamente.'
  }
  return 'Erro de conexão com o servidor.'
}
