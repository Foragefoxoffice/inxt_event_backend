import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'

async function gptJson(systemPrompt, userPrompt) {
  if (!openai) throw new Error('OpenAI not configured')
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })
  return JSON.parse(completion.choices[0].message.content)
}

// Format the category breakdown into a readable block for prompts
function formatBreakdown(categoryBreakdown) {
  return categoryBreakdown.map(cat => {
    const lines = [`CATEGORY: ${cat.category} | Score: ${cat.score}/100 | Status: ${cat.status}`]

    if (cat.gaps.length > 0) {
      lines.push('  GAPS (problems they identified):')
      cat.gaps.forEach(g => {
        lines.push(`    Q: "${g.questionText}"`)
        lines.push(`    → Selected: "${g.label}"`)
        if (g.subtitle) lines.push(`       (Consequence: ${g.subtitle})`)
      })
    }

    if (cat.strengths.length > 0) {
      lines.push('  STRENGTHS (AI-powered solutions already in place):')
      cat.strengths.forEach(s => {
        lines.push(`    → "${s.label}"`)
      })
    }

    return lines.join('\n')
  }).join('\n\n')
}

// TAB 1 — Assessment scores + summary + diagnosis
async function generateAssessment(metadata, categoryBreakdown, metrics) {
  const breakdown = formatBreakdown(categoryBreakdown)

  const criticalCategories = categoryBreakdown
    .filter(c => c.status === 'Critical' || c.status === 'Needs Work')
    .map(c => c.category).join(', ')

  return await gptJson(
    'You are a senior Takaful agency performance analyst. Return ONLY valid JSON. Be specific and use the player\'s actual data.',
    `
Agency Leader: ${metadata.clientName} (${metadata.role})
Agency Type: ${metadata.agencyType} | Team Size: ${metadata.agentCount} agents

THEIR EXACT SELECTIONS PER CATEGORY:
${breakdown}

CALCULATED SCORES: ${JSON.stringify(metrics)}
CRITICAL AREAS: ${criticalCategories || 'None'}

Task:
1. Write a 2-sentence SUMMARY addressed directly to ${metadata.clientName}, naming their specific critical categories and gap patterns (not generic advice)
2. Write a DIAGNOSIS paragraph (3-4 sentences) explaining the root causes of their specific selections — connect the dots between their choices and operational outcomes
3. Optionally ADJUST the scores based on your expert reading of their actual selections (stay within ±10 of the calculated scores)

Return JSON:
{
  "aiCalculatedScores": {
    "pipeline": number,
    "agents": number,
    "lifecycle": number,
    "visibility": number
  },
  "summary": "2 sentences specific to ${metadata.clientName}'s actual gaps",
  "diagnosis": "paragraph connecting their specific selections to operational outcomes"
}
`
  )
}

// TAB 2 — Next 90 Days action plan
async function generateActionPlan(metadata, categoryBreakdown) {
  // Flatten all gaps across categories, sorted by category score (worst first)
  const sortedCats = [...categoryBreakdown].sort((a, b) => a.score - b.score)
  const allGaps = sortedCats.flatMap(cat =>
    cat.gaps.map(g => ({ category: cat.category, score: cat.score, status: cat.status, ...g }))
  )

  if (allGaps.length === 0) return { actions: [] }

  // Build timeframes: 30-day blocks per gap
  const gapList = allGaps.map((g, i) => {
    const start = i * 30 + 1
    const end = (i + 1) * 30
    return `GAP ${i + 1} [${g.category} — ${g.status}] | Timeframe: Days ${start}-${end}
  Question: "${g.questionText}"
  Selected: "${g.label}"
  Consequence: ${g.subtitle || 'operational inefficiency'}`
  }).join('\n\n')

  return await gptJson(
    'You are a Takaful agency transformation consultant. Return ONLY valid JSON. Generate one action per gap listed, no more, no less.',
    `
Agency: ${metadata.clientName} | ${metadata.agencyType} | ${metadata.agentCount} agents | Role: ${metadata.role}

GAPS TO ADDRESS (one action per gap, in this exact order):
${gapList}

Rules:
- Generate EXACTLY ${allGaps.length} actions — one per gap above
- Action title must name the SPECIFIC problem (e.g. "Eliminate Spreadsheet Lead Tracking", not "Implement CRM")
- Description (2 sentences): what to fix and why, referencing their exact consequence
- Use the timeframe given for each gap
- Do NOT merge gaps or invent new ones

Return JSON:
{
  "actions": [
    { "title": "specific action for gap 1", "description": "...", "timeframe": "Days 1-30" }
  ]
}
`
  )
}

// TAB 3 — What Good Looks Like (solutions per gap)
async function generateSolutions(metadata, categoryBreakdown) {
  // Only pass categories that have actual gaps
  const gapCategories = categoryBreakdown.filter(c => c.gaps.length > 0)

  const breakdown = formatBreakdown(gapCategories)

  return await gptJson(
    'You are a Takaful digital transformation specialist. Return ONLY valid JSON. Only generate solutions for actual gaps listed.',
    `
Agency: ${metadata.clientName} | ${metadata.agencyType} | ${metadata.agentCount} agents

GAPS TO ADDRESS (only these, no others):
${breakdown}

Task: For EACH gap listed above, generate one solution entry.
- currentState: paraphrase their exact selected label + consequence in 1 sentence (use their subtitle)
- whatChanges: describe the specific operational improvement after this gap is fixed
- category: exact category name from the gap
- module: the SalesVerse module name that fixes this (be specific: "AI Lead Scoring Engine", "Real-Time Activity Map", "Renewal Intelligence Radar", "Live Ops Command Center", etc.)

Generate ONLY as many solutions as there are gaps above. No extras.

Return JSON:
{
  "solutions": [
    {
      "category": "exact category name",
      "module": "specific SalesVerse module name",
      "currentState": "their specific situation based on what they selected",
      "whatChanges": "specific operational outcome after fixing this gap"
    }
  ]
}
`
  )
}

export async function generateAgencyDiagnosis(input) {
  const { metadata, metrics, overallScore, categoryBreakdown } = input

  try {
    console.log(`[AI] Running 3 parallel ${MODEL} calls for ${metadata.clientName} — ${categoryBreakdown.length} categories, overall: ${overallScore}`)
    console.log('[AI] Gap summary:', categoryBreakdown.map(c => `${c.category}: ${c.gaps.length} gaps, ${c.strengths.length} strengths`).join(' | '))

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI timeout after 20s')), 20000)
    )

    const [assessment, actionPlan, solutionsData] = await Promise.race([
      Promise.all([
        generateAssessment(metadata, categoryBreakdown, metrics),
        generateActionPlan(metadata, categoryBreakdown),
        generateSolutions(metadata, categoryBreakdown)
      ]),
      timeout
    ])

    const aiScores = assessment.aiCalculatedScores || {}

    return {
      aiCalculatedScores: {
        pipeline: aiScores.pipeline ?? metrics.pipeline ?? 0,
        agents: aiScores.agents ?? metrics.agents ?? 0,
        lifecycle: aiScores.lifecycle ?? metrics.lifecycle ?? 0,
        visibility: aiScores.visibility ?? metrics.visibility ?? 0
      },
      summary: assessment.summary || '',
      diagnosis: assessment.diagnosis || '',
      actions: actionPlan.actions || [],
      solutions: solutionsData.solutions || []
    }
  } catch (err) {
    console.error('[AI] GPT call failed:', err.message)
    return {
      aiCalculatedScores: metrics,
      summary: `${metadata.clientName}'s agency has specific operational gaps requiring attention.`,
      diagnosis: 'The identified gaps across your selected categories indicate targeted areas for improvement.',
      actions: [],
      solutions: []
    }
  }
}
