'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { syncGuestReflectionActivity } from '@/lib/client/beyondfleet-sync'
import { buildContinuitySignals, ContinuitySignal } from '@/lib/content/intelligence-graph'
import { User } from '@supabase/supabase-js'
import { MembershipTier } from '@/types'
import { MEMBERSHIP_TIER_LABELS, normalizeMembershipTier } from '@/lib/membership/access'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Compass,
  GraduationCap,
  Lock,
  NotebookPen,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

interface LearningWidget {
  title: string
  description: string
  progress: number
  totalXp: number
  level: number
  levelTitle: string
  completedCount: number
  totalLessons: number
  currentStreak: number
}

interface DashboardPersonalization {
  interestProfile: {
    topics: Array<{ id: string; label: string; score: number }>
    rationale: string
    learningStage: string
    confidence: number
  }
  continueQueue: Array<{ id: string; title: string; description: string; reason: string; score: number; continuity?: string; opposingPerspective?: string }>
  recommendedLessons: Array<{ id: string; title: string; description: string; reason: string; score: number; continuity?: string; opposingPerspective?: string }>
  recommendedBriefs: Array<{ id: string; title: string; summary: string; category: string; reason: string; score: number; continuity?: string; revisitPrompt?: string }>
  suggestedTopics: Array<{ id: string; label: string; score: number; reason: string }>
  trendingTopics: Array<{ id: string; label: string; score: number; reason: string }>
  continuitySignals: ContinuitySignal[]
  opposingPerspectives: Array<{ themeId: string; label: string; prompt: string }>
  mode: 'personalized' | 'guest'
}

interface SavedReflection {
  prompt: string
  content: string
  created_at: string
  title?: string
  insight_type?: string
}

interface SavedAssumption {
  assumption: string
  revisit: string
  created_at?: string
}

const DASHBOARD_LESSONS = [
  { id: 'macro-foundations-liquidity', title: 'Liquidity: 시장을 움직이는 물의 흐름', description: '금리, 중앙은행, 달러 유동성이 위험자산 가격에 미치는 영향을 정리합니다.', xp: 80 },
  { id: 'macro-foundations-rates', title: 'Rates: 금리와 할인율', description: '금리가 오르거나 내릴 때 주식, 장기채, 성장자산이 다르게 반응하는 이유를 배웁니다.', xp: 70 },
  { id: 'macro-foundations-inflation', title: 'Inflation: 물가와 기대의 차이', description: '헤드라인 물가, 근원 물가, 임금, 기대 인플레이션이 정책 판단에 미치는 영향을 봅니다.', xp: 80 },
  { id: 'macro-foundations-bonds', title: 'Bonds: 채권금리와 경기 신호', description: '장단기 금리, 실질금리, 신용 스프레드가 경기와 위험 선호를 어떻게 보여주는지 정리합니다.', xp: 80 },
  { id: 'macro-foundations-dollar', title: 'Dollar Cycle: 강달러와 약달러', description: 'DXY, 신흥국 자금 흐름, 원자재와 글로벌 위험자산의 관계를 한 번에 연결합니다.', xp: 60 },
  { id: 'macro-foundations-events', title: 'Event Calendar: CPI, FOMC, 고용지표', description: '큰 발표 전후에 변동성이 커지는 이유와 체크해야 할 지표를 정리합니다.', xp: 70 },
  { id: 'ai-economy-compute', title: 'Compute: GPU, 전력, 데이터센터', description: 'AI 성장의 병목인 컴퓨팅 자원과 관련 기업/자산군의 연결 고리를 봅니다.', xp: 90 },
  { id: 'ai-economy-productivity', title: 'Automation: 일이 재배치되는 방식', description: 'AI 자동화가 비용 구조, 조직 설계, 노동 수요에 미치는 변화를 봅니다.', xp: 80 },
  { id: 'ai-economy-data', title: 'Data Economy: 데이터가 자본이 되는 조건', description: '데이터 품질, 접근권, 모델 학습 비용이 경제적 해자를 만드는 방식을 정리합니다.', xp: 90 },
  { id: 'ai-economy-agents', title: 'AI Agents: 의사결정 자동화', description: 'AI agents가 개인 생산성, 기업 워크플로, 시장 정보 처리 속도를 어떻게 바꾸는지 봅니다.', xp: 90 },
  { id: 'risk-thinking-probability', title: 'Probabilistic Thinking: 확률로 보기', description: '확신 대신 가능성의 범위, base rate, 시나리오를 기준으로 판단합니다.', xp: 90 },
  { id: 'risk-thinking-second-order', title: 'Second-Order Thinking: 다음 반응 보기', description: '첫 번째 뉴스보다 그 뉴스가 만들 행동, 정책, 자금 흐름을 추적합니다.', xp: 80 },
  { id: 'risk-thinking-bias', title: 'Cognitive Bias: 내 판단의 왜곡 찾기', description: '확증편향, 최신성 편향, 손실회피가 macro 판단을 흐리는 방식을 점검합니다.', xp: 80 },
  { id: 'risk-thinking-risk-management', title: 'Risk Management: 틀릴 조건을 먼저 쓰기', description: '판단하기 전에 무효화 조건, 관찰 지표, 행동 한계를 정리합니다.', xp: 100 },
]

const todaysReflectionPrompts = [
  'What stood out to you today?',
  'What feels worth paying attention to?',
  'What would you like to understand more clearly?',
]

const savedAssumptions: SavedAssumption[] = [
  { assumption: 'I want to understand how AI spending connects to the wider economy.', revisit: 'Revisit after the next AI economy brief.' },
  { assumption: 'Headlines feel easier when I separate facts from reactions.', revisit: 'Revisit after the next daily brief.' },
  { assumption: 'A short note can be enough for today.', revisit: 'Revisit when a theme appears again.' },
]

function getLearningLevel(totalXp: number) {
  const level = Math.floor(totalXp / 250) + 1
  return {
    level,
    title: level >= 5 ? 'Macro Operator' : level >= 3 ? 'Context Builder' : 'Cadet Analyst',
  }
}

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

interface TickerItem {
  symbol: string
  name: string
  price: string
  change: string
  up: boolean
}

interface TrendItem {
  keyword: string
  count: number
  category: string
  change: string
  emoji: string
}

const GUEST_LESSONS = [
  {
    id: 'macro-foundations-rates',
    title: 'Rates: 금리와 할인율',
    description: '금리가 오르거나 내릴 때 주식, 장기채, 성장자산이 다르게 반응하는 이유를 배웁니다.',
    emoji: '📈',
    tag: '매크로 기초',
  },
  {
    id: 'macro-foundations-liquidity',
    title: 'Liquidity: 유동성의 흐름',
    description: '중앙은행, 달러 유동성이 위험자산 가격에 미치는 영향을 정리합니다.',
    emoji: '💧',
    tag: '매크로 기초',
  },
  {
    id: 'risk-thinking-probability',
    title: 'Probabilistic Thinking',
    description: '확신 대신 가능성의 범위, base rate, 시나리오를 기준으로 판단합니다.',
    emoji: '🎯',
    tag: '사고 프레임',
  },
]

const CHANGE_BADGE: Record<string, { label: string; color: string }> = {
  up: { label: '🔺 상승', color: 'text-rose-400' },
  down: { label: '🔻 하락', color: 'text-blue-400' },
  new: { label: '🆕 신규', color: 'text-amber-300' },
  same: { label: '— 유지', color: 'text-gray-500' },
}

function GuestDashboard() {
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [tickerLoading, setTickerLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(true)

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  useEffect(() => {
    async function fetchTickers() {
      try {
        const res = await fetch('/api/ticker')
        if (!res.ok) throw new Error('Ticker fetch failed')
        const data = await res.json()
        setTickers((data.tickers || []).slice(0, 10))
      } catch {
        setTickers([])
      } finally {
        setTickerLoading(false)
      }
    }

    async function fetchTrends() {
      try {
        const res = await fetch('/api/trends')
        if (!res.ok) throw new Error('Trends fetch failed')
        const data = await res.json()
        setTrends(data.trends || [])
      } catch {
        setTrends([])
      } finally {
        setTrendLoading(false)
      }
    }

    fetchTickers()
    fetchTrends()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b10] text-white">
      <div className="bf-intelligence-grid absolute inset-0 opacity-12" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,145,178,0.055),transparent_22%),linear-gradient(90deg,rgba(15,23,42,0.72),transparent_58%,rgba(16,185,129,0.035))]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Hero header */}
        <section className="bf-reading-panel rounded-lg p-6 backdrop-blur-xl lg:p-8">
          <p className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-sm font-medium text-cyan-100">
            <Compass className="h-4 w-4" />
            BeyondFleet Overview
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
            시장의 흐름을 한눈에.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-gray-400">
            {today} · 오늘의 시장, 트렌딩 키워드, 추천 학습을 둘러보세요.
          </p>
        </section>

        {/* ── Section A: 오늘의 시장 맥락 ── */}
        <section className="mt-8">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg font-semibold text-white">오늘의 시장 맥락</h2>
            <span className="ml-auto text-xs text-gray-500">학습 참고용 · 주요 자산 흐름</span>
          </div>

          {tickerLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.03]" />
              ))}
            </div>
          ) : tickers.length === 0 ? (
            <p className="text-sm text-gray-500">시장 데이터를 불러올 수 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {tickers.map((t) => (
                <div
                  key={t.symbol}
                  className="group relative rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-cyan-200/25 hover:bg-cyan-200/[0.04]"
                >
                  <p className="text-xs font-bold tracking-wider text-gray-300 group-hover:text-cyan-100">
                    {t.symbol}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{t.price}</p>
                  <p className={`mt-1 text-xs font-medium ${t.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.change}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section B: 🔥 트렌딩 키워드 ── */}
        <section className="mt-8">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-200" />
            <h2 className="text-lg font-semibold text-white">🔥 트렌딩 키워드</h2>
          </div>

          {trendLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 w-28 animate-pulse rounded-full border border-white/[0.06] bg-white/[0.03]" />
              ))}
            </div>
          ) : trends.length === 0 ? (
            <p className="text-sm text-gray-500">트렌딩 데이터를 불러올 수 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {trends.map((trend) => {
                const badge = CHANGE_BADGE[trend.change] || CHANGE_BADGE.same
                return (
                  <Link
                    key={trend.keyword}
                    href={`/ai-search?q=${encodeURIComponent(trend.keyword)}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm transition hover:border-amber-200/30 hover:bg-amber-200/[0.06]"
                  >
                    <span className="text-base">{trend.emoji}</span>
                    <span className="font-medium text-gray-200 group-hover:text-white">{trend.keyword}</span>
                    <span className={`text-[10px] font-semibold ${badge.color}`}>{badge.label}</span>
                    <Search className="ml-1 h-3 w-3 text-gray-500 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Section C: 📚 추천 학습 ── */}
        <section className="mt-8">
          <div className="mb-5 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-200" />
            <h2 className="text-lg font-semibold text-white">📚 추천 학습</h2>
            <span className="ml-auto text-xs text-gray-500">시작하기 좋은 레슨</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {GUEST_LESSONS.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.id}`}
                className="group rounded-lg border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-emerald-200/25 hover:bg-emerald-200/[0.04]"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{lesson.emoji}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-gray-400">
                    {lesson.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-white group-hover:text-emerald-100">
                  {lesson.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
                  {lesson.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 opacity-0 transition group-hover:opacity-100">
                  학습 시작 <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section D: CTA Banner ── */}
        <section className="mt-10 mb-4">
          <div className="relative overflow-hidden rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-200/[0.08] via-transparent to-emerald-200/[0.06] p-8 text-center sm:p-10">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-200/25 bg-cyan-200/[0.1]">
                <Lock className="h-6 w-6 text-cyan-100" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">
                로그인하면 나만의 맞춤 대시보드를 볼 수 있어요!
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-400">
                개인화된 추천, 학습 진도 추적, 리플렉션 노트, 포트폴리오 인사이트까지 — 로그인하고 나만의 공간을 만들어보세요.
              </p>
              <Link
                href="/auth/login"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-100 px-6 py-3 text-sm font-semibold text-[#071018] transition hover:bg-white"
              >
                로그인하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; membership_tier: MembershipTier } | null>(null)
  const [loading, setLoading] = useState(true)
  const [learningWidget, setLearningWidget] = useState<LearningWidget | null>(null)
  const [personalization, setPersonalization] = useState<DashboardPersonalization | null>(null)
  const [recentReflections, setRecentReflections] = useState<SavedReflection[]>([])
  const [readingCompletionCount, setReadingCompletionCount] = useState(0)
  const [assumptionRows, setAssumptionRows] = useState<SavedAssumption[]>([])

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, membership_tier')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            display_name: profileData.display_name,
            membership_tier: normalizeMembershipTier(profileData.membership_tier),
          })
        }
      }

      setLoading(false)
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!user) return
    const currentUserId = user.id

    async function fetchLearningWidget() {
      try {
        const [{ data: progress }, { data: stats }] = await Promise.all([
          supabase
            .from('learning_progress')
            .select('lesson_id, completed')
            .eq('user_id', currentUserId),
          supabase
            .from('learning_user_stats')
            .select('total_xp, current_level, current_streak')
            .eq('user_id', currentUserId)
            .single(),
        ])

        const completedIds = new Set((progress || []).filter((row) => row.completed).map((row) => row.lesson_id))
        const completedCount = completedIds.size
        const totalXp = typeof stats?.total_xp === 'number'
          ? stats.total_xp
          : DASHBOARD_LESSONS.reduce((sum, lesson) => completedIds.has(lesson.id) ? sum + lesson.xp : sum, 0)
        const level = getLearningLevel(totalXp)
        const nextLesson = DASHBOARD_LESSONS.find((lesson) => !completedIds.has(lesson.id)) || DASHBOARD_LESSONS[0]
        const progressPercent = Math.round((completedCount / DASHBOARD_LESSONS.length) * 100)

        setLearningWidget({
          title: nextLesson.title,
          description: nextLesson.description,
          progress: progressPercent,
          totalXp,
          level: stats?.current_level || level.level,
          levelTitle: level.title,
          completedCount,
          totalLessons: DASHBOARD_LESSONS.length,
          currentStreak: stats?.current_streak || 0,
        })
      } catch {
        const saved = localStorage.getItem(`beyondfleet:learn-progress:v1:${currentUserId}`)
        const completedIds = new Set(saved ? JSON.parse(saved) as string[] : [])
        const completedCount = completedIds.size
        const totalXp = DASHBOARD_LESSONS.reduce((sum, lesson) => completedIds.has(lesson.id) ? sum + lesson.xp : sum, 0)
        const level = getLearningLevel(totalXp)
        const nextLesson = DASHBOARD_LESSONS.find((lesson) => !completedIds.has(lesson.id)) || DASHBOARD_LESSONS[0]
        const progressPercent = Math.round((completedCount / DASHBOARD_LESSONS.length) * 100)

        setLearningWidget({
          title: nextLesson.title,
          description: nextLesson.description,
          progress: progressPercent,
          totalXp,
          level: level.level,
          levelTitle: level.title,
          completedCount,
          totalLessons: DASHBOARD_LESSONS.length,
          currentStreak: Number(localStorage.getItem(`beyondfleet:learn-progress:v1:${currentUserId}:streak`) || 0),
        })
      }
    }

    async function fetchPersonalization() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch('/api/recommendations', { headers })
        if (!response.ok) return

        const payload = await response.json()
        setPersonalization(payload)
      } catch {
        setPersonalization(null)
      }
    }

    async function fetchReflectionActivity() {
      await syncGuestReflectionActivity(supabase, currentUserId)

      try {
        const localReflections = JSON.parse(
          localStorage.getItem(`beyondfleet:daily-reflections:v1:${currentUserId}`) || '[]'
        ) as SavedReflection[]
        const localIdeas = JSON.parse(
          localStorage.getItem(`beyondfleet:idea-journal:v1:${currentUserId}`) || '[]'
        ) as SavedReflection[]
        const localAssumptions = JSON.parse(
          localStorage.getItem(`beyondfleet:saved-assumptions:v1:${currentUserId}`) || '[]'
        ) as Array<{ assumption: string; revisit_trigger?: string; created_at?: string }>
        const localCompletions = JSON.parse(
          localStorage.getItem(`beyondfleet:reading-completions:v1:${currentUserId}`) || '[]'
        ) as Array<{ brief_id: string }>

        const localReflectionRows = [...localReflections, ...localIdeas]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        setRecentReflections(localReflectionRows)
        setAssumptionRows(localAssumptions.slice(0, 5).map((item) => ({
          assumption: item.assumption,
          revisit: item.revisit_trigger || 'Revisit when the next brief changes the evidence.',
          created_at: item.created_at,
        })))
        setReadingCompletionCount(localCompletions.length)
      } catch {
        setRecentReflections([])
        setReadingCompletionCount(0)
      }

      try {
        const [{ data: reflections }, { data: completions }, { data: assumptions }] = await Promise.all([
          supabase
            .from('daily_reflections')
            .select('prompt, content, created_at, insight_type')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('reading_completions')
            .select('brief_id')
            .eq('user_id', currentUserId)
            .limit(30),
          supabase
            .from('saved_assumptions')
            .select('assumption, revisit_trigger')
            .eq('user_id', currentUserId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (reflections?.length) {
          setRecentReflections(reflections as SavedReflection[])
        }
        if (completions) {
          setReadingCompletionCount(completions.length)
        }
        if (assumptions?.length) {
          setAssumptionRows(assumptions.map((item) => ({
            assumption: item.assumption,
            revisit: item.revisit_trigger || 'Revisit when the next brief changes the evidence.',
          })))
        }
      } catch {
        // Reflection infrastructure may not be migrated yet.
      }
    }

    fetchLearningWidget()
    fetchPersonalization()
    fetchReflectionActivity()
  }, [user])

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const firstRecommendation = personalization?.continueQueue[0] || personalization?.recommendedLessons[0]
  const focusTitle = firstRecommendation?.title || learningWidget?.title || 'Read today’s brief slowly'
  const focusReason = firstRecommendation?.reason || learningWidget?.description || 'Start with one brief, one simple idea, and one short note. You do not need to understand everything at once.'
  const userTier = profile?.membership_tier || 'cadet'
  const latestReflection = recentReflections[0]
  const visibleAssumptions = assumptionRows.length > 0 ? assumptionRows : savedAssumptions
  const continuitySignals = useMemo(() => {
    if (personalization?.continuitySignals?.length) return personalization.continuitySignals

    return buildContinuitySignals([
      ...recentReflections.map((reflection) => ({
        title: reflection.title,
        prompt: reflection.prompt,
        content: reflection.content,
        created_at: reflection.created_at,
      })),
      ...visibleAssumptions.map((assumption) => ({
        assumption: assumption.assumption,
        revisit: assumption.revisit,
        created_at: assumption.created_at,
      })),
    ], 1)
  }, [personalization, recentReflections, visibleAssumptions])
  const opposingLens = personalization?.opposingPerspectives?.[0] || firstRecommendation
    ? {
      label: personalization?.opposingPerspectives?.[0]?.label || 'Another way to look at it',
      prompt: personalization?.opposingPerspectives?.[0]?.prompt || firstRecommendation?.opposingPerspective || 'What would make you pause before accepting this idea?',
    }
    : null
  const primaryContinuity = continuitySignals[0]
  const activeAssumption = visibleAssumptions[0]
  const quietTopic = personalization?.suggestedTopics?.[0]
  const quietBrief = personalization?.recommendedBriefs?.[0]
  const focusHref = firstRecommendation ? `/learn/${firstRecommendation.id}` : '/briefs'
  const quietRecognitionTitle = recentReflections.length > 0
    ? 'Your notes are starting to connect.'
    : 'Progress can start with one small note.'
  const quietRecognitionBody = recentReflections.length > 0
    ? `${recentReflections.length} recent notes and ${visibleAssumptions.length} ideas are available to revisit. This is continuity, not a score.`
    : 'Read one brief, carry one question, and leave one short note when it feels useful. Breaks do not erase the rhythm.'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b10] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border border-cyan-200/20 border-t-cyan-200 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <GuestDashboard />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b10] text-white">
      <div className="bf-intelligence-grid absolute inset-0 opacity-12" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,145,178,0.055),transparent_22%),linear-gradient(90deg,rgba(15,23,42,0.72),transparent_58%,rgba(16,185,129,0.035))]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <section className="bf-reading-panel rounded-lg p-6 backdrop-blur-xl lg:p-8">
          <p className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-sm font-medium text-cyan-100">
            <Compass className="h-4 w-4" />
            Market Context
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
            Welcome back, {profile?.display_name || user.email?.split('@')[0]}.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-gray-400">
            {today} · one brief, one idea, one note.
          </p>
          <div className="mt-5 hidden flex-wrap gap-3 text-xs text-gray-500 sm:flex">
            <span>{recentReflections.length} notes saved</span>
            <span>{readingCompletionCount} briefs opened</span>
            <span>{MEMBERSHIP_TIER_LABELS[userTier]}</span>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-lg border border-cyan-200/14 bg-cyan-200/[0.035] p-6 lg:p-8">
            <p className="flex items-center gap-2 text-sm font-medium text-cyan-100">
              <Sparkles className="h-4 w-4" />
              오늘의 학습 포인트 (Today&apos;s gentle focus)
            </p>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
              {focusTitle}
            </h2>
            <p className="mt-5 max-w-[64ch] text-base leading-8 text-gray-300">{focusReason}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={focusHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-100 px-4 py-3 text-sm font-semibold text-[#071018] transition hover:bg-white"
              >
                Open today&apos;s focus
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/briefs"
                className="inline-flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold text-gray-400 transition hover:text-cyan-100"
              >
                Read the brief first
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.075] bg-white/[0.026] p-6 lg:p-7">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <NotebookPen className="h-4 w-4 text-amber-200" />
              오늘의 질문과 사색 (Quiet notes & thoughts)
            </div>
            {primaryContinuity ? (
              <>
                <p className="text-sm font-semibold text-cyan-100">{primaryContinuity.label}</p>
                <p className="mt-3 text-sm leading-7 text-gray-300">{primaryContinuity.message}</p>
                <p className="mt-5 rounded-lg border border-white/[0.075] bg-black/15 p-3 text-xs leading-5 text-gray-400">
                  {primaryContinuity.revisitPrompt}
                </p>
              </>
            ) : latestReflection ? (
              <>
                <p className="text-xs leading-5 text-amber-100/80">{latestReflection.prompt}</p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-200">{latestReflection.content}</p>
                <p className="mt-3 text-xs text-gray-500">{formatTimeAgo(latestReflection.created_at)}</p>
              </>
            ) : (
              <div className="space-y-3">
                {todaysReflectionPrompts.slice(0, 1).map((prompt) => (
                  <p key={prompt} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-gray-300">
                    {prompt}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/[0.075] bg-white/[0.026] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-200">오늘의 권장 레슨 (Recommended step)</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{learningWidget?.title || 'Macro Foundations'}</h2>
              </div>
              <BookOpen className="h-5 w-5 text-emerald-200" />
            </div>
            <p className="text-sm leading-7 text-gray-400">
              {learningWidget?.description || 'Start with the core concept that makes daily briefs easier to read.'}
            </p>
            <p className="mt-3 text-xs text-gray-500">
              No score here. Continue only when it feels useful.
            </p>
            <Link
              href={focusHref}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200/25 bg-emerald-200/[0.07] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-200/[0.12]"
            >
              Continue learning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-white/[0.075] bg-white/[0.026] p-6">
            <p className="text-sm font-medium text-amber-200">내가 다시 확인해야 할 가정 (One idea to revisit)</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {activeAssumption?.assumption || quietTopic?.label || 'Start with one idea'}
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              {activeAssumption?.revisit || opposingLens?.prompt || 'After today’s brief, save one idea you may want to understand better.'}
            </p>
            {opposingLens && (
              <p className="mt-5 border-l border-white/10 pl-4 text-xs leading-5 text-gray-500">
                Another way to look at it: {opposingLens.prompt}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-white/[0.06] bg-white/[0.018] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Continuity</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {quietRecognitionTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                {quietRecognitionBody}
              </p>
              {quietBrief && (
                <p className="mt-4 max-w-2xl border-l border-white/10 pl-4 text-xs leading-5 text-gray-500">
                  Optional next read: {quietBrief.title}
                </p>
              )}
            </div>
            <Link href="/briefs" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-cyan-100">
              Open brief reader
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
