export const DAILY_BRIEF_SECTION_ORDER = [
  'What changed',
  'Why it may matter',
  'What could change next',
  'What remains unclear',
  'Question to carry forward',
] as const

export const EDITORIAL_SURFACE_LIMITS = {
  summaryMaxChars: 160,
  sectionMaxChars: 520,
  reflectionPromptMaxChars: 150,
  relatedLessonsMax: 2,
  continueQueue: 1,
  recommendedLessons: 2,
  recommendedBriefs: 2,
  suggestedTopics: 2,
  trendingTopics: 3,
  continuityCues: 2,
  opposingPerspectives: 1,
} as const

export const BRIEF_GENERATION_CONSTRAINTS = `
## Editorial discipline
- Use one core argument. Do not branch into many simultaneous insights.
- Keep the cadence stable: what changed, why it matters, what weakens the assumption, what deserves attention, what to carry forward.
- Keep each structured field compressed and grounded. Avoid long explanatory essays.
- The reflection prompt must be one calm question, not advice, coaching, or motivation.
- Recommendations should feel optional and editorial, never urgent or promotional.
- Avoid hype, alpha language, dramatic certainty, short-term price calls, and attention-seeking phrasing.
- If the evidence is mixed, write the uncertainty clearly instead of overstating a view.
- Separate observation, interpretation, assumption, uncertainty, and carry-forward language.
- Keep the structure behind the writing; the reader should feel guided, not managed.
- Preserve human texture: ambiguity, open questions, and quiet curiosity are allowed.
`.trim()

const DRIFT_PATTERNS = [
  '100x',
  'alpha',
  'breakout',
  'dont miss',
  "don't miss",
  'explosive',
  'game-changing',
  'guaranteed',
  'huge upside',
  'moon',
  'must read',
  'urgent',
  'viral',
  '급등',
  '대박',
  '무조건',
  '놓치지',
  '수익률',
  '알파',
]

export function compactText(value: string | null | undefined, maxChars: number) {
  const text = (value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`
}

export function normalizeReflectionPrompt(value: string | null | undefined, fallback: string) {
  const compact = compactText(value || fallback, EDITORIAL_SURFACE_LIMITS.reflectionPromptMaxChars)
  if (!compact) return fallback
  return compact.endsWith('?') ? compact : `${compact.replace(/[.!]+$/g, '')}?`
}

export function countEditorialDriftHits(value: string | null | undefined) {
  const normalized = (value || '').toLowerCase()
  return DRIFT_PATTERNS.reduce((count, pattern) => (
    normalized.includes(pattern.toLowerCase()) ? count + 1 : count
  ), 0)
}

export function isDisciplinedReflectionPrompt(value: string | null | undefined) {
  const prompt = (value || '').trim()
  if (!prompt.endsWith('?')) return false
  if (prompt.length > EDITORIAL_SURFACE_LIMITS.reflectionPromptMaxChars) return false
  if (prompt.includes('!')) return false
  return countEditorialDriftHits(prompt) === 0
}
