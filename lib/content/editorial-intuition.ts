export const EDITORIAL_INTUITION_CONSTRAINTS = `
## Editorial intuition and psychological trust
- Treat structure as an editorial guardrail, not a visible script.
- Do not make every paragraph announce its category. Let the writing feel natural.
- Preserve some open tension when the evidence is mixed. Do not force a perfectly clean narrative.
- Uncertainty should feel grounding, not alarming or defensive.
- Reflection prompts should feel like quiet human questions, not framework exercises.
- Respect the reader's intelligence: fewer claims, softer certainty, and one useful question are usually enough.
`.trim()

export const HUMAN_REFLECTION_PROMPTS = [
  'What feels less certain now?',
  'What deserves more patience?',
  'What assumption are you carrying forward carefully?',
  'What would you like to keep watching?',
] as const

const MECHANICAL_FRAMING_PATTERNS = [
  /\bepistemic\b/i,
  /\binvalidation\b/i,
  /\bframework-heavy\b/i,
  /\bcertainty layer\b/i,
  /\bcognitive system\b/i,
  /\bmechanical(?:ly)?\b/i,
  /절차적/i,
  /기계적/i,
]

export function countMechanicalFramingHits(value: string | null | undefined) {
  const normalized = value || ''
  return MECHANICAL_FRAMING_PATTERNS.reduce((count, pattern) => (
    pattern.test(normalized) ? count + 1 : count
  ), 0)
}

export function hasHumanReflectionTone(value: string | null | undefined) {
  const prompt = (value || '').trim()
  if (!prompt.endsWith('?')) return false
  if (prompt.length > 150) return false

  return /feel|patient|patience|carry|watch|less certain|less reliable|uncertain|assumption|evidence|condition|view|question|느껴|기다|가정|지켜|덜 확실|불확실|질문/i.test(prompt)
}
