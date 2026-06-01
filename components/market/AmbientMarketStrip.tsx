'use client'

import { useState, useEffect } from 'react'

interface TickerItem {
  symbol: string
  name?: string
  price: string
  change: string
  up: boolean
}

const MOCK_TICKERS: TickerItem[] = [
  { symbol: 'BTC', price: '$108,245', change: '+2.4%', up: true },
  { symbol: 'ETH', price: '$2,685', change: '+1.8%', up: true },
  { symbol: 'SOL', price: '$176.32', change: '+3.1%', up: true },
  { symbol: 'KOSPI', price: '2,687.45', change: '+0.4%', up: true },
  { symbol: 'S&P500', price: '5,473.17', change: '+0.6%', up: true },
  { symbol: 'NASDAQ', price: '17,688.91', change: '+0.8%', up: true },
  { symbol: 'US10Y', price: '4.42%', change: '+0.02', up: true },
  { symbol: 'WTI', price: '$72.30', change: '-0.8%', up: false },
  { symbol: 'Gold', price: '$2,342.50', change: '+1.2%', up: true },
  { symbol: 'USD/KRW', price: '₩1,372', change: '-0.3%', up: false },
]

function TickerItemDisplay({ symbol, price, change, up }: TickerItem) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 20px',
        whiteSpace: 'nowrap',
        fontSize: '13px',
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      }}
    >
      <span
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 600,
          letterSpacing: '0.5px',
          fontSize: '11px',
          textTransform: 'uppercase',
        }}
      >
        {symbol}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
        {price}
      </span>
      <span
        style={{
          color: up ? '#34d399' : '#f87171',
          fontWeight: 600,
          fontSize: '12px',
        }}
      >
        {up ? '▲' : '▼'} {change}
      </span>
      <span
        style={{
          width: '1px',
          height: '14px',
          background: 'rgba(255,255,255,0.1)',
          marginLeft: '14px',
        }}
      />
    </span>
  )
}

export default function AmbientMarketStrip() {
  const [tickers, setTickers] = useState<TickerItem[]>(MOCK_TICKERS)

  useEffect(() => {
    async function fetchTickers() {
      try {
        const res = await fetch('/api/ticker')
        if (!res.ok) throw new Error('Failed to fetch tickers')
        const data = await res.json()
        if (data.tickers && data.tickers.length > 0) {
          setTickers(data.tickers)
        }
      } catch {
        // Keep current data (mock or last successful fetch)
      }
    }

    fetchTickers()
    const interval = setInterval(fetchTickers, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Render ticker items mapped directly
  const items = tickers

  return (
    <>
      <style jsx>{`
        @keyframes scroll-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes pulse-live {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7);
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 0 4px rgba(34, 211, 238, 0);
          }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Ticker Bar */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            background: 'rgba(10, 10, 20, 0.65)',
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          {/* Snapshot indicator */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '14px',
              paddingRight: '18px',
              zIndex: 10,
              background:
                'linear-gradient(to right, rgba(10,10,20,0.98) 85%, rgba(10,10,20,0) 100%)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22d3ee',
                display: 'inline-block',
                animation: 'pulse-live 2.5s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#22d3ee',
                letterSpacing: '1px',
                fontFamily: "var(--font-space-grotesk), sans-serif",
              }}
            >
              학습용 시장 스냅샷
            </span>
          </div>

          {/* Scrolling marquee track */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '135px',
              overflow: 'hidden',
              width: '100%',
              maskImage:
                'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
            }}
          >
            <div
              className="marquee-track"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                animation: 'scroll-marquee 60s linear infinite',
                willChange: 'transform',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.animationPlayState =
                  'paused'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.animationPlayState =
                  'running'
              }}
            >
              {items.map((item, i) => (
                <TickerItemDisplay key={`${item.symbol}-${i}`} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div
          style={{
            width: '100%',
            background: 'rgba(5, 5, 10, 0.45)',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            padding: '5px 14px',
            textAlign: 'center',
            fontSize: '9.5px',
            color: 'rgba(255,255,255,0.38)',
            fontFamily: "var(--font-inter), sans-serif",
            letterSpacing: '0.2px',
          }}
        >
          표시되는 시장 데이터는 학습 참고용이며, 실시간 거래 또는 투자 판단용 데이터가 아닙니다.
        </div>
      </div>
    </>
  )
}
