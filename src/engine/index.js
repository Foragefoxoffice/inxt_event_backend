import { handleAgency } from './agency.js'
import { handleMyth } from './myth.js'
import { handleCrossword } from './crossword.js'
import { handleInterview } from './interview.js'
import Game from '../models/Game.js'
import Session from '../models/Session.js'
import { getQuestions } from '../cache.js'
import { generateAgencyDiagnosis } from '../services/ai.js'
import Stats from '../models/Stats.js'
import { getIO, emitToEvent } from '../socket.js'

async function updateStatsAndEmit(eventId, gameType, session) {
  try {
    const isMyth = gameType === 'MYTH'
    const isAgency = gameType === 'AGENCY'
    const isCrossword = gameType === 'CROSSWORD'

    // 1. Update DB Stats
    const update = {
      $inc: { totalSubmissions: 1 }
    }
    
    // Specific logic for Myth AI Match
    if (isMyth) {
      const isMatch = (session.result?.score || 0) >= 70 // Threshold for "matching" AI
      if (isMatch) update.$inc.totalAiMatched = 1
      update.$inc.scoreSum = session.result?.score || 0
    }
    
    // Specific logic for Crossword completions
    if (isCrossword && (session.result?.score || 0) === 100) {
      update.$inc.totalCompletions = 1
    }

    const stats = await Stats.findOneAndUpdate(
      { gameId: session.gameId }, // Query by specific game for multi-game support
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Calculate derived fields (AI Match %, etc)
    if (isMyth && stats.totalSubmissions > 0) {
      stats.aiMatchPercent = Math.round(((stats.totalAiMatched || 0) / stats.totalSubmissions) * 100)
      stats.avgScore = Math.round((stats.scoreSum || 0) / stats.totalSubmissions)
      await stats.save()
    }

    // 2. Emit Real-time Refresh Signals
    // Using emitToEvent to ensure correct 'event:ID' room targeting
    emitToEvent(eventId, 'stats:update', { gameId: session.gameId, stats })

    // 2. Fetch and Emit Fresh Leaderboard (Top 10)
    const isInterview = gameType === 'INTERVIEW'
    
    // For Crossword, we want to sort by score DESC, then duration ASC (if score 100)
    const sortOption = isInterview 
      ? { completedAt: -1 } 
      : isCrossword 
        ? { 'result.score': -1, duration: 1, completedAt: 1 } 
        : { 'result.score': -1, completedAt: 1 }

    const topEntries = await Session.find({ gameId: session.gameId })
      .sort(sortOption)
      .limit(10)
      .populate('userId', 'name company')
      .lean()

    const entries = topEntries.map((s, i) => ({
      rank: i + 1,
      name: s.userId?.name,
      company: s.userId?.company,
      score: s.result?.score || 0,
      duration: s.duration,
      completedAt: s.completedAt
    }))

    emitToEvent(eventId, 'leaderboard:update', { gameId: session.gameId, top5: entries })
    
    // Special winner alert for Crossword
    if (isCrossword && (session.result?.score || 0) === 100) {
      emitToEvent(eventId, 'crossword:winner', { 
        name: entries[0]?.name, 
        company: entries[0]?.company 
      })
    }

    console.log(`[SUBMIT] Stats & Leaderboard Sync Emitted for event: ${eventId}`)
  } catch (err) {
    console.error('[STATS_ERROR] Failed to sync live dashboard:', err)
  }
}

export async function submitGame({ playerId, userId, gameId, answers, duration }) {
  try {
    console.log(`[ENGINE] Processing submission. ID: ${gameId}, Player: ${playerId}, Duration: ${duration}s`)

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
      result: { ...engineResult.result, aiResult },
      duration
    })

    // Update global dashboard statistics
    await updateStatsAndEmit(game.eventId, game.type, session)

    return { session, alreadySubmitted: false }
  } catch (err) {
    console.error(`[ENGINE_ERROR] ${err.message}`)
    throw err
  }
}
