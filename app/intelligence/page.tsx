'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  BookOpen,
  Shield,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   1. TYPES
   ───────────────────────────────────────────── */

interface CountryData {
  country: string
  flag: string
  gdp: string
  gdpTrend: 'up' | 'down' | 'flat'
  cpi: string
  cpiTrend: 'up' | 'down' | 'flat'
  rate: string
  rateTrend: 'up' | 'down' | 'flat'
  extra: { label: string; value: string; trend: 'up' | 'down' | 'flat' }
  color: string
  summary: string
}

interface IndicatorItem {
  name: string
  value: string
  prev: string
  trend: 'up' | 'down' | 'flat'
  meaning: string
}

interface IndicatorGroup {
  icon: string
  title: string
  color: string
  items: IndicatorItem[]
}

interface PrincipleCard {
  icon: string
  title: string
  subtitle: string
  description: string
  lessonLink: string
  color: string
}

interface TickerItem {
  symbol: string
  name: string
  price: string
  change: string
  up: boolean
}

/* ─────────────────────────────────────────────
   2. STATIC DATA — World Economy Heatmap
   ───────────────────────────────────────────── */

const WORLD_ECONOMY: CountryData[] = [
  {
    country: '미국',
    flag: '🇺🇸',
    gdp: '2.4%',
    gdpTrend: 'down',
    cpi: '3.3%',
    cpiTrend: 'down',
    rate: '5.25-5.50%',
    rateTrend: 'flat',
    extra: { label: '실업률', value: '4.0%', trend: 'up' },
    color: 'from-blue-500/20 to-blue-600/5',
    summary: '성장 둔화 조짐, 물가 하락 추세 속 금리 동결 유지',
  },
  {
    country: '한국',
    flag: '🇰🇷',
    gdp: '2.1%',
    gdpTrend: 'up',
    cpi: '2.7%',
    cpiTrend: 'down',
    rate: '3.25%',
    rateTrend: 'down',
    extra: { label: 'KOSPI', value: '2,687', trend: 'up' },
    color: 'from-rose-500/20 to-rose-600/5',
    summary: '수출 회복 기반 성장, 한은 금리 인하 사이클 진입',
  },
  {
    country: '중국',
    flag: '🇨🇳',
    gdp: '4.7%',
    gdpTrend: 'down',
    cpi: '0.3%',
    cpiTrend: 'flat',
    rate: '3.45%',
    rateTrend: 'down',
    extra: { label: 'PMI', value: '50.4', trend: 'up' },
    color: 'from-red-500/20 to-red-600/5',
    summary: '부동산 부진 지속, 제조업 PMI 확장 국면 진입',
  },
  {
    country: '일본',
    flag: '🇯🇵',
    gdp: '1.8%',
    gdpTrend: 'up',
    cpi: '2.8%',
    cpiTrend: 'up',
    rate: '0.25%',
    rateTrend: 'up',
    extra: { label: 'USD/JPY', value: '157.2', trend: 'up' },
    color: 'from-pink-500/20 to-pink-600/5',
    summary: '마이너스 금리 탈출, 엔화 약세와 수입 물가 상승',
  },
  {
    country: '유럽(EU)',
    flag: '🇪🇺',
    gdp: '0.7%',
    gdpTrend: 'up',
    cpi: '2.4%',
    cpiTrend: 'down',
    rate: '4.25%',
    rateTrend: 'down',
    extra: { label: 'EUR/USD', value: '1.084', trend: 'down' },
    color: 'from-indigo-500/20 to-indigo-600/5',
    summary: 'ECB 금리 인하 개시, 독일 경기 부진 vs 남유럽 회복',
  },
]

/* ─────────────────────────────────────────────
   3. STATIC DATA — Key Economic Indicators
   ───────────────────────────────────────────── */

const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    icon: '💰',
    title: '금리 (Interest Rates)',
    color: 'border-amber-400/30',
    items: [
      { name: '미국 기준금리', value: '5.25-5.50%', prev: '5.25-5.50%', trend: 'flat', meaning: '연준 동결 유지 — 인하 시기 불확실' },
      { name: '한국 기준금리', value: '3.25%', prev: '3.50%', trend: 'down', meaning: '한은 인하 사이클 진입' },
      { name: 'US 10Y 국채', value: '4.42%', prev: '4.38%', trend: 'up', meaning: '장기 성장·물가 기대 반영' },
      { name: 'US 2Y 국채', value: '4.88%', prev: '4.92%', trend: 'down', meaning: '단기 금리 인하 기대 소폭 강화' },
    ],
  },
  {
    icon: '📊',
    title: '물가 (Inflation)',
    color: 'border-rose-400/30',
    items: [
      { name: '미국 CPI (연간)', value: '3.3%', prev: '3.4%', trend: 'down', meaning: '전월 대비 둔화, 서비스 물가 여전히 높음' },
      { name: '미국 Core CPI', value: '3.6%', prev: '3.8%', trend: 'down', meaning: '근원 물가 하락 추세 지속' },
      { name: '한국 CPI (연간)', value: '2.7%', prev: '2.9%', trend: 'down', meaning: '2%대 진입 — 목표 수렴 근접' },
      { name: '미국 PCE', value: '2.7%', prev: '2.7%', trend: 'flat', meaning: '연준이 선호하는 물가 지표 — 변화 없음' },
    ],
  },
  {
    icon: '💼',
    title: '고용 (Employment)',
    color: 'border-emerald-400/30',
    items: [
      { name: '미국 실업률', value: '4.0%', prev: '3.9%', trend: 'up', meaning: '완만한 상승 — 고용 시장 서서히 식는 중' },
      { name: '비농업 고용', value: '+272K', prev: '+165K', trend: 'up', meaning: '예상보다 강한 고용, 금리 인하 지연 요인' },
      { name: '한국 실업률', value: '2.8%', prev: '2.6%', trend: 'up', meaning: '역사적 저수준 유지' },
    ],
  },
  {
    icon: '🏭',
    title: '경기 (Activity)',
    color: 'border-blue-400/30',
    items: [
      { name: '미국 제조업 PMI', value: '48.7', prev: '49.2', trend: 'down', meaning: '50 미만 = 수축 구간' },
      { name: '미국 서비스 PMI', value: '53.8', prev: '51.3', trend: 'up', meaning: '서비스업 확장 강화' },
      { name: '중국 제조업 PMI', value: '50.4', prev: '49.5', trend: 'up', meaning: '확장 국면 재진입' },
      { name: '미국 GDP (연환산)', value: '2.4%', prev: '3.4%', trend: 'down', meaning: '성장 속도 감속 시작' },
    ],
  },
  {
    icon: '💵',
    title: '통화 (Currencies)',
    color: 'border-cyan-400/30',
    items: [
      { name: 'DXY (달러 인덱스)', value: '105.2', prev: '104.6', trend: 'up', meaning: '달러 강세 — 글로벌 유동성 축소 신호' },
      { name: 'USD/KRW', value: '₩1,372', prev: '₩1,365', trend: 'up', meaning: '원화 약세 — 외국인 자금 유출 우려' },
      { name: 'USD/JPY', value: '157.2', prev: '155.8', trend: 'up', meaning: '엔화 약세 심화 — BOJ 개입 경계' },
      { name: 'EUR/USD', value: '1.084', prev: '1.089', trend: 'down', meaning: '유로 약세 — ECB 금리 인하 영향' },
    ],
  },
  {
    icon: '🛢️',
    title: '원자재 (Commodities)',
    color: 'border-orange-400/30',
    items: [
      { name: 'WTI 원유', value: '$72.30', prev: '$74.10', trend: 'down', meaning: '수요 둔화 우려 반영' },
      { name: '금 (Gold)', value: '$2,345', prev: '$2,310', trend: 'up', meaning: '안전자산 수요 + 중앙은행 매입' },
      { name: '구리 (Copper)', value: '$4.52', prev: '$4.38', trend: 'up', meaning: '산업 수요 회복 신호' },
    ],
  },
]

/* ─────────────────────────────────────────────
   4. STATIC DATA — Investment Fundamentals
   ───────────────────────────────────────────── */

const PRINCIPLES: PrincipleCard[] = [
  {
    icon: '🎯',
    title: '분산투자',
    subtitle: 'Diversification',
    description: '"달걀을 한 바구니에 담지 마라." 여러 자산에 나눠 투자하면, 하나가 빠져도 전체가 무너지지 않습니다.',
    lessonLink: '/learn/risk-thinking-risk-management',
    color: 'from-cyan-500/15 to-cyan-600/5',
  },
  {
    icon: '⏰',
    title: '시간의 힘 (복리)',
    subtitle: 'Compound Interest',
    description: '복리는 시간이 만드는 마법입니다. 연 7% 수익이면 10년에 2배, 20년이면 4배가 됩니다.',
    lessonLink: '/learn/macro-foundations-rates',
    color: 'from-emerald-500/15 to-emerald-600/5',
  },
  {
    icon: '📉',
    title: '리스크 관리',
    subtitle: 'Risk Management',
    description: '"얼마를 벌 수 있나" 보다 "얼마를 잃을 수 있나"를 먼저 생각하세요. 생존이 수익보다 먼저입니다.',
    lessonLink: '/learn/risk-thinking-risk-management',
    color: 'from-rose-500/15 to-rose-600/5',
  },
  {
    icon: '🧠',
    title: '감정 통제',
    subtitle: 'Emotional Discipline',
    description: '"공포에 사고 탐욕에 팔아라" — 말은 쉽지만 실천은 어렵습니다. 미리 정한 규칙이 감정을 이깁니다.',
    lessonLink: '/learn/risk-thinking-bias',
    color: 'from-purple-500/15 to-purple-600/5',
  },
  {
    icon: '📰',
    title: '뉴스 해석',
    subtitle: 'News Interpretation',
    description: '"뉴스가 나왔을 때는 이미 가격에 반영되어 있다." 1차 효과보다 2차 효과를 보는 습관이 중요합니다.',
    lessonLink: '/learn/risk-thinking-second-order',
    color: 'from-amber-500/15 to-amber-600/5',
  },
  {
    icon: '🔄',
    title: '리밸런싱',
    subtitle: 'Rebalancing',
    description: '비율이 흐트러지면 원래 정한 배분으로 돌려놓으세요. 자동으로 "싸게 사고 비싸게 파는" 효과가 납니다.',
    lessonLink: '/learn/macro-foundations-liquidity',
    color: 'from-teal-500/15 to-teal-600/5',
  },
]

/* ─────────────────────────────────────────────
   5. STATIC DATA — Learning Tracks
   ───────────────────────────────────────────── */

const TRACKS = [
  {
    icon: '🌊',
    title: '매크로 기초',
    subtitle: 'Macro Foundations',
    description: '유동성, 금리, 물가, 채권, 달러, 이벤트 캘린더',
    count: 6,
    href: '/learn',
    color: 'border-cyan-400/25 hover:border-cyan-400/50',
  },
  {
    icon: '🤖',
    title: 'AI 경제',
    subtitle: 'AI Economy',
    description: 'GPU, 자동화, 데이터, AI 에이전트',
    count: 4,
    href: '/learn',
    color: 'border-purple-400/25 hover:border-purple-400/50',
  },
  {
    icon: '🎯',
    title: '리스크 사고',
    subtitle: 'Risk Thinking',
    description: '확률, 2차 효과, 인지 편향, 리스크 관리',
    count: 4,
    href: '/learn',
    color: 'border-amber-400/25 hover:border-amber-400/50',
  },
]

/* ─────────────────────────────────────────────
   6. HELPER COMPONENTS
   ───────────────────────────────────────────── */

function TrendIcon({ trend, size = 14 }: { trend: 'up' | 'down' | 'flat'; size?: number }) {
  if (trend === 'up') return <TrendingUp className="text-emerald-400" style={{ width: size, height: size }} />
  if (trend === 'down') return <TrendingDown className="text-rose-400" style={{ width: size, height: size }} />
  return <Minus className="text-gray-500" style={{ width: size, height: size }} />
}

function trendColor(trend: 'up' | 'down' | 'flat') {
  if (trend === 'up') return 'text-emerald-400'
  if (trend === 'down') return 'text-rose-400'
  return 'text-gray-500'
}

/* ─────────────────────────────────────────────
   7. MAIN PAGE COMPONENT
   ───────────────────────────────────────────── */

export default function IntelligencePage() {
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const [tickerLoading, setTickerLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    async function fetchTickers() {
      try {
        const res = await fetch('/api/ticker')
        if (!res.ok) throw new Error('Ticker fetch failed')
        const data = await res.json()
        setTickers((data.tickers || []).slice(0, 16))
        setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
      } catch {
        setTickers([])
      } finally {
        setTickerLoading(false)
      }
    }
    fetchTickers()
    const interval = setInterval(fetchTickers, 60000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b10] text-white">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(6,182,212,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.2), transparent 50%)',
      }} />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        {/* ════════════════ HERO ════════════════ */}
        <header className="mb-10 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
            <Globe className="h-5 w-5" />
            Global Research Hub
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-5xl">
            세계 경제 · 지표 · 리터러시 기본
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-gray-400">
            {today} — 의사결정 및 금융 리터러시 기본 원칙부터 글로벌 경제 지표까지, 한 페이지에서 빠르게 확인하세요.
          </p>
        </header>

        {/* ════════════════ SECTION 1: 세계 경제 히트맵 ════════════════ */}
        <section className="mb-10" id="world-economy">
          <div className="mb-5 flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-bold text-white">🌐 세계 경제 한눈에</h2>
            <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-500">
              주요국 최신 경제 지표
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {WORLD_ECONOMY.map((c) => (
              <div
                key={c.country}
                className={`group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br ${c.color} p-5 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/20`}
              >
                {/* Flag & Country */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-lg font-bold text-white">{c.country}</span>
                </div>

                {/* Metrics */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">GDP 성장률</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{c.gdp}</span>
                      <TrendIcon trend={c.gdpTrend} size={12} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">CPI</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{c.cpi}</span>
                      <TrendIcon trend={c.cpiTrend} size={12} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">기준금리</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{c.rate}</span>
                      <TrendIcon trend={c.rateTrend} size={12} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5">
                    <span className="text-xs text-gray-400">{c.extra.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{c.extra.value}</span>
                      <TrendIcon trend={c.extra.trend} size={12} />
                    </div>
                  </div>
                </div>

                {/* Summary tooltip on hover */}
                <div className="mt-3 rounded-lg bg-black/20 p-2.5 text-xs leading-5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100">
                  {c.summary}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════ SECTION 2: 핵심 경제 지표 ════════════════ */}
        <section className="mb-10" id="indicators">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white">📊 핵심 경제 지표</h2>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              최근 발표 기준
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INDICATOR_GROUPS.map((group) => (
              <div
                key={group.title}
                className={`rounded-xl border ${group.color} bg-white/[0.02] p-5 transition hover:bg-white/[0.04]`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="text-sm font-bold text-white">{group.title}</h3>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.name} className="group/item">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 line-through">{item.prev}</span>
                          <span className={`text-sm font-bold ${trendColor(item.trend)}`}>
                            {item.value}
                          </span>
                          <TrendIcon trend={item.trend} size={13} />
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-gray-500 opacity-0 transition-opacity group-hover/item:opacity-100">
                        {item.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════ SECTION 3: 리터러시 기본 ════════════════ */}
        <section className="mb-10" id="fundamentals">
          <div className="mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">🎯 금융 리터러시와 의사결정의 6가지 핵심 원칙</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <Link
                key={p.title}
                href={p.lessonLink}
                className={`group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br ${p.color} p-6 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-3xl">{p.icon}</span>
                  <ArrowRight className="h-4 w-4 text-gray-500 opacity-0 transition group-hover:translate-x-1 group-hover:text-white group-hover:opacity-100" />
                </div>
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-0.5 text-xs font-medium text-gray-500">{p.subtitle}</p>
                <p className="mt-3 text-sm leading-6 text-gray-300">{p.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 opacity-0 transition group-hover:opacity-100">
                  관련 학습 보기 <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ════════════════ SECTION 4: 오늘의 시장 맥락 ════════════════ */}
        <section className="mb-10" id="market-signals">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-bold text-white">📈 오늘의 시장 맥락 (Market Context)</h2>
            <div className="ml-auto flex items-center gap-2">
              {lastUpdated && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <RefreshCw className="h-3 w-3" />
                  {lastUpdated} 업데이트
                </span>
              )}
            </div>
          </div>

          {tickerLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="h-[80px] animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.03]" />
              ))}
            </div>
          ) : tickers.length === 0 ? (
            <p className="text-sm text-gray-500">시장 데이터를 불러올 수 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {tickers.map((t) => (
                <div
                  key={t.symbol}
                  className="group rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.04]"
                >
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 group-hover:text-cyan-200">
                    {t.symbol}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{t.price}</p>
                  <p className={`mt-0.5 text-xs font-medium ${t.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.change}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ════════════════ SECTION 5: 학습 빠른 링크 ════════════════ */}
        <section className="mb-8" id="learning-tracks">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">📚 학습 트랙</h2>
            <Link href="/learn" className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-cyan-200">
              전체 보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRACKS.map((track) => (
              <Link
                key={track.title}
                href={track.href}
                className={`group rounded-xl border ${track.color} bg-white/[0.02] p-6 transition-all duration-300 hover:bg-white/[0.05]`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl">{track.icon}</span>
                  <div>
                    <h3 className="text-base font-bold text-white">{track.title}</h3>
                    <p className="text-xs text-gray-500">{track.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-gray-400">{track.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-gray-400">
                    {track.count}개 레슨
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-cyan-300 opacity-0 transition group-hover:opacity-100">
                    시작하기 <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ════════════════ FOOTER NOTE ════════════════ */}
        <footer className="mt-6 border-t border-white/[0.06] pt-6 text-center">
          <p className="text-xs leading-5 text-gray-600">
            경제 지표는 최근 공식 발표 기준이며, 시장 데이터는 실시간 API 기반입니다.
            투자 판단의 참고 자료이며 투자 권유가 아닙니다.
          </p>
        </footer>
      </div>
    </div>
  )
}
