export type IntelligenceThemeId =
  | 'liquidity'
  | 'rates'
  | 'inflation'
  | 'bonds'
  | 'dollar'
  | 'ai-compute'
  | 'automation'
  | 'data-economy'
  | 'ai-agents'
  | 'probability'
  | 'second-order'
  | 'cognitive-bias'
  | 'risk-management'

export interface IntelligenceTheme {
  id: IntelligenceThemeId
  label: string
  description: string
  keywords: string[]
  lessonIds: string[]
  opposingLens: string
  continuityCue: string
  reflectionPrompt: string
}

export interface ContinuitySource {
  title?: string | null
  prompt?: string | null
  content?: string | null
  assumption?: string | null
  revisit?: string | null
  revisit_trigger?: string | null
  created_at?: string | null
}

export interface ContinuitySignal {
  id: IntelligenceThemeId
  label: string
  count: number
  message: string
  revisitPrompt: string
  opposingLens: string
  lessonIds: string[]
  lastSeenAt?: string
}

export const INTELLIGENCE_THEMES: IntelligenceTheme[] = [
  {
    id: 'liquidity',
    label: 'Liquidity conditions',
    description: 'Funding, central bank liquidity, market breadth, and risk appetite.',
    keywords: ['liquidity', 'funding', 'dollar liquidity', '유동성', '자금', 'risk appetite'],
    lessonIds: ['macro-foundations-liquidity', 'macro-foundations-dollar', 'risk-thinking-second-order'],
    opposingLens: 'If liquidity looks supportive, ask where funding stress could still be hidden.',
    continuityCue: 'You have been returning to liquidity conditions.',
    reflectionPrompt: 'Which liquidity assumption would change your view tomorrow?',
  },
  {
    id: 'rates',
    label: 'Rates and discounting',
    description: 'Policy rates, discount rates, real yields, and valuation pressure.',
    keywords: ['rates', 'rate', 'discount', 'fomc', 'policy rate', '금리', '할인율', '정책'],
    lessonIds: ['macro-foundations-rates', 'macro-foundations-bonds', 'macro-foundations-events'],
    opposingLens: 'If rate expectations move, separate the first price reaction from the growth signal.',
    continuityCue: 'Rates have appeared in your recent thinking.',
    reflectionPrompt: 'What would make the current rate narrative less reliable?',
  },
  {
    id: 'inflation',
    label: 'Inflation regime',
    description: 'Headline inflation, core inflation, wages, and expectation shifts.',
    keywords: ['inflation', 'cpi', 'core cpi', 'wages', 'prices', '물가', '인플레이션'],
    lessonIds: ['macro-foundations-inflation', 'macro-foundations-rates', 'risk-thinking-probability'],
    opposingLens: 'If inflation cools, ask whether expectations or wages are telling a slower story.',
    continuityCue: 'Inflation has been part of your recent reading path.',
    reflectionPrompt: 'Which inflation assumption deserves the most skepticism?',
  },
  {
    id: 'bonds',
    label: 'Bond market signals',
    description: 'Yield curve, duration, credit spreads, and recession signals.',
    keywords: ['bond', 'bonds', 'yield', 'yields', 'curve', 'credit', '채권', '수익률', '스프레드'],
    lessonIds: ['macro-foundations-bonds', 'macro-foundations-rates', 'risk-thinking-risk-management'],
    opposingLens: 'If yields move sharply, ask whether it is growth, inflation, supply, or term premium.',
    continuityCue: 'Bond signals are becoming a recurring thread.',
    reflectionPrompt: 'What bond signal would invalidate your current macro read?',
  },
  {
    id: 'dollar',
    label: 'Dollar cycle',
    description: 'Dollar strength, global liquidity, emerging markets, and cross-border pressure.',
    keywords: ['dollar', 'dxy', 'fx', 'usd', '달러', '환율', 'global liquidity'],
    lessonIds: ['macro-foundations-dollar', 'macro-foundations-liquidity', 'risk-thinking-second-order'],
    opposingLens: 'If the dollar trend seems clear, check what foreign funding stress would contradict it.',
    continuityCue: 'Dollar conditions are linked across your recent notes.',
    reflectionPrompt: 'Which global risk changes if the dollar path reverses?',
  },
  {
    id: 'ai-compute',
    label: 'AI compute infrastructure',
    description: 'GPUs, power, data centers, capex, and AI infrastructure bottlenecks.',
    keywords: ['compute', 'gpu', 'data center', 'datacenter', 'power', 'capex', 'ai infrastructure', '전력', '데이터센터'],
    lessonIds: ['ai-economy-compute', 'ai-economy-data', 'risk-thinking-second-order'],
    opposingLens: 'If AI capex supports growth, ask where margins, power, or financing could become constraints.',
    continuityCue: 'AI compute keeps showing up in your thinking.',
    reflectionPrompt: 'What AI infrastructure bottleneck could change the long-term story?',
  },
  {
    id: 'automation',
    label: 'Automation and productivity',
    description: 'Work redesign, labor demand, cost structure, and productivity diffusion.',
    keywords: ['automation', 'productivity', 'labor', 'workflow', '자동화', '생산성', '노동'],
    lessonIds: ['ai-economy-productivity', 'ai-economy-agents', 'risk-thinking-bias'],
    opposingLens: 'If automation looks deflationary, ask where transition costs or wage effects may offset it.',
    continuityCue: 'Automation is becoming part of your macro lens.',
    reflectionPrompt: 'Which productivity claim needs more evidence before you trust it?',
  },
  {
    id: 'data-economy',
    label: 'Data economy',
    description: 'Data access, model quality, defensibility, and information advantage.',
    keywords: ['data', 'dataset', 'model', 'training data', '데이터', '모델', '정보'],
    lessonIds: ['ai-economy-data', 'ai-economy-agents', 'risk-thinking-bias'],
    opposingLens: 'If data looks like a moat, ask whether access, quality, or distribution is the real constraint.',
    continuityCue: 'Data advantage appears in your recent notes.',
    reflectionPrompt: 'What would make a data advantage less durable than it appears?',
  },
  {
    id: 'ai-agents',
    label: 'AI agents and decision loops',
    description: 'Agentic workflows, decision automation, and information processing speed.',
    keywords: ['agent', 'agents', 'ai agent', 'decision automation', '에이전트', '의사결정'],
    lessonIds: ['ai-economy-agents', 'ai-economy-productivity', 'risk-thinking-second-order'],
    opposingLens: 'If agents accelerate decisions, ask which feedback loops become more fragile.',
    continuityCue: 'AI agents are becoming a repeated question.',
    reflectionPrompt: 'Which decision loop could AI agents make faster but less thoughtful?',
  },
  {
    id: 'probability',
    label: 'Probabilistic thinking',
    description: 'Base rates, scenarios, confidence ranges, and uncertainty.',
    keywords: ['probability', 'base rate', 'scenario', 'uncertainty', '확률', '시나리오', '불확실성'],
    lessonIds: ['risk-thinking-probability', 'risk-thinking-risk-management', 'macro-foundations-events'],
    opposingLens: 'If a scenario feels obvious, assign a probability and name what would change it.',
    continuityCue: 'You have been framing uncertainty more explicitly.',
    reflectionPrompt: 'What probability would you assign, and what evidence would move it?',
  },
  {
    id: 'second-order',
    label: 'Second-order effects',
    description: 'The next policy, capital allocation, or behavior change after the headline.',
    keywords: ['second-order', 'second order', 'behavior', 'next reaction', '2차', '다음 반응', '행동 변화'],
    lessonIds: ['risk-thinking-second-order', 'macro-foundations-events', 'ai-economy-agents'],
    opposingLens: 'If the first reaction is loud, ask what slower second-order behavior follows.',
    continuityCue: 'Second-order effects are a recurring part of your reflections.',
    reflectionPrompt: 'What is the likely second reaction after the first market move fades?',
  },
  {
    id: 'cognitive-bias',
    label: 'Cognitive bias',
    description: 'Confirmation bias, recency bias, loss aversion, and narrative attachment.',
    keywords: ['bias', 'confirmation', 'recency', 'loss aversion', '편향', '확증편향', '최신성'],
    lessonIds: ['risk-thinking-bias', 'risk-thinking-probability', 'risk-thinking-risk-management'],
    opposingLens: 'If a view feels comfortable, ask which evidence you are filtering out.',
    continuityCue: 'Bias checks are appearing in your thinking pattern.',
    reflectionPrompt: 'Which part of your view might be shaped by recency or confirmation bias?',
  },
  {
    id: 'risk-management',
    label: 'Risk management',
    description: 'Invalidation conditions, position sizing, observation limits, and revisit triggers.',
    keywords: ['risk management', 'risk', 'invalidated', 'revisit', 'position sizing', '리스크', '무효화', '재점검'],
    lessonIds: ['risk-thinking-risk-management', 'risk-thinking-probability', 'macro-foundations-events'],
    opposingLens: 'If conviction rises, define the condition that would make you smaller or slower.',
    continuityCue: 'Risk conditions are becoming part of your decision rhythm.',
    reflectionPrompt: 'What condition would make this view wrong enough to revisit?',
  },
]

const THEME_BY_ID = new Map(INTELLIGENCE_THEMES.map((theme) => [theme.id, theme]))

export function getThemeById(id: string | null | undefined) {
  if (!id) return null
  return THEME_BY_ID.get(id as IntelligenceThemeId) || null
}

export function normalizeTopicToken(value: unknown) {
  if (typeof value !== 'string') return null
  return value.trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g, '-').replace(/^-|-$/g, '')
}

export function extractThemeIdsFromText(input: unknown): IntelligenceThemeId[] {
  const text = Array.isArray(input)
    ? input.filter(Boolean).join(' ')
    : typeof input === 'string'
      ? input
      : ''

  const normalizedText = text.toLowerCase()
  if (!normalizedText.trim()) return []

  return INTELLIGENCE_THEMES
    .filter((theme) => theme.keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase())))
    .map((theme) => theme.id)
}

export function getThemeLessonIds(themeIds: string[], limit = 4) {
  const seen = new Set<string>()
  const lessonIds: string[] = []

  themeIds.forEach((themeId) => {
    const theme = getThemeById(themeId)
    if (!theme) return

    theme.lessonIds.forEach((lessonId) => {
      if (seen.has(lessonId)) return
      seen.add(lessonId)
      lessonIds.push(lessonId)
    })
  })

  return lessonIds.slice(0, limit)
}

export function getThemeIdsForLesson(lessonId: string) {
  return INTELLIGENCE_THEMES
    .filter((theme) => theme.lessonIds.includes(lessonId))
    .map((theme) => theme.id)
}

export function getPrimaryThemeLabel(themeIds: string[]) {
  const theme = themeIds.map(getThemeById).find(Boolean)
  return theme?.label || 'judgment'
}

export function buildContinuitySignals(sources: ContinuitySource[], limit = 4): ContinuitySignal[] {
  const scores = new Map<IntelligenceThemeId, { count: number; lastSeenAt?: string }>()

  sources.forEach((source) => {
    const text = [
      source.title,
      source.prompt,
      source.content,
      source.assumption,
      source.revisit,
      source.revisit_trigger,
    ]
      .filter(Boolean)
      .join(' ')

    extractThemeIdsFromText(text).forEach((themeId) => {
      const existing = scores.get(themeId)
      const sourceTime = source.created_at || undefined

      if (!existing) {
        scores.set(themeId, { count: 1, lastSeenAt: sourceTime })
        return
      }

      const lastSeenAt = sourceTime && (!existing.lastSeenAt || new Date(sourceTime) > new Date(existing.lastSeenAt))
        ? sourceTime
        : existing.lastSeenAt

      scores.set(themeId, { count: existing.count + 1, lastSeenAt })
    })
  })

  return Array.from(scores.entries())
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count
      return new Date(b[1].lastSeenAt || 0).getTime() - new Date(a[1].lastSeenAt || 0).getTime()
    })
    .slice(0, limit)
    .map(([id, meta]) => {
      const theme = THEME_BY_ID.get(id)
      return {
        id,
        label: theme?.label || id,
        count: meta.count,
        message: meta.count > 1
          ? `${theme?.label || id} keeps returning as a thread.`
          : theme?.continuityCue || `${theme?.label || id} recently appeared in your notes.`,
        revisitPrompt: theme?.reflectionPrompt || 'What should you revisit tomorrow?',
        opposingLens: theme?.opposingLens || 'Name the condition that would make this view less reliable.',
        lessonIds: theme?.lessonIds || [],
        lastSeenAt: meta.lastSeenAt,
      }
    })
}

export function buildOpposingPerspectives(themeIds: string[], limit = 3) {
  const uniqueThemeIds = Array.from(new Set(themeIds))

  return uniqueThemeIds
    .map((themeId) => {
      const theme = getThemeById(themeId)
      if (!theme) return null

      return {
        themeId: theme.id,
        label: theme.label,
        prompt: theme.opposingLens,
      }
    })
    .filter((item): item is { themeId: IntelligenceThemeId; label: string; prompt: string } => Boolean(item))
    .slice(0, limit)
}
