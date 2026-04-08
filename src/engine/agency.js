export function handleAgency(payload, questions, game) {
  if (Array.isArray(payload)) {
    payload = { answers: payload, isHybridPayload: false, profile: { type: 'Agency' } }
  }
  return handleHybridAgency(payload, questions, game)
}

function handleHybridAgency(payload, questions, game) {
  const { profile = {}, answers = [] } = payload
  const metrics = ['pipeline', 'agents', 'lifecycle', 'visibility']
  const sums = { pipeline: 0, agents: 0, lifecycle: 0, visibility: 0 }

  // Map submitted answers by questionId
  const answerMap = {}
  const safeAnswers = Array.isArray(answers) ? answers : []
  safeAnswers.forEach(a => {
    if (a.questionId) {
      answerMap[String(a.questionId)] = (a.selectedOptionIds || []).map(id => String(id))
    }
  })

  // Build rich per-category breakdown
  // categoryMap: { sectionLabel -> { metricKey, questions: [] } }
  const categoryMap = {}

  for (const question of questions) {
    const qId = String(question._id)
    const playerSelectionIds = answerMap[qId] || []

    const sectionLabel = question.sectionLabel || 'General'

    if (!categoryMap[sectionLabel]) {
      categoryMap[sectionLabel] = { questions: [] }
    }

    const questionEntry = {
      questionText: question.text,
      selectedOptions: []
    }

    const allOptions = question.options || []

    for (const opt of allOptions) {
      const optId = String(opt.optionId || opt._id)
      const isSelected = playerSelectionIds.includes(optId) || playerSelectionIds.includes(String(opt.label))

      if (!isSelected) continue

      // Accumulate metric scores
      if (opt.scoreImpact) {
        for (const m of metrics) {
          sums[m] += Number(opt.scoreImpact[m] || 0)
        }
      }

      // Determine primary metric for this option
      const primaryMetric = opt.scoreImpact
        ? metrics.find(m => (opt.scoreImpact[m] || 0) > 0) || null
        : null

      questionEntry.selectedOptions.push({
        label: opt.label,
        subtitle: opt.subtitle || null,
        isBenchmark: opt.badge === 'AI-POWERED',
        isGap: opt.badge !== 'AI-POWERED',
        scoreImpact: opt.scoreImpact || {},
        primaryMetric
      })
    }

    // Only include questions where the player made a selection
    if (questionEntry.selectedOptions.length > 0) {
      categoryMap[sectionLabel].questions.push(questionEntry)
    }
  }

  // Scale metric sums to 0-100
  const defaults = { pipeline: 80, agents: 40, lifecycle: 40, visibility: 40 }
  const raw = game.agencyMaxPerMetric || {}
  const maxPerMetric = {
    pipeline: raw.pipeline || defaults.pipeline,
    agents: raw.agents || defaults.agents,
    lifecycle: raw.lifecycle || defaults.lifecycle,
    visibility: raw.visibility || defaults.visibility
  }
  const resultMetrics = {}
  let metricTotal = 0

  for (const m of metrics) {
    let pct = maxPerMetric[m] > 0
      ? Math.round((sums[m] / maxPerMetric[m]) * 100)
      : 0
    if (pct > 100) pct = 100
    if (pct < 0) pct = 0
    resultMetrics[m] = pct
    metricTotal += pct
  }

  const overallScore = Math.round(metricTotal / metrics.length)

  // Build the hierarchical category breakdown for AI
  const METRIC_KEY_MAP = {
    'Lead Pipeline & Acquisition': 'pipeline',
    'Agent Performance': 'agents',
    'Customer Lifecycle': 'lifecycle',
    'Visibility & Operations': 'visibility',
    'Visibility & Ops': 'visibility'
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([sectionLabel, data]) => {
    const metricKey = METRIC_KEY_MAP[sectionLabel] || null
    const score = metricKey ? (resultMetrics[metricKey] || 0) : 0

    const gaps = data.questions.flatMap(q =>
      q.selectedOptions.filter(o => o.isGap).map(o => ({
        questionText: q.questionText,
        label: o.label,
        subtitle: o.subtitle,
        primaryMetric: o.primaryMetric
      }))
    )

    const strengths = data.questions.flatMap(q =>
      q.selectedOptions.filter(o => o.isBenchmark).map(o => ({
        questionText: q.questionText,
        label: o.label,
        subtitle: o.subtitle
      }))
    )

    return {
      category: sectionLabel,
      metricKey,
      score,
      status: score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs Work' : 'Critical',
      gaps,
      strengths
    }
  })

  // Legacy flat choices (kept for backwards compat with result display)
  const choices = Object.entries(categoryMap).flatMap(([sectionLabel, data]) =>
    data.questions.flatMap(q =>
      q.selectedOptions.map(o => ({
        sectionLabel,
        choiceLabel: o.label,
        badge: o.isBenchmark ? 'AI-POWERED' : null
      }))
    )
  )

  return {
    score: overallScore,
    result: {
      score: overallScore,
      metrics: resultMetrics,
      agencyType: profile.type || 'Growth Agency',
      agentCount: profile.agentCount || 1,
      choices,
      categoryBreakdown,
      isHybrid: true
    },
    answersWithMeta: Object.entries(answerMap).map(([qId, oIds]) => ({
      questionId: qId,
      selectedOptionIds: oIds,
      isCorrect: false,
      aiMatched: false
    }))
  }
}
