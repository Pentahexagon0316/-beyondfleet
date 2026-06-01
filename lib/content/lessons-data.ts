export interface LessonData {
  id: string
  title: string
  description: string
  content: string
  level: 'beginner' | 'intermediate' | 'advanced'
  course: 'basic' | 'pro'
  thumbnail: string
  read_time: number
  required_tier: string // 'cadet' for basic, 'navigator' for pro
  order_num: number
  is_ai_generated: boolean
  xp: number
  tag: string
}

export const HARDCODED_LESSONS: LessonData[] = [
  {
    id: 'macro-foundations-liquidity',
    title: 'Liquidity: 시장을 움직이는 물의 흐름',
    description: '금리, 중앙은행, 달러 유동성이 위험자산 가격에 미치는 영향을 정리합니다.',
    content: `## Core idea

유동성은 시장 참여자가 위험을 감수할 수 있는 여유입니다. 돈이 많다는 뜻만은 아닙니다. 자금 조달 비용, 중앙은행 정책, 은행 대출 태도, 달러 접근성이 함께 움직이며 시장의 온도를 만듭니다.

### What to watch

1. 중앙은행의 정책금리와 대차대조표
2. 단기자금시장과 신용 스프레드
3. 달러 강세와 글로벌 자금 흐름
4. 기업과 가계의 차입 여건

### Judgment check

뉴스 하나를 볼 때 "이 사건은 유동성을 늘리는가, 줄이는가, 아니면 분배만 바꾸는가?"를 먼저 질문해보세요.

### Reflection

오늘 본 시장 반응 중 실제 펀더멘털 변화보다 유동성 조건 변화에 더 가까운 것은 무엇이었나요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-liquidity/800/400',
    read_time: 14,
    required_tier: 'cadet',
    order_num: 1,
    is_ai_generated: false,
    xp: 80,
    tag: 'macro-foundations',
  },
  {
    id: 'macro-foundations-rates',
    title: 'Rates: 금리와 할인율',
    description: '금리가 오르거나 내릴 때 주식, 장기채, 성장자산이 다르게 반응하는 이유를 배웁니다.',
    content: `## Core idea

금리는 미래 현금흐름을 현재 가치로 바꾸는 기준입니다. 금리가 오르면 먼 미래의 이익은 더 많이 할인되고, 금리가 내리면 장기 성장의 가치가 더 커 보입니다.

### Rate changes mean three things

1. 돈을 빌리는 비용이 바뀝니다
2. 안전자산의 매력이 바뀝니다
3. 미래 성장에 대한 가격표가 바뀝니다

### Second-order effect

금리 상승은 단순히 주가에 부담을 주는 이벤트가 아닙니다. 부채가 많은 기업, 장기 프로젝트, 소비 민감 업종, 신흥국 통화까지 서로 다른 속도로 영향을 받습니다.

### Reflection

오늘 금리라는 단어에서 가장 눈에 들어온 점은 무엇인가요? 한 문장만 적어도 충분합니다.`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-rates/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 2,
    is_ai_generated: false,
    xp: 70,
    tag: 'macro-foundations',
  },
  {
    id: 'macro-foundations-inflation',
    title: 'Inflation: 물가와 기대의 차이',
    description: '헤드라인 물가, 근원 물가, 임금, 기대 인플레이션이 정책 판단에 미치는 영향을 봅니다.',
    content: `## Core idea

인플레이션은 가격이 오른다는 사실보다 지속성과 기대가 더 중요합니다. 중앙은행은 일시적인 충격과 반복되는 압력을 구분하려고 합니다.

### What to separate

1. 헤드라인 물가와 에너지 충격
2. 근원 물가와 서비스 가격
3. 임금 상승과 노동시장 압력
4. 기대 인플레이션과 실제 소비 행동

### Why it matters

물가가 내려와도 기대가 불안정하면 정책은 쉽게 완화되지 않습니다. 반대로 물가가 높아 보여도 구성 요소가 일시적이라면 시장은 다른 반응을 보일 수 있습니다.

### Reflection

오늘의 물가 데이터에서 실제로 정책 경로를 바꿀 수 있는 항목은 무엇인가요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-inflation/800/400',
    read_time: 13,
    required_tier: 'cadet',
    order_num: 3,
    is_ai_generated: false,
    xp: 80,
    tag: 'macro-foundations',
  },
  {
    id: 'macro-foundations-bonds',
    title: 'Bonds: 채권금리와 경기 신호',
    description: '장단기 금리, 실질금리, 신용 스프레드가 경기와 위험 선호를 어떻게 보여주는지 정리합니다.',
    content: `## Core idea

채권시장은 성장, 물가, 정책 기대가 동시에 반영되는 공간입니다. 금리의 방향만 보는 것보다 어느 만기의 금리가 왜 움직였는지를 보는 것이 중요합니다.

### What to watch

1. 단기금리: 정책 경로 기대
2. 장기금리: 성장과 인플레이션 프리미엄
3. 실질금리: 위험자산의 할인율
4. 신용 스프레드: 기업 자금 조달 스트레스

### Why it matters

주식과 위험자산은 채권시장의 신호를 늦게 반영할 때가 있습니다. 특히 실질금리와 신용 스프레드는 리스크 한도를 정할 때 중요한 기준입니다.

### Reflection

지금 채권시장은 성장 둔화를 말하고 있나요, 물가 압력을 말하고 있나요, 아니면 정책 불확실성을 말하고 있나요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-bonds/800/400',
    read_time: 13,
    required_tier: 'cadet',
    order_num: 4,
    is_ai_generated: false,
    xp: 80,
    tag: 'macro-foundations',
  },
  {
    id: 'macro-foundations-dollar',
    title: 'Dollar Cycle: 강달러와 약달러',
    description: 'DXY, 신흥국 자금 흐름, 원자재와 글로벌 위험자산의 관계를 한 번에 연결합니다.',
    content: `## Core idea

달러는 단순한 한 나라의 통화가 아니라 글로벌 금융 시스템의 결제 언어입니다. 달러가 강해지면 전 세계의 달러 부채, 무역 결제, 원자재 가격, 신흥국 자금 흐름이 함께 압박을 받습니다.

### What to connect

강달러는 종종 글로벌 유동성의 축소 신호입니다. 약달러는 위험자산에 숨통을 열어주지만, 그 배경이 미국 경기 둔화라면 해석은 달라질 수 있습니다.

### Risk condition

달러 상승과 신흥국 통화 약세가 동시에 커질 때는 자금 조달 스트레스가 숨어 있을 수 있습니다.

### Reflection

오늘의 달러 움직임은 성장 기대 때문인가요, 위험 회피 때문인가요, 아니면 정책 차이 때문인가요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-dollar/800/400',
    read_time: 10,
    required_tier: 'cadet',
    order_num: 7,
    is_ai_generated: false,
    xp: 60,
    tag: 'macro-foundations',
  },
  {
    id: 'macro-foundations-events',
    title: 'Event Calendar: CPI, FOMC, 고용지표',
    description: '큰 발표 전후에 변동성이 커지는 이유와 체크해야 할 지표를 정리합니다.',
    content: `## Core idea

경제 이벤트는 숫자 자체보다 기대와의 차이가 중요합니다. 시장은 이미 많은 것을 가격에 반영합니다. 그래서 좋은 숫자가 나와도 시장이 하락할 수 있고, 나쁜 숫자가 나와도 안도 랠리가 나올 수 있습니다.

### Key events

1. CPI: 물가 압력과 정책 경로
2. FOMC: 금리, 점도표, 기자회견 톤
3. 고용지표: 임금, 실업률, 노동 수요
4. PMI: 경기 확장과 위축의 초기 신호

### Reflection

이번 이벤트에서 시장이 가장 크게 수정한 가정은 무엇이었나요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-events/800/400',
    read_time: 11,
    required_tier: 'cadet',
    order_num: 8,
    is_ai_generated: false,
    xp: 70,
    tag: 'macro-foundations',
  },
  {
    id: 'risk-thinking-probability',
    title: 'Probabilistic Thinking: 확률로 보기',
    description: '확신 대신 가능성의 범위, base rate, 시나리오를 기준으로 판단합니다.',
    content: `## Core idea

좋은 판단은 확신을 크게 외치는 것이 아니라 가능성의 범위를 정직하게 다루는 것입니다. 확률적 사고는 "맞다/틀리다"보다 "얼마나 가능성이 있는가"를 묻습니다.

### Useful questions

1. 기본 확률은 무엇인가?
2. 내가 가진 정보가 실제로 확률을 얼마나 바꾸는가?
3. 반대 시나리오는 무엇인가?
4. 틀렸을 때 손실은 얼마나 큰가?

### Reflection

내가 최근 확신했던 판단 중 실제로는 확률 범위로 봐야 했던 것은 무엇인가요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-probability/800/400',
    read_time: 14,
    required_tier: 'cadet',
    order_num: 11,
    is_ai_generated: false,
    xp: 90,
    tag: 'risk-thinking',
  },
  {
    id: 'risk-thinking-second-order',
    title: 'Second-Order Thinking: 다음 반응 보기',
    description: '첫 번째 뉴스보다 그 뉴스가 만들 행동, 정책, 자금 흐름을 추적합니다.',
    content: `## Core idea

첫 번째 효과는 뉴스가 직접 바꾸는 것입니다. 두 번째 효과는 그 뉴스에 사람들이 반응하면서 생기는 변화입니다. 장기적으로는 두 번째 효과가 더 중요할 때가 많습니다.

### Practice

중요한 뉴스를 보면 "그 다음에 누가 행동을 바꾸는가?"를 적어보세요. 정책, 기업, 소비자, 투자자 행동이 서로 영향을 주며 다음 국면을 만듭니다.

### Reflection

오늘의 핵심 뉴스가 만든 두 번째 효과는 아직 가격에 반영되었나요, 아니면 기다려야 하나요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-second-order/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 12,
    is_ai_generated: false,
    xp: 80,
    tag: 'risk-thinking',
  },
  // --- Pro lessons (required_tier: 'navigator') ---
  {
    id: 'ai-economy-compute',
    title: 'Compute: GPU, 전력, 데이터센터',
    description: 'AI 성장의 병목인 컴퓨팅 자원과 관련 기업/자산군의 연결 고리를 봅니다.',
    content: `## Core idea

AI는 소프트웨어처럼 보이지만 물리적 인프라 위에서 작동합니다. GPU, 전력, 냉각, 네트워크, 데이터센터 용량이 AI 경제의 속도와 비용을 결정합니다.

### Infrastructure stack

1. 반도체와 가속기
2. 클라우드와 데이터센터
3. 전력망과 냉각
4. 모델 학습과 추론 비용

### Second-order effect

컴퓨팅 비용이 낮아지면 더 많은 제품이 AI를 기본 기능으로 넣습니다. 반대로 비용이 높게 유지되면 대형 플랫폼과 자본력이 있는 기업이 유리해질 수 있습니다.

### Reflection

AI 성장의 가장 큰 제약은 기술인가요, 전력인가요, 자본인가요, 아니면 데이터인가요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-compute/800/400',
    read_time: 14,
    required_tier: 'navigator',
    order_num: 5,
    is_ai_generated: false,
    xp: 90,
    tag: 'ai-economy',
  },
  {
    id: 'ai-economy-productivity',
    title: 'Automation: 일이 재배치되는 방식',
    description: 'AI 자동화가 비용 구조, 조직 설계, 노동 수요에 미치는 변화를 봅니다.',
    content: `## Core idea

AI 자동화는 단순히 일자리를 없애는 이야기가 아닙니다. 반복 업무의 비용을 낮추고, 일부 직무의 속도를 높이며, 어떤 역량이 더 희소해지는지를 바꿉니다.

### What changes first

1. 문서 작성과 요약
2. 고객 응대와 내부 운영
3. 코드와 디자인 초안 생산
4. 데이터 정리와 리서치 보조

### Risk condition

생산성이 올라가도 이익이 노동자, 기업, 소비자 중 누구에게 배분되는지는 별개의 문제입니다.

### Reflection

내가 하는 일 중 AI가 속도를 높여주는 부분과 사람이 여전히 판단해야 하는 부분은 어디에서 갈라지나요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-productivity/800/400',
    read_time: 12,
    required_tier: 'navigator',
    order_num: 6,
    is_ai_generated: false,
    xp: 80,
    tag: 'ai-economy',
  },
  {
    id: 'ai-economy-data',
    title: 'Data Economy: 데이터가 자본이 되는 조건',
    description: '데이터 품질, 접근권, 모델 학습 비용이 경제적 해자를 만드는 방식을 정리합니다.',
    content: `## Core idea

AI 경제에서 데이터는 원유처럼 단순히 많이 보유한다고 가치가 생기지 않습니다. 정제 가능성, 접근권, 독점성, 신뢰도, 업데이트 속도가 함께 있어야 자본이 됩니다.

### Data quality signals

1. 정확성
2. 최신성
3. 사용 허가와 출처
4. 피드백 루프
5. 특정 문제와의 연결성

### Reflection

내가 신뢰하는 정보 출처는 최신성, 정확성, 맥락 중 무엇이 강하고 무엇이 약한가요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-data/800/400',
    read_time: 12,
    required_tier: 'navigator',
    order_num: 9,
    is_ai_generated: false,
    xp: 90,
    tag: 'ai-economy',
  },
  {
    id: 'ai-economy-agents',
    title: 'AI Agents: 의사결정 자동화',
    description: 'AI agents가 개인 생산성, 기업 워크플로, 시장 정보 처리 속도를 어떻게 바꾸는지 봅니다.',
    content: `## Core idea

AI agent는 단순한 챗봇보다 한 단계 더 나아가 목표를 이해하고, 도구를 호출하고, 여러 단계를 이어서 실행하는 시스템입니다. 중요한 질문은 "무엇을 자동화할 수 있는가"가 아니라 "어떤 판단을 위임해도 되는가"입니다.

### Agent workflow

1. 목표 설정
2. 정보 수집
3. 도구 실행
4. 결과 검토
5. 다음 행동 제안

### Risk condition

agent가 틀린 전제를 가지고 빠르게 실행하면 사람보다 더 큰 실수를 만들 수 있습니다. 속도보다 검증 구조가 중요합니다.

### Reflection

내가 AI에게 맡기고 싶은 일 중 반드시 사람이 마지막 판단을 해야 하는 부분은 무엇인가요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-agents/800/400',
    read_time: 13,
    required_tier: 'navigator',
    order_num: 10,
    is_ai_generated: false,
    xp: 90,
    tag: 'ai-economy',
  },
  {
    id: 'risk-thinking-bias',
    title: 'Cognitive Bias: 판단을 흐리는 습관',
    description: '확증편향, 최신성 편향, 손실회피가 판단을 어떻게 흔드는지 점검합니다.',
    content: `## Core idea

사람은 정보를 있는 그대로 보지 않습니다. 이미 믿고 싶은 것, 최근에 본 것, 잃기 싫은 것에 판단이 끌립니다. 편향을 없애기는 어렵지만 이름을 붙이면 관리할 수 있습니다.

### Common biases

1. 확증편향: 내 생각을 지지하는 정보만 찾기
2. 최신성 편향: 최근 사건을 과도하게 중요하게 보기
3. 손실회피: 손실을 인정하기 싫어 판단을 늦추기
4. 권위 편향: 유명한 사람의 의견을 검증 없이 따르기

### Reflection

오늘 내가 가장 쉽게 빠질 수 있는 편향은 무엇이며, 그것을 확인할 신호는 무엇인가요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-bias/800/400',
    read_time: 10,
    required_tier: 'navigator',
    order_num: 13,
    is_ai_generated: false,
    xp: 80,
    tag: 'risk-thinking',
  },
  {
    id: 'risk-thinking-risk-management',
    title: 'Risk Management: 틀릴 수 있음을 설계하기',
    description: '판단이 틀렸을 때도 시스템이 망가지지 않도록 위험을 구조화합니다.',
    content: `## Core idea

리스크 관리는 두려움을 피하는 기술이 아니라 틀릴 가능성을 설계에 포함하는 습관입니다. 좋은 판단도 틀릴 수 있기 때문에 손실 한도, 시간 범위, 재검토 조건이 필요합니다.

### Risk map

1. 무엇이 틀릴 수 있는가?
2. 틀렸다는 신호는 무엇인가?
3. 손실은 어디까지 허용할 수 있는가?
4. 언제 다시 판단할 것인가?

### Long-term habit

매일 하나의 가정을 저장하고, 일주일 뒤 다시 보세요. BeyondFleet의 핵심 루프는 빠르게 반응하는 것이 아니라 천천히 더 나아지는 것입니다.

### Reflection

지금 내가 가진 가장 중요한 가정은 무엇이며, 어떤 조건이 바뀌면 그 가정을 수정해야 하나요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-risk-management/800/400',
    read_time: 13,
    required_tier: 'navigator',
    order_num: 14,
    is_ai_generated: false,
    xp: 100,
    tag: 'risk-thinking',
  },
  {
    id: 'macro-foundations-reading-news',
    title: 'News Literacy: 뉴스를 분해하고 맥락을 읽는 법',
    description: '단순한 사실 전달을 넘어 행간에 담긴 정책 기대와 두 번째 충격을 읽어내는 법을 배웁니다.',
    content: `## Core idea

뉴스는 사건의 결과이자 새로운 행동을 만드는 원인입니다. 경제 뉴스를 읽을 때는 사실(Fact)과 해석(Opinion)을 구분하고, 이 뉴스가 시장의 어떤 기대치를 흔들었는지를 질문해야 합니다.

### How to read economic news

1. **지표와 예측치 대조**: 뉴스가 "물가 상승"을 외칠 때, 시장의 사전 예상치(Consensus)보다 높았는지 낮았는지를 대조해 보세요.
2. **이해관계자 행동 추적**: 이 뉴스로 인해 중앙은행, 대기업, 소비자는 행동을 어떻게 바꿀 것인가? (2차 사고)
3. **용어 디코딩**: "긴축적", "비둘기파적" 같은 단어가 가리키는 실제 금리 경로를 수치로 환산해 보세요.

### Reflection

오늘 본 뉴스 중 시장의 기대와 실제 사실 사이에 가장 큰 괴리가 있었던 것은 무엇이었나요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-news-reading/800/400',
    read_time: 11,
    required_tier: 'cadet',
    order_num: 15,
    is_ai_generated: false,
    xp: 75,
    tag: 'macro-foundations',
  },
  {
    id: 'risk-thinking-hypothesis-building',
    title: 'Hypothesis: 데이터를 분석하기 전 가설을 설계하는 법',
    description: '막연한 예측 대신 어떤 조건이 참일 때 내 판단이 옳은가를 규명하는 가설 수립법입니다.',
    content: `## Core idea

가설은 검증하거나 폐기할 수 있도록 구체적이고 반증 가능해야 합니다. "경기가 나빠질 것이다"는 가설이 아닙니다. "기준금리가 50bp 인상되면 신흥국 채권 스프레드가 100bp 이상 벌어질 것이다"가 훌륭한 가설입니다.

### Recipe for a Good Hypothesis

1. **반증 가능성(Falsifiability)**: 내 생각이 틀렸음을 증명해 줄 수 있는 구체적 데이터나 이벤트를 미리 지정합니다.
2. **인과관계 단순화**: 독립변수(원인)와 종속변수(결과)를 명확히 정의합니다.
3. **시간제한(Timeframe)**: 이 가설이 언제까지 유효하고 언제 검토할 것인지 날짜를 지정합니다.

### Reflection

최근 가졌던 생각 중 "만약 이 지표가 X 이상으로 나오면 내 생각이 틀린 것이다"라고 말할 수 있는 기준은 무엇인가요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-hypothesis/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 16,
    is_ai_generated: false,
    xp: 80,
    tag: 'risk-thinking',
  },
  {
    id: 'risk-thinking-chart-journal',
    title: 'Chart Journal: 차트를 주관이 아닌 객관으로 기록하는 법',
    description: '선과 지표에 속지 않고, 변동성 속에서 시장의 구조적 합의점을 읽는 차트 기록법입니다.',
    content: `## Core idea

차트는 과거 가격의 역사일 뿐 미래의 지도 기호가 아닙니다. 차트 노트를 적을 때는 가격선이 그어진 위치보다, 거래량과 변동성이 집중된 구간이 시장 참여자들의 어떤 합의를 보여주는지 관찰해야 합니다.

### Principles of Chart Journaling

1. **중요 지지와 저항 규명**: 가격이 여러 번 멈췄던 구간에 어떤 경제적 이벤트나 기대(금리, 정책)가 물려 있었는지 대조합니다.
2. **추세와 노이즈 구분**: 일일 변동성(Noise)에 흔들리지 않도록 주간/월간 단위의 큰 추세를 확인합니다.
3. **지표 맹신 금지**: 보조지표는 가격의 변형일 뿐입니다. 항상 거시 데이터(실질금리, 기대 인플레이션)와 함께 입체적으로 해석하세요.

### Reflection

최근 유심히 관찰한 차트 구간 중, 기술적 신호보다 실제 거시경제 지표 발표(CPI, FOMC)가 추세를 바꾼 사례는 무엇이었나요?`,
    level: 'beginner',
    course: 'basic',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-chart-journal/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 17,
    is_ai_generated: false,
    xp: 80,
    tag: 'risk-thinking',
  },
  {
    id: 'risk-thinking-data-sourcing',
    title: 'Data Sourcing: 수치 뒤에 숨겨진 신뢰를 검증하는 법',
    description: '떠도는 루머나 2차 해석된 가설에서 탈피해, 공신력 있는 원천 데이터를 확보하는 기술입니다.',
    content: `## Core idea

신뢰할 수 없는 데이터 위에 세워진 가설은 사상누각입니다. 금융 의사결정을 훈련할 때는 반드시 출처가 명확한 1차 데이터(Primary Source)를 확인하고 검증하는 습관을 들여야 합니다.

### Verified Sourcing Guide

1. **정책 데이터**: 연방준비은행(FRED), 한국은행, 각국 통계청 공식 릴리스 확인.
2. **기업/매크로 실적**: 기업의 공식 주주서한(10-K, 10-Q) 및 공식 IR 자료 사용.
3. **출처 검증**: "카더라" 식의 SNS 정보나 2차 가공 언론보도보다, 해당 기사가 인용한 통계 보고서 원문을 5분 더 찾아보는 훈련을 지속하세요.

### Reflection

오늘 습득한 정보 중 출처가 모호하거나 누군가의 주관적 2차 해석이 강하게 들어간 정보는 무엇인가요?`,
    level: 'intermediate',
    course: 'pro',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-data-sourcing/800/400',
    read_time: 13,
    required_tier: 'navigator',
    order_num: 18,
    is_ai_generated: false,
    xp: 90,
    tag: 'risk-thinking',
  },
]
