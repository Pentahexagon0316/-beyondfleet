import type { EditorialSimulationBrief } from './editorial-simulation-week'

export interface HumanValidationSourceNote {
  sourceId: 'bls' | 'us-treasury' | 'federal-reserve'
  label: string
  url: string
  accessedAt: string
  usedFor: string
}

export interface HumanReaderValidationBrief extends EditorialSimulationBrief {
  source_notes: HumanValidationSourceNote[]
  validation_focus: string[]
  reader_review_prompts: string[]
}

function buildFullContent(brief: Omit<HumanReaderValidationBrief, 'full_content'>) {
  const sourceNotes = brief.source_notes
    .map((source) => `- ${source.label}: ${source.usedFor} (${source.url})`)
    .join('\n')

  return [
    `## What changed\n\n${brief.what_happened}`,
    `## Why it may matter\n\n${brief.why_it_matters}`,
    `## What could change next\n\n${brief.second_order_effects}`,
    `## What remains unclear\n\n${brief.risk_conditions}`,
    `## Question to carry forward\n\n${brief.reflection_prompt}`,
    `## Source notes\n\n${sourceNotes}\n\nThese sources ground the factual layer. The reading above is BeyondFleet editorial interpretation, not a prediction or financial advice.`,
  ].join('\n\n')
}

const mondayMacroReset: Omit<HumanReaderValidationBrief, 'full_content'> = {
  day: 'Monday',
  date: '2026-05-11',
  cadence: 'Macro Reset',
  title: 'The Week Starts With a Patience Test',
  summary: 'The first question is not whether the week should feel confident. It is whether resilient labor data and tomorrow\'s CPI can coexist without pulling rates higher again.',
  category: 'macro',
  tags: ['macro-reset', 'rates', 'liquidity', 'cpi', 'labor'],
  market_sentiment: 'neutral',
  is_premium: false,
  is_published: false,
  is_featured: true,
  scheduled_for: '2026-05-11T07:00:00+10:00',
  what_happened: 'The latest official data gives the week a mixed opening. BLS reported that April payrolls rose by 115,000 and unemployment held at 4.3%. Its March CPI release showed all-items CPI up 3.3% over the prior 12 months, with April CPI scheduled for Tuesday, May 12. Treasury data for May 8 showed the 10-year yield at 4.38%, above the 2-year at 3.90%. The Fed\'s May 7 H.4.1 release showed total assets near $6.71 trillion.',
  why_it_matters: 'This does not give a clean risk-on answer. Labor resilience can support growth confidence, but it can also give policymakers less urgency to ease if inflation remains sticky. The calmer reset is to ask whether stronger labor data is still supportive if it keeps rate relief further away.',
  second_order_effects: 'If CPI confirms disinflation, labor resilience may feel more like a soft-landing condition. If CPI is firm, the same labor data may become a reason to keep real rates restrictive. AI capex, duration-sensitive assets, and high-beta stories would then need stronger cash-flow evidence rather than only liquidity hope.',
  risk_conditions: 'Hold this lightly. April CPI has not been released yet, and one labor print does not describe hiring breadth or forward demand. The rate curve can also absorb the news differently if Treasury supply, energy prices, or Fed communication changes. The view weakens if CPI is benign and yields fall without signs of stress.',
  reflection_prompt: 'What would you hold more patiently until the CPI data arrives?',
  related_lesson_ids: ['macro-foundations-rates', 'risk-thinking-second-order'],
  predictions: [
    'Wait for CPI before treating labor resilience as a clean risk signal',
    'Watch whether the 10-year yield confirms or rejects the growth story',
    'Keep liquidity conditions separate from confidence about earnings',
  ],
  key_events: [
    { date: 'May 11', title: 'Set the weekly question before the CPI release', impact: 'medium' },
    { date: 'May 12', title: 'BLS scheduled release of April CPI at 8:30 a.m. ET', impact: 'high' },
    { date: 'This week', title: 'Watch whether rates or breadth carry the stronger signal', impact: 'medium' },
  ],
  editor_notes: 'First human-reader validation draft. The emotional goal is calm attention: readers should feel clearer, not more urgent. Source notes should increase trust without making the piece feel academic.',
  source_notes: [
    {
      sourceId: 'bls',
      label: 'BLS Employment Situation, April 2026',
      url: 'https://www.bls.gov/news.release/archives/empsit_05082026.htm',
      accessedAt: '2026-05-11',
      usedFor: 'April payroll growth and unemployment rate',
    },
    {
      sourceId: 'bls',
      label: 'BLS CPI, March 2026',
      url: 'https://www.bls.gov/news.release/cpi.htm',
      accessedAt: '2026-05-11',
      usedFor: 'March CPI context and April CPI release timing',
    },
    {
      sourceId: 'us-treasury',
      label: 'U.S. Treasury Daily Par Yield Curve Rates',
      url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value=2026&type=daily_treasury_yield_curve',
      accessedAt: '2026-05-11',
      usedFor: 'May 8 Treasury yield curve context',
    },
    {
      sourceId: 'federal-reserve',
      label: 'Federal Reserve H.4.1, May 7 2026',
      url: 'https://www.federalreserve.gov/releases/h41/current/default.htm',
      accessedAt: '2026-05-11',
      usedFor: 'Federal Reserve balance sheet context',
    },
  ],
  validation_focus: [
    'Does the brief feel calm rather than urgent?',
    'Does the source note increase trust without making the article feel academic?',
    'Does the reflection prompt feel safe and human?',
    'Does the reader finish clearer than they started?',
  ],
  reader_review_prompts: [
    'How did your body feel while reading: calmer, tense, rushed, bored, or grounded?',
    'Where did your attention slow down in a good way?',
    'Where did the writing feel too structured or AI-like?',
    'Did the source notes help trust, or did they interrupt the reading flow?',
    'What are you carrying forward after reading?',
  ],
}

export const FIRST_HUMAN_READER_VALIDATION_BRIEF: HumanReaderValidationBrief = {
  ...mondayMacroReset,
  full_content: buildFullContent(mondayMacroReset),
}
