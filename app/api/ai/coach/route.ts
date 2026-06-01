import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BANNED_WORDS = [
  '매수',
  '매도',
  '보유 추천',
  '수익률 예측',
  '저평가',
  '고평가',
  '확실',
  '보장'
]

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { feedback: 'AI Coach is temporarily offline because the Anthropic API key is not configured.' },
      { status: 200 }
    )
  }

  try {
    const { title, content, templateType } = await request.json()

    if (!title && !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const prompt = `당신은 BeyondFleet의 "Thinking Lab"에서 사용자의 사고 훈련을 돕는 뛰어난 금융 리터러시 AI 코치(AI Coach)입니다.
사용자가 작성한 리서치와 가설을 검토하고, 비판적이고 교육적인 피드백을 주십시오.

## 금지어 및 제한 사항 (CRITICAL CONSTRAINTS):
- 다음 단어들은 절대 출력에 포함되어선 안 됩니다: "매수", "매도", "보유 추천", "수익률 예측", "저평가", "고평가", "확실", "보장".
- 특정 자산에 대한 투자 의견(매수/매도/보유 추천 등)을 절대 제공하지 마십시오.
- 수익률이나 가격 전망을 예측하거나 특정 자산이 고평가/저평가되었다고 진단해선 안 됩니다.

## 답변 스타일 가이드라인 (STRICTLY ONLY QUESTIONS):
- **필수 준수 사항**: 답변은 반드시 100% 질문들(물음표로 끝나는 문장들)로만 구성되어야 합니다. 어떠한 평서문, 주장, 답변, 의견 제시도 허용되지 않습니다.
- 오직 사용자의 가설을 다각도로 검토하고 비판적으로 유도하기 위한 날카로운 질문만 3~4개 던지십시오.
- 예시 질문 패턴:
  1. "이 가설이 틀렸다면 어떤 데이터가 먼저 나타날까요?"
  2. "반대 관점에서는 어떤 해석이 가능할까요?"
  3. "다음에 확인할 지표는 무엇인가요?"
  
- 사용자의 가설에 대항하는 반대 관점(Devil's Advocate)을 날카롭게 질문 형태로 꼬집어 주십시오.

## 코칭 대상 노트 정보
- **노트 제목**: ${title || '제목 없음'}
- **노트 템플릿**: ${templateType || '기본'}
- **노트 내용**: 
${content || '내용 없음'}

한국어로 오직 질문으로만 답해 주십시오.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      console.error('Anthropic API Error:', response.status)
      return NextResponse.json({
        feedback: 'AI 코치를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      })
    }

    const data = await response.json()
    const rawFeedback = data.content?.[0]?.text || '가설을 더 깊게 분석할 수 있는 질문을 작성하지 못했습니다. 내용을 보강하여 다시 시도해 주세요.'

    // Server-side strict validation check
    const containsBanned = BANNED_WORDS.some(word => rawFeedback.includes(word))
    let feedback = rawFeedback

    if (containsBanned) {
      feedback = '제시해주신 리서치와 가설을 검토해 보았습니다. 이 가설이 틀렸다면 어떤 데이터가 먼저 나타날까요? 반대 관점에서는 어떤 해석이 가능할까요? 다음에 확인할 지표는 무엇인가요?'
    }

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('AI Coach endpoint error:', error)
    return NextResponse.json({
      feedback: 'AI 코치가 일시적인 유동성 긴축으로 휴식 중입니다. 잠시 후 다시 가설을 검토해 주세요!'
    }, { status: 500 })
  }
}
