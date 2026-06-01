import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  buildRecommendations,
  BriefRecommendationInput,
  AssumptionSignalInput,
  LearningProgressRow,
  ReflectionSignalInput,
  RecentItemRow,
  SavedLessonRow,
} from '@/lib/personalization/recommendation-engine'

export const dynamic = 'force-dynamic'

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

function getBearerToken(request: NextRequest) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null
}

async function getUserId(request: NextRequest, supabase: SupabaseClient) {
  const token = getBearerToken(request)
  if (!token) return null

  const { data: { user } } = await supabase.auth.getUser(token)
  return user?.id || null
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    const recommendations = buildRecommendations({
      progress: [],
      savedLessons: [],
      recentItems: [],
      briefs: [],
      reflections: [],
      assumptions: [],
    })

    return NextResponse.json({
      ...recommendations,
      mode: 'guest',
      generatedAt: new Date().toISOString(),
    })
  }

  const userId = await getUserId(request, supabase)
  const nowIso = new Date().toISOString()

  try {
    const [progressResult, savedResult, recentResult, briefsResult, reflectionsResult, assumptionsResult] = await Promise.all([
      userId
        ? supabase
          .from('learning_progress')
          .select('lesson_id, track_id, completed, last_viewed_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(80)
        : Promise.resolve({ data: [], error: null }),
      userId
        ? supabase
          .from('learning_saved_lessons')
          .select('lesson_id, track_id')
          .eq('user_id', userId)
          .order('saved_at', { ascending: false })
          .limit(40)
        : Promise.resolve({ data: [], error: null }),
      userId
        ? supabase
          .from('learning_recent_items')
          .select('item_type, item_id, title, href, viewed_at, metadata')
          .eq('user_id', userId)
          .order('viewed_at', { ascending: false })
          .limit(40)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('daily_briefs')
        .select('id, date, title, summary, category, tags, is_premium, is_featured, market_sentiment, scheduled_for, what_happened, why_it_matters, second_order_effects, risk_conditions, reflection_prompt, related_lesson_ids')
        .eq('is_published', true)
        .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
        .order('is_featured', { ascending: false })
        .order('date', { ascending: false })
        .limit(24),
      userId
        ? supabase
          .from('daily_reflections')
          .select('prompt, content, title, insight_type, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        : Promise.resolve({ data: [], error: null }),
      userId
        ? supabase
          .from('saved_assumptions')
          .select('assumption, revisit_trigger, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (progressResult.error) throw progressResult.error
    if (savedResult.error) throw savedResult.error
    if (recentResult.error) throw recentResult.error
    if (reflectionsResult.error) {
      console.warn('Reflection continuity unavailable:', reflectionsResult.error.message)
    }
    if (assumptionsResult.error) {
      console.warn('Assumption continuity unavailable:', assumptionsResult.error.message)
    }

    // If briefs query fails (missing columns in DB), use empty array as fallback
    let briefsData: any[] = briefsResult.data || []
    if (briefsResult.error) {
      console.warn('Briefs query failed, using fallback:', briefsResult.error.message)
      // Try a simpler query with basic columns only
      try {
        const { data: simpleBriefs } = await supabase
          .from('daily_briefs')
          .select('id, date, title, summary, is_published')
          .eq('is_published', true)
          .order('date', { ascending: false })
          .limit(24)
        briefsData = simpleBriefs || []
      } catch {
        briefsData = []
      }
    }

    const recommendations = buildRecommendations({
      progress: (progressResult.data || []) as LearningProgressRow[],
      savedLessons: (savedResult.data || []) as SavedLessonRow[],
      recentItems: (recentResult.data || []) as RecentItemRow[],
      briefs: briefsData as BriefRecommendationInput[],
      reflections: (reflectionsResult.error ? [] : reflectionsResult.data || []) as ReflectionSignalInput[],
      assumptions: (assumptionsResult.error ? [] : assumptionsResult.data || []) as AssumptionSignalInput[],
    })

    if (userId) {
      await supabase
        .from('user_interest_profiles')
        .upsert({
          user_id: userId,
          topics: recommendations.interestProfile.topics,
          dominant_track: recommendations.interestProfile.dominantTrack,
          learning_stage: recommendations.interestProfile.learningStage,
          confidence: recommendations.interestProfile.confidence,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
    }

    return NextResponse.json({
      ...recommendations,
      mode: userId ? 'personalized' : 'guest',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Recommendation engine error:', error)
    // Graceful fallback: return guest recommendations instead of 500
    const fallback = buildRecommendations({
      progress: [],
      savedLessons: [],
      recentItems: [],
      briefs: [],
      reflections: [],
      assumptions: [],
    })
    return NextResponse.json({
      ...fallback,
      mode: 'guest',
      generatedAt: new Date().toISOString(),
    })
  }
}
