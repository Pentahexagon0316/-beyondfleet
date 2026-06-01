import { hasEditorialRestraintLanguage } from './editorial-selectivity'
import { countMarkdownSections } from './editorial-sustainability'

export const EDITORIAL_OPERATIONS_CALMNESS_CONSTRAINTS = `
## Editorial operations calmness
- The publication workflow should feel calm for the operator, not only for the reader.
- Do not create pressure to manufacture significance every day.
- Keep review lightweight: one signal question, one tone question, one density question, one source question, one publish-or-wait question.
- Avoid operational anxiety language such as "must publish", "daily output target", or "content gap".
- It is acceptable to save a quiet draft, publish later, or skip recommendations when the signal is weak.
- The editorial desk should protect human energy: fewer checks, fewer links, fewer surfaces, and fewer urgency cues.
`.trim()

export const OPERATIONAL_CALMNESS_LIMITS = {
  maxVisibleReviewGroups: 5,
  maxSourceNotesBeforeReviewFeelsHeavy: 5,
  maxSectionsBeforeReviewFeelsHeavy: 6,
} as const

const OPERATIONAL_PRESSURE_PATTERNS = [
  /\balways publish\b/i,
  /\bcontent gap\b/i,
  /\bcontent target\b/i,
  /\bdaily output\b/i,
  /\bengagement target\b/i,
  /\bmust publish\b/i,
  /\bnever miss\b/i,
  /\bposting cadence\b/i,
  /\btraffic goal\b/i,
  /매일 반드시/i,
  /발행 압박/i,
  /콘텐츠 공백/i,
  /트래픽 목표/i,
]

function countPatternHits(value: string | null | undefined, patterns: RegExp[]) {
  const normalized = value || ''
  return patterns.reduce((count, pattern) => (
    pattern.test(normalized) ? count + 1 : count
  ), 0)
}

export function countOperationalPressureHits(value: string | null | undefined) {
  return countPatternHits(value, OPERATIONAL_PRESSURE_PATTERNS)
}

export function evaluateOperationalCalmness(fields: {
  title?: string | null
  summary?: string | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  full_content?: string | null
  related_lesson_ids?: string[] | null
  source_note_count?: number | null
  visible_review_count?: number | null
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

  const sourceNoteCount = fields.source_note_count || 0
  const visibleReviewCount = fields.visible_review_count || 0
  const sectionCount = countMarkdownSections(fields.full_content)

  return {
    operatorPressureHits: countOperationalPressureHits(combined),
    lowPressureCadenceVisible: hasEditorialRestraintLanguage(combined),
    visibleReviewLoadOk: visibleReviewCount === 0 || visibleReviewCount <= OPERATIONAL_CALMNESS_LIMITS.maxVisibleReviewGroups,
    sourceHandlingCalm: sourceNoteCount <= OPERATIONAL_CALMNESS_LIMITS.maxSourceNotesBeforeReviewFeelsHeavy,
    sectionLoadCalm: sectionCount === 0 || sectionCount <= OPERATIONAL_CALMNESS_LIMITS.maxSectionsBeforeReviewFeelsHeavy,
  }
}
