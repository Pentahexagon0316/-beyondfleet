export const EDITORIAL_SELECTIVITY_CONSTRAINTS = `
## Editorial selectivity and signal discipline
- Do not manufacture significance. If little changed, say little changed.
- A Daily Brief should surface only when the signal changes assumptions, clarifies risk, or deserves follow-through.
- Keep background noise in the background. Do not turn every price move or headline into a macro thesis.
- Second-order effects should be concrete and earned. Do not inflate weak signals into broad narratives.
- Related lessons and recommendations are optional. Fewer, stronger links are better than automatic links.
- It is acceptable to publish a quiet brief whose main message is patience.
`.trim()

export const SELECTIVITY_THRESHOLDS = {
  recommendedBriefMinScore: 4.5,
  suggestedTopicMinScore: 2.5,
  trendingTopicMinScore: 1.5,
  lessonRecommendationMinScore: 9,
  continueQueueMinScore: 7,
} as const

const MATERIAL_SIGNAL_PATTERNS = [
  /\bassumption\b/i,
  /\bchange[ds]?\b/i,
  /\bcondition\b/i,
  /\bdata\b/i,
  /\bevidence\b/i,
  /\bfollow[- ]?through\b/i,
  /\blabor\b/i,
  /\bliquidity\b/i,
  /\bpolicy\b/i,
  /\brates?\b/i,
  /\brisk\b/i,
  /\buncertain/i,
  /가정/i,
  /금리/i,
  /데이터/i,
  /리스크/i,
  /불확실/i,
  /정책/i,
  /조건/i,
]

const RESTRAINT_PATTERNS = [
  /\bhold (?:this )?lightly\b/i,
  /\bcarry forward\b/i,
  /\bless certain\b/i,
  /\blittle changed\b/i,
  /\blighter\b/i,
  /\bnot much changed\b/i,
  /\bpatien(?:ce|tly)\b/i,
  /\bquiet\b/i,
  /\breduce\b/i,
  /\brevisit\b/i,
  /\bwait\b/i,
  /\bwatch\b/i,
  /기다/i,
  /덜 확실/i,
  /조용히/i,
  /지켜/i,
]

const OVERINTERPRETATION_PATTERNS = [
  /\beverything changes\b/i,
  /\bgame[- ]?changing\b/i,
  /\bmajor turning point\b/i,
  /\bmassive shift\b/i,
  /\bseismic\b/i,
  /\bthe only thing that matters\b/i,
  /\bthis changes everything\b/i,
  /거대한 전환/i,
  /게임 체인저/i,
  /모든 것이 바뀐다/i,
  /역대급/i,
]

function countPatternHits(value: string | null | undefined, patterns: RegExp[]) {
  const normalized = value || ''
  return patterns.reduce((count, pattern) => (
    pattern.test(normalized) ? count + 1 : count
  ), 0)
}

export function countOverinterpretationHits(value: string | null | undefined) {
  return countPatternHits(value, OVERINTERPRETATION_PATTERNS)
}

export function hasMaterialSignalLanguage(value: string | null | undefined) {
  return countPatternHits(value, MATERIAL_SIGNAL_PATTERNS) > 0
}

export function hasEditorialRestraintLanguage(value: string | null | undefined) {
  return countPatternHits(value, RESTRAINT_PATTERNS) > 0
}

export function evaluateSignalSelectivity(fields: {
  title?: string | null
  summary?: string | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  full_content?: string | null
  related_lesson_ids?: string[] | null
}) {
  const combined = [
    fields.title,
    fields.summary,
    fields.what_happened,
    fields.why_it_matters,
    fields.second_order_effects,
    fields.risk_conditions,
    fields.reflection_prompt,
    fields.full_content,
  ].filter(Boolean).join(' ')

  const relatedLessons = fields.related_lesson_ids || []

  return {
    materialSignalVisible: hasMaterialSignalLanguage(combined),
    followThroughEarned: hasMaterialSignalLanguage(fields.second_order_effects || '') || hasMaterialSignalLanguage(fields.risk_conditions || ''),
    restraintVisible: hasEditorialRestraintLanguage(combined),
    recommendationMinimal: relatedLessons.length <= 2,
    overinterpretationHits: countOverinterpretationHits(combined),
  }
}

export function selectBySignalScore<T extends { score: number }>(items: T[], limit: number, minScore: number) {
  return items
    .filter((item) => Number.isFinite(item.score) && item.score >= minScore)
    .slice(0, limit)
}
