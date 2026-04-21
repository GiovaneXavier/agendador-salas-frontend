import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DoorDisplayScreen } from './screens/DoorDisplayScreen.tsx'

const params = new URLSearchParams(window.location.search)
const doorRoomId = params.get('door')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {doorRoomId ? <DoorDisplayScreen roomId={doorRoomId} /> : <App />}
  </StrictMode>,
)
