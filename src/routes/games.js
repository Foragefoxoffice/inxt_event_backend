import { Router } from 'express'
import Game from '../models/Game.js'
import Event from '../models/Event.js'
import { getQuestions } from '../cache.js'

const router = Router()

// GET /api/games/active
router.get('/active', async (req, res) => {
  try {
    const event = await Event.findOne({ isActive: true }).lean()
    if (!event) return res.status(404).json({ error: 'No active event' })

    const games = await Game.find({ eventId: event._id, isActive: true })
      .select('_id title type')
      .lean()

    res.json({
      eventId: event._id,
      games: games.map(g => ({ gameId: g._id, title: g.title, type: g.type }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/games/:gameId/questions — strips sensitive fields
router.get('/:gameId/questions', async (req, res) => {
  try {
    const questions = await getQuestions(req.params.gameId)
    console.log(`[GAMES_ROUTER] Serving ${questions.length} questions for game ${req.params.gameId}`)
    if (questions.length > 0) {
      console.log(`[GAMES_ROUTER] Sample Question ID: ${questions[0]._id}`)
    }
    const game = await Game.findById(req.params.gameId).select('type').lean()
    if (!game) return res.status(404).json({ error: 'Game not found' })

    const isMyth = game.type === 'MYTH'
    const isCrossword = game.type === 'CROSSWORD'

    // For MYTH: randomly pick ONE question per scenario category → "NEW CHALLENGE EVERY ROUND"
    let servedQuestions = questions
    if (isMyth) {
      const groups = {}
      for (const q of questions) {
        const key = q.answer || String(q._id)
        if (!groups[key]) groups[key] = []
        groups[key].push(q)
      }
      // Sort groups by the minimum order value in each group to keep scenario order stable
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        const minA = Math.min(...groups[a].map(q => q.order))
        const minB = Math.min(...groups[b].map(q => q.order))
        return minA - minB
      })
      servedQuestions = sortedKeys.map(key => {
        const group = groups[key]
        return group[Math.floor(Math.random() * group.length)]
      })
    } else if (isCrossword) {
      // If any of the questions already have manual grid coords, prefer those!
      // This allows manually designed layouts from seed.js to stay intact.
      const hasLayout = questions.some(q => (q.gridRow > 0 && q.gridCol > 0))
      
      if (hasLayout) {
        console.log(`[GAMES_ROUTER] Using manual DB layout for game ${req.params.gameId}`)
        servedQuestions = questions
      } else {
        const { generateLayout } = await import('../utils/crosswordGenerator.js')
        console.log(`[GAMES_ROUTER] Generating dynamic layout for game ${req.params.gameId}`)
        servedQuestions = generateLayout(questions)
      }
    }

    const sanitized = servedQuestions.map(q => {
      // Handle both Mongoose docs and POJOs
      const raw = q._doc || q
      
      return {
        questionId: raw._id || raw.questionId,
        text: raw.text,
        answer: isCrossword ? raw.answer : (game.type === 'CROSSWORD' ? raw.answer : undefined),
        order: raw.order,
        sectionLabel: raw.sectionLabel || null,
        ...(isMyth ? {
          scenarioTitle: raw.answer || null,
          aiRationale: raw.aiRationale || null
        } : {}),
        gridRow: isCrossword ? raw.gridRow : (raw.gridRow || null),
        gridCol: isCrossword ? raw.gridCol : (raw.gridCol || null),
        gridDir: isCrossword ? raw.gridDir : (raw.gridDir || null),
        gridNum: isCrossword ? raw.gridNum : (raw.gridNum || null),
        gridLen: isCrossword ? (raw.answer ? raw.answer.length : raw.gridLen) : (raw.gridLen || null),
        personas: game.type === 'INTERVIEW' ? raw.personas : undefined,
        interviewType: game.type === 'INTERVIEW' ? raw.interviewType : undefined,
        interviewerTip: game.type === 'INTERVIEW' ? raw.aiRationale : undefined,
        hostProposal: game.type === 'INTERVIEW' ? raw.hostProposal : undefined,
        options: (raw.options || []).map(o => ({
          optionId: o._id,
          label: o.label,
          shortLabel: o.shortLabel || null,
          subtitle: o.subtitle || null,
          badge: o.badge || null,
          ...(isMyth ? { isCorrect: o.isCorrect } : {})
        }))
      }
    })

    res.json({ gameId: req.params.gameId, type: game.type, questions: sanitized })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
