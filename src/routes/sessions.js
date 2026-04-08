import { Router } from 'express'
import { submitGame } from '../engine/index.js'
import Session from '../models/Session.js'
import User from '../models/User.js'
import { sendDiagnosticReport } from '../services/email.js'

const router = Router()

// POST /api/sessions/submit
router.post('/submit', async (req, res) => {
  try {
    const { playerId, gameId, answers, duration } = req.body
    if (!playerId || !gameId || !answers) {
      return res.status(400).json({ error: 'playerId, gameId, and answers are required' })
    }

    const user = await User.findOne({ playerId }).lean()
    if (!user) return res.status(404).json({ error: 'Player not found — register first' })

    const { session, alreadySubmitted } = await submitGame({
      playerId,
      userId: user._id,
      gameId,
      answers,
      duration
    })

    res.json({
      sessionId: session._id,
      gameType: session.gameType,
      result: session.result,
      alreadySubmitted
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sessions/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('userId', 'name company')
      .lean()

    if (!session) return res.status(404).json({ error: 'Session not found' })

    res.json({
      sessionId: session._id,
      gameType: session.gameType,
      eventId: session.eventId,
      player: { name: session.userId?.name, company: session.userId?.company },
      result: session.result,
      completedAt: session.completedAt
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sessions/:sessionId/lead
router.post('/:sessionId/lead', async (req, res) => {
  try {
    const { name, organisation, email, phone } = req.body
    const session = await Session.findById(req.params.sessionId).lean()
    
    if (!session) return res.status(404).json({ error: 'Session not found' })

    // Send the email report using the captured data and session results
    await sendDiagnosticReport({
      to: email,
      name,
      organisation,
      result: session.result,
      aiResult: session.aiResult // Contains the AI action plan
    })

    res.json({ success: true, message: 'Report sent to ' + email })
  } catch (err) {
    console.error('Lead Capture Error:', err)
    res.status(500).json({ error: 'Failed to send report' })
  }
})

export default router
