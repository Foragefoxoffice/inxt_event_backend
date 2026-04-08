import { Router } from 'express'
import Stats from '../models/Stats.js'
import User from '../models/User.js'
import Game from '../models/Game.js'

const router = Router()

// GET /api/stats/:eventId
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params
    const totalPlayers = await User.countDocuments({ eventId })
    const allStats = await Stats.find({ eventId }).lean()
    const games = await Game.find({ eventId }).select('_id title type').lean()

    const result = games.map(game => {
      const stats = allStats.find(s => String(s.gameId) === String(game._id)) || {}
      return {
        gameId: game._id,
        gameType: game.type,
        title: game.title,
        totalSubmissions: stats.totalSubmissions || 0,
        aiMatchPercent: stats.aiMatchPercent || 0,
        totalCompletions: stats.totalCompletions || 0,
        avgScore: stats.avgScore || 0,
        avgMetrics: stats.avgMetrics || { revenue: 0, productivity: 0, conversion: 0, persistency: 0 },
        questionStats: stats.questionStats || []
      }
    })

    res.json({ eventId, totalPlayers, games: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
