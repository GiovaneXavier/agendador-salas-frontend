import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { DoorDisplayScreen } from './screens/DoorDisplayScreen.tsx'
import { queryClient } from './lib/query-client.ts'

const params = new URLSearchParams(window.location.search)
const doorRoomId = params.get('door')

// StrictMode desligado: o double-mount em dev quebra a lifecycle da câmera —
// a Promise da primeira montagem resolve depois da cleanup, e o controls.stop()
// resultante destrói o <video> compartilhado com a segunda montagem.
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    {doorRoomId ? <DoorDisplayScreen roomId={doorRoomId} /> : <App />}
  </QueryClientProvider>,
)
