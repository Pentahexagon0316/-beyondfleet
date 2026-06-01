import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface FormattedNews {
  id: string
  title: string
  summary: string
  category: string
  source: string
  source_url: string
  image_url: string
  published_at: string
  is_premium: boolean
  premium_category: string | null
  required_tier: string | null
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

// --- In-memory caches ---
const newsCache: { data: FormattedNews[]; expires: number } = { data: [], expires: 0 }
const NEWS_CACHE_TTL = 5 * 60 * 1000 // 5분

const aiSummaryCache = new Map<string, { data: FormattedNews['ai_summary']; expires: number }>()
const AI_CACHE_TTL = 30 * 60 * 1000 // 30분 (AI 비용 절약)

function getCachedSummary(newsId: string): FormattedNews['ai_summary'] | undefined {
  const cached = aiSummaryCache.get(newsId)
  if (cached && cached.expires > Date.now()) return cached.data
  if (cached) aiSummaryCache.delete(newsId)
  return undefined
}

function setCachedSummary(newsId: string, summary: FormattedNews['ai_summary']) {
  if (aiSummaryCache.size > 200) {
    const now = Date.now()
    for (const [key, val] of aiSummaryCache) {
      if (val.expires < now) aiSummaryCache.delete(key)
    }
  }
  aiSummaryCache.set(newsId, { data: summary, expires: Date.now() + AI_CACHE_TTL })
}

// RSS 피드 소스 목록 (거시경제 + 크립토 + 한국경제)
const RSS_SOURCES = [
  // 거시경제
  {
    url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',
    name: 'CNBC Economy',
    defaultCategory: 'macro',
  },
  {
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    name: 'Bloomberg Markets',
    defaultCategory: 'markets',
  },
  {
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',
    name: 'Reuters',
    defaultCategory: 'macro',
  },
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    name: 'Federal Reserve',
    defaultCategory: 'macro',
  },
  {
    url: 'https://finance.yahoo.com/news/rssindex',
    name: 'Yahoo Finance',
    defaultCategory: 'markets',
  },
  // 한국 경제
  {
    url: 'https://www.hankyung.com/feed/economy',
    name: '한국경제',
    defaultCategory: 'macro',
  },
  // 크립토
  {
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    name: 'CoinDesk',
    defaultCategory: 'crypto',
  },
  {
    url: 'https://cointelegraph.com/rss',
    name: 'CoinTelegraph',
    defaultCategory: 'crypto',
  },
  {
    url: 'https://www.theblock.co/rss.xml',
    name: 'The Block',
    defaultCategory: 'crypto',
  },
]

// XML에서 RSS 아이템 파싱 (가벼운 정규식 기반)
function parseRSSItems(xml: string, sourceName: string): Array<{
  title: string
  link: string
  description: string
  pubDate: string
  imageUrl: string
}> {
  const items: Array<{
    title: string
    link: string
    description: string
    pubDate: string
    imageUrl: string
  }> = []

  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]

    const getTag = (tag: string): string => {
      // CDATA 지원
      const cdataMatch = itemXml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'))
      if (cdataMatch) return cdataMatch[1].trim()
      const simpleMatch = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return simpleMatch ? simpleMatch[1].trim() : ''
    }

    // 이미지 추출: media:content, enclosure, 또는 description 내 img 태그
    let imageUrl = ''
    const mediaMatch = itemXml.match(/url="([^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i)
    if (mediaMatch) imageUrl = mediaMatch[1]
    if (!imageUrl) {
      const imgMatch = getTag('description').match(/<img[^>]+src="([^"]+)"/)
      if (imgMatch) imageUrl = imgMatch[1]
    }

    const title = getTag('title').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
    const link = getTag('link')
    const description = getTag('description').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim()
    const pubDate = getTag('pubDate')

    if (title && link) {
      items.push({ title, link, description, pubDate, imageUrl })
    }
  }

  return items
}

function cleanTickers(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/\b(FIGR_HELOC|HYPE|RAIN|WBT|USDS|XMR|ZEC|LEO)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// 카테고리 자동 감지 (Macro, AI, Technology, Policy, Markets, Consumer, Energy, Crypto)
function detectCategory(title: string, body: string): string {
  const c = (title + ' ' + body).toLowerCase()

  // 1. AI
  if (
    c.includes('ai ') || c.includes('artificial intelligence') || c.includes('gpt') ||
    c.includes('claude') || c.includes('openai') || c.includes('nvidia') ||
    c.includes('comput') || c.includes('deep learning') || c.includes('machine learning') ||
    c.includes('llm') || c.includes('인공지능') || c.includes('엔비디아') ||
    c.includes('거대언어모델') || c.includes('챗gpt')
  ) return 'ai'

  // 2. Crypto
  if (
    c.includes('bitcoin') || c.includes('btc') || c.includes('ethereum') ||
    c.includes('eth ') || c.includes('crypto') || c.includes('solana') ||
    c.includes('xrp') || c.includes('blockchain') || c.includes('token') ||
    c.includes('defi') || c.includes('nft') || c.includes('비트코인') ||
    c.includes('이더리움') || c.includes('가상자산') || c.includes('암호화폐') ||
    c.includes('블록체인')
  ) return 'crypto'

  // 3. Policy
  if (
    c.includes('sec ') || c.includes('regulation') || c.includes('lawsuit') ||
    c.includes('court') || c.includes('cftc') || c.includes('legal') ||
    c.includes('compliance') || c.includes('policy') || c.includes('bill ') ||
    c.includes('governm') || c.includes('규제') || c.includes('정책') ||
    c.includes('기소') || c.includes('법안') || c.includes('승인') ||
    c.includes('가이드라인')
  ) return 'policy'

  // 4. Energy
  if (
    c.includes('energy') || c.includes('oil') || c.includes('crude') ||
    c.includes('gas') || c.includes('electricity') || c.includes('power') ||
    c.includes('opec') || c.includes('solar') || c.includes('wind') ||
    c.includes('에너지') || c.includes('유가') || c.includes('원유') ||
    c.includes('천연가스') || c.includes('전력') || c.includes('발전')
  ) return 'energy'

  // 5. Consumer
  if (
    c.includes('consumer') || c.includes('retail') || c.includes('spending') ||
    c.includes('shopping') || c.includes('household') || c.includes('demograph') ||
    c.includes('소비자') || c.includes('소매') || c.includes('지출') ||
    c.includes('가계') || c.includes('인구') || c.includes('구매력')
  ) return 'consumer'

  // 6. Macro
  if (
    c.includes('fed ') || c.includes('federal reserve') || c.includes('inflation') ||
    c.includes('interest rate') || c.includes('rate cut') || c.includes('rate hike') ||
    c.includes('macro') || c.includes('gdp') || c.includes('unemployment') ||
    c.includes('economy') || c.includes('economic') || c.includes('treasury') ||
    c.includes('bond yield') || c.includes('central bank') || c.includes('ecb') ||
    c.includes('bank of japan') || c.includes('boj') || c.includes('한은') ||
    c.includes('금리') || c.includes('물가') || c.includes('경제') || c.includes('성장률') ||
    c.includes('cpi') || c.includes('pce') || c.includes('fomc') || c.includes('jackson hole') ||
    c.includes('recession') || c.includes('soft landing') || c.includes('hard landing') ||
    c.includes('trade war') || c.includes('tariff') || c.includes('sanctions') ||
    c.includes('debt ceiling') || c.includes('deficit') || c.includes('fiscal') ||
    c.includes('labor market') || c.includes('wage')
  ) return 'macro'

  // 7. Markets
  if (
    c.includes('s&p 500') || c.includes('dow jones') || c.includes('nasdaq') ||
    c.includes('stock market') || c.includes('wall street') || c.includes('earnings') ||
    c.includes('revenue') || c.includes('market index') || c.includes('증시') ||
    c.includes('주식시장') || c.includes('나스닥') || c.includes('코스피') ||
    c.includes('실적') || c.includes('주가') || c.includes('자금') ||
    c.includes('흐름') || c.includes('매수') || c.includes('매도')
  ) return 'markets'

  // 8. Technology (그 외 기술/IT 키워드)
  if (
    c.includes('technology') || c.includes('tech ') || c.includes('software') ||
    c.includes('hardware') || c.includes('semiconductor') || c.includes('internet') ||
    c.includes('cyber') || c.includes('security') || c.includes('혁신') ||
    c.includes('기술') || c.includes('소프트웨어') || c.includes('반도체')
  ) return 'technology'

  return 'macro'
}

// 프리미엄 감지
const PREMIUM_KEYWORDS: Record<string, string[]> = {
  institution: ['blackrock', 'fidelity', 'grayscale', 'institutional', 'microstrategy', 'custody'],
  whale: ['whale', 'large transfer', 'dormant wallet', 'billion transferred'],
  analysis: ['analysis', 'technical analysis', 'on-chain', 'report'],
  prediction: ['prediction', 'forecast', 'outlook', 'price target'],
  etf: ['etf', 'exchange-traded', 'spot bitcoin etf', 'ethereum etf'],
}

function detectPremium(title: string, body: string): { isPremium: boolean; category: string | null; tier: string | null } {
  const c = (title + ' ' + body).toLowerCase()
  for (const [cat, keywords] of Object.entries(PREMIUM_KEYWORDS)) {
    for (const kw of keywords) {
      if (c.includes(kw)) {
        const tier = cat === 'analysis' ? 'commander' : cat === 'prediction' || cat === 'whale' || cat === 'etf' ? 'pilot' : 'navigator'
        return { isPremium: true, category: cat, tier }
      }
    }
  }
  return { isPremium: false, category: null, tier: null }
}

// 뉴스 → 학습 레슨 자동 매핑
function detectRelatedLesson(title: string, body: string, category: string): FormattedNews['related_lesson'] {
  const c = (title + ' ' + body).toLowerCase()

  const mappings: Array<{ test: RegExp; lesson: { id: string; title: string } }> = [
    { test: /rate|금리|interest|fed |fomc|central bank/i, lesson: { id: 'macro-foundations-rates', title: 'Rates: 금리와 할인율' } },
    { test: /inflation|cpi|pce|물가|consumer price/i, lesson: { id: 'macro-foundations-inflation', title: 'Inflation: 물가와 기대의 차이' } },
    { test: /liquidity|유동성|qe|quantitative|money supply/i, lesson: { id: 'macro-foundations-liquidity', title: 'Liquidity: 유동성의 흐름' } },
    { test: /bond|treasury|yield curve|채권|국채/i, lesson: { id: 'macro-foundations-bonds', title: 'Bonds: 채권금리와 경기 신호' } },
    { test: /dollar|dxy|원화|환율|usd|forex|currency/i, lesson: { id: 'macro-foundations-dollar', title: 'Dollar: 강달러와 약달러' } },
    { test: /cpi release|fomc meeting|jobs report|고용|이벤트/i, lesson: { id: 'macro-foundations-events', title: 'Event Calendar: CPI, FOMC, 고용지표' } },
    { test: /gpu|nvidia|ai compute|data center|전력|반도체/i, lesson: { id: 'ai-economy-compute', title: 'Compute: GPU, 전력, 데이터센터' } },
    { test: /automation|automat|ai replac|자동화|일자리/i, lesson: { id: 'ai-economy-productivity', title: 'Automation: 일이 재배치되는 방식' } },
    { test: /ai agent|ai 에이전트|autonomous/i, lesson: { id: 'ai-economy-agents', title: 'AI Agents: 의사결정 자동화' } },
    { test: /bias|편향|fomo|panic|공포|탐욕/i, lesson: { id: 'risk-thinking-bias', title: 'Cognitive Bias: 인지 편향' } },
    { test: /risk|위험|hedge|헤지|손실/i, lesson: { id: 'risk-thinking-risk-management', title: 'Risk Management: 리스크 관리' } },
  ]

  for (const m of mappings) {
    if (m.test.test(c)) return m.lesson
  }

  // 카테고리 기반 폴백
  if (category === 'macro' || category === 'markets') return { id: 'macro-foundations-liquidity', title: 'Liquidity: 유동성의 흐름' }
  if (category === 'crypto') return { id: 'risk-thinking-probability', title: 'Probabilistic Thinking: 확률로 보기' }
  if (category === 'policy') return { id: 'risk-thinking-second-order', title: 'Second-Order Thinking: 다음 반응 보기' }
  if (category === 'ai' || category === 'technology') return { id: 'ai-economy-compute', title: 'Compute: GPU, 전력, 데이터센터' }

  return null
}

// RSS에서 뉴스 가져오기
async function fetchAllNews(): Promise<FormattedNews[]> {
  // 캐시 확인
  if (newsCache.expires > Date.now() && newsCache.data.length > 0) {
    return newsCache.data
  }

  const allNews: FormattedNews[] = []

  for (const source of RSS_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: {
          'User-Agent': 'BeyondFleet/1.0 (News Aggregator)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) continue

      const xml = await res.text()
      const items = parseRSSItems(xml, source.name)

      for (const item of items.slice(0, 50)) {
        try {
          const title = cleanTickers(item.title)
          const descText = item.description || ''
          const summary = cleanTickers(descText.slice(0, 200) + (descText.length > 200 ? '...' : ''))
          const category = detectCategory(title, descText)
          const premium = detectPremium(title, descText)
          const resolvedCategory = category === 'all' ? source.defaultCategory : category

          let publishedAt = new Date().toISOString()
          if (item.pubDate) {
            try {
              const d = new Date(item.pubDate)
              if (!isNaN(d.getTime())) {
                publishedAt = d.toISOString()
              }
            } catch (e) {
              // Ignore date parse errors
            }
          }

          allNews.push({
            id: Buffer.from(item.link + '|' + title).toString('base64url').slice(-40),
            title,
            summary,
            category: resolvedCategory,
            source: source.name,
            source_url: item.link,
            image_url: item.imageUrl || '',
            published_at: publishedAt,
            is_premium: premium.isPremium,
            premium_category: premium.category,
            required_tier: premium.tier,
            ai_summary: null,
            related_lesson: detectRelatedLesson(title, descText, resolvedCategory),
          })
        } catch (itemError) {
          console.error('Failed to parse RSS item:', itemError)
        }
      }
    } catch (error) {
      console.error(`Failed to fetch RSS from ${source.name}:`, error)
    }
  }

  // 날짜순 정렬
  allNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

  // 중복 제거 (같은 제목)
  const seen = new Set<string>()
  const unique = allNews.filter(n => {
    const key = n.title.toLowerCase().slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 캐시 저장
  newsCache.data = unique
  newsCache.expires = Date.now() + NEWS_CACHE_TTL

  return unique
}
// 로컬 키워드 기반 한국어 요약 생성 (AI API 실패 시 fallback)
function generateLocalSummary(title: string, summary: string, category: string): NonNullable<FormattedNews['ai_summary']> {
  const cleanSummary = cleanTickers(summary)
  const headline = cleanTickers(title)

  let why_it_matters = ''
  if (category === 'macro') {
    why_it_matters = '글로벌 거시경제 지표 및 통화 정책의 변화는 시장의 기초 자본 흐름과 자금 조달 여건을 결정하는 핵심 환경 요인입니다.'
  } else if (category === 'ai') {
    why_it_matters = '인공지능(AI)과 컴퓨팅 파워의 폭발적 성장은 산업의 생산성을 고도화하고 장기적인 비즈니스 가치 창출 방식을 재정의하고 있습니다.'
  } else if (category === 'technology') {
    why_it_matters = '정보기술(IT) 트렌드와 하드웨어/소프트웨어 혁신은 기업 간의 장기 경쟁 우위 구도를 근본적으로 뒤흔듭니다.'
  } else if (category === 'policy') {
    why_it_matters = '정부와 각국 사법 기관의 법률적 가이드라인 제정 및 규제 집행은 불확실성을 축소하고 시장의 제도권 안정성을 마련하는 과정입니다.'
  } else if (category === 'markets') {
    why_it_matters = '시장 참여자들의 단기 심리와 자금 유출입 경향성은 자산 간의 상대적 가치 및 단기 가격 진동 흐름을 반영합니다.'
  } else if (category === 'consumer') {
    why_it_matters = '경제의 기초 소비 활력 및 인구학적 변화는 기업 실적과 경제 성장 둔화 여부를 점검할 수 있는 실물 선행 지표입니다.'
  } else if (category === 'energy') {
    why_it_matters = '에너지 공급 원가와 친환경 패러다임 전환 흐름은 장기적인 제조업 이익 마진 구조 및 글로벌 인플레이션 방향을 규정합니다.'
  } else if (category === 'crypto') {
    why_it_matters = '디지털 분산 원장 네트워크 생태계가 기술 표준을 확립하고 글로벌 패시브 자금의 직접 유입 통로를 구축하는 단계적 움직임입니다.'
  } else {
    why_it_matters = '글로벌 경제 생태계와 금융 시장 전반의 장단기 변화 흐름을 다차원적으로 이해하기 위한 중요한 지표가 될 수 있습니다.'
  }

  if (cleanSummary && cleanSummary.length > 10) {
    why_it_matters = `${cleanSummary} 이처럼 실제 시장 현장의 구체적이고 실질적인 변화를 대변하는 이벤트이기 때문에 심도 깊게 다룰 가치가 있습니다.`
  }

  let key_point = ''
  if (category === 'macro') {
    key_point = '중앙은행의 거시 금리 기조 변화가 각 경제 주체의 자금 배분 결정 및 장기 채권 이자율 경로에 어떠한 피드백을 전달할까요?'
  } else if (category === 'ai') {
    key_point = '새로운 AI 컴퓨팅 인프라 성장이 산업 생태계 전반의 영업 마진 향상으로 직접 연결될 수 있는 유효한 구조인지 질문해 봅시다.'
  } else if (category === 'technology') {
    key_point = '이러한 기술적 패러다임의 혁신이 기존 시장의 지배적 사업자들과 신생 혁신 기업 간 가치 공유를 어떻게 변화시킬까요?'
  } else if (category === 'policy') {
    key_point = '제도적 규범이 특정 혁신 생태계의 진입 장벽을 높이는 역효과를 초래할지, 반대로 제도권 신뢰 형성에 기여할지 탐구해 봅시다.'
  } else if (category === 'markets') {
    key_point = '실제 시장 가격의 등락 배후에 위치한 매수/매도 자금의 펀더멘탈적 근거와 심리적 편향 요인을 어떻게 논리적으로 분리할 수 있을까요?'
  } else if (category === 'consumer') {
    key_point = '소비자 지출 트렌드 변화가 가계 부채 및 향후 유통 경제 성장에 어떤 장기적 파급 효과를 미칠지 깊이 있게 추론해 봅시다.'
  } else if (category === 'energy') {
    key_point = '에너지 전환으로 인한 단기 비용 상승(Greenflation) 우려가 전체 인플레이션 기대치 경로를 어떻게 왜곡할 수 있을까요?'
  } else if (category === 'crypto') {
    key_point = '글로벌 통화 정책이 긴축에서 완화로 선회할 때, 이 자산군이 자본 조달 비용 하락에 가장 민감한 탄력성을 발휘할 수 있을까요?'
  } else {
    key_point = '이번 뉴스가 가져올 2차 파생적 영향(Second-Order Effect)과 향후 우리가 추가로 점검해야 하는 신호는 무엇일까요?'
  }

  return {
    headline,
    why_it_matters,
    key_point
  }
}

// 유료 회원용: Anthropic AI 배치 요약
async function generateAISummaries(
  articles: Array<{ id: string; title: string; summary: string; category: string }>
): Promise<Map<string, FormattedNews['ai_summary']>> {
  const results = new Map<string, FormattedNews['ai_summary']>()
  const apiKey = process.env.ANTHROPIC_API_KEY

  // 캐시 확인
  const uncached = articles.filter(a => !getCachedSummary(a.id))
  for (const a of articles) {
    const cached = getCachedSummary(a.id)
    if (cached) results.set(a.id, cached)
  }
  if (uncached.length === 0) return results

  // AI API 호출 (키가 있을 때만)
  if (apiKey) {
    // 최대 6개만 (비용 절약)
    const batch = uncached.slice(0, 6)
    const articleList = batch
      .map((a, i) => `[기사 ${i + 1}] ID: ${a.id}\n제목: ${a.title}\n내용: ${a.summary}`)
      .join('\n\n---\n\n')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system: `당신은 금융/경제/기술 분야 리터러시 교육 전문가입니다.
각 기사를 분석하여 기사 내용을 바탕으로 교육적인 요약과 질문을 구성해주세요. 반드시 아래 JSON 형식으로만 응답하세요.

[
  {
    "id": "기사ID",
    "headline": "무슨 일이 있었나? 에 대한 요약 (1~2문장으로 기사의 핵심 사실을 객관적으로 요약)",
    "why_it_matters": "왜 중요한가? 에 대한 설명 (금융 리터러시 향상 관점에서 이 변화가 경제 구조 및 시장에 미칠 영향을 쉽게 2-3문장 설명)",
    "key_point": "생각해볼 질문 (독자가 스스로 질문을 던지고 의사결정 훈련을 할 수 있도록 유도하는 교육적 질문 형태, 예: '~라면 ~에 어떤 영향을 미칠까요?')"
  }
]

규칙:
- 기사와 무관한 상투적인 고정 문구(예: '암호화폐 시장은 빠르게 변하고 있어요' 등)를 절대 포함하지 마십시오.
- 오직 기사의 구체적인 사실에 기반하여 요약과 해설을 구성하십시오.
- 투자 추천이나 시그널, 수익률 예측이 아닌 순수한 금융 리터러시 교육 관점에서 작성하십시오.
- 전문 용어는 쉽게 풀어쓰고, '생각해볼 질문'은 반드시 독자의 비판적 사고를 유도하는 질문형(?로 끝남)이어야 합니다.
- FIGR_HELOC, HYPE, RAIN, WBT, USDS, XMR, ZEC, LEO 등 정체불명의 가짜 토큰/티커 언급을 완전히 무시하거나 제거해 주십시오.`,
          messages: [
            { role: 'user', content: `다음 ${batch.length}개 기사를 각각 요약해주세요:\n\n${articleList}` },
          ],
        }),
      })

      if (!response.ok) {
        console.error('Anthropic API error:', response.status)
        // fallback으로 진행 (return하지 않음)
      } else {
        const data = await response.json()
        const text = data.content?.[0]?.text || ''
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const summaries = JSON.parse(jsonMatch[0]) as Array<{
            id: string; headline: string; why_it_matters: string; key_point: string
          }>
          for (const s of summaries) {
            const summary = {
              headline: cleanTickers(s.headline),
              why_it_matters: cleanTickers(s.why_it_matters),
              key_point: cleanTickers(s.key_point)
            }
            results.set(s.id, summary)
            setCachedSummary(s.id, summary)
          }
        }
      }
    } catch (error) {
      console.error('AI summary error:', error)
    }
  }

  // Fallback: AI가 실패한 기사는 로컬에서 키워드 기반 요약 생성
  for (const a of articles) {
    if (!results.has(a.id)) {
      const localSummary = generateLocalSummary(a.title, a.summary, a.category)
      results.set(a.id, localSummary)
      setCachedSummary(a.id, localSummary)
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const premiumFilter = searchParams.get('premium_filter') || 'all'
  const premiumCategory = searchParams.get('premium_category') || 'all'
  const tier = searchParams.get('tier') || 'cadet'
  const perPage = 12

  const tierLevels: Record<string, number> = {
    cadet: 0, navigator: 1, pilot: 2, commander: 3, admiral: 4,
  }
  // AI 요약은 모든 사용자에게 제공 (cadet은 키워드 기반, navigator+는 AI API)
  const enableAI = true
  const useAdvancedAI = (tierLevels[tier] || 0) >= 1

  try {
    let allNews = await fetchAllNews()

    // 카테고리 필터
    if (category !== 'all') {
      allNews = allNews.filter(n => n.category === category)
    }

    // 프리미엄 필터
    if (premiumFilter === 'free') {
      allNews = allNews.filter(n => !n.is_premium)
    } else if (premiumFilter === 'premium') {
      allNews = allNews.filter(n => n.is_premium)
      if (premiumCategory !== 'all') {
        allNews = allNews.filter(n => n.premium_category === premiumCategory)
      }
    }

    // 페이지네이션
    const startIndex = (page - 1) * perPage
    const pageItems = allNews.slice(startIndex, startIndex + perPage)
    const totalPages = Math.ceil(allNews.length / perPage)

    // AI 요약 (모든 사용자에게 제공)
    const responseItems = pageItems.map(item => ({ ...item, ai_summary: null as FormattedNews['ai_summary'] }))

    if (enableAI && responseItems.length > 0) {
      const aiSummaries = await generateAISummaries(
        responseItems.map(item => ({ id: item.id, title: item.title, summary: item.summary, category: item.category }))
      )
      for (const item of responseItems) {
        item.ai_summary = aiSummaries.get(item.id) || null
      }
    }

    return NextResponse.json({
      news: responseItems,
      total: allNews.length,
      page,
      per_page: perPage,
      total_pages: totalPages,
      ai_enabled: enableAI,
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
