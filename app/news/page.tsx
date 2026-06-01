'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Lock, Diamond, X, Crown, Rocket, Star, Shield, Anchor } from 'lucide-react'
import { MembershipTier } from '@/types'
import { canAccessTier, normalizeMembershipTier } from '@/lib/membership/access'

interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  source: string
  source_url: string
  image_url: string
  published_at: string
  is_premium: boolean
  premium_category: 'institution' | 'whale' | 'analysis' | 'prediction' | 'etf' | null
  required_tier: 'navigator' | 'pilot' | 'commander' | 'admiral' | null
  ai_summary?: {
    headline: string
    why_it_matters: string
    key_point: string
  } | null
  related_lesson?: {
    id: string
    title: string
  } | null
}

type Category = 'all' | 'macro' | 'ai' | 'technology' | 'policy' | 'markets' | 'consumer' | 'energy' | 'crypto'
type PremiumFilter = 'all' | 'free' | 'premium'
type PremiumCategory = 'all' | 'institution' | 'whale' | 'analysis' | 'prediction' | 'etf'

const CATEGORIES: { label: string; value: Category; icon: string }[] = [
  { label: '전체', value: 'all', icon: '📰' },
  { label: 'Macro', value: 'macro', icon: '🌍' },
  { label: 'AI', value: 'ai', icon: '🤖' },
  { label: 'Technology', value: 'technology', icon: '💻' },
  { label: 'Policy', value: 'policy', icon: '⚖️' },
  { label: 'Markets', value: 'markets', icon: '📈' },
  { label: 'Consumer', value: 'consumer', icon: '🛍️' },
  { label: 'Energy', value: 'energy', icon: '⚡' },
  { label: 'Crypto', value: 'crypto', icon: '₿' },
]

const PREMIUM_CATEGORIES: { label: string; value: PremiumCategory; icon: string }[] = [
  { label: '전체', value: 'all', icon: '💎' },
  { label: '기관 동향', value: 'institution', icon: '🏦' },
  { label: '고래 추적', value: 'whale', icon: '🐋' },
  { label: 'AI 분석', value: 'analysis', icon: '📊' },
  { label: '예측', value: 'prediction', icon: '🔮' },
  { label: 'ETF', value: 'etf', icon: '💼' },
]

const TIER_INFO: Record<MembershipTier, { label: string; icon: React.ReactNode; color: string }> = {
  cadet: { label: 'Cadet', icon: <Anchor className="w-4 h-4" />, color: 'text-gray-400' },
  navigator: { label: 'Navigator', icon: <Star className="w-4 h-4" />, color: 'text-blue-400' },
  pilot: { label: 'Pilot', icon: <Rocket className="w-4 h-4" />, color: 'text-purple-400' },
  commander: { label: 'Commander', icon: <Shield className="w-4 h-4" />, color: 'text-yellow-400' },
  admiral: { label: 'Admiral', icon: <Crown className="w-4 h-4" />, color: 'text-amber-500' },
}

const getFallbackImage = (category: string): string => {
  switch (category) {
    case 'macro':
      return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60' // 네온 금융 차트
    case 'ai':
      return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=60' // AI 일러스트
    case 'technology':
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60' // IT 부품/회로
    case 'policy':
      return 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=60' // 의사봉/정책
    case 'markets':
      return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=60' // 주식 시장 그래프
    case 'consumer':
      return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=60' // 소비/비즈니스
    case 'energy':
      return 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=60' // 친환경 에너지 발전기
    case 'crypto':
      return 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60' // 미니멀 골드 비트코인
    default:
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60' // 미래적 데이터 우주 공간
  }
}

function NewsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>(
    (searchParams.get('category') as Category) || 'all'
  )
  const [premiumFilter, setPremiumFilter] = useState<PremiumFilter>('all')
  const [premiumCategory, setPremiumCategory] = useState<PremiumCategory>('all')
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  )
  const [totalPages, setTotalPages] = useState(1)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  // User state
  const [user, setUser] = useState<User | null>(null)
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')

  useEffect(() => {
    // Check user and tier
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('membership_tier')
            .eq('id', user.id)
            .single()

          setUserTier(normalizeMembershipTier(profile?.membership_tier))
        }
      } catch (err) {
        console.error('Failed to check user in news page:', err)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('membership_tier')
            .eq('id', session.user.id)
            .single()

          setUserTier(normalizeMembershipTier(profile?.membership_tier))
        } else {
          setUserTier('cadet')
        }
      } catch (err) {
        console.error('Auth state change error in news page:', err)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const canAccessPremiumCategory = (category: string | null): boolean => {
    if (!category) return true

    // Navigator can only access institution
    if (userTier === 'navigator' && category === 'institution') return true

    // Pilot and above can access all premium
    if (canAccessTier(userTier, 'pilot')) return true

    return false
  }

  const canAccessNews = (newsItem: NewsItem): boolean => {
    if (!newsItem.is_premium) return true

    // Check tier requirement
    if (newsItem.required_tier && !canAccessTier(userTier, newsItem.required_tier)) {
      return false
    }

    // Check premium category access
    if (!canAccessPremiumCategory(newsItem.premium_category)) {
      return false
    }

    return true
  }

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        category,
        page: currentPage.toString(),
        premium_filter: premiumFilter,
        premium_category: premiumCategory,
        tier: userTier,
      })

      const res = await fetch(`/api/news?${params}`)
      if (!res.ok) {
        throw new Error('Server returned an error')
      }
      const data = await res.json()

      if (data && data.news) {
        setNews(data.news)
        setTotalPages(data.total_pages || 1)
      } else {
        throw new Error('Invalid response structure')
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setError('뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setNews([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [category, currentPage, premiumFilter, premiumCategory, userTier])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (currentPage > 1) params.set('page', currentPage.toString())
    router.replace(`/news?${params.toString()}`, { scroll: false })
  }, [category, currentPage, router])

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory)
    setCurrentPage(1)
  }

  const handleNewsClick = (item: NewsItem, e: React.MouseEvent) => {
    if (item.is_premium && !canAccessNews(item)) {
      e.preventDefault()
      setSelectedNews(item)
      setShowUpgradeModal(true)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat)
    return found ? found.label : '전체'
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'macro':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'ai':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'technology':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'policy':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'markets':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'consumer':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'energy':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'crypto':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPremiumCategoryLabel = (cat: string | null) => {
    if (!cat) return ''
    const found = PREMIUM_CATEGORIES.find((c) => c.value === cat)
    return found ? found.label : ''
  }

  const getPremiumCategoryIcon = (cat: string | null) => {
    if (!cat) return '💎'
    const found = PREMIUM_CATEGORIES.find((c) => c.value === cat)
    return found ? found.icon : '💎'
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            시장과 경제 뉴스 읽기
          </h1>
          <p className="text-gray-400">
            실시간 시장 경제 뉴스와 AI 학습 요약을 확인하세요
          </p>

          {/* User Tier Badge */}
          {user && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-gray-400 text-sm">내 등급:</span>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full bg-space-800/50 ${TIER_INFO[userTier].color}`}>
                {TIER_INFO[userTier].icon}
                <span className="font-medium">{TIER_INFO[userTier].label}</span>
              </span>
            </div>
          )}
        </div>

        {/* Premium Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {(['all', 'free', 'premium'] as PremiumFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setPremiumFilter(filter)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                premiumFilter === filter
                  ? filter === 'premium'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black'
                    : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                  : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50'
              }`}
            >
              {filter === 'all' && '전체'}
              {filter === 'free' && '무료'}
              {filter === 'premium' && (
                <span className="flex items-center gap-1">
                  <Diamond className="w-4 h-4" />
                  프리미엄
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Premium Categories (shown when premium filter is selected) */}
        {premiumFilter === 'premium' && (
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {PREMIUM_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setPremiumCategory(cat.value)
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    premiumCategory === cat.value
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                    : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-space-700/50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-purple-500/20" />
                <div className="p-4">
                  <div className="h-4 bg-purple-500/20 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-purple-500/20 rounded w-full mb-2" />
                  <div className="h-4 bg-purple-500/20 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-xl p-12 text-center border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 text-lg mb-2">{error}</p>
            <button
              onClick={() => fetchNews()}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              다시 시도
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">해당 카테고리의 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => {
              const hasAccess = canAccessNews(item)

              return (
                <a
                  key={item.id}
                  href={hasAccess ? item.source_url : '#'}
                  target={hasAccess ? '_blank' : undefined}
                  rel={hasAccess ? 'noopener noreferrer' : undefined}
                  onClick={(e) => handleNewsClick(item, e)}
                  className={`glass rounded-xl overflow-hidden card-hover group relative ${
                    item.is_premium ? 'border-2 border-amber-500/30 hover:border-amber-500/60' : ''
                  }`}
                >
                  {/* Premium Locked Overlay */}
                  {item.is_premium && !hasAccess && (
                    <div className="absolute inset-0 z-20 bg-space-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Lock className="w-12 h-12 text-amber-500 mb-3" />
                      <p className="text-amber-400 font-bold text-center px-4">
                        {item.required_tier ? TIER_INFO[item.required_tier]?.label : 'Navigator'} 이상
                        <br />
                        멤버십이 필요합니다
                      </p>
                      <button className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                        멤버십 업그레이드
                      </button>
                    </div>
                  )}
                  {/* Image */}
                  <div className={`relative h-48 bg-space-800/50 overflow-hidden ${item.is_premium && !hasAccess ? 'blur-sm' : ''}`}>
                    <img
                      src={item.image_url || getFallbackImage(item.category)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackImage(item.category)
                      }}
                    />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>

                    {/* Premium Badge */}
                    {item.is_premium && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black flex items-center gap-1">
                          <Diamond className="w-3 h-3" />
                          프리미엄
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`p-4 ${item.is_premium && !hasAccess ? 'blur-sm' : ''}`}>
                    {/* Premium Category & AI Badge */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.is_premium && item.premium_category && (
                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs flex items-center gap-1">
                          {getPremiumCategoryIcon(item.premium_category)}
                          {getPremiumCategoryLabel(item.premium_category)}
                        </span>
                      )}
                      {item.ai_summary ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          AI 분석 완료
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-500/20 border border-gray-500/30 rounded-full text-gray-500 text-xs">
                          기본 요약
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>

                    {/* AI Summary (모든 사용자에게 제공) */}
                    {item.ai_summary && hasAccess ? (
                      <div className="space-y-2 mb-3 bg-space-950/40 p-3 rounded-lg border border-space-800/40 text-xs">
                        <div>
                          <span className="text-cyan-300 font-semibold flex items-center gap-1 mb-0.5">
                            💡 무슨 일이 있었나?
                          </span>
                          <p className="text-gray-200 leading-relaxed pl-4 mb-2">
                            {item.ai_summary.headline}
                          </p>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 mb-0.5">
                            📢 왜 중요한가?
                          </span>
                          <p className="text-gray-300 leading-relaxed pl-4 mb-2">
                            {item.ai_summary.why_it_matters}
                          </p>
                        </div>
                        <div>
                          <span className="text-amber-400 font-semibold flex items-center gap-1 mb-0.5">
                            🎯 생각해볼 질문
                          </span>
                          <p className="text-amber-300/90 leading-relaxed pl-4">
                            {item.ai_summary.key_point}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm line-clamp-3 mb-2">
                        {item.summary}
                      </p>
                    )}

                    {/* Related Lesson */}
                    {item.related_lesson && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.location.href = `/learn/${item.related_lesson!.id}`
                        }}
                        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 hover:bg-emerald-500/10 transition cursor-pointer"
                      >
                        <span className="text-emerald-400 text-xs">📚</span>
                        <span className="text-emerald-300/80 text-xs hover:text-emerald-200 transition">
                          관련 학습: {item.related_lesson.title}
                        </span>
                      </div>
                    )}
                    {/* Write Note Button */}
                    {hasAccess && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const queryParams = new URLSearchParams({
                            action: 'new',
                            template: 'news',
                            newsId: item.id,
                            title: item.title,
                            source: item.source,
                            publishedAt: item.published_at,
                            category: item.category,
                            url: item.source_url
                          })
                          router.push(`/journal/my?${queryParams.toString()}`)
                        }}
                        className="w-full mb-3 py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                      >
                        ✍️ 이 뉴스로 노트 작성하기
                      </button>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.source}</span>
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← 이전
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                        : 'bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-space-800/50 text-gray-400 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 →
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-lg w-full border border-amber-500/30 animate-fade-in">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-black" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                프리미엄 콘텐츠입니다
              </h3>

              <p className="text-gray-400 mb-6">
                이 콘텐츠는{' '}
                <span className="text-amber-400 font-bold">
                  {selectedNews.required_tier
                    ? TIER_INFO[selectedNews.required_tier]?.label
                    : 'Navigator'}
                </span>{' '}
                이상 멤버십이 필요합니다.
              </p>

              {/* Premium Features */}
              <div className="bg-space-800/50 rounded-xl p-4 mb-6 text-left">
                <p className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                  <Diamond className="w-5 h-5" />
                  프리미엄 멤버십 혜택
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span>🏦</span> 기관 동향 (블랙록, 피델리티, 그레이스케일)
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🐋</span> 고래 추적 (대형 지갑 움직임)
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📊</span> AI 심층 분석 리포트
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🔮</span> 주간/월간 예측
                  </li>
                  <li className="flex items-center gap-2">
                    <span>💼</span> ETF 자금 흐름
                  </li>
                </ul>
              </div>

              {/* Tier Access Table */}
              <div className="bg-space-800/50 rounded-xl p-4 mb-6">
                <p className="text-white font-bold mb-3">등급별 접근 권한</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Star className="w-4 h-4" />
                    Navigator: 기관동향만
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <Rocket className="w-4 h-4" />
                    Pilot: 전체
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Shield className="w-4 h-4" />
                    Commander: + AI분석
                  </div>
                  <div className="flex items-center gap-2 text-amber-500">
                    <Crown className="w-4 h-4" />
                    Admiral: + 독점 리포트
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-space-700 text-gray-300 hover:bg-space-600 transition-colors"
                >
                  나중에
                </button>
                <Link href="/membership" className="flex-1">
                  <button className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:opacity-90 transition-opacity">
                    멤버십 보기
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewsLoading() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-10 bg-purple-500/20 rounded w-48 mb-2" />
          <div className="h-4 bg-purple-500/20 rounded w-64" />
        </div>
        <div className="flex gap-2 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-purple-500/20 rounded-xl w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-purple-500/20" />
              <div className="p-4">
                <div className="h-4 bg-purple-500/20 rounded w-1/4 mb-3" />
                <div className="h-6 bg-purple-500/20 rounded w-3/4 mb-2" />
                <div className="h-4 bg-purple-500/20 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent />
    </Suspense>
  )
}
