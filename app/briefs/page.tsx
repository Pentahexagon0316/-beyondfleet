'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CircleDot,
  Eye,
  EyeOff,
  Gauge,
  LineChart,
  LockKeyhole,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Star,
  NotebookPen,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { syncGuestReflectionActivity } from '@/lib/client/beyondfleet-sync'
import {
  buildContinuitySignals,
  ContinuitySignal,
  extractThemeIdsFromText,
  getThemeLessonIds,
} from '@/lib/content/intelligence-graph'
import { MembershipTier } from '@/types'
import { isMembershipTier } from '@/lib/membership/access'

type Sentiment = 'bullish' | 'bearish' | 'neutral'

interface DailyBrief {
  id: string
  date: string
  title: string
  summary: string
  full_content: string | null
  market_sentiment: Sentiment | null
  btc_price: number | null
  eth_price: number | null
  btc_change_24h: number | null
  eth_change_24h: number | null
  fear_greed_index: number | null
  key_events?: unknown[] | null
  predictions?: string[] | null
  category?: string | null
  tags?: string[] | null
  is_premium?: boolean | null
  is_featured?: boolean | null
  what_happened?: string | null
  why_it_matters?: string | null
  second_order_effects?: string | null
  risk_conditions?: string | null
  reflection_prompt?: string | null
  related_lesson_ids?: string[] | null
  editorial_quality_score?: number | null
  reading_level?: string | null
  locked?: boolean
  message?: string
  summaryOnly?: boolean
  fullAccess?: boolean
  publicAccess?: boolean
  unlocksAt?: string
}

interface RelatedLesson {
  id: string
  track: string
  title: string
  href: string
  minutes: number
  keywords: string[]
}

interface TimelineEvent {
  date: string
  title: string
  impact: 'high' | 'medium' | 'low'
}

const STORAGE_KEY = 'beyondfleet:saved-briefs:v1'
const RECENT_ITEMS_KEY = 'beyondfleet:recent-learning:v1'
const REFLECTION_STORAGE_KEY = 'beyondfleet:daily-reflections:v1'
const ASSUMPTION_STORAGE_KEY = 'beyondfleet:saved-assumptions:v1'
const IDEA_STORAGE_KEY = 'beyondfleet:idea-journal:v1'
const READING_COMPLETION_KEY = 'beyondfleet:reading-completions:v1'
const LIGHTWEIGHT_JUDGMENT_KEY = 'beyondfleet:lightweight-judgments:v1'

type StructureChoice = 'temporary' | 'structural' | 'unsure'
type AttentionChoice = 'worth-watching' | 'probably-noise' | 'uncertain'

interface LightweightJudgment {
  structure?: StructureChoice
  attention?: AttentionChoice
  updated_at?: string
}

const STRUCTURE_OPTIONS: Array<{ value: StructureChoice; label: string }> = [
  { value: 'temporary', label: 'Temporary' },
  { value: 'structural', label: 'Structural' },
  { value: 'unsure', label: 'Not sure' },
]

const ATTENTION_OPTIONS: Array<{ value: AttentionChoice; label: string }> = [
  { value: 'worth-watching', label: 'Worth watching' },
  { value: 'probably-noise', label: 'Probably noise' },
  { value: 'uncertain', label: 'Uncertain' },
]

const RELATED_LESSONS: RelatedLesson[] = [
  {
    id: 'macro-foundations-liquidity',
    track: 'Macro Foundations',
    title: 'Liquidity: 시장을 움직이는 물의 흐름',
    href: '/learn/macro-foundations-liquidity',
    minutes: 14,
    keywords: ['liquidity', 'funding', 'dollar', 'risk appetite', '유동성'],
  },
  {
    id: 'macro-foundations-rates',
    track: 'Macro Foundations',
    title: 'Rates: 금리와 할인율',
    href: '/learn/macro-foundations-rates',
    minutes: 12,
    keywords: ['rates', 'discount', 'fomc', 'policy', '금리'],
  },
  {
    id: 'macro-foundations-inflation',
    track: 'Macro Foundations',
    title: 'Inflation: 물가와 기대의 차이',
    href: '/learn/macro-foundations-inflation',
    minutes: 13,
    keywords: ['market', 'macro', 'inflation', 'cpi', 'policy', 'rates'],
  },
  {
    id: 'macro-foundations-bonds',
    track: 'Macro Foundations',
    title: 'Bonds: 채권금리와 경기 신호',
    href: '/learn/macro-foundations-bonds',
    minutes: 13,
    keywords: ['market', 'macro', 'bonds', 'yields', 'rates', 'credit'],
  },
  {
    id: 'macro-foundations-dollar',
    track: 'Macro Foundations',
    title: 'Dollar Cycle: 강달러와 약달러',
    href: '/learn/macro-foundations-dollar',
    minutes: 10,
    keywords: ['dollar', 'dxy', 'fx', 'global liquidity', '달러'],
  },
  {
    id: 'risk-thinking-second-order',
    track: 'Risk Thinking',
    title: 'Second-Order Thinking: 다음 반응 보기',
    href: '/learn/risk-thinking-second-order',
    minutes: 12,
    keywords: ['risk', 'second-order', 'judgment', 'bias', 'reflection'],
  },
  {
    id: 'risk-thinking-probability',
    track: 'Risk Thinking',
    title: 'Probabilistic Thinking: 확률로 보기',
    href: '/learn/risk-thinking-probability',
    minutes: 14,
    keywords: ['risk', 'probability', 'scenario', 'uncertainty'],
  },
  {
    id: 'ai-economy-agents',
    track: 'AI Economy',
    title: 'AI Agents: 자동화와 의사결정',
    href: '/learn/ai-economy-agents',
    minutes: 13,
    keywords: ['ai', 'agents', 'automation', 'data economy'],
  },
  {
    id: 'ai-economy-data',
    track: 'AI Economy',
    title: 'Data Economy: 데이터가 자본이 되는 조건',
    href: '/learn/ai-economy-data',
    minutes: 12,
    keywords: ['ai', 'data', 'infrastructure', 'productivity', 'economy'],
  },
  {
    id: 'ai-economy-productivity',
    track: 'AI Economy',
    title: 'Automation: 일이 재배치되는 방식',
    href: '/learn/ai-economy-productivity',
    minutes: 12,
    keywords: ['ai', 'automation', 'productivity', 'labor', '자동화'],
  },
  {
    id: 'risk-thinking-bias',
    track: 'Risk Thinking',
    title: 'Cognitive Bias: 판단을 흐리는 습관',
    href: '/learn/risk-thinking-bias',
    minutes: 10,
    keywords: ['risk', 'bias', 'assumption', 'reflection', 'judgment'],
  },
  {
    id: 'ai-economy-compute',
    track: 'AI Economy',
    title: 'Compute: GPU, 전력, 데이터센터',
    href: '/learn/ai-economy-compute',
    minutes: 14,
    keywords: ['ai', 'compute', 'gpu', 'energy', 'infrastructure'],
  },
  {
    id: 'risk-thinking-risk-management',
    track: 'Risk Thinking',
    title: 'Risk Management: 틀릴 조건을 먼저 쓰기',
    href: '/learn/risk-thinking-risk-management',
    minutes: 15,
    keywords: ['risk', 'risk management', 'revisit', 'invalidated', '리스크'],
  },
]

const DEFAULT_REFLECTION_PROMPT = 'What stood out to you today?'

const BEGINNER_GLOSSARY = [
  {
    terms: ['cpi', 'inflation', '인플레이션', '물가'],
    label: 'CPI / 물가',
    meaning: '사람들이 사는 물건과 서비스 가격이 얼마나 빨리 오르는지 보는 지표입니다.',
  },
  {
    terms: ['rate', 'rates', 'fomc', '금리'],
    label: '금리',
    meaning: '돈을 빌리는 비용입니다. 금리가 바뀌면 기업, 가계, 자산 가격의 기준이 흔들릴 수 있습니다.',
  },
  {
    terms: ['liquidity', 'funding', '유동성'],
    label: '유동성',
    meaning: '시장에 움직일 수 있는 돈과 신용이 얼마나 여유로운지 보는 말입니다.',
  },
  {
    terms: ['bond', 'bonds', 'yield', 'yields', '채권'],
    label: '채권 / 금리',
    meaning: '채권 금리는 시장이 성장, 물가, 위험을 어떻게 보고 있는지 보여주는 신호가 될 수 있습니다.',
  },
  {
    terms: ['dollar', 'dxy', '달러'],
    label: '달러',
    meaning: '글로벌 자금 흐름의 기준 통화입니다. 강달러는 다른 시장의 부담으로 이어질 수 있습니다.',
  },
  {
    terms: ['ai capex', 'compute', 'gpu', 'data center', '데이터센터'],
    label: 'AI 투자',
    meaning: 'AI를 돌리기 위한 칩, 전력, 데이터센터 지출입니다. 성장 기대와 비용 부담을 함께 봐야 합니다.',
  },
  {
    terms: ['second-order', 'second order', '2차', '다음 반응'],
    label: 'Second-order',
    meaning: '뉴스 자체보다 그 뉴스가 사람들의 행동과 다음 결정을 어떻게 바꾸는지 보는 방식입니다.',
  },
]

function getBriefSearchText(brief: DailyBrief | null) {
  if (!brief) return ''

  return [
    brief.title,
    brief.summary,
    brief.what_happened,
    brief.why_it_matters,
    brief.second_order_effects,
    brief.risk_conditions,
    brief.full_content,
    brief.category,
    ...(brief.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getBeginnerTerms(brief: DailyBrief | null) {
  const text = getBriefSearchText(brief)
  if (!text) return []

  return BEGINNER_GLOSSARY.filter((item) =>
    item.terms.some((term) => text.includes(term.toLowerCase()))
  ).slice(0, 3)
}

function getBeginnerBridge(brief: DailyBrief | null) {
  const text = getBriefSearchText(brief)

  if (/(cpi|inflation|인플레이션|물가)/i.test(text)) {
    return '오늘은 물가가 정책 기대를 바꿀 수 있는지 먼저 보면 됩니다.'
  }

  if (/(rate|rates|fomc|금리)/i.test(text)) {
    return '오늘은 돈을 빌리는 비용이 사람들의 선택을 어떻게 바꿀 수 있는지 보면 됩니다.'
  }

  if (/(liquidity|funding|유동성)/i.test(text)) {
    return '오늘은 시장에 여유 자금이 늘었는지 줄었는지를 먼저 보면 됩니다.'
  }

  if (/(ai|compute|gpu|data center|데이터센터)/i.test(text)) {
    return '오늘은 AI 기대가 실제 비용, 인프라, 생산성 변화와 연결되는지 보면 됩니다.'
  }

  return '오늘은 사실 하나, 가능한 영향 하나, 아직 모르는 조건 하나만 잡으면 충분합니다.'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatInline(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-cyan-200">$1</code>')
}

function renderMarkdown(markdown: string) {
  const lines = escapeHtml(markdown).split('\n')
  let html = ''
  let inList = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      return
    }

    if (trimmed.startsWith('### ')) {
      closeList()
      html += `<h3 class="mb-3 mt-8 text-xl font-semibold text-white">${formatInline(trimmed.slice(4))}</h3>`
      return
    }

    if (trimmed.startsWith('## ')) {
      closeList()
      html += `<h2 class="mb-4 mt-10 border-t border-white/10 pt-8 text-2xl font-semibold text-white">${formatInline(trimmed.slice(3))}</h2>`
      return
    }

    if (trimmed.startsWith('# ')) {
      closeList()
      html += `<h1 class="mb-5 mt-8 text-3xl font-semibold text-white">${formatInline(trimmed.slice(2))}</h1>`
      return
    }

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="my-6 space-y-3 pl-5 text-[17px] leading-8 text-gray-300">'
        inList = true
      }
      html += `<li class="list-disc pl-1">${formatInline(trimmed.slice(2))}</li>`
      return
    }

    if (trimmed.startsWith('> ')) {
      closeList()
      html += `<blockquote class="my-7 border-l-2 border-cyan-300/60 bg-cyan-300/[0.06] px-5 py-4 text-[17px] leading-8 text-cyan-50">${formatInline(trimmed.slice(2))}</blockquote>`
      return
    }

    closeList()
    html += `<p class="my-5 text-[17px] leading-8 text-gray-300">${formatInline(trimmed)}</p>`
  })

  closeList()
  return html
}

function formatDate(value?: string | null) {
  if (!value) return '날짜 없음'
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(date)
  } catch {
    return value
  }
}

function estimateReadingTime(brief: DailyBrief | null) {
  const text = `${brief?.summary || ''} ${brief?.full_content || ''}`.trim()
  if (!text) return 2
  return Math.max(2, Math.ceil(text.length / 650))
}

function sentimentMeta(sentiment?: Sentiment | null) {
  switch (sentiment) {
    case 'bullish':
      return { label: 'Bullish', color: 'text-emerald-300', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' }
    case 'bearish':
      return { label: 'Bearish', color: 'text-red-300', bg: 'bg-red-400/10', border: 'border-red-400/30' }
    default:
      return { label: 'Neutral', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30' }
  }
}

function crowdStressLabel(value?: number | null) {
  if (typeof value !== 'number') return '데이터 없음'
  if (value <= 25) return 'Defensive'
  if (value <= 45) return 'Cautious'
  if (value <= 55) return 'Balanced'
  if (value <= 75) return 'Confident'
  return 'Stretched'
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number') return '-'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatReadingLevel(value?: string | null) {
  if (!value) return 'Foundational'
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getRiskScore(brief: DailyBrief | null) {
  if (!brief) return 50

  let score = 45
  const crowdStress = brief.fear_greed_index
  const btcMove = Math.abs(brief.btc_change_24h || 0)
  const ethMove = Math.abs(brief.eth_change_24h || 0)

  if (typeof crowdStress === 'number') {
    if (crowdStress >= 75) score += 24
    else if (crowdStress <= 25) score += 18
    else if (crowdStress >= 60 || crowdStress <= 40) score += 8
  }

  if (btcMove >= 5 || ethMove >= 5) score += 18
  else if (btcMove >= 3 || ethMove >= 3) score += 10

  if (brief.market_sentiment === 'bearish') score += 12
  if (brief.market_sentiment === 'bullish') score -= 4

  return Math.max(0, Math.min(100, score))
}

function getRiskLabel(score: number) {
  if (score >= 75) return 'High'
  if (score >= 55) return 'Elevated'
  if (score >= 35) return 'Balanced'
  return 'Low'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getTimelineEvents(brief: DailyBrief | null): TimelineEvent[] {
  const rawEvents = Array.isArray(brief?.key_events) ? brief?.key_events || [] : []
  const events = rawEvents
    .map((event): TimelineEvent | null => {
      if (typeof event === 'string') {
        return { date: brief?.date || 'Today', title: event, impact: 'medium' }
      }

      if (!isRecord(event)) return null

      const title = event.title || event.event || event.name
      const date = event.date || event.time || brief?.date || 'Today'
      const impact = event.impact === 'high' || event.impact === 'low' ? event.impact : 'medium'

      if (typeof title !== 'string') return null

      return {
        date: typeof date === 'string' ? date : String(date),
        title,
        impact,
      }
    })
    .filter((event): event is TimelineEvent => Boolean(event))

  if (events.length > 0) return events.slice(0, 3)

  const predictions = brief?.predictions || []
  if (predictions.length > 0) {
    return predictions.slice(0, 3).map((prediction, index) => ({
      date: index === 0 ? 'Today' : `T+${index}`,
      title: prediction,
      impact: index === 0 ? 'high' : 'medium',
    }))
  }

  return [
    { date: 'Today', title: '흐름, 변동성, 시장 심리 지표를 먼저 확인합니다.', impact: 'high' },
    { date: 'Next', title: '매크로 이벤트와 주요 디지털 자산 변동성을 분리해서 관찰합니다.', impact: 'medium' },
    { date: 'Watch', title: '확신보다 리스크 한도를 먼저 정합니다.', impact: 'low' },
  ]
}

function getRelatedLessons(brief: DailyBrief | null) {
  const keywords = [
    brief?.category,
    ...(brief?.tags || []),
    brief?.market_sentiment,
    brief?.title,
    brief?.summary,
    brief?.what_happened,
    brief?.why_it_matters,
    brief?.second_order_effects,
    brief?.risk_conditions,
    brief?.reflection_prompt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const themeLessonIds = getThemeLessonIds(extractThemeIdsFromText(keywords), 5)
  const directIds = new Set([...(brief?.related_lesson_ids || []), ...themeLessonIds])
  const matched = RELATED_LESSONS.filter((lesson) =>
    directIds.has(lesson.id) || lesson.keywords.some((keyword) => keywords.includes(keyword.toLowerCase()))
  )

  return (matched.length > 0 ? matched : RELATED_LESSONS).slice(0, 2)
}

function MetricTile({
  label,
  value,
  change,
}: {
  label: string
  value: string
  change?: number | null
}) {
  const isPositive = typeof change === 'number' && change >= 0
  const isNegative = typeof change === 'number' && change < 0

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xl font-semibold text-white">{value}</p>
        {typeof change === 'number' && (
          <span className={`inline-flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-emerald-300' : isNegative ? 'text-red-300' : 'text-gray-400'
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {formatPercent(change)}
          </span>
        )}
      </div>
    </div>
  )
}

function PremiumBlurSection({ message }: { message?: string }) {
  return (
    <section className="relative mt-8 overflow-hidden rounded-lg border border-amber-400/25 bg-amber-400/[0.05]">
      <div className="select-none space-y-5 p-6 blur-[5px]">
        <p className="text-[17px] leading-8 text-gray-300">
          Liquidity conditions remain mixed across risk assets. The strongest signal is not a single headline,
          but the combination of market breadth, exchange flow, and policy expectations.
        </p>
        <p className="text-[17px] leading-8 text-gray-300">
          Position sizing should stay conservative until confirmation improves across volume and realized volatility.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-lg bg-white/10" />
          <div className="h-20 rounded-lg bg-white/10" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-900/72 px-6 text-center backdrop-blur-sm">
        <LockKeyhole className="mb-4 h-8 w-8 text-amber-300" />
        <h3 className="text-lg font-semibold text-white">Premium analysis locked</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-300">
          {message || '전체 분석과 실행 기준은 Commander 이상에서 확인할 수 있습니다.'}
        </p>
        <Link
          href="/membership"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-space-900 transition hover:bg-amber-200"
        >
          멤버십 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

export default function DailyBriefReaderPage() {
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readingProgress, setReadingProgress] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [savedBriefIds, setSavedBriefIds] = useState<Set<string>>(new Set())
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false)
  const [readerUserId, setReaderUserId] = useState<string | null>(null)
  const [reflectionDraft, setReflectionDraft] = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [readingCompletionRecorded, setReadingCompletionRecorded] = useState(false)
  const [continuitySignals, setContinuitySignals] = useState<ContinuitySignal[]>([])
  const [lightweightJudgment, setLightweightJudgment] = useState<LightweightJudgment>({})
  const [judgmentSaved, setJudgmentSaved] = useState(false)

  const readingTime = estimateReadingTime(brief)
  const riskScore = getRiskScore(brief)
  const riskLabel = getRiskLabel(riskScore)
  const sentiment = sentimentMeta(brief?.market_sentiment)
  const timelineEvents = useMemo(() => getTimelineEvents(brief), [brief])
  const relatedLessons = useMemo(() => getRelatedLessons(brief), [brief])
  const beginnerTerms = useMemo(() => getBeginnerTerms(brief), [brief])
  const beginnerBridge = useMemo(() => getBeginnerBridge(brief), [brief])
  const reflectionPrompt = brief?.reflection_prompt || DEFAULT_REFLECTION_PROMPT
  const sourceDateLabel = brief?.date ? formatDate(brief.date) : 'publication time'
  const isSaved = brief ? savedBriefIds.has(brief.id) : false
  const hasFullArticle = Boolean(brief?.fullAccess && brief.full_content)
  const hasPremiumLimit = Boolean(brief?.locked || brief?.summaryOnly)
  const hasLightweightJudgment = Boolean(lightweightJudgment.structure || lightweightJudgment.attention)

  useEffect(() => {
    async function resolveUserTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setReaderUserId(user?.id || null)
        if (!user) return

        await syncGuestReflectionActivity(supabase, user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single()

        if (isMembershipTier(profile?.membership_tier)) {
          setUserTier(profile.membership_tier)
        }
      } catch (err) {
        console.error('Failed to resolve user tier:', err)
      }
    }

    resolveUserTier()
  }, [])

  useEffect(() => {
    fetchFeaturedBrief()
  }, [userTier])

  useEffect(() => {
    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [brief, focusMode])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) as string[] : []
      setSavedBriefIds(new Set(parsed))
    } catch {
      setSavedBriefIds(new Set())
    } finally {
      setBookmarksLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!bookmarksLoaded) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(savedBriefIds)))
  }, [bookmarksLoaded, savedBriefIds])

  useEffect(() => {
    if (!brief?.id) return
    recordRecentBrief(brief)
    loadReflectionContinuity()
    setReflectionDraft('')
    setReflectionSaved(false)
    setReadingCompletionRecorded(false)
    loadLightweightJudgment(brief.id)
  }, [brief?.id, readerUserId])

  useEffect(() => {
    if (!brief?.id || readingCompletionRecorded || readingProgress < 90) return
    recordReadingCompletion(brief.id, Math.round(readingProgress))
  }, [brief?.id, readingProgress, readingCompletionRecorded])

  async function fetchFeaturedBrief() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/cosmic-radar/daily-brief?tier=${userTier}&latest=true`, {
        headers: await getReaderHeaders(),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Daily Brief를 불러오지 못했습니다.')
      }

      setBrief(payload.brief)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Daily Brief를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function getReaderHeaders(): Promise<HeadersInit> {
    const session = await Promise.race([
      supabase.auth.getSession().then(({ data }) => data.session),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 600)),
    ]).catch(() => null)
    const headers: Record<string, string> = {}

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    return headers
  }

  function toggleBookmark() {
    if (!brief) return

    setSavedBriefIds((current) => {
      const next = new Set(current)
      if (next.has(brief.id)) {
        next.delete(brief.id)
      } else {
        next.add(brief.id)
      }
      return next
    })
  }

  async function recordRecentBrief(currentBrief: DailyBrief) {
    const item = {
      item_type: 'brief' as const,
      item_id: currentBrief.id,
      title: currentBrief.title,
      href: '/briefs',
      viewed_at: new Date().toISOString(),
      metadata: {
        date: currentBrief.date,
        category: currentBrief.category || 'market',
      },
    }

    try {
      const storageKey = `${RECENT_ITEMS_KEY}:${readerUserId || 'guest'}`
      const saved = window.localStorage.getItem(storageKey)
      const parsed = saved ? JSON.parse(saved) as Array<typeof item> : []
      const next = [
        item,
        ...parsed.filter((existing) => !(existing.item_type === item.item_type && existing.item_id === item.item_id)),
      ].slice(0, 8)

      window.localStorage.setItem(storageKey, JSON.stringify(next))

      if (readerUserId) {
        await supabase
          .from('learning_recent_items')
          .upsert({
            user_id: readerUserId,
            item_type: item.item_type,
            item_id: item.item_id,
            title: item.title,
            href: item.href,
            viewed_at: item.viewed_at,
            metadata: item.metadata,
          }, {
            onConflict: 'user_id,item_type,item_id',
          })
      }
    } catch {
      // Recent activity is non-critical.
    }
  }

  async function recordReadingCompletion(briefId: string, progress: number) {
    setReadingCompletionRecorded(true)

    try {
      const storageKey = `${READING_COMPLETION_KEY}:${readerUserId || 'guest'}`
      const saved = window.localStorage.getItem(storageKey)
      const parsed = saved ? JSON.parse(saved) as Array<{ brief_id: string; completed_at: string; reading_progress: number }> : []
      const next = [
        { brief_id: briefId, completed_at: new Date().toISOString(), reading_progress: progress },
        ...parsed.filter((item) => item.brief_id !== briefId),
      ].slice(0, 30)
      window.localStorage.setItem(storageKey, JSON.stringify(next))

      if (readerUserId) {
        await supabase
          .from('reading_completions')
          .upsert({
            user_id: readerUserId,
            brief_id: briefId,
            reading_progress: progress,
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,brief_id',
          })
      }
    } catch {
      // Completion tracking is non-critical.
    }
  }

  function getLightweightJudgmentStorageKey() {
    return `${LIGHTWEIGHT_JUDGMENT_KEY}:${readerUserId || 'guest'}`
  }

  function loadLightweightJudgment(briefId: string) {
    try {
      const saved = window.localStorage.getItem(getLightweightJudgmentStorageKey())
      const parsed = saved ? JSON.parse(saved) as Record<string, LightweightJudgment> : {}
      const existing = parsed[briefId] || {}
      setLightweightJudgment(existing)
      setJudgmentSaved(Boolean(existing.structure || existing.attention))
    } catch {
      setLightweightJudgment({})
      setJudgmentSaved(false)
    }
  }

  function saveLightweightJudgment(update: Partial<LightweightJudgment>) {
    if (!brief) return

    const next = {
      ...lightweightJudgment,
      ...update,
      updated_at: new Date().toISOString(),
    }

    setLightweightJudgment(next)
    setJudgmentSaved(true)

    try {
      const storageKey = getLightweightJudgmentStorageKey()
      const saved = window.localStorage.getItem(storageKey)
      const parsed = saved ? JSON.parse(saved) as Record<string, LightweightJudgment> : {}
      window.localStorage.setItem(storageKey, JSON.stringify({
        ...parsed,
        [brief.id]: next,
      }))
    } catch {
      // Lightweight judgment is local and optional.
    }
  }

  async function loadReflectionContinuity() {
    const sources: Array<{
      title?: string | null
      prompt?: string | null
      content?: string | null
      assumption?: string | null
      revisit?: string | null
      revisit_trigger?: string | null
      created_at?: string | null
    }> = []

    try {
      const reflectionKey = `${REFLECTION_STORAGE_KEY}:${readerUserId || 'guest'}`
      const ideaKey = `${IDEA_STORAGE_KEY}:${readerUserId || 'guest'}`
      const assumptionKey = `${ASSUMPTION_STORAGE_KEY}:${readerUserId || 'guest'}`
      const localReflections = JSON.parse(window.localStorage.getItem(reflectionKey) || '[]') as typeof sources
      const localIdeas = JSON.parse(window.localStorage.getItem(ideaKey) || '[]') as typeof sources
      const localAssumptions = JSON.parse(window.localStorage.getItem(assumptionKey) || '[]') as typeof sources
      sources.push(...localReflections, ...localIdeas, ...localAssumptions)
    } catch {
      // Continuity cues are additive.
    }

    if (readerUserId) {
      try {
        const [{ data: reflections }, { data: assumptions }] = await Promise.all([
          supabase
            .from('daily_reflections')
            .select('prompt, content, title, created_at')
            .eq('user_id', readerUserId)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('saved_assumptions')
            .select('assumption, revisit_trigger, created_at')
            .eq('user_id', readerUserId)
            .order('created_at', { ascending: false })
            .limit(30),
        ])

        sources.push(...(reflections || []), ...(assumptions || []))
      } catch {
        // Reflection tables may not be migrated in every local environment.
      }
    }

    setContinuitySignals(buildContinuitySignals(sources, 3))
  }

  async function saveDailyReflection() {
    if (!brief || !reflectionDraft.trim()) return
    const themeIds = extractThemeIdsFromText([
      brief.title,
      brief.summary,
      brief.category,
      ...(brief.tags || []),
      brief.reflection_prompt,
      reflectionDraft,
    ])

    const reflection = {
      brief_id: brief.id,
      prompt: reflectionPrompt,
      content: reflectionDraft.trim(),
      created_at: new Date().toISOString(),
      title: brief.title,
      theme_ids: themeIds,
    }

    try {
      const storageKey = `${REFLECTION_STORAGE_KEY}:${readerUserId || 'guest'}`
      const saved = window.localStorage.getItem(storageKey)
      const parsed = saved ? JSON.parse(saved) as Array<typeof reflection> : []
      const next = [reflection, ...parsed].slice(0, 30)
      window.localStorage.setItem(storageKey, JSON.stringify(next))

      if (readerUserId) {
        await supabase
          .from('daily_reflections')
          .insert({
            user_id: readerUserId,
            brief_id: brief.id,
            prompt: reflection.prompt,
            content: reflection.content,
            insight_type: 'daily',
            visibility: 'private',
          })
      }
    } catch {
      // Local reflection backup and DB sync are non-critical.
    }

    setReflectionSaved(true)
    loadReflectionContinuity()
  }

  return (
    <main className={`min-h-screen bg-[#070b10] text-white ${focusMode ? 'pt-6' : 'pt-20'}`}>
      <div className="fixed left-0 right-0 top-16 z-40 h-1 bg-white/10">
        <div
          className="h-full bg-cyan-200/75 transition-all"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {!focusMode && (
        <section className="border-b border-white/[0.075] bg-[linear-gradient(180deg,#0b111c_0%,#070b10_100%)]">
          <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-2 text-sm font-medium text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                  Daily Brief
                </div>

                {loading ? (
                  <div className="space-y-4">
                    <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
                    <div className="h-14 max-w-3xl animate-pulse rounded bg-white/10" />
                    <div className="h-20 max-w-2xl animate-pulse rounded bg-white/10" />
                  </div>
                ) : brief ? (
                  <>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {brief.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
                          <Star className="h-3.5 w-3.5" />
                          Start here
                        </span>
                      )}
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                        {brief.category || 'market'}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${sentiment.border} ${sentiment.bg} ${sentiment.color}`}>
                        {sentiment.label}
                      </span>
                    </div>

                    <h1 className="max-w-[13ch] break-words text-3xl font-semibold tracking-normal text-white sm:max-w-4xl md:text-5xl">
                      {brief.title}
                    </h1>
                    <p className="mt-5 max-w-[32ch] break-words text-base leading-8 text-gray-300 sm:max-w-[66ch] md:text-lg md:leading-9">
                      {brief.summary}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-400 sm:gap-x-4">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-cyan-300" />
                        {formatDate(brief.date)}
                      </span>
                      <span className="text-gray-500">|</span>
                      <span>Published: {brief.date}</span>
                      <span className="text-gray-500">|</span>
                      <span>Last reviewed: 2026-06-01</span>
                      {brief.date !== '2026-05-27' ? (
                        <span className="ml-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300 border border-amber-400/20">
                          Archive
                        </span>
                      ) : (
                        <span className="ml-2 rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300 border border-cyan-400/20">
                          Latest Brief
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-amber-300" />
                        {readingTime} min read
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="sm:hidden">Sourced</span>
                        <span className="hidden sm:inline">Carefully sourced</span>
                      </span>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={toggleBookmark}
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          isSaved
                            ? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
                            : 'border-white/15 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFocusMode(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.055]"
                      >
                        <Maximize2 className="h-4 w-4" />
                        Focus mode
                      </button>
                      <button
                        type="button"
                        onClick={fetchFeaturedBrief}
                        className="hidden items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06] sm:inline-flex"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <h1 className="max-w-[13ch] break-words text-3xl font-semibold text-white sm:max-w-none sm:text-4xl">Daily Brief가 아직 없습니다.</h1>
                    <p className="mt-4 max-w-[32ch] break-words leading-7 text-gray-400 sm:max-w-none">관리자 CMS에서 공개된 브리핑을 발행하면 이곳에 표시됩니다.</p>
                  </div>
                )}
              </div>

              {brief && (
                <div className="hidden grid-cols-2 gap-3 lg:grid">
                  <MetricTile label="Reading" value={`${readingTime} min`} />
                  <MetricTile label="Level" value={formatReadingLevel(brief.reading_level)} />
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">Attention</p>
                    <p className="mt-3 text-xl font-semibold text-white">{crowdStressLabel(brief.fear_greed_index)}</p>
                    <p className="mt-1 text-sm text-gray-500">Just context</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">Uncertainty</p>
                    <p className="mt-3 text-xl font-semibold text-white">{riskLabel}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-red-300" style={{ width: `${riskScore}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {focusMode && (
        <div className="sticky top-0 z-50 border-b border-white/10 bg-[#070b10]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="line-clamp-1 text-sm font-medium text-gray-300">{brief?.title || 'Daily Brief'}</span>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200"
            >
              <Minimize2 className="h-4 w-4" />
              Exit
            </button>
          </div>
        </div>
      )}

      <section className={`mx-auto grid gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 ${
        focusMode ? 'max-w-3xl' : 'max-w-[1180px] lg:grid-cols-[minmax(0,740px)_320px]'
      }`}>
        <article className="min-w-0">
          {error && (
            <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-lg bg-white/10" />
              <div className="h-96 animate-pulse rounded-lg bg-white/10" />
            </div>
          ) : brief ? (
            <>
              <section className="rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                  <BookOpen className="h-4 w-4" />
                  처음이라면 이렇게 읽으세요
                </div>
                <p className="max-w-[66ch] text-sm leading-7 text-gray-300">
                  전문 용어를 모두 이해하지 않아도 됩니다. 오늘은 눈에 들어온 변화 하나와 궁금한 점 하나만 잡으면 충분합니다.
                </p>
                <p className="mt-3 max-w-[66ch] text-sm leading-7 text-cyan-50/78">
                  {beginnerBridge}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['1. 무슨 일이 있었나?', '실제로 바뀐 사실 하나만 먼저 봅니다.'],
                    ['2. 왜 중요할까?', '이 변화가 사람들의 선택을 바꿀 수 있는지 봅니다.'],
                    ['3. 무엇을 더 기다릴까?', '아직 모르는 부분은 그대로 남겨둡니다.'],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-lg border border-white/[0.06] bg-black/12 p-4">
                      <p className="text-xs font-medium text-cyan-100/80">{title}</p>
                      <p className="mt-2 text-xs leading-5 text-gray-400">{body}</p>
                    </div>
                  ))}
                </div>

                {beginnerTerms.length > 0 && (
                  <div className="mt-5 rounded-lg border border-white/[0.06] bg-black/10 p-4">
                    <p className="text-xs font-medium text-gray-400">오늘 나오는 쉬운 뜻</p>
                    <div className="mt-3 grid gap-3">
                      {beginnerTerms.map((term) => (
                        <div key={term.label} className="grid gap-1 sm:grid-cols-[120px_1fr]">
                          <p className="text-sm font-medium text-cyan-100">{term.label}</p>
                          <p className="text-sm leading-6 text-gray-400">{term.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

	              <section className="bf-reading-panel mt-6 rounded-lg p-6 sm:p-7">
	                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
	                  <Sparkles className="h-4 w-4" />
	                  Today&apos;s reading
	                </div>
	                <p className="max-w-[68ch] text-lg leading-9 text-cyan-50/90">{brief.summary}</p>
	                <p className="mt-4 max-w-[66ch] text-xs leading-5 text-gray-500">
	                  Read this slowly. It is okay if only one part feels clear on the first pass.
	                </p>
	                <details className="mt-5 rounded-lg border border-white/[0.06] bg-black/10 px-4 py-3">
	                  <summary className="cursor-pointer list-none text-xs font-medium text-gray-400">
	                    <span className="inline-flex items-center gap-2">
	                      <ShieldAlert className="h-3.5 w-3.5 text-cyan-300" />
	                      Source note
	                    </span>
	                  </summary>
	                  <p className="mt-3 max-w-[66ch] text-xs leading-5 text-gray-500">
	                    Facts are checked against information available by {sourceDateLabel}. The interpretation is educational context, not financial advice.
	                  </p>
	                </details>
	              </section>

              {!hasFullArticle && (
                <>
                  <section className="mt-9 border-t border-white/[0.075] pt-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <NotebookPen className="h-4 w-4 text-cyan-300" />
                          A simple way to read this
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Start with what changed. You do not need to turn the brief into an answer today.
                        </p>
                      </div>
                      <span className="hidden rounded-full border border-cyan-300/16 px-3 py-1 text-xs text-cyan-100 sm:inline-flex">
                        Brief → Learn → Note
                      </span>
                    </div>

                    <div className="mt-7 grid gap-5 md:grid-cols-2">
                      <div className="border-l border-cyan-300/25 pl-4">
                        <p className="text-xs font-medium uppercase text-cyan-100/70">What changed</p>
                        <p className="mt-2 text-[15px] leading-7 text-gray-300">
                          {brief.what_happened || brief.summary || '오늘 실제로 바뀐 데이터, 정책, 자금 흐름을 먼저 확인합니다.'}
                        </p>
                      </div>
                      <div className="border-l border-white/10 pl-4">
                        <p className="text-xs font-medium uppercase text-gray-500">Why it may matter</p>
                        <p className="mt-2 text-[15px] leading-7 text-gray-400">
                          {brief.why_it_matters || brief.second_order_effects || '다음 행동, 정책 반응, 자본 배분 변화가 어디서 생길지 천천히 봅니다.'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="mt-9 border-t border-white/[0.075] pt-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Gauge className="h-4 w-4 text-amber-300" />
                          What remains unclear
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-400">
                          {brief.risk_conditions || 'Read what remains uncertain before turning the brief into a conclusion.'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg border border-amber-300/18 bg-amber-300/[0.06] px-3 py-1 text-sm font-semibold text-amber-200">
                        {riskLabel}
                      </span>
                    </div>
                  </section>
                </>
              )}

              <section className="mt-8 rounded-lg border border-white/[0.075] bg-white/[0.024] p-5 sm:p-6">
                <div className="mb-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <CircleDot className="h-4 w-4 text-cyan-300" />
                    Think alongside the brief
                  </div>
                  <p className="mt-2 max-w-[62ch] text-sm leading-6 text-gray-500">
                    No score and no prediction game. Just mark how the signal feels right now.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Temporary or structural?</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1">
                      {STRUCTURE_OPTIONS.map((option) => {
                        const selected = lightweightJudgment.structure === option.value

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => saveLightweightJudgment({ structure: option.value })}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                              selected
                                ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-50'
                                : 'border-white/[0.075] bg-black/15 text-gray-400 hover:border-white/18 hover:text-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-300">Worth watching?</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1">
                      {ATTENTION_OPTIONS.map((option) => {
                        const selected = lightweightJudgment.attention === option.value

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => saveLightweightJudgment({ attention: option.value })}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                              selected
                                ? 'border-amber-300/40 bg-amber-300/[0.12] text-amber-50'
                                : 'border-white/[0.075] bg-black/15 text-gray-400 hover:border-white/18 hover:text-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-500">
                  {judgmentSaved && hasLightweightJudgment
                    ? 'Saved quietly on this device. You can change it anytime.'
                    : 'You can skip this and keep reading.'}
                </p>
              </section>

              {hasFullArticle ? (
                <section className="mt-10">
                  <div
                    className="bf-reading-body border-t border-white/[0.075] pt-8"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(brief.full_content || '') }}
                  />
                </section>
              ) : (
                <PremiumBlurSection message={brief.message} />
              )}

              {hasPremiumLimit && !brief.locked && (
                <div className="mt-5 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-sm leading-6 text-amber-100/90">
                  <LockKeyhole className="mr-2 inline h-4 w-4" />
                  {brief.message || '현재 등급에서는 요약만 제공됩니다.'}
                </div>
              )}

              <section className="mt-12 border-t border-white/[0.075] pt-9">
                <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-white">
                  <LineChart className="h-4 w-4 text-cyan-300" />
                  One thing to watch
                </div>
                <div className="space-y-4">
                  {timelineEvents.slice(0, 1).map((event, index) => (
                    <div key={`${event.title}-${index}`} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4">
                      <div className="text-sm font-medium text-gray-500">{event.date}</div>
                      <div className="border-l border-white/10 pl-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-xs font-medium text-cyan-100">
                            watch
                          </span>
                          <p className="text-[15px] leading-7 text-gray-200">{event.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-12 rounded-lg border border-white/[0.075] bg-white/[0.022] p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <NotebookPen className="h-4 w-4 text-amber-300" />
                  One small note
                </div>
                {continuitySignals.length > 0 && (
                  <div className="mb-5 border-l border-cyan-300/30 pl-4">
                    <p className="text-xs font-medium leading-5 text-cyan-100/75">
                      {continuitySignals[0].message}
                    </p>
                  </div>
                )}
                <p className="text-[15px] leading-7 text-amber-50/90">
                  {reflectionPrompt}
                </p>
                <textarea
                  value={reflectionDraft}
                  onChange={(event) => {
                    setReflectionDraft(event.target.value)
                    setReflectionSaved(false)
                  }}
                  rows={3}
                  placeholder="A word, a sentence, or a question is enough."
                  className="bf-reading-input mt-4"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">Optional. Short is enough.</p>
                  <button
                    type="button"
                    onClick={saveDailyReflection}
                    disabled={!reflectionDraft.trim()}
                    className="rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reflectionSaved ? 'Saved' : 'Save note'}
                  </button>
                </div>
              </section>

              <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <h3 className="font-semibold text-white">신뢰 기준 및 금융 면책</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      본 서비스는 정보 제공 및 교육 목적입니다. 매수, 매도, 보유 권유가 아니며 모든 투자 판단과 책임은 사용자에게 있습니다. BeyondFleet는 투자 자문, 투자 일임, 매매 추천, 수익 보장을 제공하지 않습니다. 모든 콘텐츠는 금융 리터러시와 의사결정 교육을 위한 참고 자료입니다.
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
              <BarChart3 className="mx-auto mb-4 h-10 w-10 text-gray-500" />
              <h2 className="text-xl font-semibold text-white">표시할 Brief가 없습니다.</h2>
              <p className="mt-2 text-gray-400">공개된 Daily Brief를 먼저 발행해주세요.</p>
            </div>
          )}
        </article>

        {!focusMode && brief && (
          <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block lg:self-start">
            <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-white">Reading panel</h2>
                <span className="text-sm text-gray-500">{Math.round(readingProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${readingProgress}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/[0.075] bg-black/15 p-3">
                  <Clock3 className="mb-2 h-4 w-4 text-amber-300" />
                  <p className="font-semibold text-white">{readingTime} min</p>
                  <p className="text-gray-500">Estimated</p>
                </div>
                <div className="rounded-lg border border-white/[0.075] bg-black/15 p-3">
                  {hasFullArticle ? <Eye className="mb-2 h-4 w-4 text-emerald-300" /> : <EyeOff className="mb-2 h-4 w-4 text-amber-300" />}
                  <p className="font-semibold text-white">{hasFullArticle ? 'Full' : 'Summary'}</p>
                  <p className="text-gray-500">Access</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-300" />
                <h2 className="font-semibold text-white">One next lesson</h2>
              </div>
              <div className="space-y-3">
                {relatedLessons.slice(0, 1).map((lesson) => (
                  <Link
                    key={lesson.title}
                    href={lesson.href}
                    className="block rounded-lg border border-white/[0.075] bg-black/15 p-4 transition hover:border-cyan-300/32 hover:bg-cyan-300/[0.035]"
                  >
                    <p className="text-xs font-medium text-cyan-300">{lesson.track}</p>
                    <h3 className="mt-2 text-sm font-semibold leading-6 text-white">{lesson.title}</h3>
                    <p className="mt-2 text-xs text-gray-500">{lesson.minutes} min lesson</p>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        )}
      </section>
    </main>
  )
}
