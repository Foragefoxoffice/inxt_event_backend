import { Server } from 'socket.io'

let io

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`)
    })
  })

  return io
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function emitToEvent(eventId, event, data) {
  getIO().to(`event:${eventId}`).emit(event, data)
}
