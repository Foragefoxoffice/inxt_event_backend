import { Router } from 'express'
import Event from '../models/Event.js'
import Game from '../models/Game.js'
import Question from '../models/Question.js'
import Session from '../models/Session.js'
import Stats from '../models/Stats.js'
import { invalidateGame } from '../cache.js'
import { computeAgencyMaxPerMetric } from '../lib/scoring.js'

const router = Router()

// ── Events ──────────────────────────────────────────────

router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).lean()
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/events', async (req, res) => {
  try {
    const { name, slug } = req.body
    const event = await Event.create({ name, slug, isActive: false })
    res.status(201).json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/events/:id/activate', async (req, res) => {
  try {
    await Event.updateMany({}, { isActive: false })
    const event = await Event.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true })
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Games ────────────────────────────────────────────────

router.get('/games', async (req, res) => {
  try {
    const event = await Event.findOne({ isActive: true }).lean()
    if (!event) return res.status(404).json({ error: 'No active event' })
    const games = await Game.find({ eventId: event._id }).lean()
    res.json(games)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/games', async (req, res) => {
  try {
    const { eventId, title, type } = req.body
    const game = await Game.create({ eventId, title, type })
    await Stats.findOneAndUpdate(
      { gameId: game._id },
      { $setOnInsert: { gameId: game._id, eventId, gameType: type } },
      { upsert: true }
    )
    res.status(201).json(game)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/games/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true })
    invalidateGame(req.params.id)
    res.json(game)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/games/:id', async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id)
    await Question.deleteMany({ gameId: req.params.id })
    await Session.deleteMany({ gameId: req.params.id })
    await Stats.deleteOne({ gameId: req.params.id })
    invalidateGame(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Questions ────────────────────────────────────────────

router.get('/games/:gameId/questions', async (req, res) => {
  try {
    const questions = await Question.find({ gameId: req.params.gameId }).sort({ order: 1 }).lean()
    res.json(questions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/games/:gameId/questions', async (req, res) => {
  try {
    const { text, order, aiRecommended, answer, sectionLabel, aiRationale, options, gridRow, gridCol, gridDir, gridNum, gridLen } = req.body
    const question = await Question.create({
      gameId: req.params.gameId,
      text,
      order,
      aiRecommended: aiRecommended || null,
      answer: answer || null,
      sectionLabel: sectionLabel || null,
      aiRationale: aiRationale || null,
      gridRow: gridRow || null,
      gridCol: gridCol || null,
      gridDir: gridDir || null,
      gridNum: gridNum || null,
      gridLen: gridLen || null,
      options: options || []
    })
    invalidateGame(req.params.gameId)
    await recomputeAgencyMax(req.params.gameId)
    res.status(201).json(question)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true })
    invalidateGame(String(question.gameId))
    await recomputeAgencyMax(String(question.gameId))
    res.json(question)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id)
    if (question) {
      invalidateGame(String(question.gameId))
      await recomputeAgencyMax(String(question.gameId))
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Sessions ─────────────────────────────────────────────

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('userId', 'name company')
      .sort({ createdAt: -1 })
      .lean()
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/sessions/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Helpers ──────────────────────────────────────────────

async function recomputeAgencyMax(gameId) {
  const game = await Game.findById(gameId).lean()
  if (!game || game.type !== 'AGENCY') return
  const questions = await Question.find({ gameId }).lean()
  const maxPerMetric = computeAgencyMaxPerMetric(questions)
  const maxScore = Object.values(maxPerMetric).reduce((a, b) => a + b, 0)
  await Game.findByIdAndUpdate(gameId, {
    agencyMaxPerMetric: maxPerMetric,
    maxPossibleScore: maxScore
  })
}

export default router
