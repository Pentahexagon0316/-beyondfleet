// AI Daily Brief 생성 API
// POST /api/cosmic-radar/daily-brief/generate

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { collectMarketData, formatPrice } from '@/lib/api/binance'
import {
  BRIEF_GENERATION_CONSTRAINTS,
  EDITORIAL_SURFACE_LIMITS,
  compactText,
  normalizeReflectionPrompt,
} from '@/lib/content/editorial-discipline'
import { EPISTEMIC_GENERATION_CONSTRAINTS } from '@/lib/content/epistemic-clarity'
import { EDITORIAL_INTUITION_CONSTRAINTS } from '@/lib/content/editorial-intuition'
import { EDITORIAL_SELECTIVITY_CONSTRAINTS } from '@/lib/content/editorial-selectivity'
import { EDITORIAL_SUSTAINABILITY_CONSTRAINTS } from '@/lib/content/editorial-sustainability'
import { EDITORIAL_OPERATIONS_CALMNESS_CONSTRAINTS } from '@/lib/content/editorial-operations-calmness'
import { PUBLICATION_MEMORY_CONSTRAINTS } from '@/lib/content/publication-memory'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60초 타임아웃

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const DEFAULT_REFLECTION_PROMPT = 'What feels less certain now?'

// Supabase 클라이언트 lazy loading
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function generateLocalDailyBrief(marketData: {
  prices: Record<string, { price: number; changePercent24h: number; high24h: number; low24h: number }>
  fearGreedIndex: number
}) {
  const { prices, fearGreedIndex } = marketData
  const btcPrice = prices.btc?.price?.toLocaleString() || '68,500'
  const btcChange = prices.btc?.changePercent24h?.toFixed(2) || '0.00'
  
  return {
    summary: '인플레이션 기대 안정과 연준 금리 인하 확률 점검 속에서 글로벌 매크로 유동성의 숨고르기 흐름이 포착되었습니다.',
    whatHappened: `최근 위험자산 프록시인 비트코인(BTC)은 $${btcPrice} (${btcChange}%) 수준을 횡보하며 단기 차익 실현 물량과 장기 패시브 펀드 유입 사이의 힘겨루기를 보이고 있습니다. 공포 탐욕 지수는 ${fearGreedIndex}/100으로 시장의 과열 심리가 다소 진정된 중립 구간에 머물러 있습니다.`,
    whyItMatters: '시장 가격의 단순한 횡보보다 중요한 것은 채권 금리와 실질 금리의 안정적 보합세입니다. 이는 연준의 매파적 긴축 우려가 시장 가격에 대부분 반영되었으며, 자본 배분가들이 서서히 다음 단계를 대비하고 있음을 시사합니다.',
    secondOrderEffects: '단기 자금 유입이 둔화되는 반면, 주요 가상자산 ETF 및 대형 주소들의 콜드월렛 인출이 늘어나며 유통 유동성 공급 부족 현상이 심화될 가능성이 존재합니다. 이는 공급망 쇼크와 유사한 온체인 공급 압박을 가할 수 있습니다.',
    riskConditions: '미국 노동 지표가 예상치를 상회하여 인플레이션 재점화 가능성이 거론되거나, 실질 금리가 급격하게 재상승하는 조건이 갖춰진다면 이와 같은 장기 매집 가설의 타당성은 크게 훼손될 수 있습니다.',
    reflectionPrompt: '시장의 가격 횡보 국면에서 나를 불안하게 만드는 가장 큰 단기적인 소음은 무엇인가요?',
    relatedLessonIds: ['macro-foundations-liquidity', 'risk-thinking-second-order'],
    fullContent: `## What changed
최근 위험자산 프록시인 비트코인(BTC)은 $${btcPrice} (${btcChange}%) 수준을 횡보하며 단기 차익 실현 물량과 장기 패시브 펀드 유입 사이의 힘겨루기를 보이고 있습니다. 공포 탐욕 지수는 ${fearGreedIndex}/100으로 시장의 과열 심리가 다소 진정된 중립 구간에 머물러 있습니다.

## Why it may matter
시장 가격의 단순한 횡보보다 중요한 것은 채권 금리와 실질 금리의 안정적 보합세입니다. 이는 연준의 매파적 긴축 우려가 시장 가격에 대부분 반영되었으며, 자본 배분가들이 서서히 다음 단계를 대비하고 있음을 시사합니다.

## What could change next
단기 자금 유입이 둔화되는 반면, 주요 가상자산 ETF 및 대형 주소들의 콜드월렛 인출이 늘어나며 유통 유동성 공급 부족 현상이 심화될 가능성이 존재합니다. 이는 공급망 쇼크와 유사한 온체인 공급 압박을 가할 수 있습니다.

## What remains unclear
미국 노동 지표가 예상치를 상회하여 인플레이션 재점화 가능성이 거론되거나, 실질 금리가 급격하게 재상승하는 조건이 갖춰진다면 이와 같은 장기 매집 가설의 타당성은 크게 훼손될 수 있습니다.

## Question to carry forward
시장의 가격 횡보 국면에서 나를 불안하게 만드는 가장 큰 단기적인 소음은 무엇인가요?`,
    sentiment: 'neutral',
    predictions: ['미 채권금리 변동성 확인', '연준 의원 주요 발언 트래킹', '현물 ETF 순유입 추이 점검'],
  }
}

// Claude API로 판단 중심 Daily Brief 생성
async function generateAnalysisWithClaude(marketData: {
  prices: Record<string, { price: number; changePercent24h: number; high24h: number; low24h: number }>
  fearGreedIndex: number
}): Promise<{
  summary: string
  fullContent: string
  sentiment: string
  predictions: string[]
  whatHappened: string
  whyItMatters: string
  secondOrderEffects: string
  riskConditions: string
  reflectionPrompt: string
  relatedLessonIds: string[]
}> {
  const { prices, fearGreedIndex: crowdStressIndex } = marketData

  const prompt = `당신은 BeyondFleet의 거시경제, AI 경제, 리스크 사고를 다루는 Daily Brief 에디터입니다.
 
목표는 사용자가 더 빠르게 반응하게 만드는 것이 아니라 더 명확하게 판단하도록 돕는 것입니다.
아래 데이터는 위험 선호, 유동성 분위기, 시장 심리를 읽기 위한 보조 프록시입니다.
매수/매도 조언, 과장된 수익 표현, 단기 가격 예측, 자극적인 표현은 금지합니다.
 
${BRIEF_GENERATION_CONSTRAINTS}
 
${EPISTEMIC_GENERATION_CONSTRAINTS}
 
${EDITORIAL_INTUITION_CONSTRAINTS}
 
${EDITORIAL_SELECTIVITY_CONSTRAINTS}
 
${EDITORIAL_SUSTAINABILITY_CONSTRAINTS}
 
${EDITORIAL_OPERATIONS_CALMNESS_CONSTRAINTS}
 
${PUBLICATION_MEMORY_CONSTRAINTS}
 
## 보조 시장 데이터
- Risk asset proxy A: $${prices.btc?.price?.toLocaleString() || 'N/A'} (24h: ${prices.btc?.changePercent24h?.toFixed(2) || 0}%)
- Risk asset proxy B: $${prices.eth?.price?.toLocaleString() || 'N/A'} (24h: ${prices.eth?.changePercent24h?.toFixed(2) || 0}%)
- High-beta liquidity proxy: $${prices.sol?.price?.toLocaleString() || 'N/A'} (24h: ${prices.sol?.changePercent24h?.toFixed(2) || 0}%)
- Cross-border risk proxy: $${prices.xrp?.price?.toLocaleString() || 'N/A'} (24h: ${prices.xrp?.changePercent24h?.toFixed(2) || 0}%)
- Crowd Stress Proxy: ${crowdStressIndex}/100
 
## 요청사항
다음 JSON 형식으로 응답해주세요:
 
{
  "summary": "오늘의 핵심 판단 요약. ${EDITORIAL_SURFACE_LIMITS.summaryMaxChars}자 이내.",
  "whatHappened": "What changed. 관찰 가능한 변화, 데이터, 정책, 자금 흐름을 ${EDITORIAL_SURFACE_LIMITS.sectionMaxChars}자 이내로 설명",
  "whyItMatters": "Why it may matter. 이 변화가 왜 중요할 수 있는지 ${EDITORIAL_SURFACE_LIMITS.sectionMaxChars}자 이내로 설명. 사실처럼 단정하지 말 것",
  "secondOrderEffects": "What could change next. 다음 행동, 정책 반응, 자본 배분 변화가 어떻게 달라질 수 있는지 ${EDITORIAL_SURFACE_LIMITS.sectionMaxChars}자 이내로 설명",
  "riskConditions": "What remains unclear. 무엇이 아직 불확실하고 이 관점이 약해지는 조건을 ${EDITORIAL_SURFACE_LIMITS.sectionMaxChars}자 이내로 설명",
  "reflectionPrompt": "Question to carry forward. 사용자가 오늘 기록할 수 있는 차분한 질문 1개. ${EDITORIAL_SURFACE_LIMITS.reflectionPromptMaxChars}자 이내.",
  "relatedLessonIds": ["관련 학습 lesson id 0~${EDITORIAL_SURFACE_LIMITS.relatedLessonsMax}개. 신호가 약하면 비워도 됨"],
  "fullContent": "마크다운 형식. 반드시 ## What changed, ## Why it may matter, ## What could change next, ## What remains unclear, ## Question to carry forward 섹션을 포함",
  "sentiment": "bullish 또는 bearish 또는 neutral 중 하나",
  "predictions": ["관찰할 조건 1", "관찰할 조건 2", "관찰할 조건 3"]
}
 
사용 가능한 lesson id:
- macro-foundations-liquidity
- macro-foundations-rates
- macro-foundations-inflation
- macro-foundations-bonds
- macro-foundations-dollar
- macro-foundations-events
- ai-economy-compute
- ai-economy-productivity
- ai-economy-data
- ai-economy-agents
- risk-thinking-probability
- risk-thinking-second-order
- risk-thinking-bias
- risk-thinking-risk-management
 
톤은 차분하고 신뢰감 있게 작성하고, 한국어로 작성해주세요.
어제와 오늘의 연속성을 느낄 수 있도록 "무엇이 달라졌는지"와 "어떤 가정을 재검토해야 하는지"를 분명하게 작성해주세요.
가능하면 지난 질문이 아직 의미 있는지, 조용히 사라져도 되는지, 또는 다음 브리프로 carry forward할 가치가 있는지 한 문장 안에서만 다뤄주세요.
단, 중요하지 않은 움직임이라면 과도하게 의미를 만들지 말고 "크게 달라진 것은 많지 않다"는 판단도 허용합니다.`

  let content: string
  try {
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('your_') || ANTHROPIC_API_KEY.includes('sk-ant-j_') || ANTHROPIC_API_KEY.length < 30) {
      console.warn('Anthropic API Key is not configured or mock. Using high-signal local daily brief fallback...')
      return generateLocalDailyBrief(marketData)
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn('Claude API returned error, using safe local daily brief fallback:', error)
      return generateLocalDailyBrief(marketData)
    }

    const data = await response.json()
    content = data.content[0].text
  } catch (aiError) {
    console.warn('Error during daily brief generation, executing local fallback:', aiError)
    return generateLocalDailyBrief(marketData)
  }

  const DEFAULT_REFLECTION_PROMPT = 'What feels less certain now?'

  // JSON 파싱 시도
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: compactText(parsed.summary || content, EDITORIAL_SURFACE_LIMITS.summaryMaxChars),
        fullContent: parsed.fullContent || content,
        sentiment: parsed.sentiment || 'neutral',
        predictions: Array.isArray(parsed.predictions) ? parsed.predictions.slice(0, 3) : ['유동성 조건 확인', '정책 반응 확인', '리스크 조건 재점검'],
        whatHappened: compactText(parsed.whatHappened || parsed.summary || content, EDITORIAL_SURFACE_LIMITS.sectionMaxChars),
        whyItMatters: compactText(parsed.whyItMatters || '이 변화가 거시 판단과 장기 의사결정에 중요한 이유를 확인합니다.', EDITORIAL_SURFACE_LIMITS.sectionMaxChars),
        secondOrderEffects: compactText(parsed.secondOrderEffects || '다음 행동, 정책 반응, 자본 배분 변화가 어디서 생길지 봅니다.', EDITORIAL_SURFACE_LIMITS.sectionMaxChars),
        riskConditions: compactText(parsed.riskConditions || '이 관점이 틀릴 조건과 과소평가된 리스크를 먼저 분리합니다.', EDITORIAL_SURFACE_LIMITS.sectionMaxChars),
        reflectionPrompt: normalizeReflectionPrompt(parsed.reflectionPrompt, DEFAULT_REFLECTION_PROMPT),
        relatedLessonIds: Array.isArray(parsed.relatedLessonIds)
          ? parsed.relatedLessonIds.slice(0, EDITORIAL_SURFACE_LIMITS.relatedLessonsMax)
          : ['risk-thinking-second-order', 'macro-foundations-liquidity'],
      }
    }
    throw new Error('No JSON found in response')
  } catch {
    // JSON 파싱 실패 시 기본값 반환
    return {
      summary: compactText(content, EDITORIAL_SURFACE_LIMITS.summaryMaxChars),
      fullContent: content,
      sentiment: 'neutral',
      predictions: ['유동성 조건 확인', '정책 반응 확인', '리스크 조건 재점검'],
      whatHappened: compactText(content, EDITORIAL_SURFACE_LIMITS.sectionMaxChars),
      whyItMatters: '오늘의 변화가 장기 판단과 리스크 조건에 어떤 의미를 갖는지 확인해야 합니다.',
      secondOrderEffects: '첫 번째 시장 반응보다 다음 정책, 자금 흐름, 행동 변화가 더 중요할 수 있습니다.',
      riskConditions: '핵심 전제가 바뀌는 조건을 따로 기록해야 합니다.',
      reflectionPrompt: DEFAULT_REFLECTION_PROMPT,
      relatedLessonIds: ['risk-thinking-second-order', 'macro-foundations-liquidity'],
    }
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    // Cron secret 또는 admin 인증 확인
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Admin 체크 (간단 버전)
      const token = authHeader?.replace('Bearer ', '')
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }
      } else if (cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const today = new Date().toISOString().split('T')[0]

    // 오늘 이미 생성된 리포트가 있는지 확인
    const { data: existing } = await supabase
      .from('daily_briefs')
      .select('id')
      .eq('date', today)
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        message: '오늘의 리포트가 이미 존재합니다',
        date: today,
      })
    }

    // 시장 데이터 수집
    const marketData = await collectMarketData()

    // Claude API로 분석 생성
    const analysis = await generateAnalysisWithClaude({
      prices: marketData.prices as unknown as Record<string, { price: number; changePercent24h: number; high24h: number; low24h: number }>,
      fearGreedIndex: marketData.fearGreedIndex,
    })

    // 자동 생성된 브리핑을 오늘의 브리핑으로 고정
    await supabase
      .from('daily_briefs')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .eq('is_featured', true)

    // DB에 저장
    const { data: brief, error } = await supabase
      .from('daily_briefs')
      .insert({
        date: today,
        title: `${today} Daily Judgment Brief`,
        summary: analysis.summary,
        full_content: analysis.fullContent,
        what_happened: analysis.whatHappened,
        why_it_matters: analysis.whyItMatters,
        second_order_effects: analysis.secondOrderEffects,
        risk_conditions: analysis.riskConditions,
        reflection_prompt: analysis.reflectionPrompt,
        market_sentiment: analysis.sentiment,
        btc_price: marketData.prices.btc.price,
        eth_price: marketData.prices.eth.price,
        btc_change_24h: marketData.prices.btc.changePercent24h,
        eth_change_24h: marketData.prices.eth.changePercent24h,
        fear_greed_index: marketData.fearGreedIndex,
        predictions: analysis.predictions,
        related_lesson_ids: analysis.relatedLessonIds,
        category: 'macro',
        tags: ['ai-generated', 'daily-brief', 'macro', 'reflection'],
        is_premium: false,
        is_published: true,
        is_featured: true,
        editorial_quality_score: 75,
        reading_level: 'foundational',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving daily brief:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      brief,
      marketData: {
        riskAssetA: formatPrice(marketData.prices.btc.price),
        riskAssetB: formatPrice(marketData.prices.eth.price),
        crowdStressIndex: marketData.fearGreedIndex,
      },
    })

  } catch (error) {
    console.error('Daily brief generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
