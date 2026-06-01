// Daily Brief 조회 API
// GET /api/cosmic-radar/daily-brief?tier=admiral&date=2024-12-16

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { FIRST_REAL_PUBLICATION_CADENCE } from '@/lib/content/first-real-publication-cadence'

export const dynamic = 'force-dynamic'

type MembershipTier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'
type BriefListParams = {
  tier?: string
  limit?: number
  offset?: number
  category?: string
}

// 등급별 접근 레벨
const ACCESS_LEVELS: Record<MembershipTier, number> = {
  cadet: 0,
  navigator: 1,
  pilot: 2,
  commander: 3,
  admiral: 4,
}

function normalizeTier(value: string | null): MembershipTier {
  if (value && value in ACCESS_LEVELS) {
    return value as MembershipTier
  }
  return 'cadet'
}

function getBearerToken(request: NextRequest) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null
}

async function resolveMembershipTier(
  request: NextRequest,
  supabase: SupabaseClient,
  requestedTier: MembershipTier
): Promise<MembershipTier> {
  const token = getBearerToken(request)

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('membership_tier')
        .eq('id', user.id)
        .single()

      if (profile?.membership_tier && profile.membership_tier in ACCESS_LEVELS) {
        return profile.membership_tier as MembershipTier
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return requestedTier
  }

  return 'cadet'
}

function parseInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.floor(parsed)))
}

function getDevelopmentCadenceBriefs(nowIso: string) {
  return FIRST_REAL_PUBLICATION_CADENCE
    .filter((brief) => (
      brief.is_published
      && (!brief.scheduled_for || new Date(brief.scheduled_for).getTime() <= new Date(nowIso).getTime())
    ))
    .sort((a, b) => {
      if (Number(b.is_featured) !== Number(a.is_featured)) {
        return Number(b.is_featured) - Number(a.is_featured)
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
}

function developmentCadenceResponse(params: BriefListParams & {
  date: string
  latest: boolean
  list: boolean
  tier: MembershipTier
  nowIso: string
}) {
  const visibleBriefs = getDevelopmentCadenceBriefs(params.nowIso)

  if (params.list) {
    const categoryFiltered = params.category && params.category !== 'all'
      ? visibleBriefs.filter((brief) => brief.category === params.category)
      : visibleBriefs
    const offset = params.offset || 0
    const limit = params.limit || 7
    const page = categoryFiltered.slice(offset, offset + limit)

    return NextResponse.json({
      briefs: page.map((brief) => filterContentByTier({ ...brief }, params.tier)),
      total: categoryFiltered.length,
      userTier: params.tier,
      mode: 'development-cadence-fallback',
    })
  }

  const brief = params.latest
    ? visibleBriefs[0]
    : visibleBriefs.find((item) => item.date === params.date)

  return NextResponse.json({
    brief: brief ? filterContentByTier({ ...brief }, params.tier) : null,
    userTier: params.tier,
    accessLevel: ACCESS_LEVELS[params.tier],
    mode: 'development-cadence-fallback',
    message: brief ? undefined : '해당 날짜의 리포트가 없습니다',
  })
}

// Supabase 클라이언트 lazy loading
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// 등급별 콘텐츠 필터링
function filterContentByTier(brief: Record<string, unknown>, tier: MembershipTier): Record<string, unknown> {
  const accessLevel = ACCESS_LEVELS[tier]
  const isPremium = brief.is_premium !== false

  if (!isPremium) {
    return {
      ...brief,
      fullAccess: true,
      publicAccess: true,
    }
  }

  // Cadet: 완전 잠금
  if (accessLevel === 0) {
    return {
      id: brief.id,
      date: brief.date,
      title: brief.title,
      summary: brief.summary,
      category: brief.category,
      tags: brief.tags,
      reflection_prompt: brief.reflection_prompt,
      related_lesson_ids: brief.related_lesson_ids,
      editorial_quality_score: brief.editorial_quality_score,
      reading_level: brief.reading_level,
      is_premium: brief.is_premium,
      is_featured: brief.is_featured,
      locked: true,
      message: '🔒 Navigator 이상 멤버십이 필요합니다',
      requiredTier: 'navigator',
    }
  }

  // Navigator: 1주일 지연
  if (accessLevel === 1) {
    const briefDate = new Date(brief.date as string)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    if (briefDate > oneWeekAgo) {
      return {
        id: brief.id,
        date: brief.date,
        title: brief.title,
        summary: brief.summary,
        category: brief.category,
        tags: brief.tags,
        reflection_prompt: brief.reflection_prompt,
        related_lesson_ids: brief.related_lesson_ids,
        editorial_quality_score: brief.editorial_quality_score,
        reading_level: brief.reading_level,
        is_premium: brief.is_premium,
        is_featured: brief.is_featured,
        locked: true,
        message: '📅 Navigator 등급은 1주일 후에 열람 가능합니다',
        unlocksAt: new Date(briefDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requiredTier: 'pilot',
      }
    }
    // 1주일 지난 리포트는 요약만 제공
    return {
      ...brief,
      full_content: null,
      summaryOnly: true,
    }
  }

  // Pilot: 요약만
  if (accessLevel === 2) {
    return {
      ...brief,
      full_content: null,
      summaryOnly: true,
      message: '📊 전체 내용은 Commander 이상에서 확인 가능합니다',
    }
  }

  // Commander, Admiral: 전체 내용
  return {
    ...brief,
    fullAccess: true,
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const searchParams = request.nextUrl.searchParams
  const requestedTier = normalizeTier(searchParams.get('tier'))
  const tier = supabase ? await resolveMembershipTier(request, supabase, requestedTier) : requestedTier
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const latest = searchParams.get('latest') === 'true'
  const list = searchParams.get('list') === 'true'
  const limit = parseInteger(searchParams.get('limit'), 7, 1, 20)
  const offset = parseInteger(searchParams.get('offset'), 0, 0, 500)
  const category = searchParams.get('category')
  const nowIso = new Date().toISOString()

  try {
    if (!supabase && process.env.NODE_ENV !== 'production') {
      return developmentCadenceResponse({ date, latest, list, limit, offset, category: category || undefined, tier, nowIso })
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    if (list) {
      let listQuery = supabase
        .from('daily_briefs')
        .select('id, date, title, summary, market_sentiment, btc_price, eth_price, btc_change_24h, eth_change_24h, fear_greed_index, category, tags, is_premium, is_featured, is_published, scheduled_for, published_at, reflection_prompt, related_lesson_ids, editorial_quality_score, reading_level', { count: 'exact' })
        .eq('is_published', true)
        .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
        .order('is_featured', { ascending: false })
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1)

      if (category && category !== 'all') {
        listQuery = listQuery.eq('category', category)
      }

      const { data, error, count } = await listQuery
      if (error) throw error

      return NextResponse.json({
        briefs: data?.map(brief => filterContentByTier(brief, tier)) || [],
        total: count,
        userTier: tier,
      })
    }

    let query = supabase
      .from('daily_briefs')
      .select('*')
      .eq('is_published', true)
      .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)

    if (latest) {
      // 오늘의 고정 브리핑을 우선하고, 없으면 최신 공개 브리핑을 가져오기
      query = query
        .order('is_featured', { ascending: false })
        .order('date', { ascending: false })
        .limit(1)
    } else {
      // 특정 날짜 리포트
      query = query.eq('date', date)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          brief: null,
          message: '해당 날짜의 리포트가 없습니다',
        })
      }
      throw error
    }

    // 등급별 콘텐츠 필터링
    const filteredBrief = filterContentByTier(data, tier)

    return NextResponse.json({
      brief: filteredBrief,
      userTier: tier,
      accessLevel: ACCESS_LEVELS[tier],
    })

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'unknown error'
      console.warn(`Daily brief database unavailable; using development cadence fallback: ${message}`)
      return developmentCadenceResponse({ date, latest, list, limit, offset, category: category || undefined, tier, nowIso })
    }
    console.error('Error fetching daily brief:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily brief' },
      { status: 500 }
    )
  }
}

// 리포트 목록 조회 (히스토리)
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { tier = 'cadet', limit = 7, offset = 0, category = 'all' } = body as BriefListParams
    const resolvedTier = await resolveMembershipTier(request, supabase, normalizeTier(tier))
    const safeLimit = parseInteger(limit, 7, 1, 20)
    const safeOffset = parseInteger(offset, 0, 0, 500)

    let listQuery = supabase
      .from('daily_briefs')
      .select('id, date, title, summary, market_sentiment, btc_price, eth_price, btc_change_24h, eth_change_24h, fear_greed_index, category, tags, is_premium, is_featured, is_published, scheduled_for, published_at, reflection_prompt, related_lesson_ids, editorial_quality_score, reading_level', { count: 'exact' })
      .eq('is_published', true)
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .order('is_featured', { ascending: false })
      .order('date', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1)

    if (category && category !== 'all') {
      listQuery = listQuery.eq('category', category)
    }

    const { data, error, count } = await listQuery

    if (error) throw error

    // 등급별 필터링 적용
    const filteredBriefs = data?.map(brief => filterContentByTier(brief, resolvedTier)) || []

    return NextResponse.json({
      briefs: filteredBriefs,
      total: count,
      userTier: resolvedTier,
    })

  } catch (error) {
    console.error('Error fetching briefs list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch briefs' },
      { status: 500 }
    )
  }
}
