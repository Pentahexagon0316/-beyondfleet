import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

interface TickerItem {
  symbol: string
  name: string
  price: string
  change: string
  up: boolean
}

const STATIC_TICKERS: TickerItem[] = [
  { symbol: 'KOSPI', name: 'KOSPI', price: '2,687.45', change: '+0.4%', up: true },
  { symbol: 'S&P500', name: 'S&P 500', price: '5,473.17', change: '+0.6%', up: true },
  { symbol: 'NASDAQ', name: 'NASDAQ', price: '17,688.91', change: '+0.8%', up: true },
  { symbol: 'US10Y', name: 'US 10Y Yield', price: '4.42%', change: '+0.02', up: true },
  { symbol: 'WTI', name: 'WTI Oil', price: '$72.30', change: '-0.8%', up: false },
  { symbol: 'Gold', name: 'Gold safe haven', price: '$2,342.50', change: '+1.2%', up: true },
  { symbol: 'USD/KRW', name: 'Won/Dollar', price: '₩1,372', change: '-0.3%', up: false },
]

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&sparkline=false&price_change_percentage=24h',
      {
        next: { revalidate: 60 },
        headers: { Accept: 'application/json' },
      }
    )

    if (!res.ok) throw new Error('CoinGecko API error')

    const coins = await res.json()
    const cryptoTickers: TickerItem[] = coins.map((coin: any) => {
      const change = coin.price_change_percentage_24h || 0
      const price = coin.current_price >= 1
        ? `$${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        up: change >= 0,
      }
    })

    return NextResponse.json({
      tickers: [...cryptoTickers, ...STATIC_TICKERS],
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    // Fallback to simplified mock data
    const fallback: TickerItem[] = [
      { symbol: 'BTC', name: 'Bitcoin', price: '$108,245', change: '+2.4%', up: true },
      { symbol: 'ETH', name: 'Ethereum', price: '$2,685', change: '+1.8%', up: true },
      { symbol: 'SOL', name: 'Solana', price: '$176.32', change: '+3.1%', up: true },
      ...STATIC_TICKERS,
    ]
    return NextResponse.json({ tickers: fallback, updatedAt: new Date().toISOString(), fallback: true })
  }
}
