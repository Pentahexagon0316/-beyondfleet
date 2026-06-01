import { hasEditorialRestraintLanguage } from './editorial-selectivity'

export const EDITORIAL_SUSTAINABILITY_CONSTRAINTS = `
## Long-term editorial sustainability
- Protect the cadence from entropy. Do not add extra sections, recurring frameworks, or recommendation surfaces just to make the product feel fuller.
- A sustainable Daily Brief may be quiet. "Not much changed" is a valid editorial outcome.
- Keep the daily operating load low enough that quality can be maintained for years.
- Avoid explanation expansion: if a sentence does not clarify the signal, uncertainty, or carry-forward question, cut it.
- Do not introduce a new named framework unless it can support months of future reading.
- Preserve the BeyondFleet voice: calm, selective, human, and comfortable saying less.
`.trim()

export const SUSTAINABILITY_LIMITS = {
  maxBriefSections: 6,
  maxRelatedLessons: 2,
  maxPredictions: 3,
  maxLongFormChars: 4200,
} as const

const FRAMEWORK_CREEP_PATTERNS = [
  /\bcomplete framework\b/i,
  /\bcontent engine\b/i,
  /\bdecision engine\b/i,
  /\bengagement loop\b/i,
  /\bgrowth hack\b/i,
  /\bmaster system\b/i,
  /\boptimization system\b/i,
  /\bproprietary framework\b/i,
  /\bultimate guide\b/i,
  /\bunlock\b/i,
  /완벽한 프레임워크/i,
  /성장 해킹/i,
  /최적화 시스템/i,
]

function countPatternHits(value: string | null | undefined, patterns: RegExp[]) {
  const normalized = value || ''
  return patterns.reduce((count, pattern) => (
    pattern.test(normalized) ? count + 1 : count
  ), 0)
}

export function countFrameworkCreepHits(value: string | null | undefined) {
  return countPatternHits(value, FRAMEWORK_CREEP_PATTERNS)
}

export function countMarkdownSections(value: string | null | undefined) {
  return (value || '').split('\n').filter((line) => /^##\s+/.test(line.trim())).length
}

export function evaluateEditorialSustainability(fields: {
  title?: string | null
  summary?: string | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  full_content?: string | null
  related_lesson_ids?: string[] | null
  predictions?: string[] | null
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

  const sectionCount = countMarkdownSections(fields.full_content)
  const relatedLessonCount = fields.related_lesson_ids?.length || 0
  const predictionCount = fields.predictions?.length || 0
  const frameworkCreepHits = countFrameworkCreepHits(combined)
  const totalChars = combined.length

  return {
    sustainableCadenceVisible: hasEditorialRestraintLanguage(combined),
    sectionCount,
    sectionCountOk: sectionCount === 0 || sectionCount <= SUSTAINABILITY_LIMITS.maxBriefSections,
    relatedLessonCount,
    relatedLessonCountOk: relatedLessonCount <= SUSTAINABILITY_LIMITS.maxRelatedLessons,
    predictionCount,
    predictionCountOk: predictionCount <= SUSTAINABILITY_LIMITS.maxPredictions,
    verbosityRisk: totalChars > SUSTAINABILITY_LIMITS.maxLongFormChars,
    frameworkCreepHits,
  }
}
