import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    console.error(".env.local not found!")
    process.exit(1)
  }

  const lines = readFileSync(envPath, 'utf8').split('\n')
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const splitIndex = trimmed.indexOf('=')
    if (splitIndex === -1) return

    const key = trimmed.slice(0, splitIndex).trim()
    const value = trimmed.slice(splitIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  })
}

async function main() {
  loadLocalEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const todayStr = '2026-05-27'

  // Clear existing featured briefs to ensure this new premium brief is the featured highlight of today
  const { error: clearError } = await supabase
    .from('daily_briefs')
    .update({ is_featured: false, updated_at: new Date().toISOString() })
    .eq('is_featured', true)

  if (clearError) {
    console.warn('Warning clearing featured status:', clearError.message)
  }

  const briefPayload = {
    date: todayStr,
    title: '미래 3대 핵심 기술 산업별 선도 기업 및 구조적 성장 데이터 분석',
    summary: 'AI 인프라, Web3/DePIN, 핀테크 금융망 분야별 선도 기업들의 실제 CapEx, 수수료, 연산 비용 절감률 등의 데이터적 근거를 바탕으로 그들의 장기 성장성을 증명하고, 스스로 시장의 해자를 공부할 수 있는 4단계 연구 방법론을 제시합니다.',
    full_content: `## 1. 미래 기술 3대 핵심 분야 및 선도 기업 데이터 분석

### 1) AI & 고성능 컴퓨팅 (High-Performance Computing, HPC)
인공지능 분야는 단순한 소프트웨어 경쟁을 넘어 **"컴퓨팅 파워 공급망(Compute Supply Chain)"**을 장악한 기업이 모든 가치를 독식하는 승자독식 구조를 띄고 있습니다.

* **NVIDIA (엔비디아)**: AI 연산의 표준 아키텍처(CUDA) 및 고성능 GPU(H100, B200) 시장 점유율 90% 이상 장악.
* **TSMC (TSMC)**: 전 세계 미세 공정 반도체 위탁 생산의 92% 이상을 담당하는 대체 불가능한 생산 기둥.
* **OpenAI & Anthropic**: 초거대 언어 모델(LLM)의 연구 및 엔터프라이즈 상용화 프론티어.

#### 📊 핵심 데이터 및 성장 가능성 근거
* **빅테크 기업의 자본 지출(CapEx) 폭증**: Microsoft, Google, Meta, AWS 4대 하이퍼스케일러의 2024~2025년 누적 설비투자(CapEx) 전망치는 **연간 2,000억 달러(한화 약 270조 원)**를 상회합니다. 이 자금의 약 60% 이상이 하드웨어(엔비디아 칩 및 데이터센터)에 직접 투입되고 있습니다.
* **연산 비용의 파괴적 하락 (LLM Scaling Law)**: GPT-3 시절 대비 토큰(Token)당 연산 비용은 **99% 이상 감소**했습니다. 이는 성능 향상 속도가 인프라 공급 단가 하락 속도보다 빨라, 엔터프라이즈 도입 장벽이 지속해서 낮아지고 있음을 증명합니다.

---

### 2) Web3 & 분산 인프라 (Decentralized Web3 & DePIN)
Web3는 자본 집약적인 중앙집중형 클라우드를 탈피하여, 전 세계의 유휴 자원(컴퓨팅, 네트워크, 저장소)을 블록체인 인센티브로 결합하는 **DePIN(Decentralized Physical Infrastructure Networks)** 모델로 진화하고 있습니다.

* **Solana (솔라나)**: 극단적인 저비용(트랜잭션당 $0.00025)과 고속 성능(실제 TPS 2,500+)으로 DePIN 허브로 안착.
* **Render Network (렌더)**: 유휴 GPU 분산 렌더링 네트워크를 구축해 AI 학습 및 3D 그래픽 렌더링의 대안으로 부상.
* **Helium (헬륨)**: 세계 최대의 분산형 무선 통신 네트워크를 구축하여 전통 통신망(5G) 대비 90% 저렴한 IoT 통신망 개척.

#### 📊 핵심 데이터 및 성장 가능성 근거
* **공급망 대비 비용 효율성**: Render Network의 분산형 GPU 연산 비용은 기존 AWS(Amazon Web Services) 대비 **최대 2~10배 저렴**합니다. 대규모 AI 학습 수요 증가로 전 세계적인 GPU 쇼티지가 발생할 때 유일한 유휴 자원 공급망 역할을 합니다.
* **DePIN 네트워크 참여 지표**: Helium의 글로벌 분산형 노드(핫스팟) 수는 누적 **98만 개**를 돌파하였으며, 솔라나 기반 노드 수수료 소모율은 전년 대비 **180% 성장**하며 실물 인프라 유틸리티 기반의 생태계로 성장하고 있습니다.

---

### 3) 핀테크 & 매크로 인텔리전스 (FinTech & Macro Intelligence)
전통 금융망의 파편화된 데이터와 신용 장벽을 초연결 API와 AI 매크로 의사결정으로 지능화하는 분야입니다.

* **Stripe (스트라이프)**: 인터넷 경제의 표준 결제 인프라(API)로 글로벌 온프레미스 및 국경 간 자금 흐름 독점.
* **Plaid (플레이드)**: 오픈뱅킹 API의 표준으로 사용자 금융 자산 데이터를 안전하게 통합 제공.
* **Bloomberg (블룸버그)**: 전 세계 금융 정보 터미널 시장 점유율 1위로 독보적인 매크로 정보 및 신용 장벽 구축.

#### 📊 핵심 데이터 및 성장 가능성 근거
* **국경 간 결제 인프라의 성장성**: Stripe의 2024년 총 처리 결제 금액(TPV)은 **1조 달러(한화 약 1,350조 원)**를 돌파했습니다. 이는 전 세계 GDP의 약 1%에 달하는 규모이며, 연평균 성장률(CAGR)은 **25%**에 육박합니다.
* **매크로 데이터의 락인 효과**: 금융 시장 전문가들의 87%는 대체 불가능한 도구로 블룸버그 터미널을 지목합니다. 연간 구독료가 **$24,000(한화 약 3,200만 원)** 이상임에도 고객 유지율(Retention)은 **94% 이상**을 유지하는 초강력 경제적 해자(Moat)를 갖고 있습니다.`,
    what_happened: '전 세계 빅테크 기업들의 연간 CapEx 규모가 2,000억 달러를 돌파하며 AI 인프라 독점이 가속화되는 한편, 실물 자원을 분산 결합하는 Web3 DePIN 인프라와 플레이드/스트라이프 중심의 글로벌 금융 API 시장의 구조적 성장이 뚜렷해지고 있습니다.',
    why_it_matters: '단순히 시장의 표면적인 주가 등락만 추종해서는 지속 가능한 눈을 기를 수 없습니다. 선도 인프라의 공급 단가 하락, 설비 투자 지표, 한계 비용의 0 수렴성과 같은 "데이터적 증거"를 바탕으로 산업의 핵심 기둥을 이해해야만 스스로 생각하는 공부를 개척할 수 있습니다.',
    second_order_effects: '1. 하이퍼스케일러의 CapEx 증가 -> 반도체 미세 공정 생산 기지(TSMC) 및 락인 장벽(엔비디아 CUDA)의 수수료 성격 독점 가치 상승. 2. 대형 GPU 인프라 쇼티지 발생 -> AWS 대안으로서 렌더 네트워크(Render)와 같은 DePIN 유휴 연산 수요 급증. 3. 파편화된 다국적 핀테크 망 통합 -> Stripe TPV 성장에 따른 인터넷 경제 총생산 가치의 기하급수적 팽창.',
    risk_conditions: '1. 연준(Fed)의 고금리 장기화 기조에 따른 스타트업 및 중소 노드 생태계의 자금 조달 리스크. 2. 분산 네트워크 참여 노드의 실질 가동률 및 서비스 수준 협약(SLA) 품질 보증 실패 우려.',
    reflection_prompt: '오늘 분석된 3대 핵심 산업(AI, Web3/DePIN, FinTech) 중, 당신이 보기에 한계 비용의 하락 속도가 가장 빠르고 네트워크 효과가 강력하다고 생각하는 분야는 어디이며, 그 데이터적 근거는 무엇인가요?',
    market_sentiment: 'neutral',
    fear_greed_index: 68,
    btc_price: 94820.00,
    eth_price: 3410.00,
    btc_change_24h: 1.45,
    eth_change_24h: -0.85,
    is_premium: true,
    is_published: true,
    is_featured: true,
    category: 'macro',
    tags: ['macro', 'capital-expenditure', 'depin', 'fintech'],
    editorial_quality_score: 98,
    reading_level: 'foundational',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Check if brief for today already exists
  const { data: existing, error: existingError } = await supabase
    .from('daily_briefs')
    .select('id')
    .eq('date', todayStr)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    const { error } = await supabase
      .from('daily_briefs')
      .update(briefPayload)
      .eq('id', existing.id)

    if (error) throw error
    console.log(`Successfully updated today's brief for ${todayStr}!`)
  } else {
    const { error } = await supabase
      .from('daily_briefs')
      .insert(briefPayload)

    if (error) throw error
    console.log(`Successfully seeded today's featured brief for ${todayStr}!`)
  }
}

main().catch((error) => {
  console.error("Failed to seed brief:", error)
  process.exit(1)
})
