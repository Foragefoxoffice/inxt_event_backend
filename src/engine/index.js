import { handleAgency } from './agency.js'
import { handleMyth } from './myth.js'
import { handleCrossword } from './crossword.js'
import { handleInterview } from './interview.js'
import Game from '../models/Game.js'
import Session from '../models/Session.js'
import { getQuestions } from '../cache.js'
import { generateAgencyDiagnosis } from '../services/ai.js'
import Stats from '../models/Stats.js'
import { getIO } from '../socket.js'

async function updateStatsAndEmit(eventId, gameType, session) {
  try {
    const stats = await Stats.findOneAndUpdate(
      { eventId, gameType },
      { 
        $inc: { totalParticipants: 1, totalScore: session.result?.score || 100 },
        $push: { recentPlayers: { playerId: session.playerId, score: session.result?.score || 100, timestamp: new Date() } }
      },
      { upsert: true, new: true }
    )

    const io = getIO()
    if (io) {
      // 1. Emit Stats Signal
      io.to(String(eventId)).emit('stats:update', { gameId: session.gameId, stats })

      // 2. Fetch and Emit Fresh Leaderboard (Top 10)
      const isCrossword = gameType === 'CROSSWORD'
      const isInterview = gameType === 'INTERVIEW'
      const sortOption = isInterview ? { completedAt: -1 } : { 'result.score': -1, completedAt: 1 }

      const topEntries = await Session.find({ gameId: session.gameId })
        .sort(sortOption)
        .limit(10)
        .populate('userId', 'name company')
        .lean()

      const entries = topEntries.map((s, i) => ({
        rank: i + 1,
        name: s.userId?.name,
        company: s.userId?.company,
        score: s.result.score,
        completedAt: s.completedAt
      }))

      io.to(String(eventId)).emit('leaderboard:update', { gameId: session.gameId, top5: entries })
    }
    console.log('[SUBMIT] Stats & Leaderboard Synced Successfully')
  } catch (err) {
    console.error('[STATS_ERROR] Failed to update stats:', err.message)
  }
}

export async function submitGame({ playerId, userId, gameId, answers }) {
  try {
    console.log(`[ENGINE] Processing submission. ID: ${gameId}, Player: ${playerId}`)

    // Check for duplicate submission
    const existing = await Session.findOne({ playerId, gameId }).lean()
    if (existing) {
      console.log('[ENGINE] Duplicate submission detected, returning existing session')
      return { session: existing, alreadySubmitted: true }
    }

    let game = await Game.findById(gameId).lean()

    if (!game) {
      console.error(`[ENGINE_ERROR] Game not found for ID: ${gameId}`)
      throw new Error('Game not found')
    }

    const questions = await getQuestions(game._id)
    let engineResult = { score: 0, result: {}, answersWithMeta: [] }

    // Execute specialized scoring engine
    switch (game.type) {
      case 'AGENCY':
        engineResult = handleAgency(answers, questions, game)
        break
      case 'MYTH':
        engineResult = handleMyth(answers, questions)
        break
      case 'CROSSWORD':
        engineResult = handleCrossword(answers, questions)
        break
      case 'INTERVIEW':
        engineResult = handleInterview(answers, questions)
        break
      default:
        throw new Error('Unknown game type')
    }

    // Trigger AI Strategist for Agency AI Results
    let aiResult = null
    if (game.type === 'AGENCY') {
      const aiInput = {
        metadata: {
          clientName: answers.profile?.name || 'Agency Principal',
          role: answers.profile?.role || 'Leader',
          agencyType: answers.profile?.type || 'Growth Agency',
          agentCount: answers.profile?.agentCount || 10
        },
        metrics: engineResult.result.metrics || {},
        overallScore: engineResult.score,
        categoryBreakdown: engineResult.result.categoryBreakdown || []
      }

      console.log(`[AI] Generating strategist assessment for ${aiInput.metadata.clientName}`)
      aiResult = await generateAgencyDiagnosis(aiInput)
    }

    // Persist session
    const session = await Session.create({
      playerId,
      userId,
      gameId,
      eventId: game.eventId,
      gameType: game.type,
      answers: engineResult.answersWithMeta || [],
      result: { ...engineResult.result, aiResult }
    })

    // Update global dashboard statistics
    await updateStatsAndEmit(game.eventId, game.type, session)

    return { session, alreadySubmitted: false }
  } catch (err) {
    console.error(`[ENGINE_ERROR] ${err.message}`)
    throw err
  }
}
