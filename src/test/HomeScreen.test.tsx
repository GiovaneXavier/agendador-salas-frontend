import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeScreen } from '../screens/HomeScreen'
import { NavigationContext } from '../contexts/NavigationContext'
import type { AppScreen } from '../lib/navigation'

// Mock dos hooks que fazem chamadas HTTP
vi.mock('../hooks/useRooms')
vi.mock('../hooks/useBookings', () => ({
  useBookings: () => ({ data: [], isLoading: false }),
}))

import * as useRoomsModule from '../hooks/useRooms'

const mockNavigate = vi.fn()
const mockSetSelectedDate = vi.fn()

function renderHomeScreen() {
  return render(
    <NavigationContext.Provider value={{
      navigate: mockNavigate as (s: AppScreen) => void,
      goHome: vi.fn(),
      selectedDate: '2099-01-01',
      setSelectedDate: mockSetSelectedDate,
    }}>
      <HomeScreen />
    </NavigationContext.Provider>
  )
}

describe('HomeScreen', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe spinner enquanto carrega as salas', () => {
    vi.mocked(useRoomsModule.useRooms).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useRoomsModule.useRooms>)

    renderHomeScreen()

    // Spinner não tem texto — verifica que a mensagem de erro não aparece
    expect(screen.queryByText(/não foi possível/i)).toBeNull()
  })

  it('exibe mensagem de erro quando a API falha', () => {
    vi.mocked(useRoomsModule.useRooms).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useRoomsModule.useRooms>)

    renderHomeScreen()

    expect(screen.getByText(/não foi possível conectar à api/i)).toBeDefined()
    expect(screen.getByText(/verifique a conexão com o servidor/i)).toBeDefined()
  })

  it('exibe lista de salas quando a API responde com sucesso', () => {
    vi.mocked(useRoomsModule.useRooms).mockReturnValue({
      data: [
        { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Sala Carvalho', color_bg: '#eae4dc', color_accent: '#4a3d2f', capacity: 8, resources: ['TV'] },
        { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Sala Ipê',      color_bg: '#e2e6df', color_accent: '#2f4a3d', capacity: 4, resources: [] },
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useRoomsModule.useRooms>)

    renderHomeScreen()

    expect(screen.getByText('Sala Carvalho')).toBeDefined()
    expect(screen.getByText('Sala Ipê')).toBeDefined()
    expect(screen.queryByText(/não foi possível/i)).toBeNull()
  })

  it('não exibe mensagem de erro quando carregamento é bem-sucedido', () => {
    vi.mocked(useRoomsModule.useRooms).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useRoomsModule.useRooms>)

    renderHomeScreen()

    expect(screen.queryByText(/não foi possível/i)).toBeNull()
  })
})
