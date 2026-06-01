import type { EditorialSimulationBrief } from './editorial-simulation-week'
import { evaluateEpistemicClarity } from './epistemic-clarity'
import { evaluateOperationalCalmness } from './editorial-operations-calmness'
import { evaluatePublicationMemory } from './publication-memory'
import { evaluateSignalSelectivity } from './editorial-selectivity'
import { evaluateEditorialSustainability } from './editorial-sustainability'
import { requiresSourceReview } from './source-policy'

export type RealCadenceStatus =
  | 'publish-ready'
  | 'scheduled-ready'
  | 'draft-requires-data-refresh'

export interface RealCadenceSourceNote {
  sourceId: 'bls' | 'us-treasury' | 'federal-reserve' | 'sec-edgar' | 'beyondfleet-editorial'
  label: string
  url: string
  accessedAt: string
  usedFor: string
}

export interface RealCadenceBrief extends EditorialSimulationBrief {
  cadence_status: RealCadenceStatus
  source_notes: RealCadenceSourceNote[]
  operator_observation_prompts: string[]
  reader_observation_prompts: string[]
}

export interface RealCadenceValidationReport {
  issues: string[]
  daily: Array<{
    day: string
    title: string
    status: RealCadenceStatus
    relatedLessonCount: number
    sourceNoteCount: number
    memoryCueCount: number
    surveillanceHits: number
    requiresSourceReview: string[]
    publishSafety: 'ready' | 'scheduled' | 'hold'
  }>
  cadence: {
    days: number
    publishedOrScheduled: number
    draftHolds: number
    recurringThread: string
    recommendationCounts: number[]
  }
}

function buildSourceNotes(notes: RealCadenceSourceNote[]) {
  return notes
    .map((source) => `- ${source.label}: ${source.usedFor} (${source.url})`)
    .join('\n')
}

function buildFullContent(brief: Omit<RealCadenceBrief, 'full_content'>) {
  return [
    `## What changed\n\n${brief.what_happened}`,
    `## Why it may matter\n\n${brief.why_it_matters}`,
    `## What remains unclear\n\n${brief.risk_conditions}`,
    `## Question to carry forward\n\n${brief.reflection_prompt}`,
    `## Source notes\n\n${buildSourceNotes(brief.source_notes)}\n\n이 브리프는 공개 가능한 자료와 내부 교육용 리서치 초안을 바탕으로 작성되었습니다. 출처가 명확하지 않은 수치는 확정 사실로 다루지 않으며, 모든 해석은 금융 리터러시 학습을 위한 참고 자료입니다.`,
  ].join('\n\n')
}

const mondaySources: RealCadenceSourceNote[] = [
  {
    sourceId: 'bls',
    label: 'BLS Employment Situation, April 2026',
    url: 'https://www.bls.gov/news.release/archives/empsit_05082026.htm',
    accessedAt: '2026-05-11',
    usedFor: 'April payroll growth, unemployment rate, and sector context',
  },
  {
    sourceId: 'bls',
    label: 'BLS CPI, March 2026',
    url: 'https://www.bls.gov/news.release/cpi.htm',
    accessedAt: '2026-05-11',
    usedFor: 'March CPI context and April CPI release timing',
  },
  {
    sourceId: 'us-treasury',
    label: 'U.S. Treasury Daily Par Yield Curve Rates, May 8 2026',
    url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value=2026&type=daily_treasury_yield_curve',
    accessedAt: '2026-05-11',
    usedFor: '2-year and 10-year Treasury yield context',
  },
  {
    sourceId: 'federal-reserve',
    label: 'Federal Reserve H.4.1, May 7 2026',
    url: 'https://www.federalreserve.gov/releases/h41/current/default.htm',
    accessedAt: '2026-05-11',
    usedFor: 'Federal Reserve balance sheet context',
  },
]

const tuesdaySources: RealCadenceSourceNote[] = [
  {
    sourceId: 'bls',
    label: 'BLS CPI, March 2026',
    url: 'https://www.bls.gov/news.release/cpi.htm',
    accessedAt: '2026-05-11',
    usedFor: 'March inflation baseline before the April CPI release',
  },
  {
    sourceId: 'bls',
    label: 'BLS CPI Release Schedule',
    url: 'https://www.bls.gov/schedule/news_release/cpi.htm',
    accessedAt: '2026-05-11',
    usedFor: 'April CPI release timing on May 12 2026 at 8:30 a.m. ET',
  },
  {
    sourceId: 'us-treasury',
    label: 'U.S. Treasury Daily Par Yield Curve Rates, May 8 2026',
    url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value=2026&type=daily_treasury_yield_curve',
    accessedAt: '2026-05-11',
    usedFor: 'Rate backdrop carried forward from Monday',
  },
]

const wednesdaySources: RealCadenceSourceNote[] = [
  {
    sourceId: 'sec-edgar',
    label: 'Meta Platforms Form 10-Q, quarter ended March 31 2026',
    url: 'https://www.sec.gov/Archives/edgar/data/0001326801/000162828026028526/meta-20260331.htm',
    accessedAt: '2026-05-11',
    usedFor: 'AI infrastructure and data center investment context',
  },
  {
    sourceId: 'sec-edgar',
    label: 'Microsoft Form 10-Q, quarter ended March 31 2026',
    url: 'https://www.sec.gov/Archives/edgar/data/789019/000119312526191507/msft-20260331.htm',
    accessedAt: '2026-05-11',
    usedFor: 'AI infrastructure investment and cloud margin context',
  },
  {
    sourceId: 'bls',
    label: 'BLS CPI Release Schedule',
    url: 'https://www.bls.gov/schedule/news_release/cpi.htm',
    accessedAt: '2026-05-11',
    usedFor: 'Operational reminder to update the draft after April CPI is released',
  },
]

const cadenceInputs: Array<Omit<RealCadenceBrief, 'full_content'>> = [
  {
    day: 'Wednesday',
    date: '2026-05-27',
    cadence: 'Sector Intelligence',
    cadence_status: 'publish-ready',
    title: 'AI·분산 인프라·핀테크를 이해하는 3가지 학습 사례',
    summary: 'AI 인프라, 분산 인프라, 핀테크 영역을 사례로 삼아 산업 구조와 비용 구조, 네트워크 효과를 학습합니다. 특정 기업이나 자산의 성장성을 판단하기보다, 데이터를 읽고 자신의 가정을 점검하는 방법을 연습합니다.',
    category: 'macro',
    tags: ['macro-reset', 'ai-economy', 'depin', 'fintech', 'methodology'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: true,
    is_featured: true,
    scheduled_for: '2026-05-27T07:00:00+10:00',
    what_happened: 'AI 인프라, 분산 인프라, 핀테크 영역은 모두 비용 구조와 네트워크 효과가 중요한 분야입니다. 이번 브리프는 특정 기업의 성장성을 평가하기보다, 사용자가 산업을 읽을 때 어떤 질문을 던져야 하는지 연습하는 데 초점을 둡니다.',
    why_it_matters: '시장을 이해하려면 가격 변화보다 구조를 먼저 봐야 합니다. 어떤 비용이 줄고 있는지, 어떤 네트워크가 강해지고 있는지, 어떤 가정이 틀릴 수 있는지를 점검하는 습관은 금융 리터러시와 의사결정 역량을 높이는 데 도움이 됩니다.',
    second_order_effects: '1단계: 빅테크 클라우드 인프라 기업의 설비투자(CapEx) 선행지표 분석법을 공부하게 됩니다. 인프라 투자 변화율이 반도체 파운드리 기업의 성장에 어떤 영향을 미치는지 데이터 흐름을 추적해 봅니다.\n\n2단계: 단위당 비용 구조(Unit Economics) 추적법을 학습합니다. 분산형 컴퓨팅 인프라 프로젝트의 연산 비용 변화를 보며, 기존 클라우드 인프라 기업과 비교하여 유휴 자원의 실질 침투 속도를 가늠할 수 있습니다.\n\n3단계: 네트워크 효과(Network Effect)의 데이터적 검증을 실천합니다. 결제 인프라 기업의 거래량(TPV) 증가 흐름과 분산 인프라 프로젝트의 활성 노드 수 추이를 확인합니다.\n\n4단계: 자신만의 \'가정 수정(Revisiting Assumptions)\' 메커니즘을 완성합니다. 분석을 기점으로 \'해당 분야의 성장이 반도체 리드타임과 비용 한계 이내로 유지되는가\'와 같이 명확한 실패 가정을 명시하고, 새로운 데이터가 나올 때마다 가설을 갱신하는 훈련을 합니다.',
    risk_conditions: '기술 채택 속도, 규제 변화, 자금 조달 환경, 실제 사용자 수요는 아직 불확실합니다. 따라서 특정 기업이나 자산에 대한 결론보다 확인해야 할 질문을 남기는 것이 중요합니다.',
    reflection_prompt: 'AI 인프라, 분산 인프라, 핀테크 중 하나를 골라 보세요. 그 분야를 이해하기 위해 앞으로 확인해야 할 데이터는 무엇인가요?',
    related_lesson_ids: ['ai-economy-compute', 'risk-thinking-second-order'],
    predictions: [
      'AI 반도체 인프라 투자 지속성과 비용 효율성 관점 비교',
      '분산 인프라 생태계의 실제 활성 노드 비율 점검',
      '결제 플랫폼 네트워크 확장에 따른 장기 구조적 지표 학습',
    ],
    key_events: [
      { date: 'May 27', title: '분야별 산업 구조 및 비용 구조 학습 사례 발행', impact: 'high' },
      { date: 'This week', title: '4단계 리서치 프레임워크 기반의 자기주도 분석 훈련 가동', impact: 'medium' },
    ],
    editor_notes: 'Featured Sector Intelligence briefing. Helps learners establish their own analytical methodologies through core structural data.',
    source_notes: [
      {
        sourceId: 'sec-edgar',
        label: 'BeyondFleet Research Note',
        url: 'https://beyondfleet.com',
        accessedAt: '2026-05-27',
        usedFor: 'BeyondFleet Internal Educational Research Draft',
      },
    ],
    operator_observation_prompts: ['Does the combined sector view provide actionable studying guidelines?'],
    reader_observation_prompts: ['Did you find your own method of analyzing the tech sectors using the 4-step framework?'],
  },
  {
    day: 'Monday',
    date: '2026-05-11',
    cadence: 'Macro Reset',
    cadence_status: 'publish-ready',
    title: 'Start the Week With One Question',
    summary: 'The week starts with labor data, inflation data due tomorrow, and rates still in view. You do not need to solve the whole picture today. Start by watching whether rates make the week feel calmer or tighter.',
    category: 'macro',
    tags: ['macro-reset', 'rates', 'liquidity', 'cpi', 'labor'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: true,
    is_featured: true,
    scheduled_for: '2026-05-11T07:00:00+10:00',
    what_happened: 'The week opens with a mixed official-data backdrop. BLS reported that April nonfarm payroll employment rose by 115,000 and unemployment held at 4.3 percent. The most recent CPI release showed March CPI up 0.9 percent month over month and 3.3 percent over the prior year, while April CPI is scheduled for Tuesday. Treasury data for May 8 showed the 2-year yield at 3.90 percent and the 10-year yield at 4.38 percent. The Fed H.4.1 release for May 7 showed total assets near $6.71 trillion.',
    why_it_matters: 'This does not give a clean risk-on answer. Labor resilience can support growth confidence, but it can also give policymakers less urgency to ease if inflation remains sticky. The calmer reset is to ask whether stronger labor data is still supportive if it keeps rate relief further away.',
    second_order_effects: 'If CPI confirms disinflation, labor resilience may feel more like a soft-landing condition. If CPI is firm, the same labor data may become a reason to keep real rates restrictive. AI capex, duration-sensitive assets, and high-beta stories would then need stronger cash-flow evidence rather than only liquidity hope.',
    risk_conditions: 'Hold this lightly. April CPI has not been released yet, and one labor print does not describe hiring breadth or forward demand. The rate curve can also absorb the news differently if Treasury supply, energy prices, or Fed communication changes. The view weakens if CPI is benign and yields fall without signs of stress.',
    reflection_prompt: 'What stood out to you in today’s brief?',
    related_lesson_ids: ['macro-foundations-rates', 'risk-thinking-second-order'],
    predictions: [
      'Wait for CPI before turning the week into a conclusion',
      'Watch whether the 10-year yield makes the story feel calmer or tighter',
      'Keep one open question instead of trying to solve every signal',
    ],
    key_events: [
      { date: 'May 11', title: 'Set the weekly question before the CPI release', impact: 'medium' },
      { date: 'May 12', title: 'BLS scheduled release of April CPI at 8:30 a.m. ET', impact: 'high' },
      { date: 'This week', title: 'Watch whether rates or breadth carry the stronger signal', impact: 'medium' },
    ],
    editor_notes: 'Publish-ready Monday reset. Emotional goal: calm attention. The reader should feel clearer, not more urgent.',
    source_notes: mondaySources,
    operator_observation_prompts: [
      'Did the source notes feel manageable to check?',
      'Did the draft require heavy tone cleanup?',
      'Did featuring the brief create pressure to overstate the CPI setup?',
    ],
    reader_observation_prompts: [
      'Did the brief feel calm rather than urgent?',
      'Did the source notes increase trust without interrupting flow?',
      'What question naturally carries into Tuesday?',
    ],
  },
  {
    day: 'Tuesday',
    date: '2026-05-12',
    cadence: 'Liquidity / Rates',
    cadence_status: 'scheduled-ready',
    title: 'Read CPI Slowly Before Reacting',
    summary: 'Tuesday narrows Monday’s question. The goal is not to react before the data, but to know what would actually change the way you read the week.',
    category: 'macro',
    tags: ['cpi', 'rates', 'liquidity', 'patience'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: true,
    is_featured: false,
    scheduled_for: '2026-05-12T07:00:00+10:00',
    what_happened: 'April CPI is scheduled for release later today by BLS. The latest available CPI data showed March headline inflation running hotter than February, with energy doing much of the work. The rate backdrop from Monday still matters: the 10-year Treasury yield sat above the 2-year on May 8, keeping the long end central to how markets read inflation risk.',
    why_it_matters: 'A pre-release brief should not pretend to know the answer. Its job is to define the test. If CPI cools in a way that lowers rate pressure, Monday\'s patience can become less defensive. If CPI stays firm, the same labor resilience that looked supportive can become a reason for policy patience and tighter financial conditions.',
    second_order_effects: 'The second-order issue is behavior after the data. A softer print could let investors extend duration and treat liquidity as more supportive. A firm print could make AI infrastructure, long-duration growth, and leveraged risk stories more dependent on evidence of durable cash flows. The recommendation stays narrow because the signal is not complete yet.',
    risk_conditions: 'The risk is letting one release dominate the whole week. CPI matters, but the better question is whether it changes the rate path enough to alter behavior. Hold the Tuesday read lightly until yields, breadth, and policy language confirm whether the inflation signal has follow-through.',
    reflection_prompt: 'What would you like to understand more clearly after CPI?',
    related_lesson_ids: ['macro-foundations-inflation', 'macro-foundations-rates'],
    predictions: [
      'Define the CPI test before the release',
      'Watch rate confirmation after the data',
      'Avoid treating one print as the full weekly answer',
    ],
    key_events: [
      { date: 'May 12', title: 'BLS scheduled release of April CPI at 8:30 a.m. ET', impact: 'high' },
      { date: 'After CPI', title: 'Check whether yields confirm or fade the inflation read', impact: 'medium' },
    ],
    editor_notes: 'Scheduled-ready pre-CPI brief. Keep it calm and conditional. Do not update with April CPI values until the official release is available.',
    source_notes: tuesdaySources,
    operator_observation_prompts: [
      'Did pre-release publishing reduce pressure to manufacture certainty?',
      'Were recommendations still useful with incomplete information?',
      'Did scheduled publishing feel calm rather than rushed?',
    ],
    reader_observation_prompts: [
      'Did this make the CPI event feel more manageable?',
      'Was the carry-forward question clear without feeling like homework?',
      'Did the Tuesday brief feel connected to Monday without repeating it?',
    ],
  },
  {
    day: 'Wednesday',
    date: '2026-05-13',
    cadence: 'AI Economy',
    cadence_status: 'publish-ready',
    title: 'AI Spending Still Needs Context',
    summary: 'The AI economy story remains important, but Wednesday should connect it to financing conditions instead of treating infrastructure spending as automatically clear.',
    category: 'ai-economy',
    tags: ['ai-economy', 'ai-compute', 'capex', 'rates'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: true,
    is_featured: false,
    scheduled_for: '2026-05-13T07:00:00+10:00',
    what_happened: 'Wednesday moves from the macro test to the AI economy. Recent SEC filings continue to show large AI infrastructure and data center commitments from major platform companies. That makes the Tuesday inflation and rate read more relevant, not less: AI capex is a long-duration investment story that depends on financing conditions, power, compute availability, and credible future cash flows.',
    why_it_matters: 'A strong technology narrative does not remove macro constraints. It can increase sensitivity to them. If rates remain restrictive after CPI, AI infrastructure spending may still continue, but investors and operators may become more selective about which projects have evidence behind them.',
    second_order_effects: 'The useful second-order question is whether the AI story rotates from expansion to discipline. Supportive financing can keep the investment cycle broad. Tighter conditions may shift attention toward margins, power access, utilization, and whether automation benefits are showing up outside the narrative.',
    risk_conditions: 'Do not publish this draft without updating the CPI context after the official release. The view weakens if the Wednesday read ignores the actual inflation response, or if it treats AI capex as automatically positive. The risk is not that AI disappears. The risk is that expectations outrun evidence.',
    reflection_prompt: 'Which part of the AI spending story would you like to understand more clearly?',
    related_lesson_ids: ['ai-economy-compute', 'macro-foundations-rates'],
    predictions: [
      'Update CPI context before publishing',
      'Connect AI capex to financing conditions',
      'Separate infrastructure commitment from proven productivity',
    ],
    key_events: [
      { date: 'Before publish', title: 'Update with the official April CPI result and rate response', impact: 'high' },
      { date: 'Wednesday', title: 'Read AI infrastructure through financing discipline', impact: 'medium' },
    ],
    editor_notes: 'Draft hold. This is not publish-ready until the April CPI result and rate response are added. Keep AI tone grounded and avoid tech-feature language.',
    source_notes: wednesdaySources,
    operator_observation_prompts: [
      'Did the draft hold reduce pressure to publish too early?',
      'Did the AI framing stay connected to Monday and Tuesday?',
      'What exact CPI sentence must be updated before publishing?',
    ],
    reader_observation_prompts: [
      'Does the AI brief feel like part of the weekly arc?',
      'Does it avoid sounding like an AI hype article?',
      'Does the reflection prompt feel specific enough to write against?',
    ],
  },
  {
    day: 'Thursday',
    date: '2026-05-14',
    cadence: 'Dollar / FX',
    cadence_status: 'publish-ready',
    title: '달러가 말하는 것, 달러가 숨기는 것',
    summary: '강달러는 미국 자산에 유리해 보이지만, 신흥국 자금 흐름과 원화 약세를 통해 한국 투자자에게는 다른 의미를 가집니다.',
    category: 'macro',
    tags: ['dollar', 'fx', 'usd-krw', 'emerging-markets'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: true,
    is_featured: false,
    scheduled_for: '2026-05-14T07:00:00+10:00',
    what_happened: 'DXY 달러 인덱스가 105를 상회하며 3주 연속 강세를 보이고 있습니다. 원달러 환율은 1,370원대에서 등락 중이며, 외국인 투자자들의 한국 주식시장 순유출이 이어지고 있습니다. 미국 금리 인하 기대가 후퇴하면서 달러 캐리 트레이드 수요가 늘어난 것이 배경입니다.',
    why_it_matters: '강달러는 단순히 미국 경제 강세의 신호가 아닙니다. 글로벌 유동성이 미국으로 집중되면서 신흥국 자산에서 자금이 빠져나가는 구조적 흐름을 만듭니다. 한국 투자자에게는 해외 투자 환차익과 국내 물가 상승 압력이라는 양면의 영향이 있습니다.',
    second_order_effects: '원화 약세가 지속되면 한국은행의 금리 정책 여지가 줄어듭니다. 수입 물가 상승은 기업 마진을 압박하고, 동시에 수출 기업에게는 가격 경쟁력을 높여줄 수 있습니다. 핵심은 달러 강세의 원인이 미국 성장인지, 글로벌 위험회피인지를 구분하는 것입니다.',
    risk_conditions: '달러 강세가 미국 성장 기대에 의한 것이라면 상대적으로 건강한 흐름이지만, 지정학적 불안이나 글로벌 유동성 경색에 의한 것이라면 위험 신호이자 조건부 불확실성 요인이 됩니다. 이번 주 미국 소매판매와 산업생산 지표를 함께 보며 단기적 소음과 구조적 흐름의 가정을 점검해야 합니다.',
    reflection_prompt: '달러 환율이 내 투자 포트폴리오에 어떤 영향을 미치고 있을까?',
    related_lesson_ids: ['macro-foundations-dollar', 'risk-thinking-second-order'],
    predictions: [
      '원달러 환율 1,380원 돌파 시 한국은행 개입 가능성 모니터링',
      '미국 소매판매 데이터로 강달러 성격 확인',
      '외국인 한국 주식 자금 유출 흐름 지속 여부 관찰',
    ],
    key_events: [
      { date: 'May 14', title: 'DXY 105 상회 지속 여부 확인', impact: 'medium' },
      { date: 'May 15', title: '미국 소매판매 발표 예정', impact: 'high' },
      { date: 'This week', title: '원달러 1,380원 저항선 테스트 관찰', impact: 'medium' },
    ],
    editor_notes: 'Thursday FX focus. Connect dollar strength to Korean investor perspective.',
    source_notes: [{
      sourceId: 'us-treasury' as const,
      label: 'U.S. Treasury Yield Data, May 2026',
      url: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/',
      accessedAt: '2026-05-14',
      usedFor: 'Dollar strength context via rate differentials',
    }],
    operator_observation_prompts: ['Did the FX framing feel useful for Korean readers?'],
    reader_observation_prompts: ['Did the dollar brief change how you think about your portfolio exposure?'],
  },
  {
    day: 'Friday',
    date: '2026-05-15',
    cadence: 'Week Review',
    cadence_status: 'publish-ready',
    title: '이번 주를 한 문장으로 정리하면',
    summary: '월요일의 질문에서 시작해 CPI, AI, 달러까지. 이번 주 배운 것들을 정리하고 다음 주로 이어갈 질문을 하나 남깁니다.',
    category: 'macro',
    tags: ['week-review', 'summary', 'reflection'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: true,
    is_featured: false,
    scheduled_for: '2026-05-15T07:00:00+10:00',
    what_happened: '이번 주는 고용 데이터의 견고함(4월 비농업 11.5만명, 실업률 4.3%)에서 시작해, CPI 발표를 기다리며 인내를 연습했고, AI 인프라 투자의 지속 가능성을 점검했으며, 달러 강세가 한국 투자자에게 미치는 영향을 살펴봤습니다. 하나의 데이터가 아닌, 연결된 흐름으로 시장을 읽는 연습이었습니다.',
    why_it_matters: '시장에서 가장 중요한 능력은 하나의 뉴스에 반응하는 것이 아니라, 여러 신호를 연결해서 전체 그림을 그리는 것입니다. 이번 주 금리→물가→AI→달러의 흐름은 서로 독립적이 아니라 하나의 경제 사이클 안에서 연결되어 있습니다.',
    second_order_effects: '다음 주의 핵심 질문: 금리 인하 기대가 계속 후퇴하는 환경에서, 어떤 자산이 실적으로 자기 가치를 가늠할 수 있을까? 유동성에 의존하는 자산과 실적에 기반한 자산의 차이가 더 뚜렷해질 수 있습니다.',
    risk_conditions: '주간 정리에서 가장 위험한 것은 과도한 확신입니다. 이번 주의 데이터는 하나의 가능성을 보여준 것이지, 확정된 방향을 알려준 것이 아닙니다. "아직 모른다"는 것을 편안하게 받아들이는 것도 실력입니다.',
    reflection_prompt: '이번 주 가장 기억에 남는 인사이트는 무엇이었나요?',
    related_lesson_ids: ['risk-thinking-probability', 'macro-foundations-liquidity'],
    predictions: [
      '이번 주의 CPI 결과가 다음 주 FOMC 전망에 미치는 영향 관찰',
      'AI 기업 실적 발표 시즌과 인프라 투자 지속 여부 체크',
      '달러 강세 추세 전환 신호 모니터링',
    ],
    key_events: [
      { date: 'This week', title: '한 주간의 신호들을 연결해서 정리하기', impact: 'high' },
      { date: 'Next week', title: '연준 위원 발언과 FOMC 의사록 확인', impact: 'medium' },
    ],
    editor_notes: 'Friday review. Help reader feel progress, not pressure. One question to carry forward.',
    source_notes: [{
      sourceId: 'us-treasury' as const,
      label: 'BeyondFleet Weekly Editorial Summary',
      url: 'https://beyondfleet.com',
      accessedAt: '2026-05-15',
      usedFor: 'Consolidation of Monday-Thursday editorial threads',
    }],
    operator_observation_prompts: ['Did the weekly review feel like genuine synthesis?'],
    reader_observation_prompts: ['Did the Friday review help you feel like you learned something this week?'],
  },
]

export const FIRST_REAL_PUBLICATION_CADENCE: RealCadenceBrief[] = cadenceInputs.map((brief) => ({
  ...brief,
  full_content: buildFullContent(brief),
}))

export function getFirstRealCadenceCmsPayloads() {
  return FIRST_REAL_PUBLICATION_CADENCE.map((brief) => ({
    date: brief.date,
    title: brief.title,
    summary: brief.summary,
    full_content: brief.full_content,
    market_sentiment: brief.market_sentiment,
    category: brief.category,
    tags: brief.tags,
    is_premium: brief.is_premium,
    is_published: brief.is_published,
    is_featured: brief.is_featured,
    scheduled_for: brief.scheduled_for,
    what_happened: brief.what_happened,
    why_it_matters: brief.why_it_matters,
    second_order_effects: brief.second_order_effects,
    risk_conditions: brief.risk_conditions,
    reflection_prompt: brief.reflection_prompt,
    related_lesson_ids: brief.related_lesson_ids,
    predictions: brief.predictions,
    key_events: brief.key_events,
    reading_level: 'foundational',
    editorial_quality_score: brief.cadence_status === 'draft-requires-data-refresh' ? 72 : 86,
    editor_notes: [
      brief.editor_notes,
      `Cadence status: ${brief.cadence_status}.`,
      `Source notes: ${brief.source_notes.map((source) => source.label).join('; ')}.`,
      `Operator prompts: ${brief.operator_observation_prompts.join(' | ')}`,
    ].join('\n'),
  }))
}

export function evaluateFirstRealPublicationCadence(): RealCadenceValidationReport {
  const issues: string[] = []

  const daily = FIRST_REAL_PUBLICATION_CADENCE.map((brief) => {
    const epistemic = evaluateEpistemicClarity(brief)
    const memory = evaluatePublicationMemory(brief)
    const operations = evaluateOperationalCalmness({
      ...brief,
      source_note_count: brief.source_notes.length,
      visible_review_count: 5,
    })
    const selectivity = evaluateSignalSelectivity(brief)
    const sustainability = evaluateEditorialSustainability(brief)
    const sourceReviewIds = brief.source_notes
      .filter((source) => requiresSourceReview(source.sourceId))
      .map((source) => source.sourceId)

    if (!epistemic.observationPresent || !epistemic.interpretationPresent) {
      issues.push(`${brief.day}: observation and interpretation are not clearly separated`)
    }
    if (!epistemic.uncertaintyVisible) {
      issues.push(`${brief.day}: uncertainty is not visible enough`)
    }
    if (memory.surveillanceHits > 0) {
      issues.push(`${brief.day}: memory language feels surveillance-like`)
    }
    if (!memory.memoryCueVisible) {
      issues.push(`${brief.day}: publication memory cue is missing`)
    }
    if (!operations.sourceHandlingCalm || !operations.visibleReviewLoadOk || !operations.sectionLoadCalm) {
      issues.push(`${brief.day}: operator load is too heavy`)
    }
    if (operations.operatorPressureHits > 0) {
      issues.push(`${brief.day}: operational pressure language detected`)
    }
    if (!selectivity.recommendationMinimal || !sustainability.relatedLessonCountOk) {
      issues.push(`${brief.day}: too many related lessons`)
    }
    if (sustainability.frameworkCreepHits > 0 || sustainability.verbosityRisk) {
      issues.push(`${brief.day}: sustainability risk detected`)
    }
    if (sourceReviewIds.length > 0) {
      issues.push(`${brief.day}: source requires commercial or redistribution review: ${sourceReviewIds.join(', ')}`)
    }
    if (brief.cadence_status === 'draft-requires-data-refresh' && brief.is_published) {
      issues.push(`${brief.day}: draft requiring data refresh must not be published`)
    }

    return {
      day: brief.day,
      title: brief.title,
      status: brief.cadence_status,
      relatedLessonCount: brief.related_lesson_ids.length,
      sourceNoteCount: brief.source_notes.length,
      memoryCueCount: memory.memoryCueCount,
      surveillanceHits: memory.surveillanceHits,
      requiresSourceReview: sourceReviewIds,
      publishSafety: brief.cadence_status === 'draft-requires-data-refresh'
        ? 'hold' as const
        : brief.cadence_status === 'scheduled-ready'
          ? 'scheduled' as const
          : 'ready' as const,
    }
  })

  return {
    issues,
    daily,
    cadence: {
      days: FIRST_REAL_PUBLICATION_CADENCE.length,
      publishedOrScheduled: FIRST_REAL_PUBLICATION_CADENCE.filter((brief) => brief.is_published).length,
      draftHolds: FIRST_REAL_PUBLICATION_CADENCE.filter((brief) => !brief.is_published).length,
      recurringThread: 'Labor resilience -> CPI/rates -> AI financing discipline',
      recommendationCounts: FIRST_REAL_PUBLICATION_CADENCE.map((brief) => brief.related_lesson_ids.length),
    },
  }
}
