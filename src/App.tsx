import { useState, useCallback } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { format } from 'date-fns'
import { queryClient } from './lib/query-client'
import { NavigationContext } from './contexts/NavigationContext'
import type { AppScreen } from './lib/navigation'
import { TotemHeader } from './components/TotemHeader'
import { HomeScreen } from './screens/HomeScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { BookingDetailsScreen } from './screens/BookingDetailsScreen'
import { BookingStep1Screen } from './screens/BookingStep1Screen'
import { BookingStep2Screen } from './screens/BookingStep2Screen'
import { CancelConfirmScreen } from './screens/CancelConfirmScreen'
import { ConfirmationScreen } from './screens/ConfirmationScreen'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>({ kind: 'home' })
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const navigate = useCallback((s: AppScreen) => setScreen(s), [])
  const goHome = useCallback(() => setScreen({ kind: 'home' }), [])

  function renderScreen() {
    switch (screen.kind) {
      case 'home':
        return <HomeScreen />
      case 'dashboard':
        return <DashboardScreen />
      case 'booking-details':
        return <BookingDetailsScreen booking={screen.booking} room={screen.room} />
      case 'book-step1':
        return <BookingStep1Screen room={screen.room} date={screen.date} startMinute={screen.startMinute} />
      case 'book-step2':
        return (
          <BookingStep2Screen
            room={screen.room}
            date={screen.date}
            startMinute={screen.startMinute}
            duration={screen.duration}
          />
        )
      case 'cancel-confirm':
        return <CancelConfirmScreen booking={screen.booking} room={screen.room} />
      case 'confirmation':
        return (
          <ConfirmationScreen
            variant={screen.variant}
            roomName={screen.roomName}
            startTime={screen.startTime}
            endTime={screen.endTime}
            date={screen.date}
            fullName={screen.fullName}
          />
        )
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContext.Provider value={{ navigate, goHome, selectedDate, setSelectedDate }}>
        <div className="flex flex-col h-screen bg-[#f5f3ef] overflow-hidden">
          <TotemHeader />
          <div className="flex-1 overflow-hidden">
            {renderScreen()}
          </div>
        </div>
      </NavigationContext.Provider>
    </QueryClientProvider>
  )
}
