'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { MembershipTier } from '@/types'
import { sanitizeHTML } from '@/lib/security/sanitize'
import {
  canAccessTier,
  MEMBERSHIP_TIER_LABELS,
  normalizeMembershipTier,
} from '@/lib/membership/access'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Lock,
  BookOpen,
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  level: 'beginner' | 'intermediate' | 'advanced'
  thumbnail: string
  read_time: number
  required_tier: MembershipTier
  order_num: number
}

const LEARNING_STORAGE_PREFIX = 'beyondfleet:learn-progress:v1'
const RECENT_STORAGE_PREFIX = 'beyondfleet:recent-learning:v1'

const levelConfig = {
  beginner: {
    label: '초급',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
  intermediate: {
    label: '중급',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
  advanced: {
    label: '고급',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
  },
}

function getStorageKey(userId: string | null) {
  return `${LEARNING_STORAGE_PREFIX}:${userId || 'guest'}`
}

function getRecentStorageKey(userId: string | null) {
  return `${RECENT_STORAGE_PREFIX}:${userId || 'guest'}`
}

function getLocalDate() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function isYesterday(previousDate: string | null, today: string) {
  if (!previousDate) return false
  const previous = new Date(`${previousDate}T00:00:00`)
  const current = new Date(`${today}T00:00:00`)
  return current.getTime() - previous.getTime() === 24 * 60 * 60 * 1000
}

function getTrackIdForLesson(lessonId: string) {
  if (lessonId.startsWith('ai-economy')) return 'ai-economy'
  if (lessonId.startsWith('risk-thinking')) return 'risk-thinking'
  return 'macro-foundations'
}

function getLessonXp(lessonId: string) {
  const xpMap: Record<string, number> = {
    'macro-foundations-liquidity': 80,
    'macro-foundations-rates': 70,
    'macro-foundations-inflation': 80,
    'macro-foundations-bonds': 80,
    'macro-foundations-dollar': 60,
    'macro-foundations-events': 70,
    'ai-economy-compute': 90,
    'ai-economy-productivity': 80,
    'ai-economy-data': 90,
    'ai-economy-agents': 90,
    'risk-thinking-probability': 90,
    'risk-thinking-second-order': 80,
    'risk-thinking-bias': 80,
    'risk-thinking-risk-management': 100,
    'macro-foundations-reading-news': 75,
    'risk-thinking-hypothesis-building': 80,
    'risk-thinking-chart-journal': 80,
    'risk-thinking-data-sourcing': 90,
  }

  return xpMap[lessonId] || 70
}

function getLearningLevel(totalXp: number) {
  return Math.floor(totalXp / 250) + 1
}

const activatedDemoLessons: Lesson[] = [
  {
    id: 'macro-foundations-liquidity',
    title: 'Liquidity: 시장을 움직이는 물의 흐름',
    description: '금리, 중앙은행, 달러 유동성이 위험자산 가격에 미치는 영향을 정리합니다.',
    content: `## 🎯 한 줄 핵심

유동성(Liquidity)은 쉽게 말해 **"시장에 돌아다니는 돈의 양과 속도"**입니다. 워터파크의 물과 같습니다.

---

## 🏊 초등학생도 이해하는 비유: 워터파크

워터파크를 상상해 보세요.

- **물이 넘치는 워터파크** = 유동성이 풍부한 시장 🌊
  - 슬라이드도 잘 미끄러지고, 파도풀도 신나고, 모든 사람이 즐겁게 놀 수 있어요.
  - 시장에 돈이 넘치면: 주식, 비트코인, 부동산 가격이 다 올라가요.

- **물이 빠진 워터파크** = 유동성이 줄어든 시장 🏜️
  - 슬라이드가 까끌까끌하고, 파도풀 수심이 낮아지고, 놀기 불편해서 사람들이 하나둘 빠져나가요.
  - 시장에서 돈이 빠지면: 위험한 자산부터 가격이 빠지기 시작해요.

> **핵심**: 워터파크 관리자 = **중앙은행(한국은행, 미국 연준)**. 이 사람이 물(돈)을 얼마나 틀어주느냐에 따라 파크 전체의 분위기가 달라집니다.

---

## 📰 실제 뉴스로 이해하기

### 사례 1: "연준, 기준금리 동결" (2026년 5월)

이 뉴스가 나오면 이렇게 생각해 보세요:

- 금리를 **올리지 않았다** → 돈 빌리는 비용이 더 비싸지지 않았다 → 워터파크 물이 더 줄지는 않는다 → 시장은 일단 안도 😌
- 하지만 금리를 **내리지도 않았다** → 새로운 물을 더 틀어주지도 않았다 → 지금 있는 물로 계속 버텨야 한다

### 사례 2: "한국은행, 기준금리 0.25%p 인하" 

- 금리 인하 = 돈 빌리는 비용이 싸짐 = **워터파크에 물을 더 틀어준 것!** 🌊
- 기업: "돈을 빌려서 새 공장을 지을까?" → 투자 증가
- 개인: "대출 이자가 줄었네, 집을 살까?" → 소비 증가
- 시장: 돈이 돌기 시작하니 주식도 올라가네! → 자산 가격 상승

### 사례 3: "미국 달러 강세, DXY 106 돌파"

- 달러가 세지면 = 전 세계에서 달러로 빌린 돈의 이자 부담이 커짐
- 마치 워터파크의 물이 한쪽(미국)으로만 몰리는 것 → **다른 나라 파크(신흥국 시장)에는 물이 부족**해짐
- 한국 주식시장에서 외국인이 돈을 빼가는 이유가 바로 이겁니다

---

## 🧩 유동성을 결정하는 4가지 조각

| 조각 | 쉬운 설명 | 확인 방법 |
|------|-----------|-----------|
| 🏛️ **중앙은행 정책** | 워터파크 관리자가 물을 틀어주느냐 잠그느냐 | 금리 결정, 양적완화(QE) 발표 |
| 💰 **단기자금시장** | 은행들끼리 하루짜리 돈을 빌려주는 시장 | 오버나이트 금리, 신용 스프레드 |
| 💵 **달러 강약** | 전 세계 돈의 기준 통화 방향 | DXY(달러 인덱스), 원달러 환율 |
| 🏠 **대출 여건** | 보통 사람과 기업이 은행에서 돈을 빌릴 수 있는지 | 가계대출 증감, 기업 회사채 금리 |

---

## 🔍 뉴스를 볼 때 이 질문을 해보세요

어떤 경제 뉴스를 보든, 이 **3가지 질문**만 머릿속에 떠올려 보세요:

1. **"이 사건은 시장에 물(돈)을 더 넣어주나, 빼나?"**
2. **"물이 어디로 흐르고 있나? (미국? 한국? 가상자산?)"**
3. **"물의 양이 바뀐 건가, 아니면 물이 이동만 한 건가?"**

> 이 세 질문만 습관이 되면, 뉴스를 볼 때 전문가처럼 한 단계 깊은 해석이 가능해집니다.

---

## ✅ 오늘의 미니 퀴즈

다음 뉴스를 보고 유동성이 늘어나는 상황인지 줄어드는 상황인지 생각해 보세요:

- "연준이 국채를 대량 매입한다고 발표" → 물을 틀어주는 것? 잠그는 것?
- "미국 국채 금리가 5%를 돌파" → 워터파크에 물이 넘치는 것? 마르는 것?

정답은 없습니다. 중요한 것은 **스스로 생각해 보는 과정** 자체입니다.

---

## 💭 오늘의 사색 질문

오늘 본 시장 뉴스 중, **회사의 실적이 좋아서 오른 것**과 **단순히 시장에 돈이 많아서 오른 것**을 구분할 수 있나요? 그 차이를 한 줄로 적어보세요.`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-liquidity/800/400',
    read_time: 14,
    required_tier: 'cadet',
    order_num: 1,
  },
  {
    id: 'macro-foundations-rates',
    title: 'Rates: 금리와 할인율',
    description: '금리가 오르거나 내릴 때 주식, 장기채, 성장자산이 다르게 반응하는 이유를 배웁니다.',
    content: `## 🎯 한 줄 핵심

금리는 쉽게 말해 **"돈을 빌리는 데 드는 비용(이자)"**입니다. 이 숫자 하나가 바뀌면 집값, 주가, 환율, 기업 투자가 전부 영향을 받습니다.

---

## 🛒 초등학생도 이해하는 비유: 백화점 세일

백화점에서 **모든 물건을 50% 세일**한다고 상상해 보세요.

- 세일할 때(금리가 낮을 때) → 사람들이 몰려들어요 → 물건(자산)이 불티나게 팔려요 → 가격이 올라가요
- 세일이 끝나면(금리가 오르면) → "이 가격이면 안 살래" → 사람들이 줄어요 → 가격이 떨어져요

> **금리가 낮다** = 돈 빌리기가 쉽다 = 세일 중! → 투자·소비 증가
> **금리가 높다** = 돈 빌리기가 비싸다 = 정가! → 투자·소비 감소

---

## 📰 실제 뉴스로 이해하기

### 사례 1: "미국 연준, 금리 5.25% 유지 — 인하 시기는 불확실"

- 금리가 5.25%라는 건 → 은행에서 돈 빌리면 매년 5.25%의 이자를 내야 한다는 뜻
- 이자가 비싸니까 → 기업은 새 공장 짓기 망설이고 → 개인은 집 사기 부담되고 → 경제가 천천히 움직여요
- **2차 효과**: 안전한 은행 예금 이자가 5%면... "위험한 주식 안 하고 그냥 은행에 넣지 뭐" → 주식시장에서 돈이 빠져요

### 사례 2: "한국 주택담보대출 금리 4% 돌파"

- 3억 원을 빌렸다고 치면 → 금리 3%일 때 연 이자 900만원 → 금리 4%면 1,200만원
- 매달 25만원씩 더 나가는 것! → 이사를 포기하거나, 소비를 줄이게 됨
- 이게 **수백만 가구**에서 동시에 일어나면? → 식당·카페·쇼핑이 줄고 → 경제가 위축

---

## 🧩 금리가 바꾸는 3가지

| 변화 | 쉬운 설명 | 예시 |
|------|-----------|------|
| 💸 **빌리는 비용** | 대출 이자가 바뀜 | 주택대출, 기업 투자 |
| 🏦 **안전자산 매력** | 예금 이자가 높으면 굳이 위험한 투자를 안 함 | 예금 5% vs 주식 불확실 |
| 🔮 **미래 가치 할인** | 금리가 높으면 미래의 돈은 지금 돈보다 훨씬 가치가 적음 | AI 스타트업 같은 장기 성장주 타격 |

---

## 🔍 뉴스에서 금리가 나오면 이렇게 읽으세요

1. **"금리를 올렸다/내렸다/동결했다"** → 세일이 시작됐는지, 끝났는지, 유지인지 파악
2. **"시장이 예상한 것과 같았나?"** → 예상대로면 반응이 작고, 예상과 다르면 반응이 커요
3. **"누가 가장 타격받나?"** → 빚이 많은 기업, 성장주, 부동산이 특히 민감

---

## ✅ 오늘의 미니 퀴즈

- 금리가 내리면 은행 예금 이자는 어떻게 될까요? 그러면 사람들은 돈을 어디에 넣고 싶어할까요?
- 금리 5%인 나라와 금리 1%인 나라, 어디에 돈이 더 많이 몰릴까요? 그게 환율에 무슨 영향을 줄까요?

---

## 💭 오늘의 사색 질문

여러분의 용돈을 은행에 넣으면 연 5% 이자를 주는데, 친구가 "나한테 빌려주면 10% 줄게"라고 합니다. 어떤 선택이 나을까요? 그 판단 기준은 무엇인가요?`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-rates/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 2,
  },
  {
    id: 'macro-foundations-inflation',
    title: 'Inflation: 물가와 기대의 차이',
    description: '헤드라인 물가, 근원 물가, 임금, 기대 인플레이션이 정책 판단에 미치는 영향을 봅니다.',
    content: `## 🎯 한 줄 핵심

인플레이션(물가 상승)은 **"같은 돈으로 살 수 있는 것이 줄어드는 현상"**입니다. 편의점에서 삼각김밥이 1,200원에서 1,500원이 된 것, 그게 바로 인플레이션입니다.

---

## 🍙 초등학생도 이해하는 비유: 편의점 가격표

작년에 삼각김밥이 **1,200원**이었는데, 올해 **1,500원**이 됐어요.

- 용돈 6,000원으로 작년에는 5개 살 수 있었는데 → 올해는 4개밖에 못 사요
- 삼각김밥은 그대로인데 **내 용돈의 가치가 줄어든 거예요** → 이게 인플레이션!

> **물가가 오른다** = 같은 돈의 구매력이 줄어든다 = 용돈이 사실상 깎인 것

그런데 중요한 건:
- 삼각김밥이 오른 게 **쌀값이 올라서**(원재료)? → 오래 갈 수도 있음 😟
- **택배비가 잠깐 올라서**(일시적 충격)? → 곧 내려올 수도 있음 😌

중앙은행은 이 차이를 구분하려고 매달 물가 데이터를 뜯어봅니다.

---

## 📰 실제 뉴스로 이해하기

### 사례 1: "미국 4월 CPI 3.3% 상승 — 시장 예상 상회"

- CPI(소비자물가지수) = 사람들이 많이 사는 물건·서비스 가격을 종합해서 만든 숫자
- 3.3% 상승 = 작년 이맘때보다 물건이 평균 3.3% 비싸졌다
- 시장이 3.1%를 예상했는데 3.3%가 나왔다면? → "예상보다 물가가 안 떨어지네" → 연준이 금리를 쉽게 못 내린다 → 주식 하락 📉

### 사례 2: "기름값 급등, 3개월 연속 상승"

- 기름값이 오르면 → 택배비, 택시비, 비행기표, 난방비 전부 올라요
- 하지만 기름값은 **전쟁이나 감산 합의 같은 특별한 이유**로 오를 때가 많아요
- 그래서 경제학자들은 **기름·식품을 뺀 "근원 물가(Core CPI)"**를 따로 봐요 → 이게 진짜 물가 추세를 보여주니까

### 사례 3: "카페 아르바이트 시급 11,000원 돌파"

- 임금이 오르면 → 카페 사장님이 커피 가격을 올려야 해요 → 물가 상승
- 임금이 올라서 물가가 오르고 → 물가가 올라서 다시 임금을 올려달라고 하고 → 🔄 이게 반복되면 **악순환**!

---

## 🧩 물가를 이해하는 핵심 구분

| 구분 | 의미 | 예시 |
|------|------|------|
| 📊 **헤드라인 CPI** | 모든 품목 포함한 전체 물가 | 기름값 폭등하면 확 올라감 |
| 🔍 **근원 CPI** | 식품·에너지 빼고 계산 | 진짜 물가 추세를 보여줌 |
| 💰 **임금 상승률** | 사람들이 받는 월급이 얼마나 올랐나 | 임금이 물가보다 빨리 오르면 좋은 것 |
| 🧠 **기대 인플레이션** | 사람들이 앞으로 물가가 얼마나 오를 거라고 생각하는지 | 기대가 올라가면 실제로도 올라감 |

---

## 🔍 물가 뉴스를 볼 때 이 질문을 해보세요

1. **"이 물가 상승은 일시적인가, 오래 갈 것인가?"** → 원인이 전쟁/기름이면 일시적, 임금/서비스면 오래감
2. **"중앙은행이 금리를 바꿀 만큼 큰 변화인가?"** → 예상보다 높으면 "금리 인하 미뤄질 수도"
3. **"내 생활에 직접 영향은?"** → 식비, 교통비, 통신비 중 뭐가 올랐나 체크

---

## ✅ 오늘의 미니 퀴즈

학교 매점에서 빵이 800원에서 1,000원으로 올랐어요:
- 밀가루 가격이 올라서 그런 거라면, 이건 오래 갈까요 아닐까요?
- 만약 전교생이 "앞으로 빵값 더 오를 거야"라고 생각하면, 실제로 어떻게 될까요?

---

## 💭 오늘의 사색 질문

여러분이 편의점 사장이라면, 원재료가 10% 올랐을 때 상품 가격을 바로 올릴 건가요, 아니면 참고 기다릴 건가요? 그 판단의 기준은 무엇일까요?`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-inflation/800/400',
    read_time: 13,
    required_tier: 'cadet',
    order_num: 3,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-bonds/800/400',
    read_time: 13,
    required_tier: 'cadet',
    order_num: 4,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-dollar/800/400',
    read_time: 10,
    required_tier: 'cadet',
    order_num: 7,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-events/800/400',
    read_time: 11,
    required_tier: 'cadet',
    order_num: 8,
  },
  {
    id: 'ai-economy-compute',
    title: 'Compute: GPU, 전력, 데이터센터',
    description: 'AI 성장의 병목인 컴퓨팅 자원과 관련 기업/자산군의 연결 고리를 봅니다.',
    content: `## 🎯 한 줄 핵심

AI는 눈에 보이지 않지만, 실제로는 **거대한 공장과 엄청난 전기**가 필요한 산업입니다. ChatGPT 한 번 질문할 때마다 진짜 컴퓨터가 돌아가고, 진짜 전기가 사용됩니다.

---

## 🍕 초등학생도 이해하는 비유: 피자 공장

AI를 **초대형 피자 공장**이라고 생각해 보세요.

- **AI 모델** = 피자 레시피 🍕
- **GPU(그래픽카드)** = 피자를 굽는 오븐 🔥
- **데이터센터** = 오븐이 수천 개 들어있는 거대한 공장 🏭
- **전력** = 오븐을 돌리는 전기 ⚡
- **데이터** = 피자를 만드는 재료(밀가루, 치즈, 토핑) 🧀

> 아무리 맛있는 레시피가 있어도, **오븐이 없으면 피자를 못 만듭니다**.
> 지금 AI 산업에서 가장 중요한 싸움은 "누가 더 좋은 오븐(GPU)을 더 많이 갖고 있느냐"입니다.

---

## 📰 실제 뉴스로 이해하기

### 사례 1: "엔비디아 매출 260억 달러 — 사상 최대 실적"

- 엔비디아 = AI 오븐(GPU)을 만드는 회사
- 구글, 마이크로소프트, 메타가 AI 공장을 짓기 위해 오븐을 대량 주문 → 매출 폭발
- 마치 전 세계 모든 피자 프랜차이즈가 한 회사의 오븐만 사는 것 → **90% 시장 독점!**

### 사례 2: "빅테크, 올해 AI 인프라에 2,000억 달러 투자 계획"

- 한화로 약 **270조 원**! 한국 1년 국가 예산의 절반 수준
- 이 돈의 대부분이 GPU 구매, 데이터센터 건설, 전력 확보에 들어감
- 왜 이렇게 많이 쓸까? → **AI 공장이 크면 클수록 피자(AI 서비스) 한 판 만드는 비용이 싸지니까** (규모의 경제)

### 사례 3: "ChatGPT 질문 한 번에 전기세 10배 — 구글 검색 대비"

- 구글 검색 1회 = 전구 10초 켜는 전기
- ChatGPT 질문 1회 = 전구 100초 켜는 전기 ⚡
- AI 공장은 전기를 엄청 먹는 괴물 → 전력 확보가 AI 성장의 가장 큰 제약 중 하나

---

## 🧩 AI 인프라 4가지 층

| 층 | 역할 | 현재 핵심 기업 |
|----|------|----------------|
| 🔧 **반도체(칩)** | AI 연산을 처리하는 두뇌 | NVIDIA(H100, B200), TSMC(생산) |
| 🏭 **데이터센터** | 칩을 수천 개 모아놓은 공장 | AWS, Microsoft Azure, Google Cloud |
| ⚡ **전력/냉각** | 공장을 돌리는 에너지 | 원자력, 태양광 투자 급증 |
| 📊 **모델/서비스** | 사용자가 쓰는 AI 제품 | OpenAI, Anthropic, Google Gemini |

---

## 💡 이 구조를 알면 뉴스가 다르게 보여요

- "엔비디아 주가 급등" → 오븐 수요가 폭발적 → 빅테크가 AI 공장 건설 중
- "전력 부족 우려" → 오븐은 있는데 전기가 모자라 → AI 성장 속도에 브레이크
- "AI 서비스 가격 인하" → 피자 한 판 만드는 비용이 낮아짐 → 더 많은 사람이 AI 사용 가능

---

## 🔍 뉴스를 볼 때 이 질문을 해보세요

1. **"이 회사는 AI 4층 중 어디에 있나?"** → 칩? 데이터센터? 전력? 서비스?
2. **"병목은 어디인가?"** → 지금 가장 부족한 게 칩인지, 전력인지, 데이터인지
3. **"비용이 내려가고 있나, 올라가고 있나?"** → 비용이 내려가면 대중화, 올라가면 독점 강화

---

## ✅ 오늘의 미니 퀴즈

- 엔비디아가 새로운 GPU를 발표하면, TSMC(반도체 공장) 주가도 영향을 받을까요? 왜 그럴까요?
- 만약 전 세계에 GPU가 남아돌기 시작하면, 엔비디아에게 좋은 소식일까요 나쁜 소식일까요?

---

## 💭 오늘의 사색 질문

학교에서 급식을 만든다고 상상해 보세요. 요리사(AI 모델)가 아무리 뛰어나도, 조리 기구(GPU)와 가스(전력)가 없으면 밥을 못 만듭니다. **AI 산업에서 지금 가장 부족한 "조리 기구"는 무엇일까요?**`,
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-compute/800/400',
    read_time: 14,
    required_tier: 'cadet',
    order_num: 5,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-productivity/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 6,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-data/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 9,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-agents/800/400',
    read_time: 13,
    required_tier: 'cadet',
    order_num: 10,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-probability/800/400',
    read_time: 14,
    required_tier: 'cadet',
    order_num: 11,
  },
  {
    id: 'risk-thinking-second-order',
    title: 'Second-Order Thinking: 다음 반응 보기',
    description: '첫 번째 뉴스보다 그 뉴스가 만들 행동, 정책, 자금 흐름을 추적합니다.',
    content: `## 🎯 한 줄 핵심

첫 번째 효과는 "무슨 일이 일어났다", 두 번째 효과는 **"그래서 사람들이 어떻게 행동을 바꿨다"**입니다. 장기적으로는 두 번째 효과가 더 중요합니다.

---

## 🎲 초등학생도 이해하는 비유: 도미노

도미노를 상상해 보세요.

- 첫 번째 도미노를 손가락으로 톡 밀어요 → 이게 **1차 효과** (뉴스 자체)
- 그 도미노가 다음 도미노를 쓰러뜨려요 → 이게 **2차 효과** (사람들의 반응)
- 그 다음 도미노도, 그 다음도... → 연쇄 반응이 치즈어져요!

> **핵심**: 뉴스를 보면 "이 다음에 누가 행동을 바꾸지?"를 생각해 보세요. 그게 2차 효과입니다.

---

## 📰 실제 뉴스로 이해하기

### 사례 1: "기름값 20% 급등"

도미노 체인을 따라가 보세요:

- 1차: 기름값이 올람 → 택배비가 오름 🚚
- 2차: 택배비가 오르니까 온라인 쇼핑 가격이 오름 💻
- 3차: 소비자가 소비를 줄임 → 기업 매출 하락 📉
- 4차: 기업 매출이 줄면 직원을 춤 → 고용 악화 😟

**기름값 한 개의 뉴스에서 4단계의 연쇄 반응이 나왔어요!**

### 사례 2: "연준, 금리 인하 신호"

- 1차: 금리 인하 기대 → 주식 시장 하루악이 오름 📈
- 2차: 투자자들이 성장주에 몰림 → AI·테크 주가 더 오름
- 3차: 모두가 같은 주식을 사니 버블 위험 증가 🎈
- 4차: 버블이 껨지면? → 원래 보다 더 크게 하락 💥

### 사례 3: "애플, 아이폰 신모델 판매 부진"

- 1차: 애플 매출 예상 하락
- 2차: 애플에 부품 납품하는 한국 회사들도 영향 → 코스피 하락 
- 3차: 한국 주식시장이 빠지면 → 외국인 투자자가 돈을 빼 → 원화 약세 → 환율 상승

---

## 🔍 뉴스를 볼 때 이 질문을 해보세요

1. **"이 뉴스 다음에 누가 행동을 바꾸지?"** → 정부? 기업? 소비자? 투자자?
2. **"그 행동 변화가 또 다른 도미노를 쓰러뜨리나?"** → 연쇄 반응이 몇 단계까지 가나?
3. **"이 효과는 이미 가격에 반영됐나?"** → 시장이 이미 알고 있는 건 닦은 물이에요

---

## ✅ 오늘의 미니 퀴즈

학교에서 점심시간을 30분 줄인다고 발표했어요. 1차 효과는 "점심 시간이 줄어든다"인데:
- 2차 효과는 뭘까요? (학생들의 행동 변화)
- 3차 효과는 뭘까요? (학교 근처 가게들은?)

---

## 💭 오늘의 사색 질문

오늘 가장 크게 다루어진 뉴스를 하나 골라서, **도미노 체인을 3단계까지 적어보세요**. 1차 → 2차 → 3차까지 그려보면, 세상이 다르게 보이기 시작할 거예요.`,
    level: 'beginner',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-second-order/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 12,
  },
  {
    id: 'risk-thinking-bias',
    title: 'Cognitive Bias: 판단을 흐리는 습관',
    description: '확증편향, 최신성 편향, 손실회피가 판단을 어떻게 흔드는지 점검합니다.',
    content: `## 🎯 한 줄 핵심

사람은 정보를 있는 그대로 보지 않습니다. **이미 믿고 싶은 것, 최근에 본 것, 잃기 싫은 것**에 판단이 끌립니다. 이걸 **인지 편향**이라고 합니다.

---

## 🕶️ 초등학생도 이해하는 비유: 색안경

빨간색 안경을 끼면 세상이 빨겝게 보이죠? **편향도 똑같아요.** 편향이라는 안경을 끼면 사실이 왔곡되어 보여요.

문제는 **새안경을 끼고 있다는 걸 본인이 모른다는 점**입니다.

> 편향을 없애기는 어렵지만, **"나 지금 색안경 끼고 있나?"**라고 의심하는 것만으로도 판단이 한층 나아집니다.

---

## 📰 실제 뉴스로 이해하기

### 편향 1: 확증편향 — "내 생각만 맞는 것 같아"

예시: 비트코인이 오를 거라고 믿으면 → 오를 거라는 기사만 눈에 들어오고 → "역시 내가 맞았어!" → 하락할 가능성은 무시

학교 예시: 수학 시험 답을 3번이라고 생각했는데 → 3번이 맞는 이유만 자꾸 떠오르고 → 다른 답 가능성을 안 봐요

### 편향 2: 최신성 편향 — "방금 본 게 제일 중요해"

예시: 어제 주가가 5% 떨어졌는데 → "망했다, 다 팔아야 해" → 하지만 한 달 전체로 보면 +15%

학교 예시: 방금 시험에서 60점 받으면 → "나 수학 못하나 봐" → 그런데 지난 시험 5회 평균은 85점

### 편향 3: 손실회피 — "손해보는 게 너무 싫어"

예시: 주식이 30% 빠졌는데 → "팔면 손해 확정이니까 그냥 들고 있자" → 더 빠져서 50% 손실

학교 예시: 뽑기를 5,000원 주고 했는데 원하는 거 안 나옴 → "조금만 더 하면 나올 거야" → 결국 20,000원 씀

### 편향 4: 권위 편향 — "유명한 사람이 말했으니까 맞겠지"

예시: 유명 유튜버가 "이 코인 하늘로 간다" → "그렇구나!" → 그런데 그 유튜버는 소유자라 자기 코인을 선전하는 중

---

## 🧩 편향 정리표

| 편향 | 쉬운 설명 | 실생활 예시 |
|------|-----------|----------------|
| 🔍 **확증편향** | 내 생각을 지지하는 정보만 찾음 | SNS에서 내 의견과 같은 글만 좋아요 누름 |
| 📆 **최신성 편향** | 어제 일을 너무 크게 평가 | 어제 비 왔으니까 오늘도 우산 챙겨감 |
| 💸 **손실회피** | 손해 인정이 싫어서 더 큰 손해 발생 | 맛없는 음식도 돈 아깐워서 다 먹음 |
| 👑 **권위 편향** | 유명한 사람 말을 검증 없이 따름 | 선생님이 말하면 다 맞는 줄 알았음 |

---

## 🔍 편향을 점검하는 3가지 질문

중요한 판단을 하기 전에:

1. **"나는 지금 반대 의견을 얼마나 찾아봤나?"** → 확증편향 점검
2. **"이 판단이 어제 본 뉴스 때문인가, 아니면 1개월 데이터 기준인가?"** → 최신성 편향 점검
3. **"이 정보를 말한 사람이 이익 충돌은 없나?"** → 권위 편향 점검

---

## ✅ 오늘의 미니 퀴즈

친구가 "비트코인 사면 100% 돈 번다"고 말했어요.
- 여러분은 어떤 편향의 영향을 받고 있나요? (확증? 권위? 둘 다?)
- 이 말을 듣고 "하지만..." 하고 반대 의견을 떠올릴 수 있나요?

---

## 💭 오느의 사색 질문

오늘 내가 가장 쉽게 빠질 수 있는 편향은 무엇이며, 그것을 확인할 신호는 무엇인가요? 편향의 이름을 붙이는 것만으로도 반은 해결됩니다.`,
    level: 'intermediate',
    thumbnail: 'https://picsum.photos/seed/beyondfleet-bias/800/400',
    read_time: 10,
    required_tier: 'cadet',
    order_num: 13,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-risk-management/800/400',
    read_time: 13,
    required_tier: 'cadet',
    order_num: 14,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-news-reading/800/400',
    read_time: 11,
    required_tier: 'cadet',
    order_num: 15,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-hypothesis/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 16,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-chart-journal/800/400',
    read_time: 12,
    required_tier: 'cadet',
    order_num: 17,
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
    thumbnail: 'https://picsum.photos/seed/beyondfleet-data-sourcing/800/400',
    read_time: 13,
    required_tier: 'navigator',
    order_num: 18,
  },
]

function escapeLessonHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatLessonInline(value: string) {
  return value
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

function renderMarkdown(content: string): string {
  const lines = escapeLessonHtml(content).split('\n')
  let html = ''
  let inList = false
  let inTable = false
  let tableHeaderDone = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  const closeTable = () => {
    if (inTable) {
      html += '</tbody></table></div>'
      inTable = false
      tableHeaderDone = false
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      closeTable()
      return
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      closeList()
      closeTable()
      html += '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:2.5rem 0" />'
      return
    }

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList()
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim())

      // Skip separator row (|---|---|)
      if (cells.every(c => /^[-:]+$/.test(c))) {
        tableHeaderDone = true
        return
      }

      if (!inTable) {
        html += '<div style="overflow-x:auto;margin:1.5rem 0"><table style="width:100%;border-collapse:collapse;font-size:0.95rem"><thead><tr>'
        cells.forEach(cell => {
          html += `<th style="padding:0.75rem 1rem;text-align:left;border-bottom:2px solid rgba(255,255,255,0.15);color:#e2e8f0;font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em">${formatLessonInline(cell)}</th>`
        })
        html += '</tr></thead><tbody>'
        inTable = true
        return
      }

      html += '<tr>'
      cells.forEach(cell => {
        html += `<td style="padding:0.75rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06);color:#cbd5e1">${formatLessonInline(cell)}</td>`
      })
      html += '</tr>'
      return
    }

    // Close table if non-table content follows
    closeTable()

    if (trimmed.startsWith('### ')) {
      closeList()
      html += `<h3>${formatLessonInline(trimmed.slice(4))}</h3>`
      return
    }

    if (trimmed.startsWith('## ')) {
      closeList()
      html += `<h2>${formatLessonInline(trimmed.slice(3))}</h2>`
      return
    }

    if (trimmed.startsWith('# ')) {
      closeList()
      html += `<h1>${formatLessonInline(trimmed.slice(2))}</h1>`
      return
    }

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      html += `<li>${formatLessonInline(trimmed.slice(2))}</li>`
      return
    }

    if (trimmed.startsWith('> ')) {
      closeList()
      html += `<blockquote>${formatLessonInline(trimmed.slice(2))}</blockquote>`
      return
    }

    closeList()
    html += `<p>${formatLessonInline(trimmed)}</p>`
  })

  closeList()
  closeTable()
  return html
}

export default function LessonDetailPage() {
  const params = useParams()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchLesson()
    fetchAllLessons()
    checkAuth()
  }, [lessonId])

  useEffect(() => {
    if (!lesson) return
    void recordLessonRecent(lesson, userId)
  }, [lesson?.id, userId])

  async function fetchLesson() {
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

    const isBanned = (title: string, desc: string = '', content: string = '') => {
      if (BANNED_LESSON_TITLES.includes(title)) return true
      const tLower = title.toLowerCase()
      const dLower = desc.toLowerCase()
      const cLower = content.toLowerCase()
      return BANNED_KEYWORDS.some((kw) => {
        const kwLower = kw.toLowerCase()
        return tLower.includes(kwLower) || dLower.includes(kwLower) || cLower.includes(kwLower)
      })
    }

    const activatedLesson = activatedDemoLessons.find(l => l.id === lessonId)
    if (activatedLesson) {
      if (isBanned(activatedLesson.title, activatedLesson.description, activatedLesson.content)) {
        setLesson(null)
      } else {
        setLesson(activatedLesson)
      }
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      if (data && isBanned(data.title, data.description || '', data.content || '')) {
        setLesson(null)
      } else {
        setLesson(data)
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      // 데모 데이터 사용
      const demoLesson = activatedDemoLessons.find(l => l.id === lessonId)
      if (demoLesson) {
        if (isBanned(demoLesson.title, demoLesson.description, demoLesson.content)) {
          setLesson(null)
        } else {
          setLesson(demoLesson)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllLessons() {
    setAllLessons(activatedDemoLessons)
  }

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        setUserId(user.id)

        // 사용자 티어 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single()

        setUserTier(normalizeMembershipTier(profile?.membership_tier))

        // 완료 여부 확인
        const { data: progress } = await supabase
          .from('learning_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle()

        if (progress?.completed) {
          setIsCompleted(true)
        }
      } else {
        const saved = window.localStorage.getItem(getStorageKey(null))
        const completed = saved ? JSON.parse(saved) as string[] : []
        setIsCompleted(completed.includes(lessonId))
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  async function recordLessonRecent(currentLesson: Lesson, currentUserId: string | null) {
    const item = {
      item_type: 'lesson' as const,
      item_id: currentLesson.id,
      title: currentLesson.title,
      href: `/learn/${currentLesson.id}`,
      viewed_at: new Date().toISOString(),
      metadata: {
        trackId: getTrackIdForLesson(currentLesson.id),
        level: currentLesson.level,
      },
    }

    try {
      const key = getRecentStorageKey(currentUserId)
      const saved = window.localStorage.getItem(key)
      const parsed = saved ? JSON.parse(saved) as Array<typeof item> : []
      const next = [
        item,
        ...parsed.filter((existing) => !(existing.item_type === item.item_type && existing.item_id === item.item_id)),
      ].slice(0, 8)
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Recent activity is non-critical.
    }

    if (currentUserId) {
      await supabase
        .from('learning_recent_items')
        .upsert({
          user_id: currentUserId,
          item_type: item.item_type,
          item_id: item.item_id,
          title: item.title,
          href: item.href,
          viewed_at: item.viewed_at,
          metadata: item.metadata,
        }, {
          onConflict: 'user_id,item_type,item_id',
        })
    }
  }

  async function updateLearningStats(currentUserId: string | null, completedLessonIds: Set<string>) {
    const totalXp = activatedDemoLessons.reduce((sum, item) => (
      completedLessonIds.has(item.id) ? sum + getLessonXp(item.id) : sum
    ), 0)
    const today = getLocalDate()

    if (!currentUserId) {
      const key = getStorageKey(null)
      const previousDate = window.localStorage.getItem(`${key}:last-activity`)
      const currentStreak = Number(window.localStorage.getItem(`${key}:streak`) || 0)
      const longestStreak = Number(window.localStorage.getItem(`${key}:longest-streak`) || 0)
      const nextStreak = previousDate === today ? Math.max(1, currentStreak) : isYesterday(previousDate, today) ? currentStreak + 1 : 1

      window.localStorage.setItem(`${key}:streak`, String(nextStreak))
      window.localStorage.setItem(`${key}:longest-streak`, String(Math.max(longestStreak, nextStreak)))
      window.localStorage.setItem(`${key}:last-activity`, today)
      return
    }

    const { data: existingStats } = await supabase
      .from('learning_user_stats')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', currentUserId)
      .maybeSingle()

    const previousDate = existingStats?.last_activity_date || null
    const currentStreak = existingStats?.current_streak || 0
    const longestStreak = existingStats?.longest_streak || 0
    const nextStreak = previousDate === today ? Math.max(1, currentStreak) : isYesterday(previousDate, today) ? currentStreak + 1 : 1

    await supabase
      .from('learning_user_stats')
      .upsert({
        user_id: currentUserId,
        total_xp: totalXp,
        current_level: getLearningLevel(totalXp),
        current_streak: nextStreak,
        longest_streak: Math.max(longestStreak, nextStreak),
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
  }

  async function handleComplete() {
    if (!lesson) return

    setCompleting(true)
    try {
      const now = new Date().toISOString()
      const trackId = getTrackIdForLesson(lessonId)
      const lessonXp = getLessonXp(lessonId)
      const storageKey = getStorageKey(userId)
      const saved = window.localStorage.getItem(storageKey)
      const localCompleted = new Set(saved ? JSON.parse(saved) as string[] : [])
      localCompleted.add(lessonId)
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(localCompleted)))

      await recordLessonRecent(lesson, userId)

      if (isLoggedIn && userId) {
        const { error } = await supabase
          .from('learning_progress')
          .upsert({
            user_id: userId,
            lesson_id: lessonId,
            track_id: trackId,
            lesson_title: lesson.title,
            lesson_xp: lessonXp,
            completed: true,
            completed_at: now,
            last_viewed_at: now,
            updated_at: now,
          }, {
            onConflict: 'user_id,lesson_id'
          })

        if (error) throw error

        const { data: progressRows } = await supabase
          .from('learning_progress')
          .select('lesson_id, completed')
          .eq('user_id', userId)

        const completedIds = new Set((progressRows || []).filter((row) => row.completed).map((row) => row.lesson_id))
        completedIds.add(lessonId)
        await updateLearningStats(userId, completedIds)
      } else {
        await updateLearningStats(null, localCompleted)
      }

      setIsCompleted(true)
    } catch (error) {
      console.error('Error marking complete:', error)
      // 데모 모드에서는 그냥 완료 처리
      setIsCompleted(true)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-space-700 rounded w-1/4 mb-8" />
            <div className="h-64 bg-space-700 rounded-xl mb-8" />
            <div className="h-6 bg-space-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-space-700 rounded w-full mb-2" />
            <div className="h-4 bg-space-700 rounded w-full mb-2" />
            <div className="h-4 bg-space-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">강의를 찾을 수 없습니다</h1>
          <Link href="/learn">
            <Button>강의 목록으로</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isLocked = !canAccessTier(userTier, lesson.required_tier)
  const config = levelConfig[lesson.level]

  // 이전/다음 강의 찾기
  const currentIndex = allLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b10] px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.035] p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06]">
            <Lock className="h-7 w-7 text-cyan-100" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-white">{lesson.title}</h1>
          <p className="mb-6 text-sm leading-6 text-gray-400">
            이 강의는 <span className="font-medium text-cyan-100">{MEMBERSHIP_TIER_LABELS[lesson.required_tier]}</span> 이상
            멤버만 접근할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Link href="/learn" className="flex-1">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로
              </Button>
            </Link>
            <Link href="/membership" className="flex-1">
              <Button className="w-full">
                멤버십 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b10] px-4 py-10 sm:py-12">
      <div className="mx-auto min-w-0 w-[calc(100vw_-_2rem)] max-w-[740px] sm:w-full">
        {/* Back Button */}
        <Link href="/learn" className="mb-8 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-200">
          <ArrowLeft className="w-4 h-4 mr-2" />
          강의 목록
        </Link>

        <section className="bf-reading-panel mb-9 rounded-lg p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className={`rounded-lg px-3 py-1 ${config.bg} ${config.color} text-sm font-medium`}>
              {config.label}
            </span>
            <span className="flex items-center text-sm text-gray-400">
              <Clock className="mr-1 h-4 w-4" />
              {lesson.read_time}분
            </span>
            <span className="flex items-center text-sm text-gray-400">
              <BookOpen className="mr-1 h-4 w-4" />
              Lesson {lesson.order_num}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-1 text-sm text-emerald-200">
                <CheckCircle className="h-4 w-4" />
                완료됨
              </span>
            )}
          </div>

          <h1 className="max-w-full break-words text-3xl font-semibold leading-tight text-white md:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-5 max-w-[32ch] break-words text-base leading-8 text-gray-400 sm:max-w-[62ch] sm:text-lg">
            {lesson.description}
          </p>
        </section>

        <section className="mb-8 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <BookOpen className="h-4 w-4" />
            처음 읽는다면
          </div>
          <p className="text-sm leading-7 text-gray-300">
            완벽히 이해하려 하지 않아도 됩니다. 오늘은 눈에 들어온 문장 하나,
            모르는 단어 하나, 더 알고 싶은 질문 하나만 남기면 충분합니다.
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-gray-400 sm:grid-cols-3">
            <p className="rounded-lg border border-white/[0.06] bg-black/12 p-3">본문에서 가장 중요한 문장 하나를 찾습니다.</p>
            <p className="rounded-lg border border-white/[0.06] bg-black/12 p-3">모르는 용어는 맥락만 잡고 넘어갑니다.</p>
            <p className="rounded-lg border border-white/[0.06] bg-black/12 p-3">마지막 질문은 짧게 적어도 됩니다.</p>
          </div>
        </section>

        {/* Content */}
        <div className="mb-9 min-w-0 overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.024] p-6 md:p-10">
          <article
            className="bf-reading-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(renderMarkdown(lesson.content)) }}
          />
        </div>

        {/* Complete Button */}
        <div className="mb-9 flex flex-col items-start justify-between gap-4 rounded-lg border border-white/[0.075] bg-white/[0.024] p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isCompleted ? 'This lesson is in your learning archive' : 'Mark this as read when ready'}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {isCompleted
                ? 'Come back when a future brief makes this concept useful again.'
                : 'This is only a gentle marker. There is no need to finish everything today.'}
            </p>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">완료됨</span>
            </div>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="whitespace-nowrap"
            >
              {completing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  읽음으로 기록
                </>
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          {prevLesson ? (
            <Link href={`/learn/${prevLesson.id}`} className="flex-1">
              <div className="h-full rounded-lg border border-white/[0.075] bg-white/[0.024] p-4 transition-colors hover:bg-white/[0.045]">
                <div className="flex items-center text-gray-400 text-sm mb-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  이전 강의
                </div>
                <h4 className="text-white font-medium line-clamp-1">{prevLesson.title}</h4>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextLesson ? (
            <Link href={`/learn/${nextLesson.id}`} className="flex-1">
              <div className="h-full rounded-lg border border-white/[0.075] bg-white/[0.024] p-4 text-right transition-colors hover:bg-white/[0.045]">
                <div className="flex items-center justify-end text-gray-400 text-sm mb-2">
                  다음 강의
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                <h4 className="text-white font-medium line-clamp-1">{nextLesson.title}</h4>
              </div>
            </Link>
          ) : (
            <Link href="/learn" className="flex-1">
              <div className="h-full rounded-lg border border-white/[0.075] bg-white/[0.024] p-4 text-right transition-colors hover:bg-white/[0.045]">
                <div className="flex items-center justify-end text-gray-400 text-sm mb-2">
                  모든 강의 완료!
                </div>
                <h4 className="text-white font-medium">목록으로 돌아가기</h4>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
