import type { NextApiRequest } from 'next'
import type { SocketIOResponse } from '@/lib/server/websocket'
import { initializeSocketIO } from '@/lib/server/websocket'

export default function handler(req: NextApiRequest, res: SocketIOResponse) {
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.IO server...')
    res.socket.server.io = initializeSocketIO(res.socket.server)
  } else {
    console.log('♻️ Socket.IO server already running')
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}
