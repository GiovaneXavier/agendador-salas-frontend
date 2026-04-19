import { createContext, useContext } from 'react'
import type { AppScreen } from '../lib/navigation'

interface NavigationContextValue {
  navigate: (screen: AppScreen) => void
  goHome: () => void
  selectedDate: string
  setSelectedDate: (date: string) => void
}

export const NavigationContext = createContext<NavigationContextValue>(null!)

export function useNav() {
  return useContext(NavigationContext)
}
