import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HARDCODED_LESSONS, LessonData } from '@/lib/content/lessons-data'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface NewsArticle {
  title: string
  description?: string
  source?: string
}

async function fetchLatestNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('http://localhost:3000/api/news', {
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const data = await res.json()
    // Support both { articles: [...] } and direct array responses
    const articles = Array.isArray(data) ? data : data.articles || data.news || []
    return articles.slice(0, 5).map((a: Record<string, unknown>) => ({
      title: String(a.title || ''),
      description: String(a.description || a.summary || ''),
      source: String(a.source || ''),
    }))
  } catch {
    console.warn('Failed to fetch news for lesson generation')
    return []
  }
}

async function getExistingTitles(supabase: any): Promise<string[]> {
  const hardcodedTitles = HARDCODED_LESSONS.map((l) => l.title)

  if (!supabase) return hardcodedTitles

  try {
    const { data } = await supabase
      .from('lessons')
      .select('title')

    const dbTitles = (data || []).map((row: { title: string }) => row.title)
    return [...hardcodedTitles, ...dbTitles]
  } catch {
    return hardcodedTitles
  }
}

function getNextOrderNum(): number {
  const maxOrder = HARDCODED_LESSONS.reduce((max, l) => Math.max(max, l.order_num), 0)
  return maxOrder + 1
}

function generateFallbackLessons(): LessonData[] {
  const now = new Date()
  const weekLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
  const baseOrder = getNextOrderNum()

  const basicLesson: LessonData = {
    id: `ai-gen-basic-${now.getTime()}`,
    title: `이번 주 시장 맥락 정리 (${weekLabel})`,
    description: '이번 주 주요 시장 이벤트와 핵심 개념을 초보자 관점에서 정리합니다.',
    content: `## Core idea

이번 주 시장에서 주목할 핵심 흐름을 정리합니다. 복잡한 뉴스 속에서 초보자가 먼저 파악해야 할 구조를 잡아봅니다.

### What to watch

1. 이번 주 주요 경제 지표 발표 일정
2. 중앙은행 발언과 정책 시그널
3. 글로벌 자금 흐름의 방향성
4. 위험자산과 안전자산의 상대적 움직임

### Reflection

이번 주 뉴스 중 가장 중요하다고 느낀 한 가지는 무엇이며, 그 이유는 무엇인가요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-ai-basic/800/400',
    read_time: 10,
    required_tier: 'cadet',
    order_num: baseOrder,
    is_ai_generated: true,
    xp: 60,
    tag: 'weekly-context',
  }

  const proLesson: LessonData = {
    id: `ai-gen-pro-${now.getTime()}`,
    title: `이번 주 심층 분석: 시장 구조와 리스크 (${weekLabel})`,
    description: '이번 주 시장 이벤트를 깊이 분석하고 실전 적용 방법을 제시합니다.',
    content: `## Core idea

이번 주 시장 이벤트를 구조적으로 분석합니다. 표면적인 가격 움직임 너머에 있는 메커니즘과 리스크를 탐색합니다.

### What to watch

1. 금리와 유동성 조건의 변화
2. 섹터 로테이션과 자금 재배치
3. 거시 지표와 시장 기대치의 괴리
4. 지정학적 리스크와 공급망 변수

### Practical application

이번 주 분석을 기반으로 자신의 포트폴리오 가정을 점검해보세요. 어떤 가정이 유지되고, 어떤 가정이 수정되어야 하는지 구분합니다.

### Reflection

이번 주 시장에서 가장 과소평가된 리스크는 무엇이라고 생각하나요?`,
    level: 'advanced',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-ai-pro/800/400',
    read_time: 15,
    required_tier: 'navigator',
    order_num: baseOrder + 1,
    is_ai_generated: true,
    xp: 90,
    tag: 'weekly-deep-dive',
  }

  return [basicLesson, proLesson]
}

async function generateWithAnthropic(
  news: NewsArticle[],
  existingTitles: string[]
): Promise<LessonData[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const newsContext = news.length > 0
    ? news.map((n) => `- ${n.title}${n.description ? `: ${n.description}` : ''}`).join('\n')
    : '(최신 뉴스를 가져올 수 없었습니다. 일반적인 시장 맥락을 사용하세요.)'

  const existingTitlesList = existingTitles.slice(0, 20).join(', ')
  const baseOrder = getNextOrderNum()
  const now = new Date()

  const prompt = `당신은 BeyondFleet 교육 시스템의 레슨 작성자입니다. 이번 주 시장 맥락을 기반으로 2개의 레슨을 한국어로 작성해주세요.

## 이번 주 주요 뉴스:
${newsContext}

## 기존 레슨 제목 (중복 방지):
${existingTitlesList}

## 작성 규칙:
1. 각 레슨은 다음 마크다운 형식을 따라야 합니다:
   - ## Core idea (핵심 개념 설명)
   - ### What to watch (관찰 포인트 3-5개, 번호 목록)
   - ### Reflection (성찰 질문 1개)
2. 실제 이번 주 시장 이벤트를 연결하세요
3. 기존 레슨과 제목이 겹치지 않아야 합니다

## 생성할 레슨:

### 레슨 1 (Basic / 초보자용):
- 하나의 개념을 쉽게 설명
- level: "beginner"
- course: "basic"
- required_tier: "cadet"
- read_time: 8-12분
- xp: 50-70

### 레슨 2 (Pro / 심화):
- 더 깊은 분석과 실전 적용
- level: "advanced"
- course: "pro"
- required_tier: "navigator"
- read_time: 12-18분
- xp: 80-100

다음 JSON 형식으로 정확히 응답하세요 (다른 텍스트 없이 JSON만):
[
  {
    "title": "레슨 제목",
    "description": "한 줄 설명",
    "content": "마크다운 본문",
    "level": "beginner",
    "course": "basic",
    "read_time": 10,
    "required_tier": "cadet",
    "xp": 60,
    "tag": "태그"
  },
  {
    "title": "레슨 제목",
    "description": "한 줄 설명",
    "content": "마크다운 본문",
    "level": "advanced",
    "course": "pro",
    "read_time": 15,
    "required_tier": "navigator",
    "xp": 90,
    "tag": "태그"
  }
]`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  const textContent = result.content?.[0]?.text
  if (!textContent) {
    throw new Error('Empty response from Anthropic')
  }

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = textContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  const parsed = JSON.parse(jsonStr) as Array<{
    title: string
    description: string
    content: string
    level: string
    course: string
    read_time: number
    required_tier: string
    xp: number
    tag: string
  }>

  return parsed.map((item, index) => ({
    id: `ai-gen-${item.course}-${now.getTime()}-${index}`,
    title: item.title,
    description: item.description,
    content: item.content,
    level: (item.level || (index === 0 ? 'beginner' : 'advanced')) as LessonData['level'],
    course: (item.course || (index === 0 ? 'basic' : 'pro')) as LessonData['course'],
    thumbnail: `https://picsum.photos/seed/beyondfleet-ai-${item.course}-${now.getTime()}/800/400`,
    read_time: item.read_time || (index === 0 ? 10 : 15),
    required_tier: item.required_tier || (index === 0 ? 'cadet' : 'navigator'),
    order_num: baseOrder + index,
    is_ai_generated: true,
    xp: item.xp || (index === 0 ? 60 : 90),
    tag: item.tag || 'ai-weekly',
  }))
}

async function saveToSupabase(
  supabase: any,
  lessons: LessonData[]
): Promise<void> {
  const { error } = await (supabase as any)
    .from('lessons')
    .upsert(
      lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        content: l.content,
        level: l.level,
        course: l.course,
        thumbnail: l.thumbnail,
        read_time: l.read_time,
        required_tier: l.required_tier,
        order_num: l.order_num,
        is_ai_generated: l.is_ai_generated,
        xp: l.xp,
        tag: l.tag,
        created_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Supabase save error:', error)
    throw new Error(`Failed to save lessons: ${error.message}`)
  }
}

export async function POST() {
  try {
    // 1. Fetch latest news
    const news = await fetchLatestNews()

    // 2. Get existing titles to avoid duplicates
    const supabase = getSupabaseClient()
    const existingTitles = await getExistingTitles(supabase)

    // 3. Generate lessons via Anthropic (with fallback)
    let generatedLessons: LessonData[]
    try {
      generatedLessons = await generateWithAnthropic(news, existingTitles)
    } catch (aiError) {
      console.warn('Anthropic API failed, using fallback lessons:', aiError)
      generatedLessons = generateFallbackLessons()
    }

    // 4. Save to Supabase
    if (supabase) {
      try {
        await saveToSupabase(supabase, generatedLessons)
      } catch (saveError) {
        console.error('Failed to save to Supabase:', saveError)
        // Still return the generated lessons even if save fails
      }
    }

    // 5. Return the generated lessons
    return NextResponse.json({
      success: true,
      lessons: generatedLessons,
      total: generatedLessons.length,
      source: generatedLessons[0]?.id.includes('fallback') || !process.env.ANTHROPIC_API_KEY
        ? 'fallback'
        : 'anthropic',
    })
  } catch (error) {
    console.error('Lesson generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lessons', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
