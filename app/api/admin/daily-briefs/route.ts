import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'coinkim00@gmail.com'

type MarketSentiment = 'bullish' | 'bearish' | 'neutral'

interface BriefInput {
  id?: string
  date?: string
  title?: string
  summary?: string
  full_content?: string
  market_sentiment?: MarketSentiment
  category?: string
  tags?: string[]
  is_premium?: boolean
  is_published?: boolean
  is_featured?: boolean
  btc_price?: number | null
  eth_price?: number | null
  btc_change_24h?: number | null
  eth_change_24h?: number | null
  fear_greed_index?: number | null
  key_events?: unknown[]
  predictions?: unknown[]
  what_happened?: string
  why_it_matters?: string
  second_order_effects?: string
  risk_conditions?: string
  reflection_prompt?: string
  related_lesson_ids?: string[]
  editorial_quality_score?: number | null
  reading_level?: string
  scheduled_for?: string | null
  published_at?: string | null
  editor_notes?: string
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function requireAdmin(request: NextRequest, supabase: SupabaseClient) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data, error } = await supabase.auth.getUser(token)
  const user = data.user

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (user.email === ADMIN_EMAIL) {
    return { user }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { user }
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function sanitizeBriefInput(body: BriefInput, partial = false) {
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    updated_at: now,
  }

  const setString = (key: keyof BriefInput, fallback?: string) => {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) {
      payload[key] = value.trim()
    } else if (!partial && fallback !== undefined) {
      payload[key] = fallback
    }
  }

  setString('date')
  setString('title')
  setString('summary')
  setString('full_content')
  setString('category', 'market')
  setString('what_happened')
  setString('why_it_matters')
  setString('second_order_effects')
  setString('risk_conditions')
  setString('reflection_prompt')
  setString('reading_level', 'foundational')
  setString('editor_notes')

  const setOptionalDateTime = (key: 'scheduled_for' | 'published_at') => {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        payload[key] = parsed.toISOString()
      }
    } else if (value === null) {
      payload[key] = null
    }
  }

  setOptionalDateTime('scheduled_for')
  setOptionalDateTime('published_at')

  if (body.market_sentiment && ['bullish', 'bearish', 'neutral'].includes(body.market_sentiment)) {
    payload.market_sentiment = body.market_sentiment
  } else if (!partial) {
    payload.market_sentiment = 'neutral'
  }

  if (Array.isArray(body.tags) || !partial) {
    payload.tags = normalizeTags(body.tags)
  }

  const booleanFields: Array<keyof BriefInput> = ['is_premium', 'is_published', 'is_featured']
  booleanFields.forEach((field) => {
    if (typeof body[field] === 'boolean') {
      payload[field] = body[field]
    } else if (!partial) {
      payload[field] = field === 'is_premium' || field === 'is_published'
    }
  })

  if (body.is_published === true && payload.published_at === undefined) {
    payload.published_at = now
  }

  if (body.is_published === false) {
    payload.published_at = null
  }

  const numericFields: Array<keyof BriefInput> = [
    'btc_price',
    'eth_price',
    'btc_change_24h',
    'eth_change_24h',
    'fear_greed_index',
  ]
  numericFields.forEach((field) => {
    const value = body[field]
    if (typeof value === 'number' || value === null) {
      payload[field] = value
    }
  })

  if (Array.isArray(body.key_events)) {
    payload.key_events = body.key_events
  }
  if (Array.isArray(body.predictions)) {
    payload.predictions = body.predictions
  }
  if (Array.isArray(body.related_lesson_ids) || !partial) {
    payload.related_lesson_ids = normalizeTags(body.related_lesson_ids)
  }

  if (typeof body.editorial_quality_score === 'number' || body.editorial_quality_score === null) {
    payload.editorial_quality_score = body.editorial_quality_score
  } else if (!partial) {
    payload.editorial_quality_score = 0
  }

  return payload
}

function missingCreateFields(payload: Record<string, unknown>) {
  return ['date', 'title', 'summary', 'full_content'].filter((field) => !payload[field])
}

async function clearFeaturedBriefs(supabase: SupabaseClient, currentId?: string) {
  let query = supabase
    .from('daily_briefs')
    .update({ is_featured: false, updated_at: new Date().toISOString() })
    .eq('is_featured', true)

  if (currentId) {
    query = query.neq('id', currentId)
  }

  const { error } = await query
  if (error) throw error
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const admin = await requireAdmin(request, supabase)
  if (admin.error) return admin.error

  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') || 'all'
  const status = searchParams.get('status') || 'all'
  const limit = Math.min(Number(searchParams.get('limit') || 80), 120)

  try {
    let query = supabase
      .from('daily_briefs')
      .select('*', { count: 'exact' })
      .order('is_featured', { ascending: false })
      .order('date', { ascending: false })
      .limit(limit)

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    if (status === 'published') {
      query = query.eq('is_published', true)
    } else if (status === 'draft') {
      query = query.eq('is_published', false)
    } else if (status === 'premium') {
      query = query.eq('is_premium', true)
    } else if (status === 'public') {
      query = query.eq('is_premium', false)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ briefs: data || [], total: count || 0 })
  } catch (error) {
    console.error('Admin daily briefs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch daily briefs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const admin = await requireAdmin(request, supabase)
  if (admin.error) return admin.error

  try {
    const body = (await request.json()) as BriefInput
    const payload = sanitizeBriefInput(body)
    const missingFields = missingCreateFields(payload)

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (payload.is_featured === true) {
      await clearFeaturedBriefs(supabase)
    }

    const { data, error } = await supabase
      .from('daily_briefs')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ brief: data }, { status: 201 })
  } catch (error) {
    console.error('Admin daily brief create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create daily brief' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const admin = await requireAdmin(request, supabase)
  if (admin.error) return admin.error

  try {
    const body = (await request.json()) as BriefInput
    if (!body.id) {
      return NextResponse.json({ error: 'Brief id is required' }, { status: 400 })
    }

    const payload = sanitizeBriefInput(body, true)

    if (payload.is_featured === true) {
      await clearFeaturedBriefs(supabase, body.id)
    }

    const { data, error } = await supabase
      .from('daily_briefs')
      .update(payload)
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ brief: data })
  } catch (error) {
    console.error('Admin daily brief update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update daily brief' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const admin = await requireAdmin(request, supabase)
  if (admin.error) return admin.error

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Brief id is required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('daily_briefs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin daily brief delete error:', error)
    return NextResponse.json({ error: 'Failed to delete daily brief' }, { status: 500 })
  }
}
