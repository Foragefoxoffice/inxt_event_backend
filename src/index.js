import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './lib/db.js'
import { initSocket } from './socket.js'
import usersRouter from './routes/users.js'
import gamesRouter from './routes/games.js'
import sessionsRouter from './routes/sessions.js'
import leaderboardRouter from './routes/leaderboard.js'
import statsRouter from './routes/stats.js'
import adminRouter from './routes/admin.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

app.use('/api/users', usersRouter)
app.use('/api/games', gamesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/stats', statsRouter)
app.use('/api/admin', adminRouter)

// Maintenance route (Private or limited in prod)
import { invalidateAll } from './cache.js'
app.post('/api/maintenance/clear-cache', (req, res) => {
  invalidateAll()
  res.json({ success: true, message: 'Cache cleared' })
})

initSocket(httpServer)

// Connect to MongoDB once when the server starts
// Top-level await is used to ensure the connection is established before accepting requests
try {
  await connectDB()
} catch (err) {
  console.error('CRITICAL: Failed to connect to MongoDB:', err)
}

if (process.env.VERCEL !== '1') {
  httpServer.listen(process.env.PORT || 4000, () => {
    console.log(`Server running on port ${process.env.PORT || 4000}`)
  })
}

export default app
