// Market context API Types
export interface CoinMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
  sparkline_in_7d?: {
    price: number[]
  }
}

// Membership Types
export type MembershipTier = 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral'

export interface MembershipInfo {
  tier: MembershipTier
  name: string
  nameKr: string
  icon: string
  votePower: number
  benefits: string[]
  color: string
}

export const MEMBERSHIP_TIERS: Record<MembershipTier, MembershipInfo> = {
  cadet: {
    tier: 'cadet',
    name: 'Reader',
    nameKr: '리더',
    icon: '01',
    votePower: 1,
    benefits: ['Daily Brief 접근', 'Learning Path 시작', 'Reflection Journal'],
    color: 'from-slate-400 to-slate-600',
  },
  navigator: {
    tier: 'navigator',
    name: 'Navigator',
    nameKr: '항해사',
    icon: '02',
    votePower: 2,
    benefits: ['주간 인텔리전스 노트', '중급 학습 경로', 'Saved Research'],
    color: 'from-cyan-300 to-sky-600',
  },
  pilot: {
    tier: 'pilot',
    name: 'Analyst',
    nameKr: '애널리스트',
    icon: '03',
    votePower: 3,
    benefits: ['프리미엄 브리프 아카이브', '고급 학습 경로', '회고 템플릿'],
    color: 'from-blue-300 to-cyan-700',
  },
  commander: {
    tier: 'commander',
    name: 'Mentor',
    nameKr: '멘토',
    icon: '04',
    votePower: 5,
    benefits: ['리서치 서클 참여', '프리미엄 리포트', '멘토링 세션'],
    color: 'from-amber-200 to-yellow-700',
  },
  admiral: {
    tier: 'admiral',
    name: 'Steward',
    nameKr: '스튜어드',
    icon: '05',
    votePower: 10,
    benefits: ['Founding archive 접근', '비공개 스터디 서클', '기여 기준 제안'],
    color: 'from-stone-300 to-amber-700',
  },
}

// User Types
export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  membership_tier: MembershipTier
  vote_power: number
  role: UserRole
  created_at: string
}

// API Response Types
export interface PricesResponse {
  coins: CoinMarket[]
  total: number
  page: number
  per_page: number
}
