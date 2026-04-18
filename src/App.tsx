import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { HomePage } from './pages/HomePage'
import { RoomPage } from './pages/RoomPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms/:id" element={<RoomPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
