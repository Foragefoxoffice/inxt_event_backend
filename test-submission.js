/**
 * Test: Two different players, different answers → different AI results
 * Run: node test-submission.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const BASE = `http://localhost:${process.env.PORT || 4000}`

async function registerPlayer(name, company) {
  // Get active event
  const evRes = await fetch(`${BASE}/api/games/active`)
  const evData = await evRes.json()
  const eventId = evData.eventId
  const gameId = evData.games.find(g => g.type === 'AGENCY')?.gameId
  if (!gameId) throw new Error('No AGENCY game found')

  // Register
  const regRes = await fetch(`${BASE}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, company, eventId })
  })
  const reg = await regRes.json()
  if (!regRes.ok) throw new Error(`Register failed: ${reg.error}`)

  return { playerId: reg.playerId, gameId }
}

async function fetchQuestions(gameId) {
  const res = await fetch(`${BASE}/api/games/${gameId}/questions`)
  const data = await res.json()
  return data.questions
}

async function submit(playerId, gameId, profile, selectedLabels) {
  const questions = await fetchQuestions(gameId)

  // Build answers: for each question, find options matching selectedLabels
  const answers = questions.map(q => {
    const matchingIds = q.options
      .filter(o => selectedLabels.some(label => o.label.toLowerCase().includes(label.toLowerCase())))
      .map(o => o.optionId)
    return matchingIds.length > 0 ? { questionId: q.questionId, selectedOptionIds: matchingIds } : null
  }).filter(Boolean)

  const payload = {
    playerId,
    gameId,
    answers: { profile, answers, isHybridPayload: true, clientTimestamp: new Date().toISOString() }
  }

  const res = await fetch(`${BASE}/api/sessions/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Submit failed: ${data.error}`)
  return data
}

async function run() {
  console.log('=== TEST: Two players, different answers ===\n')

  // --- Player 1: Manual/broken agency ---
  console.log('▶ Player 1: Arun — manual everything, no AI tools')
  const p1 = await registerPlayer('Arun', 'Legacy Agency')
  const result1 = await submit(p1.playerId, p1.gameId, {
    name: 'Arun', role: 'Agency Manager', type: 'Mature Agency', agentCount: 25
  }, [
    'Manual/Spreadsheet tracking',
    'Random agent selection',
    'Dependence on verbal',
    'Lapses discovered after the fact',
    'Data exists in disconnected silos'
  ])

  console.log('\n✅ Player 1 Result:')
  console.log('  Score:', result1.result?.score)
  console.log('  Metrics:', JSON.stringify(result1.result?.metrics))
  console.log('  AI Scores:', JSON.stringify(result1.result?.aiResult?.aiCalculatedScores))
  console.log('  Summary:', result1.result?.aiResult?.summary)
  console.log('  Actions:')
  ;(result1.result?.aiResult?.actions || []).forEach((a, i) => console.log(`    ${i+1}. [${a.timeframe}] ${a.title}`))
  console.log('  Solutions:')
  ;(result1.result?.aiResult?.solutions || []).forEach(s => console.log(`    - [${s.category}] ${s.currentState} → ${s.whatChanges}`))

  // --- Player 2: Tech-forward agency with some AI already ---
  console.log('\n\n▶ Player 2: Priya — AI tools in pipeline but weak on lifecycle')
  const p2 = await registerPlayer('Priya', 'TechForward Agency')
  const result2 = await submit(p2.playerId, p2.gameId, {
    name: 'Priya', role: 'Chief Distribution Officer', type: 'New Agency', agentCount: 8
  }, [
    'AI-Powered Unified Capture',  // benchmark — strength
    'AI-Lead Scoring',              // benchmark — strength
    'Manual daily log submission',  // gap
    'Lapses discovered after the fact',  // gap
    'Weekly delay in standard reporting'  // gap
  ])

  console.log('\n✅ Player 2 Result:')
  console.log('  Score:', result2.result?.score)
  console.log('  Metrics:', JSON.stringify(result2.result?.metrics))
  console.log('  AI Scores:', JSON.stringify(result2.result?.aiResult?.aiCalculatedScores))
  console.log('  Summary:', result2.result?.aiResult?.summary)
  console.log('  Actions:')
  ;(result2.result?.aiResult?.actions || []).forEach((a, i) => console.log(`    ${i+1}. [${a.timeframe}] ${a.title}`))
  console.log('  Solutions:')
  ;(result2.result?.aiResult?.solutions || []).forEach(s => console.log(`    - [${s.category}] ${s.currentState} → ${s.whatChanges}`))

  // --- Diff check ---
  console.log('\n\n=== DIFF CHECK ===')
  const sameSummary = result1.result?.aiResult?.summary === result2.result?.aiResult?.summary
  const sameActions = JSON.stringify(result1.result?.aiResult?.actions) === JSON.stringify(result2.result?.aiResult?.actions)
  console.log('Summaries identical?', sameSummary ? '❌ SAME (bad)' : '✅ DIFFERENT (good)')
  console.log('Actions identical?', sameActions ? '❌ SAME (bad)' : '✅ DIFFERENT (good)')

  process.exit(0)
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
