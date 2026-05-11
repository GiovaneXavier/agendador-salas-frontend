import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { DoorDisplayScreen } from './screens/DoorDisplayScreen.tsx'
import { queryClient } from './lib/query-client.ts'

const params = new URLSearchParams(window.location.search)
const doorRoomId = params.get('door')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {doorRoomId ? <DoorDisplayScreen roomId={doorRoomId} /> : <App />}
    </QueryClientProvider>
  </StrictMode>,
)
