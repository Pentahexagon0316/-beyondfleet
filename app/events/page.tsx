'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Flame,
  Gavel,
  Gift,
  Globe,
  Megaphone,
  MessageCircle,
  Mic2,
  Rocket,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────
type EventCategory = 'all' | 'webinar' | 'ama' | 'auction' | 'challenge' | 'special'
type EventStatus = 'upcoming' | 'live' | 'ended'

interface EventItem {
  id: string
  title: string
  description: string
  category: EventCategory
  status: EventStatus
  date: string
  time: string
  duration: string
  host: string
  hostAvatar: string
  participants: number
  maxParticipants?: number
  reward?: string
  tier?: string
  image?: string
  link?: string
  tags: string[]
  startAt: string
  endAt: string
}

interface AuctionItem {
  id: string
  title: string
  description: string
  currentBid: number
  currency: string
  bidCount: number
  endsAt: Date
  image: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  seller: string
}

// ─── Demo Data ────────────────────────────────────────────────────
const CATEGORIES: Array<{ id: EventCategory; label: string; icon: typeof Calendar; color: string }> = [
  { id: 'all', label: '전체', icon: Globe, color: 'text-white' },
  { id: 'webinar', label: '웨비나', icon: Video, color: 'text-cyan-400' },
  { id: 'ama', label: 'AMA', icon: Mic2, color: 'text-violet-400' },
  { id: 'challenge', label: '챌린지', icon: Target, color: 'text-emerald-400' },
  { id: 'special', label: '특별 이벤트', icon: Sparkles, color: 'text-pink-400' },
]

function getNextDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

const EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    title: '📊 이번 주 매크로 브리핑',
    description: '금주 FOMC 의사록 공개 전 주요 지표 해석과 시장 전망을 함께 분석합니다.',
    category: 'webinar',
    status: 'upcoming',
    date: '2026-05-31',
    time: '20:00 KST',
    duration: '60분',
    host: 'Captain Nova',
    hostAvatar: '🧑‍🚀',
    participants: 147,
    reward: '+50 XP',
    tags: ['FOMC', '금리', '매크로'],
    startAt: '2026-05-31T20:00:00+09:00',
    endAt: '2026-05-31T21:00:00+09:00',
  },
  {
    id: 'ev-2',
    title: '💎 주간 리워드 챌린지 — 프로 코스 1개월 이용권 & 배지 패키지',
    description: 'BeyondFleet 우수 활동 회원들을 위한 주간 챌린지 응모! 선정 시 프로 코스 1개월 무료 수강권과 특별 학습 배지 혜택이 주어집니다.',
    category: 'auction',
    status: 'upcoming',
    date: '2026-06-01',
    time: '19:00 KST',
    duration: '24시간',
    host: 'BeyondFleet',
    hostAvatar: '🚀',
    participants: 23,
    reward: '프로 1개월권 + 학습 배지',
    tier: 'navigator',
    tags: ['학습챌린지', '리워드', '프로코스'],
    startAt: '2026-06-01T19:00:00+09:00',
    endAt: '2026-06-02T19:00:00+09:00',
  },
  {
    id: 'ev-3',
    title: '🎤 AMA — AI가 바꿀 2026년 하반기 경제 전망',
    description: 'AI 경제 전문가와 함께 하반기 핵심 경제 전망을 짚어봅니다. 실시간 Q&A 진행.',
    category: 'ama',
    status: 'upcoming',
    date: '2026-06-03',
    time: '21:00 KST',
    duration: '90분',
    host: 'Dr. Quantum',
    hostAvatar: '🤖',
    participants: 89,
    maxParticipants: 200,
    reward: '+100 XP',
    tags: ['AI', '경제전망', 'Q&A'],
    startAt: '2026-06-03T21:00:00+09:00',
    endAt: '2026-06-03T22:30:00+09:00',
  },
  {
    id: 'ev-4',
    title: '🏆 7일 챌린지 — 매일 1레슨 완주 (지금 진행 중!)',
    description: '7일 연속 레슨 완료 시 특별 배지 + 200 XP 보상! 지금 참여하세요.',
    category: 'challenge',
    status: 'live',
    date: '2026-05-31',
    time: '언제든',
    duration: '7일',
    host: 'BeyondFleet',
    hostAvatar: '⭐',
    participants: 312,
    reward: '🏅 7일 연속 배지 + 200 XP',
    tags: ['챌린지', '학습', '배지'],
    startAt: '2026-05-28T00:00:00+09:00',
    endAt: '2026-06-04T23:59:59+09:00',
  },
  {
    id: 'ev-5',
    title: '🌟 특별 이벤트 — 경제 DNA 오픈 기념',
    description: '경제 DNA 프로필을 공유하면 추첨을 통해 프로 코스 3개월 무료 이용권을 드립니다!',
    category: 'special',
    status: 'upcoming',
    date: '2026-06-02',
    time: '00:00 KST',
    duration: '5일',
    host: 'BeyondFleet',
    hostAvatar: '🧬',
    participants: 456,
    reward: '프로 코스 3개월 무료',
    tags: ['경제DNA', '프로모션', '무료'],
    startAt: '2026-06-02T00:00:00+09:00',
    endAt: '2026-06-07T23:59:59+09:00',
  },
  {
    id: 'ev-6',
    title: '📊 웨비나 — 온체인 데이터 읽는 법',
    description: '비트코인 온체인 지표(MVRV, SOPR, 거래소 잔고)를 활용한 실전 분석법을 배웁니다.',
    category: 'webinar',
    status: 'upcoming',
    date: '2026-06-05',
    time: '20:00 KST',
    duration: '75분',
    host: 'Navigator Kim',
    hostAvatar: '📡',
    participants: 65,
    maxParticipants: 150,
    reward: '+80 XP',
    tier: 'navigator',
    tags: ['온체인', '비트코인', '분석'],
    startAt: '2026-06-05T20:00:00+09:00',
    endAt: '2026-06-05T21:15:00+09:00',
  },
  {
    id: 'ev-7',
    title: '🎁 학습 리워드 응모 — 1:1 멘토링 세션 신청권',
    description: '전문 애널리스트와의 1:1 의사결정 훈련 화상 멘토링 세션(60분) 신청 챌린지! 보유 XP를 사용하여 응모해 보세요.',
    category: 'auction',
    status: 'upcoming',
    date: '2026-06-04',
    time: '18:00 KST',
    duration: '48시간',
    host: 'BeyondFleet',
    hostAvatar: '🎫',
    participants: 18,
    reward: '1:1 멘토링 신청권',
    tags: ['멘토링', '리워드', '의사결정'],
    startAt: '2026-06-04T18:00:00+09:00',
    endAt: '2026-06-06T18:00:00+09:00',
  },
  {
    id: 'ev-8',
    title: '🔴 [종료] 5월 30일 매크로 기초 강좌',
    description: '이 이벤트는 5월 30일에 완료되어 과거 내역으로 분류됩니다.',
    category: 'webinar',
    status: 'ended',
    date: '2026-05-30',
    time: '20:00 KST',
    duration: '60분',
    host: 'Captain Nova',
    hostAvatar: '🧑‍🚀',
    participants: 94,
    reward: '+30 XP',
    tags: ['매크로', '기초'],
    startAt: '2026-05-30T20:00:00+09:00',
    endAt: '2026-05-30T21:00:00+09:00',
  },
]

const AUCTION_ITEMS: AuctionItem[] = [
  {
    id: 'auc-1',
    title: '프로 코스 1개월 이용권',
    description: 'BeyondFleet 핵심 경제 개념 및 시나리오 훈련 프로 코스 1개월 수강권입니다.',
    currentBid: 1850,
    currency: 'XP',
    bidCount: 12,
    endsAt: new Date(Date.now() + 86400000),
    image: '🎟️',
    rarity: 'legendary',
    seller: 'BeyondFleet Official',
  },
  {
    id: 'auc-2',
    title: '1:1 화상 멘토링 신청권',
    description: '경제 분석 및 의사결정 프레임워크 훈련을 돕는 전문가 1:1 화상 멘토링(60분) 신청권입니다.',
    currentBid: 1400,
    currency: 'XP',
    bidCount: 7,
    endsAt: new Date(Date.now() + 172800000),
    image: '🎓',
    rarity: 'epic',
    seller: 'BeyondFleet Official',
  },
  {
    id: 'auc-3',
    title: '심화 리서치 리포트 PDF 다운로드권',
    description: '거시경제 흐름과 산업 메커니즘을 심도 있게 분석한 핵심 연구 리포트 PDF 파일 다운로드 권한입니다.',
    currentBid: 950,
    currency: 'XP',
    bidCount: 5,
    endsAt: new Date(Date.now() + 259200000),
    image: '📂',
    rarity: 'rare',
    seller: 'Captain Nova',
  },
]

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  legendary: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'LEGENDARY' },
  epic: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', label: 'EPIC' },
  rare: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', label: 'RARE' },
  common: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'COMMON' },
}

// ─── Countdown Hook ───────────────────────────────────────────────
function useCountdown(endDate: Date | string) {
  const [timeLeft, setTimeLeft] = useState('계산 중...')

  useEffect(() => {
    const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate
    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      setTimeLeft('유효하지 않은 날짜')
      return
    }

    function update() {
      const diff = targetDate.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('종료됨'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${d > 0 ? `${d}일 ` : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endDate])

  return timeLeft
}

// ─── Auction Card ─────────────────────────────────────────────────
function AuctionCard({ item }: { item: AuctionItem }) {
  const timeLeft = useCountdown(item.endsAt)
  const rarity = RARITY_STYLES[item.rarity] || RARITY_STYLES.common

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${rarity.border} ${rarity.bg} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-${item.rarity === 'legendary' ? 'amber' : 'violet'}-500/10`}>
      {/* Rarity badge */}
      <div className={`absolute right-3 top-3 rounded-full border ${rarity.border} bg-black/40 px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${rarity.text}`}>
        {rarity.label}
      </div>

      {/* Image/emoji */}
      <div className="mb-4 flex h-20 items-center justify-center text-5xl">
        {item.image}
      </div>

      <h3 className="text-lg font-bold text-white">{item.title}</h3>
      <p className="mt-1 text-sm text-gray-400 line-clamp-2">{item.description}</p>

      {/* Current bid */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase text-gray-500">현재 최고 응모</p>
          <p className="text-xl font-bold text-white">{item.currentBid} <span className="text-sm text-gray-400">{item.currency}</span></p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase text-gray-500">남은 시간</p>
          <p className="font-mono text-sm font-bold text-amber-400">{timeLeft}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{item.bidCount}명 응모</span>
        <span>{item.seller}</span>
      </div>

      <Link
        href="/journal/challenges"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
      >
        <Trophy className="h-4 w-4" />
        챌린지 응모하기
      </Link>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────
function EventCard({ event }: { event: EventItem }) {
  const isLive = event.status === 'live'
  const categoryInfo = CATEGORIES.find(c => c.id === event.category) || CATEGORIES[0]
  const CatIcon = categoryInfo.icon

  const eventDate = new Date(event.date)
  const dateStr = eventDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })

  return (
    <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
      isLive
        ? 'border-red-500/40 bg-red-500/5 shadow-lg shadow-red-500/5'
        : 'border-white/[0.08] bg-white/[0.025] hover:border-white/15'
    }`}>
      {/* Live indicator */}
      {isLive && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-bold text-red-400">LIVE</span>
        </div>
      )}

      <div className="p-5">
        {/* Category + date */}
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span className={`flex items-center gap-1 ${categoryInfo.color}`}>
            <CatIcon className="h-3.5 w-3.5" />
            {categoryInfo.label}
          </span>
          <span className="text-gray-500">{dateStr} · {event.time}</span>
          <span className="text-gray-600">{event.duration}</span>
        </div>

        <h3 className="text-base font-semibold text-white sm:text-lg">{event.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-400 line-clamp-2">{event.description}</p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.tags.map(tag => (
            <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-gray-400">#{tag}</span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>{event.hostAvatar}</span>
              {event.host}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.participants}명{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
            </span>
          </div>

          {event.reward && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              🎁 {event.reward}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4">
          {isLive ? (
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/30">
              <Zap className="h-4 w-4" />
              지금 참여하기
            </button>
          ) : event.category === 'auction' ? (
            <Link
              href="/journal/challenges"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              <Trophy className="h-4 w-4" />
              리워드 응모하기
            </Link>
          ) : (
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-sm font-semibold text-gray-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300">
              <Calendar className="h-4 w-4" />
              알림 설정하기
            </button>
          )}
        </div>
      </div>

      {/* Tier badge */}
      {event.tier && (
        <div className="absolute left-3 top-3 rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold text-violet-400">
          {event.tier.toUpperCase()}+
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState<EventCategory>('all')
  const [user, setUser] = useState<any>(null)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => setUser(user))
      .catch(err => console.error('Error fetching user in events:', err))
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(interval)
  }, [])

  const getEventStatus = (startAtStr: string, endAtStr: string): EventStatus => {
    if (!now) return 'upcoming' // SSR/초기 렌더링 대비 기본값
    const startAt = new Date(startAtStr)
    const endAt = new Date(endAtStr)
    if (now < startAt) return 'upcoming'
    if (now >= startAt && now <= endAt) return 'live'
    return 'ended'
  }

  const computedEvents = EVENTS.map(e => ({
    ...e,
    status: getEventStatus(e.startAt, e.endAt)
  }))

  // Filter out any auction events to prevent them from showing
  const filteredEvents = (activeCategory === 'all'
    ? computedEvents
    : computedEvents.filter(e => e.category === activeCategory)
  ).filter(e => e.category !== 'auction')

  // 실제 계산된 라이브 이벤트만 노출 (경매 카테고리 제외)
  const liveEvents = computedEvents.filter(e => e.status === 'live' && e.category !== 'auction')
  
  // 실제 계산된 다가올 이벤트만 노출 (종료 및 라이브 제외, 경매 카테고리 제외)
  const upcomingEvents = filteredEvents.filter(e => e.status === 'upcoming' && e.category !== 'auction')

  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">

        {/* ─── Hero ─── */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/10 via-transparent to-amber-500/10 p-8 sm:p-10">
          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-300">
              <Megaphone className="h-4 w-4" />
              학습 챌린지 & 리워드
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              함께 성장하는 <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">경제 커뮤니티</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-400">
              라이브 웨비나, AMA, 학습 챌린지, 특별 멤버십 리워드까지 — BeyondFleet에서 일어나는 모든 이벤트를 한눈에 확인하세요.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>
                {liveEvents.length > 0 ? `${liveEvents.length}개 라이브 중` : '진행 중인 이벤트 없음'}
              </span>
              <span>·</span>
              <span>{upcomingEvents.length}개 예정</span>
            </div>
          </div>
          {/* Decorative */}
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        {/* ─── Category Filter ─── */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:border-white/15 hover:text-gray-300'
                }`}
              >
                <CatIcon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* ─── Live Events ─── */}
        {liveEvents.length > 0 && (activeCategory === 'all' || activeCategory === 'webinar') && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-400">
              <Flame className="h-4 w-4" />
              지금 라이브
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {liveEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Social Contribution Banner ─── */}
        <section className="mb-10 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center">
          <p className="text-sm text-cyan-300 font-medium">
            BeyondFleet는 향후 교육 접근성 확대를 위한 사회공헌 프로그램을 검토하고 있습니다.
          </p>
        </section>

        {/* ─── Upcoming Events ─── */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-cyan-400">
            <Calendar className="h-4 w-4" />
            예정된 이벤트
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
              <p className="text-4xl">🔭</p>
              <p className="mt-3 text-gray-400">이 카테고리에 예정된 이벤트가 없습니다</p>
              <button
                onClick={() => setActiveCategory('all')}
                className="mt-3 text-sm text-cyan-400 transition hover:text-cyan-300"
              >
                전체 이벤트 보기
              </button>
            </div>
          )}
        </section>

        {/* ─── How It Works ─── */}
        <section className="mb-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-white">🎯 이벤트 참여 방법</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-2xl">
                1️⃣
              </div>
              <h3 className="font-semibold text-white">이벤트 선택</h3>
              <p className="mt-1 text-sm text-gray-400">관심 있는 웨비나, AMA, 챌린지를 골라보세요</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-2xl">
                2️⃣
              </div>
              <h3 className="font-semibold text-white">알림 설정</h3>
              <p className="mt-1 text-sm text-gray-400">시작 전 알림을 받고 놓치지 마세요</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
                3️⃣
              </div>
              <h3 className="font-semibold text-white">보상 획득</h3>
              <p className="mt-1 text-sm text-gray-400">참여하면 XP, 배지, 특별 보상을 받아요</p>
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section className="overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-transparent to-amber-500/10 p-6 sm:p-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-lg font-bold text-white">🧬 경제 DNA 오픈 기념 이벤트</h2>
              <p className="mt-1 text-sm text-gray-400">나만의 투자자 유형을 발견하고 공유하면 프로 코스 3개월 무료!</p>
            </div>
            <Link
              href="/dna"
              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-violet-500/20 px-6 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/30"
            >
              <Sparkles className="h-4 w-4" />
              경제 DNA 시작하기
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
