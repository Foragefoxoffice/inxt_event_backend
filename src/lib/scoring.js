export function normalizeScore(raw, max) {
  if (!max || max === 0) return 0
  return Math.round((raw / max) * 100)
}

export function computeAgencyMaxPerMetric(questions) {
  const metrics = ['revenue', 'productivity', 'conversion', 'persistency']
  const max = { revenue: 0, productivity: 0, conversion: 0, persistency: 0 }

  for (const question of questions) {
    for (const metric of metrics) {
      const values = question.options.map(o => o.scoreImpact?.[metric] ?? 0)
      const best = values.length > 0 ? Math.max(...values) : 0
      max[metric] += best
    }
  }

  return max
}
