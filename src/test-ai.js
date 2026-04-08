import { generateAgencyDiagnosis } from './services/ai.js'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

async function testAi() {
  console.log('--- Testing AI Diagnosis Service ---')
  console.log('Using Provider:', process.env.AI_PROVIDER || 'auto')
  
  const testInput = {
    metadata: { clientName: 'Antigravity Test', role: 'Agency Principal', agencyType: 'Growth Agency', agentCount: 45 },
    scores: { overallHealth: 42, categories: { pipeline: 30, agents: 50, lifecycle: 20, visibility: 60 } },
    detectedGaps: [
      { category: 'Lead Pipeline', issue: 'Manual lead capture', impact: 'Serious leakage' },
      { category: 'Customer Lifecycle', issue: 'Manual renewal tracking', impact: 'High lapse risk' }
    ]
  }

  try {
    const result = await generateAgencyDiagnosis(testInput)
    console.log('\n✅ AI SUCCESS')
    console.log('Summary:', result.summary.substring(0, 100) + '...')
    console.log('Action Count:', result.actions?.length)
    console.log('Solutions Count:', result.solutions?.length)
    process.exit(0)
  } catch (err) {
    console.error('\n❌ AI FAILED')
    console.error(err.message)
    process.exit(1)
  }
}

testAi()
