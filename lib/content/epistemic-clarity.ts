export type EpistemicLayerId =
  | 'observation'
  | 'sourced-fact'
  | 'interpretation'
  | 'assumption'
  | 'uncertainty'
  | 'carry-forward'

export interface EpistemicLayer {
  id: EpistemicLayerId
  label: string
  purpose: string
  cue: string
}

export const EPISTEMIC_LAYERS: EpistemicLayer[] = [
  {
    id: 'observation',
    label: 'Observation',
    purpose: 'What was observed or reported.',
    cue: 'What changed?',
  },
  {
    id: 'sourced-fact',
    label: 'Sourced fact',
    purpose: 'A factual claim grounded in an external source or dataset.',
    cue: 'Where did this come from?',
  },
  {
    id: 'interpretation',
    label: 'Interpretation',
    purpose: 'BeyondFleet editorial reading of why the observation may matter.',
    cue: 'One interpretation is...',
  },
  {
    id: 'assumption',
    label: 'Assumption',
    purpose: 'A belief that should remain revisitable.',
    cue: 'This depends on...',
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty',
    purpose: 'What remains unclear or could weaken the view.',
    cue: 'This becomes weaker if...',
  },
  {
    id: 'carry-forward',
    label: 'Carry forward',
    purpose: 'One question or condition worth watching next.',
    cue: 'What deserves continued attention?',
  },
]

export const EPISTEMIC_BRIEF_STRUCTURE = [
  {
    title: 'What changed',
    field: 'what_happened',
    description: 'Observed change, data point, policy move, or reported development.',
  },
  {
    title: 'Why it may matter',
    field: 'why_it_matters',
    description: 'Why the observation may matter. This is editorial judgment, not raw fact.',
  },
  {
    title: 'What could change next',
    field: 'second_order_effects',
    description: 'What behavior, policy reaction, or capital allocation may change next.',
  },
  {
    title: 'What remains unclear',
    field: 'risk_conditions',
    description: 'What remains unclear, what could weaken the view, and what to watch.',
  },
  {
    title: 'Question to carry forward',
    field: 'reflection_prompt',
    description: 'One quiet prompt that helps the reader identify a revisitable assumption.',
  },
] as const

export const EPISTEMIC_GENERATION_CONSTRAINTS = `
## Epistemic clarity
- Separate observation from interpretation. Do not present interpretation as fact.
- Use measured language: "may", "could", "appears", "one interpretation is", "this weakens if".
- Name at least one uncertainty or condition that would weaken the view.
- Avoid deterministic forecasting and false certainty.
- Make assumptions visible and revisitable.
- If a claim depends on external data or reporting, write it as a sourced fact rather than an editorial conclusion.
- Use these distinctions as guardrails. Do not make the prose feel like an academic checklist.
`.trim()

const UNCERTAINTY_PATTERNS = [
  'appears',
  'assumption',
  'condition',
  'could',
  'depends',
  'evidence',
  'failure',
  'if ',
  'invalidation',
  'less certain',
  'less reliable',
  'may',
  'might',
  'one interpretation',
  'remain uncertain',
  'risk',
  'skepticism',
  'uncertain',
  'unless',
  'watch',
  'weaken',
  'wrong',
  '불확실',
  '가정',
  '가능성',
  '약해',
  '조건',
  '해석',
]

const OVERCERTAINTY_PATTERNS = [
  /\bguarantees?\b/i,
  /\bguaranteed\b/i,
  /\binevitable\b/i,
  /\bno doubt\b/i,
  /\b(?:proves|proved|proven)\b/i,
  /\bwill definitely\b/i,
  /\bwithout question\b/i,
  /반드시/i,
  /확실히/i,
  /무조건/i,
  /증명한다/i,
]

export function countOvercertaintyHits(value: string | null | undefined) {
  const normalized = value || ''
  return OVERCERTAINTY_PATTERNS.reduce((count, pattern) => (
    pattern.test(normalized) ? count + 1 : count
  ), 0)
}

export function hasUncertaintyLanguage(value: string | null | undefined) {
  const normalized = (value || '').toLowerCase()
  return UNCERTAINTY_PATTERNS.some((pattern) => normalized.includes(pattern.toLowerCase()))
}

export function evaluateEpistemicClarity(fields: {
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  full_content?: string | null
}) {
  const combined = [
    fields.what_happened,
    fields.why_it_matters,
    fields.second_order_effects,
    fields.risk_conditions,
    fields.reflection_prompt,
    fields.full_content,
  ].filter(Boolean).join(' ')

  return {
    observationPresent: Boolean(fields.what_happened?.trim()),
    interpretationPresent: Boolean(fields.why_it_matters?.trim()),
    uncertaintyVisible: hasUncertaintyLanguage(fields.risk_conditions || combined),
    assumptionPromptVisible: /assumption|가정|uncertain|불확실|weaken|약해|condition|조건|evidence|less reliable|less certain|view|question|skepticism|retire|rewrite|carry|would make|feel|patient|patience|watch|hold lightly|덜 확실|지켜|기다/i.test(fields.reflection_prompt || ''),
    overcertaintyHits: countOvercertaintyHits(combined),
  }
}
