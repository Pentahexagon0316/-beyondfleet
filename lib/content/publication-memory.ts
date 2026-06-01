import { extractThemeIdsFromText, getThemeById, IntelligenceThemeId } from './intelligence-graph'

export const PUBLICATION_MEMORY_CONSTRAINTS = `
## Publication memory and editorial continuity
- Let the publication remember quietly. Reference prior questions only when they help the reader think better.
- Connect the week through one recurring tension, unresolved assumption, or carry-forward question.
- Avoid prediction scoreboards, historical victory laps, or retrospective certainty.
- If a prior concern faded, say it faded quietly. Do not force it back into the foreground.
- Memory should feel editorial and human, not analytical or surveillance-like.
- Weekly reflection should revisit the opening question without making the reader manage a timeline.
`.trim()

const MEMORY_CUE_PATTERNS = [
  /\bagain\b/i,
  /\bearlier\b/i,
  /\bcarry forward\b/i,
  /\bcontinued? to matter\b/i,
  /\bfaded\b/i,
  /\bfrom Monday\b/i,
  /\blast week\b/i,
  /\bprior\b/i,
  /\bprevious(?:ly)?\b/i,
  /\brecurring\b/i,
  /\bremember\b/i,
  /\brevisit\b/i,
  /\bstill matters\b/i,
  /\bthe week\b/i,
  /\btomorrow\b/i,
  /계속/i,
  /다시/i,
  /이어/i,
  /지난/i,
  /재점검/i,
]

const SURVEILLANCE_MEMORY_PATTERNS = [
  /\btracked you\b/i,
  /\byou mentioned .* times\b/i,
  /\byou revisited .* times\b/i,
  /\byour behavior\b/i,
  /\byour score\b/i,
  /\bprediction accuracy\b/i,
  /\bscoreboard\b/i,
  /\b승률\b/i,
  /\b점수\b/i,
  /\b행동 추적\b/i,
]

function countPatternHits(value: string | null | undefined, patterns: RegExp[]) {
  const normalized = value || ''
  return patterns.reduce((count, pattern) => (
    pattern.test(normalized) ? count + 1 : count
  ), 0)
}

export function countPublicationMemoryCues(value: string | null | undefined) {
  return countPatternHits(value, MEMORY_CUE_PATTERNS)
}

export function countSurveillanceMemoryHits(value: string | null | undefined) {
  return countPatternHits(value, SURVEILLANCE_MEMORY_PATTERNS)
}

export function evaluatePublicationMemory(fields: {
  title?: string | null
  summary?: string | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  full_content?: string | null
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

  return {
    memoryCueCount: countPublicationMemoryCues(combined),
    memoryCueVisible: countPublicationMemoryCues(combined) > 0,
    surveillanceHits: countSurveillanceMemoryHits(combined),
    themes: extractThemeIdsFromText(combined),
  }
}

export function buildPublicationMemorySignals(briefs: Array<{
  title?: string | null
  summary?: string | null
  tags?: string[] | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
}>, limit = 3) {
  const counts = new Map<IntelligenceThemeId, number>()

  briefs.forEach((brief) => {
    const themes = extractThemeIdsFromText([
      brief.title,
      brief.summary,
      ...(brief.tags || []),
      brief.what_happened,
      brief.why_it_matters,
      brief.second_order_effects,
      brief.risk_conditions,
      brief.reflection_prompt,
    ])

    themes.forEach((themeId) => {
      counts.set(themeId, (counts.get(themeId) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([themeId, count]) => {
      const theme = getThemeById(themeId)

      return {
        themeId,
        label: theme?.label || themeId,
        count,
        note: `${theme?.label || themeId} keeps returning as an editorial thread.`,
        revisitPrompt: theme?.reflectionPrompt || 'What deserves to be carried forward carefully?',
      }
    })
}
