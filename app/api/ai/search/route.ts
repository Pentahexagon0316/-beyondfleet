import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function generateLocalSearchResponse(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('금리') || q.includes('fomc') || q.includes('fed') || q.includes('시장')) {
    return `### 💡 금리와 거시경제 (Federal Funds Rate)

**금리**는 자금의 시간 가치이자 유동성의 가격입니다. 미국 연방준비제도(Fed)가 금리를 결정하면 글로벌 금융 시장 전체의 유동성 조건이 결정됩니다.

- **금리 인하 (Rate Cut):** 돈을 빌리는 비용이 낮아지므로 시장에 유동성이 풀려 비트코인, 주식 등 위험 자산 가격이 상승하는 경향이 있습니다.
- **금리 인상 (Rate Hike):** 저축 메리트가 커지고 자본 비용이 올라가므로 자산 시장에서 안전 자산(국채, 현금)으로 자금이 대피합니다.

💡 **더 알아보기:**
- [Rates: 금리와 할인율](/learn/macro-foundations-rates)
- [Bonds: 채권금리와 경기 신호](/learn/macro-foundations-bonds)
- [Inflation: 물가와 기대의 차이](/learn/macro-foundations-inflation)`;
  }
  
  if (q.includes('비트코인') || q.includes('btc') || q.includes('블록체인') || q.includes('코인') || q.includes('크립토')) {
    return `### 💡 비트코인과 가치 보존의 법칙 (Bitcoin Foundations)

**비트코인**은 2,100만 개로 총발행량이 고정된 최초의 탈중앙화 자산입니다. 매크로 투자자들은 비트코인을 '가상의 금(Digital Gold)'이자 법정화폐 유동성의 과잉 공급을 방어하는 헤지 수단으로 활용합니다.

- **반감기 (Halving):** 4년마다 신규 발행량이 절반으로 줄어들어 희소성이 기하급수적으로 증가합니다.
- **포트폴리오 역할:** 높은 변동성을 가지므로 단기 투기 대상보다 포트폴리오의 비대칭적 성장(Asymmetric Return)을 노리는 1~5%의 분산 자산으로 다루어야 합니다.

💡 **더 알아보기:**
- [Probabilistic Thinking: 확률로 보기](/learn/risk-thinking-probability)
- [Second-Order Thinking: 다음 반응 보기](/learn/risk-thinking-second-order)
- [Rates: 금리와 할인율](/learn/macro-foundations-rates)`;
  }

  if (q.includes('고래') || q.includes('온체인') || q.includes('whale') || q.includes('지갑')) {
    return `### 🐋 온체인 데이터와 고래 지표 (On-chain Dynamics)

**고래(Whale)**는 시장에 영향력을 미칠 수 있는 대규모 자금 보유자(보통 1,000 BTC 이상)를 의미합니다. 블록체인은 공개 장부이므로 이들의 트랜잭션을 실시간으로 추적할 수 있는 **온체인 데이터**가 발달해 있습니다.

- **거래소 입금 (Inflow):** 고래들이 매도하기 위해 코인을 거래소로 보내는 신호이므로 단기 매도 압력이 커질 수 있습니다.
- **거래소 출금 (Outflow):** 장기 보유를 위해 하드웨어 지갑으로 인출하는 신호이므로 유통 유동성이 줄어들어 하방이 단단해집니다.

💡 **더 알아보기:**
- [Liquidity: 유동성의 흐름](/learn/macro-foundations-liquidity)
- [Second-Order Thinking: 다음 반응 보기](/learn/risk-thinking-second-order)
- [Risk Management: 리스크 관리](/learn/risk-thinking-risk-management)`;
  }

  return `### 💡 입력하신 질문에 대한 분석 안내

문의하신 **"${query}"** 주제는 글로벌 매크로 유동성 및 장기 리스크 사고와 깊이 맞물려 있습니다.

기본적으로 투자 시장의 의사결정은 단일 사실의 선형적 인과관계가 아닌, **두 번째 단계의 반응(Second-Order Effect)**과 확률적 기댓값을 평가하는 복합적인 프로세스입니다. 아래 관련 교육 모듈을 통해 기초 뼈대를 튼튼하게 다져보실 수 있습니다.

💡 **더 알아보기:**
- [Second-Order Thinking: 다음 반응 보기](/learn/risk-thinking-second-order)
- [Probabilistic Thinking: 확률로 보기](/learn/risk-thinking-probability)
- [Cognitive Bias: 인지 편향](/learn/risk-thinking-bias)`;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.includes('your_') || apiKey.includes('sk-ant-j_') || apiKey.length < 30) {
      console.warn('Anthropic API Key is not configured or mock. Using high-signal local search fallback...')
      return NextResponse.json({
        answer: generateLocalSearchResponse(query),
        query: query.trim(),
        timestamp: new Date().toISOString(),
      })
    }

    const systemPrompt = `당신은 BeyondFleet의 경제 교육 AI 어시스턴트입니다.
    
역할:
- 경제, 주식, 암호화폐, 거시경제에 대한 질문에 친근하고 쉽게 답변합니다
- 전문 용어는 꼭 필요할 때만 사용하고, 사용 시 쉬운 설명을 덧붙입니다
- 초보자도 이해할 수 있게 비유와 예시를 활용합니다
- 투자 조언이 아닌 교육적 정보만 제공합니다

답변 형식:
- 핵심 답변을 먼저 간결하게 (2-3문장)
- 그 다음 좀 더 자세한 설명 (3-5문장)
- 마지막에 "💡 더 알아보기" 섹션으로 관련 주제 2-3개 추천
- 이모지를 적절히 사용하여 친근한 톤 유지
- 한국어로 답변`

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
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            { role: 'user', content: query.trim() },
          ],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.warn('Anthropic API error, using safe local search fallback:', response.status, errText)
        return NextResponse.json({
          answer: generateLocalSearchResponse(query),
          query: query.trim(),
          timestamp: new Date().toISOString(),
        })
      }

      const data = await response.json()
      const answer = data.content?.[0]?.text || '답변을 생성하지 못했어요. 다시 시도해주세요.'

      return NextResponse.json({
        answer,
        query: query.trim(),
        timestamp: new Date().toISOString(),
      })
    } catch (aiError) {
      console.warn('Network or server error in Anthropic call, using local search fallback:', aiError)
      return NextResponse.json({
        answer: generateLocalSearchResponse(query),
        query: query.trim(),
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('AI search error:', error)
    return NextResponse.json(
      { error: 'AI 검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
