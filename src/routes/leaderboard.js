import { Router } from 'express'
import Session from '../models/Session.js'
import Game from '../models/Game.js'

const router = Router()

// GET /api/leaderboard/:gameId
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId).select('type').lean()
    if (!game) return res.status(404).json({ error: 'Game not found' })

    const isCrossword = game.type === 'CROSSWORD'
    const isInterview = game.type === 'INTERVIEW'

    let query = Session.find({ gameId: req.params.gameId })

    // No longer filter only completed crosswords — show all progress
    // Crossword: sort by score DESC, duration ASC
    const sortOption = isInterview 
      ? { completedAt: -1 } 
      : isCrossword
        ? { 'result.score': -1, duration: 1, completedAt: 1 }
        : { 'result.score': -1, completedAt: 1 }

    const sessions = await query
      .sort(sortOption)
      .limit(20)
      .populate('userId', 'name company')
      .lean()

    let currentRank = 1
    let prevScore = null

    const entries = sessions.map((s, i) => {
      if (!isCrossword) {
        if (s.result?.score !== prevScore) {
          currentRank = i + 1
          prevScore = s.result?.score
        }
      }
      return {
        rank: isCrossword ? i + 1 : currentRank,
        name: s.userId?.name,
        company: s.userId?.company,
        score: s.result?.score || 0,
        duration: s.duration,
        completedAt: s.completedAt
      }
    })

    res.json({ gameId: req.params.gameId, gameType: game.type, entries })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
