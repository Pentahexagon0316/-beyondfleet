import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TrendItem {
  keyword: string
  count: number
  category: 'coin' | 'macro' | 'concept' | 'event'
  change: 'up' | 'down' | 'new' | 'same'
  emoji: string
}

// In production, this would aggregate from Supabase:
// - Search queries from ai-search
// - Viewed lessons/briefs
// - Popular coin lookups
// For now, return curated trending data
const trendingKeywords: TrendItem[] = [
  { keyword: '비트코인 반감기', count: 342, category: 'event', change: 'up', emoji: '₿' },
  { keyword: '금리 인하', count: 287, category: 'macro', change: 'up', emoji: '📉' },
  { keyword: 'ETH ETF', count: 256, category: 'coin', change: 'new', emoji: '⟠' },
  { keyword: 'AI 반도체', count: 234, category: 'concept', change: 'up', emoji: '🤖' },
  { keyword: 'SOL 생태계', count: 198, category: 'coin', change: 'up', emoji: '☀️' },
  { keyword: '달러 약세', count: 176, category: 'macro', change: 'same', emoji: '💵' },
  { keyword: 'DeFi 수익률', count: 165, category: 'concept', change: 'down', emoji: '🏦' },
  { keyword: '일본 금리', count: 154, category: 'macro', change: 'new', emoji: '🇯🇵' },
  { keyword: 'NFT 마켓', count: 143, category: 'concept', change: 'down', emoji: '🎨' },
  { keyword: '미국 고용지표', count: 132, category: 'event', change: 'up', emoji: '📊' },
]

export async function GET() {
  return NextResponse.json({
    trends: trendingKeywords,
    updatedAt: new Date().toISOString(),
    totalUsers: 1247, // mock total active users
    period: '24h',
  })
}
