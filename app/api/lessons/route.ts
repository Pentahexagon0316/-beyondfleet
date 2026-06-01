import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HARDCODED_LESSONS, LessonData } from '@/lib/content/lessons-data'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseFilter = searchParams.get('course') || 'all' // 'basic' | 'pro' | 'all'
    const includeAi = searchParams.get('include_ai') !== 'false' // default true

    // Start with hardcoded lessons
    const lessonsById = new Map<string, LessonData>()
    for (const lesson of HARDCODED_LESSONS) {
      lessonsById.set(lesson.id, lesson)
    }

    // Try to fetch from Supabase and merge (DB lessons don't override hardcoded ones)
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const { data: dbLessons, error } = await supabase
          .from('lessons')
          .select('*')
          .order('order_num', { ascending: true })

        if (!error && dbLessons && dbLessons.length > 0) {
          for (const dbLesson of dbLessons) {
            // Hardcoded lessons take priority — only add DB lessons that aren't already present
            if (!lessonsById.has(dbLesson.id)) {
              lessonsById.set(dbLesson.id, {
                id: dbLesson.id,
                title: dbLesson.title,
                description: dbLesson.description || '',
                content: dbLesson.content || '',
                level: dbLesson.level || 'beginner',
                course: dbLesson.course || 'basic',
                thumbnail: dbLesson.thumbnail || '',
                read_time: dbLesson.read_time || 10,
                required_tier: dbLesson.required_tier || 'cadet',
                order_num: dbLesson.order_num || 99,
                is_ai_generated: dbLesson.is_ai_generated ?? true,
                xp: dbLesson.xp || 70,
                tag: dbLesson.tag || '',
              } satisfies LessonData)
            }
          }
        }
      } catch {
        // Graceful fallback — table may not exist yet; just use hardcoded lessons
        console.warn('Supabase lessons table not available, using hardcoded lessons only')
      }
    }

    // Convert to array
    let lessons = Array.from(lessonsById.values())

    // Strict validator blocklist to scrub out speculative/crypto-focused lessons and keywords
    const BANNED_LESSON_TITLES = [
      '지갑 만들기 가이드',
      '첫 거래하기',
      '스테이킹 가이드',
      '기술적 분석 심화',
      '투자 전략과 포트폴리오',
      'NFT 이해하기',
      'DeFi 기초',
      '온체인 데이터 분석',
      '스마트 컨트랙트 이해',
    ]

    const BANNED_KEYWORDS = [
      '첫 거래',
      '스테이킹',
      'NFT',
      'DeFi',
      '기술적 분석',
      '투자 전략',
      '포트폴리오 관리',
      '수익 창출',
    ]

    lessons = lessons.filter((l) => {
      // 1. Check title against exact blocklist
      if (BANNED_LESSON_TITLES.includes(l.title)) return false

      // 2. Check title/description/content for forbidden keywords
      const titleLower = l.title.toLowerCase()
      const descLower = (l.description || '').toLowerCase()
      const contentLower = (l.content || '').toLowerCase()

      const hasBannedWord = BANNED_KEYWORDS.some((kw) => {
        const kwLower = kw.toLowerCase()
        return (
          titleLower.includes(kwLower) ||
          descLower.includes(kwLower) ||
          contentLower.includes(kwLower)
        )
      })

      return !hasBannedWord
    })

    // Filter by course
    if (courseFilter === 'basic' || courseFilter === 'pro') {
      lessons = lessons.filter((l) => l.course === courseFilter)
    }

    // Filter AI-generated lessons if requested
    if (!includeAi) {
      lessons = lessons.filter((l) => !l.is_ai_generated)
    }

    // Sort by order_num
    lessons.sort((a, b) => a.order_num - b.order_num)

    return NextResponse.json({
      lessons,
      total: lessons.length,
      course: courseFilter,
    })
  } catch (error) {
    console.error('Lessons API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}
