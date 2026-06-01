'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RefreshCw, Diamond, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { MembershipTier } from '@/types'
import { canAccessTier, normalizeMembershipTier } from '@/lib/membership/access'

interface WhaleTransaction {
  id: string
  coin: string
  amount: number
  amount_usd: number
  from_address: string
  to_address: string
  from_label: string | null
  to_label: string | null
  tx_type: 'exchange_deposit' | 'exchange_withdrawal' | 'transfer' | 'unknown'
  tx_hash: string
  blockchain: string
  timestamp: string
  is_significant: boolean
}

const COIN_COLORS: Record<string, string> = {
  BTC: 'text-orange-400 bg-orange-500/20',
  ETH: 'text-purple-400 bg-purple-500/20',
  USDT: 'text-green-400 bg-green-500/20',
  USDC: 'text-blue-400 bg-blue-500/20',
  XRP: 'text-gray-400 bg-gray-500/20',
  SOL: 'text-cyan-400 bg-cyan-500/20',
}

const TX_TYPE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  exchange_deposit: {
    label: '거래소 입금',
    icon: <ArrowDownLeft className="w-4 h-4" />,
    color: 'text-red-400',
  },
  exchange_withdrawal: {
    label: '거래소 출금',
    icon: <ArrowUpRight className="w-4 h-4" />,
    color: 'text-green-400',
  },
  transfer: {
    label: '전송',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    color: 'text-blue-400',
  },
  unknown: {
    label: '알 수 없음',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    color: 'text-gray-400',
  },
}

export default function WhalePage() {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)
  const [significantOnly, setSignificantOnly] = useState(false)

  // User state
  const [user, setUser] = useState<User | null>(null)
  const [userTier, setUserTier] = useState<MembershipTier>('cadet')

  const canAccess = canAccessTier(userTier, 'pilot')

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_tier')
          .eq('id', user.id)
          .single()

        setUserTier(normalizeMembershipTier(profile?.membership_tier))
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [selectedCoin, significantOnly])

  async function fetchTransactions() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCoin) params.set('coin', selectedCoin)
      if (significantOnly) params.set('significant', 'true')
      params.set('limit', '50')

      const res = await fetch(`/api/whale?${params}`)
      const data = await res.json()

      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching whale transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchTransactions()
    setRefreshing(false)
  }

  const formatAmount = (amount: number, coin: string) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${coin}`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${coin}`
    return `${amount.toLocaleString()} ${coin}`
  }

  const formatUsd = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`
    return `$${amount.toLocaleString()}`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const shortenAddress = (address: string) => {
    if (!address) return '알 수 없음'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // If user doesn't have access, show upgrade prompt
  if (!canAccess) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/news" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" />
            뉴스로 돌아가기
          </Link>

          {/* Locked Content */}
          <div className="glass rounded-2xl p-12 text-center border border-amber-500/30">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
              <Lock className="w-12 h-12 text-black" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              🐋 고래 추적
            </h1>

            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              대형 거래와 고래 지갑 움직임을 실시간으로 추적하세요.
              <br />
              <span className="text-amber-400 font-bold">Pilot</span> 이상 멤버십이 필요합니다.
            </p>

            {/* Features Preview */}
            <div className="bg-space-800/50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
              <p className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                <Diamond className="w-5 h-5" />
                고래 추적 기능
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">🐋 BTC 1,000개 이상 거래 추적</li>
                <li className="flex items-center gap-2">🐋 ETH 10,000개 이상 거래 추적</li>
                <li className="flex items-center gap-2">📊 거래소 입출금 모니터링</li>
                <li className="flex items-center gap-2">🔔 대형 거래 실시간 알림</li>
                <li className="flex items-center gap-2">📈 고래 동향 분석</li>
              </ul>
            </div>

            <Link href="/membership">
              <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
                멤버십 업그레이드
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/news" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            뉴스로 돌아가기
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                🐋 고래 추적
                <span className="px-3 py-1 text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full font-bold">
                  PREMIUM
                </span>
              </h1>
              <p className="text-gray-400">
                대형 암호화폐 거래를 실시간으로 추적합니다
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Coin Filter */}
          <div className="flex gap-2">
            {['BTC', 'ETH', 'USDT', 'USDC'].map((coin) => (
              <button
                key={coin}
                onClick={() => setSelectedCoin(selectedCoin === coin ? null : coin)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCoin === coin
                    ? COIN_COLORS[coin] || 'bg-gray-500/20 text-gray-400'
                    : 'bg-space-800/50 text-gray-400 hover:text-white'
                }`}
              >
                {coin}
              </button>
            ))}
          </div>

          {/* Significant Only Toggle */}
          <button
            onClick={() => setSignificantOnly(!significantOnly)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              significantOnly
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-space-800/50 text-gray-400 hover:text-white'
            }`}
          >
            🔥 대형 거래만
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">총 거래 수</p>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">거래소 입금</p>
            <p className="text-2xl font-bold text-red-400">
              {transactions.filter(tx => tx.tx_type === 'exchange_deposit').length}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">거래소 출금</p>
            <p className="text-2xl font-bold text-green-400">
              {transactions.filter(tx => tx.tx_type === 'exchange_withdrawal').length}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">대형 거래</p>
            <p className="text-2xl font-bold text-amber-400">
              {transactions.filter(tx => tx.is_significant).length}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full" />
                    <div>
                      <div className="h-5 bg-purple-500/20 rounded w-32 mb-2" />
                      <div className="h-4 bg-purple-500/20 rounded w-48" />
                    </div>
                  </div>
                  <div className="h-6 bg-purple-500/20 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🐋</div>
            <p className="text-gray-400 text-lg">최근 고래 거래가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const txInfo = TX_TYPE_INFO[tx.tx_type] || TX_TYPE_INFO.unknown
              const coinColor = COIN_COLORS[tx.coin] || 'text-gray-400 bg-gray-500/20'

              return (
                <div
                  key={tx.id || tx.tx_hash}
                  className={`glass rounded-xl p-6 hover:bg-space-800/50 transition-colors ${
                    tx.is_significant ? 'border-2 border-amber-500/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Left: Coin & Amount */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${coinColor}`}>
                        <span className="text-xl font-bold">{tx.coin.slice(0, 1)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">
                            {formatAmount(tx.amount, tx.coin)}
                          </span>
                          {tx.is_significant && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                              🔥 대형
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {formatUsd(tx.amount_usd)}
                        </p>
                      </div>
                    </div>

                    {/* Center: Transaction Type & Addresses */}
                    <div className="flex-1 min-w-[200px]">
                      <div className={`flex items-center gap-2 mb-1 ${txInfo.color}`}>
                        {txInfo.icon}
                        <span className="text-sm font-medium">{txInfo.label}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span>{tx.from_label || shortenAddress(tx.from_address)}</span>
                        <span className="mx-2">→</span>
                        <span>{tx.to_label || shortenAddress(tx.to_address)}</span>
                      </div>
                    </div>

                    {/* Right: Time & Link */}
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">{formatTime(tx.timestamp)}</p>
                      <p className="text-gray-500 text-xs">{tx.blockchain}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 glass rounded-xl p-4 border border-amber-500/20">
          <p className="text-amber-400 text-sm">
            ⚠️ 고래 거래 정보는 참고용입니다. 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
