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

    socket.on('join:game', ({ eventId, gameId, playerName }) => {
      socket.join(`game:${gameId}`)
      // Broadcast to others in the event that someone started a game
      io.to(`event:${eventId}`).emit('player:activity', { gameId, playerName, status: 'playing' })
    })

    socket.on('leave:game', ({ eventId, gameId, playerName }) => {
      socket.leave(`game:${gameId}`)
      io.to(`event:${eventId}`).emit('player:activity', { gameId, playerName, status: 'left' })
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
