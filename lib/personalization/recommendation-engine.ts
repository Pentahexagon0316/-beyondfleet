import {
  buildContinuitySignals,
  buildOpposingPerspectives,
  ContinuitySignal,
  extractThemeIdsFromText,
  getPrimaryThemeLabel,
  getThemeById,
  getThemeIdsForLesson,
  IntelligenceThemeId,
} from '@/lib/content/intelligence-graph'
import {
  EDITORIAL_SURFACE_LIMITS,
  compactText,
  normalizeReflectionPrompt,
} from '@/lib/content/editorial-discipline'
import {
  SELECTIVITY_THRESHOLDS,
  selectBySignalScore,
} from '@/lib/content/editorial-selectivity'

export type TrackId = 'macro-foundations' | 'ai-economy' | 'risk-thinking'
export type LearningStage = 'beginner' | 'intermediate' | 'adaptive'

export interface LessonCatalogItem {
  id: string
  trackId: TrackId
  title: string
  description: string
  duration: number
  xp: number
  tag: string
  order: number
  stage: LearningStage
  topics: string[]
}

export interface LearningProgressRow {
  lesson_id: string
  track_id: string | null
  completed: boolean | null
  last_viewed_at?: string | null
}

export interface SavedLessonRow {
  lesson_id: string
  track_id: string | null
}

export interface RecentItemRow {
  item_type: 'lesson' | 'brief'
  item_id: string
  title: string
  href: string
  viewed_at: string
  metadata?: Record<string, unknown> | null
}

export interface BriefRecommendationInput {
  id: string
  date: string
  title: string
  summary: string
  category?: string | null
  tags?: string[] | null
  is_premium?: boolean | null
  is_featured?: boolean | null
  market_sentiment?: string | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  related_lesson_ids?: string[] | null
}

export interface ReflectionSignalInput {
  prompt?: string | null
  content?: string | null
  title?: string | null
  insight_type?: string | null
  created_at?: string | null
}

export interface AssumptionSignalInput {
  assumption?: string | null
  revisit_trigger?: string | null
  status?: string | null
  created_at?: string | null
}

export interface RecommendationContext {
  progress: LearningProgressRow[]
  savedLessons: SavedLessonRow[]
  recentItems: RecentItemRow[]
  briefs: BriefRecommendationInput[]
  reflections?: ReflectionSignalInput[]
  assumptions?: AssumptionSignalInput[]
}

export interface ScoredLesson {
  id: string
  trackId: TrackId
  title: string
  description: string
  duration: number
  xp: number
  score: number
  reason: string
  stage: LearningStage
  tag: string
  relatedThemeIds: IntelligenceThemeId[]
  continuity: string
  opposingPerspective: string
}

export interface ScoredBrief {
  id: string
  date: string
  title: string
  summary: string
  category: string
  tags: string[]
  score: number
  reason: string
  isPremium: boolean
  relatedThemeIds: IntelligenceThemeId[]
  continuity: string
  revisitPrompt: string
}

export interface TopicRecommendation {
  id: string
  label: string
  score: number
  reason: string
}

export interface InterestProfile {
  topics: TopicRecommendation[]
  dominantTrack: TrackId
  learningStage: LearningStage
  confidence: number
  rationale: string
}

export interface RecommendationResult {
  interestProfile: InterestProfile
  continueQueue: ScoredLesson[]
  recommendedLessons: ScoredLesson[]
  recommendedBriefs: ScoredBrief[]
  suggestedTopics: TopicRecommendation[]
  trendingTopics: TopicRecommendation[]
  continuitySignals: ContinuitySignal[]
  opposingPerspectives: Array<{ themeId: IntelligenceThemeId; label: string; prompt: string }>
  trackProgress: Record<TrackId, { completed: number; total: number; percent: number }>
}

export const LESSON_CATALOG: LessonCatalogItem[] = [
  {
    id: 'macro-foundations-liquidity',
    trackId: 'macro-foundations',
    title: 'Liquidity: 시장을 움직이는 물의 흐름',
    description: '금리, 중앙은행, 달러 유동성이 위험자산 가격에 미치는 영향을 정리합니다.',
    duration: 14,
    xp: 80,
    tag: 'Core',
    order: 1,
    stage: 'beginner',
    topics: ['macro', 'liquidity', 'rates', 'dollar', 'risk'],
  },
  {
    id: 'macro-foundations-rates',
    trackId: 'macro-foundations',
    title: 'Rates: 금리와 할인율',
    description: '금리가 오르거나 내릴 때 주식, 장기채, 성장자산이 다르게 반응하는 이유를 배웁니다.',
    duration: 12,
    xp: 70,
    tag: 'Macro',
    order: 2,
    stage: 'beginner',
    topics: ['macro', 'rates', 'valuation', 'risk'],
  },
  {
    id: 'macro-foundations-dollar',
    trackId: 'macro-foundations',
    title: 'Dollar Cycle: 강달러와 약달러',
    description: 'DXY, 신흥국 자금 흐름, 원자재와 글로벌 위험자산의 관계를 한 번에 연결합니다.',
    duration: 10,
    xp: 60,
    tag: 'Context',
    order: 5,
    stage: 'beginner',
    topics: ['macro', 'dollar', 'liquidity', 'global-assets'],
  },
  {
    id: 'macro-foundations-inflation',
    trackId: 'macro-foundations',
    title: 'Inflation: 물가와 기대의 차이',
    description: '헤드라인 물가, 근원 물가, 임금, 기대 인플레이션이 정책 판단에 미치는 영향을 봅니다.',
    duration: 13,
    xp: 80,
    tag: 'Policy',
    order: 3,
    stage: 'beginner',
    topics: ['macro', 'inflation', 'cpi', 'policy', 'rates'],
  },
  {
    id: 'macro-foundations-bonds',
    trackId: 'macro-foundations',
    title: 'Bonds: 채권금리와 경기 신호',
    description: '장단기 금리, 실질금리, 신용 스프레드가 경기와 위험 선호를 어떻게 보여주는지 정리합니다.',
    duration: 13,
    xp: 80,
    tag: 'Rates',
    order: 4,
    stage: 'beginner',
    topics: ['macro', 'bonds', 'yields', 'rates', 'credit'],
  },
  {
    id: 'macro-foundations-events',
    trackId: 'macro-foundations',
    title: 'Event Calendar: CPI, FOMC, 고용지표',
    description: '큰 발표 전후에 변동성이 커지는 이유와 체크해야 할 지표를 정리합니다.',
    duration: 11,
    xp: 70,
    tag: 'Checklist',
    order: 6,
    stage: 'beginner',
    topics: ['macro', 'events', 'fomc', 'cpi', 'risk'],
  },
  {
    id: 'ai-economy-compute',
    trackId: 'ai-economy',
    title: 'Compute: GPU, 전력, 데이터센터',
    description: 'AI 성장의 병목인 컴퓨팅 자원과 관련 기업/자산군의 연결 고리를 봅니다.',
    duration: 14,
    xp: 90,
    tag: 'Infrastructure',
    order: 9,
    stage: 'intermediate',
    topics: ['ai', 'compute', 'infrastructure', 'macro'],
  },
  {
    id: 'ai-economy-productivity',
    trackId: 'ai-economy',
    title: 'Automation: 일이 재배치되는 방식',
    description: 'AI 자동화가 비용 구조, 조직 설계, 노동 수요에 미치는 변화를 봅니다.',
    duration: 12,
    xp: 80,
    tag: 'Automation',
    order: 6,
    stage: 'adaptive',
    topics: ['ai', 'automation', 'productivity', 'macro'],
  },
  {
    id: 'ai-economy-data',
    trackId: 'ai-economy',
    title: 'Data Economy: 데이터가 자본이 되는 조건',
    description: '데이터 품질, 접근권, 모델 학습 비용이 경제적 해자를 만드는 방식을 정리합니다.',
    duration: 15,
    xp: 90,
    tag: 'Data',
    order: 7,
    stage: 'adaptive',
    topics: ['ai', 'data', 'infrastructure', 'risk'],
  },
  {
    id: 'ai-economy-agents',
    trackId: 'ai-economy',
    title: 'AI Agents: 의사결정 자동화',
    description: 'AI agents가 개인 생산성, 기업 워크플로, 시장 정보 처리 속도를 어떻게 바꾸는지 봅니다.',
    duration: 13,
    xp: 90,
    tag: 'Agents',
    order: 8,
    stage: 'adaptive',
    topics: ['ai', 'agents', 'automation', 'data'],
  },
  {
    id: 'risk-thinking-probability',
    trackId: 'risk-thinking',
    title: 'Probabilistic Thinking: 확률로 보기',
    description: '확신 대신 가능성의 범위, base rate, 시나리오를 기준으로 판단합니다.',
    duration: 14,
    xp: 90,
    tag: 'Probability',
    order: 9,
    stage: 'intermediate',
    topics: ['risk', 'probability', 'uncertainty', 'scenario'],
  },
  {
    id: 'risk-thinking-second-order',
    trackId: 'risk-thinking',
    title: 'Second-Order Thinking: 다음 반응 보기',
    description: '첫 번째 뉴스보다 그 뉴스가 만들 행동, 정책, 자금 흐름을 추적합니다.',
    duration: 12,
    xp: 80,
    tag: 'Second-order',
    order: 10,
    stage: 'intermediate',
    topics: ['risk', 'second-order', 'judgment', 'macro'],
  },
  {
    id: 'risk-thinking-bias',
    trackId: 'risk-thinking',
    title: 'Cognitive Bias: 내 판단의 왜곡 찾기',
    description: '확증편향, 최신성 편향, 손실회피가 macro 판단을 흐리는 방식을 점검합니다.',
    duration: 13,
    xp: 80,
    tag: 'Bias',
    order: 11,
    stage: 'adaptive',
    topics: ['risk', 'bias', 'judgment', 'reflection'],
  },
  {
    id: 'risk-thinking-risk-management',
    trackId: 'risk-thinking',
    title: 'Risk Management: 틀릴 조건을 먼저 쓰기',
    description: '판단하기 전에 무효화 조건, 관찰 지표, 행동 한계를 정리합니다.',
    duration: 15,
    xp: 100,
    tag: 'Risk',
    order: 12,
    stage: 'adaptive',
    topics: ['risk', 'management', 'reflection', 'scenario'],
  },
]

const TOPIC_LABELS: Record<string, string> = {
  macro: 'Macro structure',
  liquidity: 'Liquidity conditions',
  rates: 'Rates and discounting',
  dollar: 'Dollar cycle',
  events: 'Event risk',
  fomc: 'FOMC',
  cpi: 'Inflation data',
  inflation: 'Inflation regime',
  bonds: 'Bond market signals',
  yields: 'Yield curve',
  credit: 'Credit conditions',
  risk: 'Risk management',
  crypto: 'Digital asset context',
  bitcoin: 'Bitcoin context',
  etf: 'Fund flows',
  institution: 'Institutional flows',
  flows: 'Market flows',
  onchain: 'On-chain signals',
  volatility: 'Volatility',
  leverage: 'Leverage risk',
  ai: 'AI economy',
  compute: 'AI compute',
  infrastructure: 'Infrastructure',
  productivity: 'Productivity',
  automation: 'Automation',
  data: 'Data economy',
  agents: 'AI agents',
  valuation: 'Valuation',
  portfolio: 'Portfolio lens',
  probability: 'Probabilistic thinking',
  uncertainty: 'Uncertainty',
  scenario: 'Scenario planning',
  'second-order': 'Second-order thinking',
  judgment: 'Judgment',
  bias: 'Cognitive bias',
  reflection: 'Reflection',
  management: 'Risk management',
}

const TRACK_LABELS: Record<TrackId, string> = {
  'macro-foundations': 'Macro Foundations',
  'ai-economy': 'AI Economy',
  'risk-thinking': 'Risk Thinking',
}

function increment(map: Map<string, number>, key: string, amount: number) {
  if (!key) return
  map.set(key, (map.get(key) || 0) + amount)
}

function normalizeTopic(value: unknown) {
  if (typeof value !== 'string') return null
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
}

function daysAgo(dateValue?: string | null) {
  if (!dateValue) return 30
  const time = new Date(dateValue).getTime()
  if (Number.isNaN(time)) return 30
  return Math.max(0, Math.floor((Date.now() - time) / (24 * 60 * 60 * 1000)))
}

function recencyBoost(dateValue?: string | null) {
  const age = daysAgo(dateValue)
  if (age <= 1) return 2.5
  if (age <= 7) return 1.75
  if (age <= 21) return 1
  return 0.35
}

function getLesson(lessonId: string) {
  return LESSON_CATALOG.find((lesson) => lesson.id === lessonId)
}

function getTopicsFromRecentItem(item: RecentItemRow) {
  const topics: string[] = []
  const trackId = normalizeTopic(item.metadata?.trackId)
  const tag = normalizeTopic(item.metadata?.tag)
  const category = normalizeTopic(item.metadata?.category)

  if (trackId) topics.push(trackId)
  if (tag) topics.push(tag)
  if (category) topics.push(category)

  const lesson = item.item_type === 'lesson' ? getLesson(item.item_id) : null
  if (lesson) topics.push(...lesson.topics)
  topics.push(...extractThemeIdsFromText([item.title, item.href, JSON.stringify(item.metadata || {})]))

  return topics
}

function getBriefTopics(brief: BriefRecommendationInput) {
  const topics = [
    normalizeTopic(brief.category),
    ...(brief.tags || []).map(normalizeTopic),
  ].filter((topic): topic is string => Boolean(topic))

  const text = [
    brief.title,
    brief.summary,
    brief.category,
    ...(brief.tags || []),
    brief.what_happened,
    brief.why_it_matters,
    brief.second_order_effects,
    brief.risk_conditions,
    brief.reflection_prompt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  Object.keys(TOPIC_LABELS).forEach((topic) => {
    if (text.includes(topic.replace('-', ' ')) || text.includes(topic)) {
      topics.push(topic)
    }
  })

  topics.push(...extractThemeIdsFromText(text))

  return Array.from(new Set(topics))
}

function scoreTopics(context: RecommendationContext) {
  const scores = new Map<string, number>()

  context.recentItems.forEach((item) => {
    const boost = recencyBoost(item.viewed_at)
    getTopicsFromRecentItem(item).forEach((topic) => increment(scores, topic, item.item_type === 'brief' ? 2.4 * boost : 2 * boost))
  })

  context.savedLessons.forEach((saved) => {
    const lesson = getLesson(saved.lesson_id)
    if (lesson) lesson.topics.forEach((topic) => increment(scores, topic, 1.8))
  })

  context.progress.forEach((progress) => {
    const lesson = getLesson(progress.lesson_id)
    if (!lesson) return
    lesson.topics.forEach((topic) => increment(scores, topic, progress.completed ? 0.55 : 1.3))
  })

  context.reflections?.forEach((reflection) => {
    const boost = recencyBoost(reflection.created_at)
    const text = [reflection.title, reflection.prompt, reflection.content].filter(Boolean).join(' ')
    extractThemeIdsFromText(text).forEach((topic) => increment(scores, topic, 2.6 * boost))
  })

  context.assumptions?.forEach((assumption) => {
    const boost = recencyBoost(assumption.created_at)
    const text = [assumption.assumption, assumption.revisit_trigger].filter(Boolean).join(' ')
    extractThemeIdsFromText(text).forEach((topic) => increment(scores, topic, 2.2 * boost))
  })

  return scores
}

function buildTopicList(scores: Map<string, number>, limit: number, reason: string, minScore = 0): TopicRecommendation[] {
  return Array.from(scores.entries())
    .filter(([, score]) => score >= minScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => ({
      id,
      label: TOPIC_LABELS[id] || id.replace(/-/g, ' '),
      score: Math.round(score * 10) / 10,
      reason,
    }))
}

function getTrackProgress(progress: LearningProgressRow[]) {
  const completed = new Set(progress.filter((row) => row.completed).map((row) => row.lesson_id))

  return LESSON_CATALOG.reduce((acc, lesson) => {
    if (!acc[lesson.trackId]) {
      acc[lesson.trackId] = { completed: 0, total: 0, percent: 0 }
    }

    acc[lesson.trackId].total += 1
    if (completed.has(lesson.id)) {
      acc[lesson.trackId].completed += 1
    }

    return acc
  }, {} as Record<TrackId, { completed: number; total: number; percent: number }>)
}

function finalizeTrackProgress(trackProgress: Record<TrackId, { completed: number; total: number; percent: number }>) {
  (Object.keys(trackProgress) as TrackId[]).forEach((trackId) => {
    const track = trackProgress[trackId]
    track.percent = Math.round((track.completed / track.total) * 100)
  })

  return trackProgress
}

function getLearningStage(completedCount: number, trackProgress: Record<TrackId, { completed: number; total: number; percent: number }>): LearningStage {
  if (completedCount < 3 || trackProgress['macro-foundations']?.percent < 50) return 'beginner'
  if (completedCount < 8) return 'intermediate'
  return 'adaptive'
}

function getDominantTrack(topicScores: Map<string, number>, trackProgress: Record<TrackId, { completed: number; total: number; percent: number }>): TrackId {
  const trackScores: Record<TrackId, number> = {
    'macro-foundations': (topicScores.get('macro') || 0) + (topicScores.get('liquidity') || 0) + (topicScores.get('rates') || 0) + (100 - (trackProgress['macro-foundations']?.percent || 0)) / 30,
    'ai-economy': (topicScores.get('ai') || 0) + (topicScores.get('compute') || 0) + (topicScores.get('productivity') || 0),
    'risk-thinking': (topicScores.get('risk') || 0) + (topicScores.get('probability') || 0) + (topicScores.get('second-order') || 0) + (topicScores.get('bias') || 0) + (topicScores.get('reflection') || 0),
  }

  return (Object.entries(trackScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'macro-foundations') as TrackId
}

function scoreLesson(
  lesson: LessonCatalogItem,
  topicScores: Map<string, number>,
  completedLessons: Set<string>,
  savedLessons: Set<string>,
  stage: LearningStage,
  trackProgress: Record<TrackId, { completed: number; total: number; percent: number }>
) {
  if (completedLessons.has(lesson.id)) return -Infinity

  let score = 5
  lesson.topics.forEach((topic) => {
    score += topicScores.get(topic) || 0
  })

  if (savedLessons.has(lesson.id)) score += 2
  if (lesson.stage === stage) score += 4
  if (stage === 'beginner' && lesson.trackId === 'macro-foundations') score += 5
  if (stage === 'intermediate' && lesson.trackId === 'risk-thinking') score += 3
  if (stage === 'adaptive' && lesson.trackId !== 'macro-foundations') score += 1

  const progress = trackProgress[lesson.trackId]
  if (progress && progress.percent > 0 && progress.percent < 100) score += 2.5
  if (progress && progress.percent === 0) score += 1

  score += Math.max(0, 10 - lesson.order) / 10

  return Math.round(score * 10) / 10
}

function lessonReason(lesson: LessonCatalogItem, stage: LearningStage, trackProgress: Record<TrackId, { completed: number; total: number; percent: number }>) {
  const themeIds = getThemeIdsForLesson(lesson.id)
  const themeLabel = getPrimaryThemeLabel(themeIds)

  if (stage === 'beginner' && lesson.trackId === 'macro-foundations') {
    return `This is a gentle place to start with ${themeLabel}.`
  }

  const track = trackProgress[lesson.trackId]
  if (track && track.percent > 0 && track.percent < 100) {
    return `Continue your ${TRACK_LABELS[lesson.trackId]} path when you feel ready.`
  }

  return `This can help make ${themeLabel} feel clearer over time.`
}

function scoreBrief(brief: BriefRecommendationInput, topicScores: Map<string, number>) {
  const topics = getBriefTopics(brief)
  let score = brief.is_featured ? 6 : 2
  topics.forEach((topic) => {
    score += topicScores.get(topic) || 0
  })
  score += recencyBoost(brief.date)
  if (brief.is_premium) score -= 0.5

  return Math.round(score * 10) / 10
}

function buildTrendingTopics(briefs: BriefRecommendationInput[]) {
  const scores = new Map<string, number>()

  briefs.forEach((brief) => {
    const boost = recencyBoost(brief.date)
    getBriefTopics(brief).forEach((topic) => increment(scores, topic, boost))
  })

  return buildTopicList(
    scores,
    EDITORIAL_SURFACE_LIMITS.trendingTopics,
    '최근 공개 브리핑에서 반복되는 주제입니다.',
    SELECTIVITY_THRESHOLDS.trendingTopicMinScore
  )
}

export function buildRecommendations(context: RecommendationContext): RecommendationResult {
  const completedLessons = new Set(context.progress.filter((row) => row.completed).map((row) => row.lesson_id))
  const savedLessons = new Set(context.savedLessons.map((row) => row.lesson_id))
  const completedCount = completedLessons.size
  const trackProgress = finalizeTrackProgress(getTrackProgress(context.progress))
  const topicScores = scoreTopics(context)
  const learningStage = getLearningStage(completedCount, trackProgress)
  const dominantTrack = getDominantTrack(topicScores, trackProgress)
  const hasPersonalSignals = context.recentItems.length > 0
    || context.progress.length > 0
    || context.savedLessons.length > 0
    || Boolean(context.reflections?.length)
    || Boolean(context.assumptions?.length)
  const topics = hasPersonalSignals
    ? buildTopicList(topicScores, 4, '학습, 저장, 최근 열람 기록을 조용히 종합했습니다.', SELECTIVITY_THRESHOLDS.suggestedTopicMinScore)
    : []
  const continuitySignals = buildContinuitySignals([
    ...(context.reflections || []).map((reflection) => ({
      title: reflection.title,
      prompt: reflection.prompt,
      content: reflection.content,
      created_at: reflection.created_at,
    })),
    ...(context.assumptions || []).map((assumption) => ({
      assumption: assumption.assumption,
      revisit_trigger: assumption.revisit_trigger,
      created_at: assumption.created_at,
    })),
  ], EDITORIAL_SURFACE_LIMITS.continuityCues)

  const scoredLessons = LESSON_CATALOG
    .map((lesson) => {
      const relatedThemeIds = getThemeIdsForLesson(lesson.id)
      const primaryTheme = getThemeById(relatedThemeIds[0])

      return {
        id: lesson.id,
        trackId: lesson.trackId,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        xp: lesson.xp,
        score: scoreLesson(lesson, topicScores, completedLessons, savedLessons, learningStage, trackProgress),
        reason: lessonReason(lesson, learningStage, trackProgress),
        stage: lesson.stage,
        tag: lesson.tag,
        relatedThemeIds,
        continuity: primaryTheme?.continuityCue || 'This lesson can support the next quiet step in your reading path.',
        opposingPerspective: primaryTheme?.opposingLens || 'Name the condition that would make this view less reliable.',
      }
    })
    .filter((lesson) => Number.isFinite(lesson.score))
    .sort((a, b) => b.score - a.score)

  const recommendedBriefs = selectBySignalScore(context.briefs
    .map((brief) => {
      const relatedThemeIds = getBriefTopics(brief)
        .map((topic) => getThemeById(topic)?.id)
        .filter((themeId): themeId is IntelligenceThemeId => Boolean(themeId))
      const primaryTheme = getThemeById(relatedThemeIds[0])

      return {
        id: brief.id,
        date: brief.date,
        title: brief.title,
        summary: compactText(brief.summary, 220),
        category: brief.category || 'market',
        tags: brief.tags || [],
        score: scoreBrief(brief, topicScores),
        reason: brief.is_featured
          ? 'Today’s brief is a calm place to begin.'
          : `A quiet continuation of ${primaryTheme?.label || 'your recent themes'}.`,
        isPremium: brief.is_premium !== false,
        relatedThemeIds,
        continuity: primaryTheme?.continuityCue || 'This brief can extend one active thinking thread.',
        revisitPrompt: normalizeReflectionPrompt(
          primaryTheme?.reflectionPrompt || brief.reflection_prompt,
          'What stood out to you today?'
        ),
      }
    })
    .sort((a, b) => b.score - a.score), EDITORIAL_SURFACE_LIMITS.recommendedBriefs, SELECTIVITY_THRESHOLDS.recommendedBriefMinScore)

  const trendingTopics = buildTrendingTopics(context.briefs)
  const suggestedTopics = topics.length > 0
    ? topics.slice(0, EDITORIAL_SURFACE_LIMITS.suggestedTopics).map((topic) => ({
      ...topic,
      reason: '현재 읽기 흐름을 다음 학습과 연결할 수 있는 주제입니다.',
    }))
    : []

  const confidenceBase = Math.min(1, (context.recentItems.length * 0.08) + (context.progress.length * 0.06) + (context.savedLessons.length * 0.08))
  const topThemeIds = [
    ...continuitySignals.map((signal) => signal.id),
    ...topics.map((topic) => topic.id),
  ]

  return {
    interestProfile: {
      topics,
      dominantTrack,
      learningStage,
      confidence: Math.round(confidenceBase * 1000) / 1000,
      rationale: `${TRACK_LABELS[dominantTrack]} 중심의 ${learningStage} route입니다.`,
    },
    continueQueue: selectBySignalScore(scoredLessons, EDITORIAL_SURFACE_LIMITS.continueQueue, SELECTIVITY_THRESHOLDS.continueQueueMinScore),
    recommendedLessons: selectBySignalScore(scoredLessons, EDITORIAL_SURFACE_LIMITS.recommendedLessons, SELECTIVITY_THRESHOLDS.lessonRecommendationMinScore),
    recommendedBriefs,
    suggestedTopics,
    trendingTopics,
    continuitySignals,
    opposingPerspectives: buildOpposingPerspectives(topThemeIds, EDITORIAL_SURFACE_LIMITS.opposingPerspectives),
    trackProgress,
  }
}
