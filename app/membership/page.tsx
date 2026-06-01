'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { MEMBERSHIP_TIERS, MembershipTier } from '@/types'
import { normalizeMembershipTier, MEMBERSHIP_TIER_LABELS } from '@/lib/membership/access'
import Button from '@/components/ui/Button'
import {
  ArrowRight,
  Bell,
  Check,
  Crown,
  Mail,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'

interface NotificationSettings {
  emailBriefDigest: boolean
  emailWeeklySummary: boolean
  emailTierChanges: boolean
}

const TIER_HIGHLIGHTS: Record<MembershipTier, { emoji: string; highlight: string; price: string }> = {
  cadet: { emoji: '🚀', highlight: '무료로 시작하세요', price: '무료' },
  navigator: { emoji: '🧭', highlight: '더 깊은 분석과 인사이트', price: '₩9,900/월' },
  pilot: { emoji: '✈️', highlight: '프리미엄 아카이브 접근', price: '₩19,900/월' },
  commander: { emoji: '⭐', highlight: '멘토링과 리서치 서클', price: '₩39,900/월' },
  admiral: { emoji: '👑', highlight: '커뮤니티 리더십과 기여', price: '₩79,900/월' },
}

const TIER_ORDER: MembershipTier[] = ['cadet', 'navigator', 'pilot', 'commander', 'admiral']

function TierBadge({ tier }: { tier: MembershipTier }) {
  const colors: Record<MembershipTier, string> = {
    cadet: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
    navigator: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
    pilot: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
    commander: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    admiral: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colors[tier]}`}>
      <span>{TIER_HIGHLIGHTS[tier].emoji}</span>
      {MEMBERSHIP_TIER_LABELS[tier]}
    </span>
  )
}

export default function MembershipPage() {
  const [currentTier, setCurrentTier] = useState<MembershipTier>('cadet')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<MembershipTier | null>(null)
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false)
  
  // Interactive Billing States
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardPwd, setCardPwd] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailBriefDigest: true,
    emailWeeklySummary: true,
    emailTierChanges: true,
  })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsLoggedIn(true)
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, membership_tier')
            .eq('id', user.id)
            .single()

          if (profile) {
            setCurrentTier(normalizeMembershipTier(profile.membership_tier))
            setDisplayName(profile.display_name || user.email?.split('@')[0] || '')
          }

          // Load notification preferences
          try {
            const { data: prefs } = await supabase
              .from('notification_preferences')
              .select('email_brief_digest, email_weekly_summary, email_tier_changes')
              .eq('user_id', user.id)
              .single()

            if (prefs) {
              setNotifications({
                emailBriefDigest: prefs.email_brief_digest ?? true,
                emailWeeklySummary: prefs.email_weekly_summary ?? true,
                emailTierChanges: prefs.email_tier_changes ?? true,
              })
            }
          } catch {
            // Table may not exist yet
          }
        }
      } catch (err) {
        console.error('Error loading user:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  async function handleNotificationSave() {
    setNotifSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_brief_digest: notifications.emailBriefDigest,
          email_weekly_summary: notifications.emailWeeklySummary,
          email_tier_changes: notifications.emailTierChanges,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2000)
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    } finally {
      setNotifSaving(false)
    }
  }

  function handleUpgradeClick(tier: MembershipTier) {
    setSelectedUpgradeTier(tier)
    setShowUpgradeForm(true)
    setUpgradeSubmitted(false)
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
    setCardPwd('')
    setPayError('')
  }

  async function handleUpgradeSubmit() {
    if (!selectedUpgradeTier) return
    setIsPaying(true)
    setPayError('')

    if (cardNumber.length < 16) {
      setPayError('카드 번호 16자리를 정확하게 입력해 주세요.')
      setIsPaying(false)
      return
    }
    if (cardExpiry.length < 4) {
      setPayError('올바른 유효 기간(MMYY)을 입력해 주세요.')
      setIsPaying(false)
      return
    }
    if (cardCvc.length < 3) {
      setPayError('올바른 CVC 번호(3자리)를 입력해 주세요.')
      setIsPaying(false)
      return
    }
    if (cardPwd.length < 2) {
      setPayError('카드 비밀번호 앞 2자리를 입력해 주세요.')
      setIsPaying(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setPayError('로그인이 필요합니다.')
        setIsPaying(false)
        return
      }

      const response = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          requestedTier: selectedUpgradeTier,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setUpgradeSubmitted(true)
        setCurrentTier(selectedUpgradeTier)
      } else {
        setPayError(data.error || '결제 처리 중 요류가 발생했습니다.')
      }
    } catch (err) {
      setPayError('서버와의 통신에 실패했습니다.')
    } finally {
      setIsPaying(false)
    }
  }

  const currentTierIndex = TIER_ORDER.indexOf(currentTier)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b10]">
        <div className="h-12 w-12 animate-spin rounded-full border border-cyan-200/20 border-t-cyan-200" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#070b10] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* ── Hero ── */}
        <section className="mb-10">
          <p className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] px-3 py-1.5 text-sm font-medium text-cyan-100">
            <Crown className="h-4 w-4" />
            Membership
          </p>
          <h1 className="mt-5 text-3xl font-bold text-white md:text-5xl font-sans tracking-tight">
            멤버십 & 알림 관리
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-gray-400">
            {isLoggedIn
              ? `${displayName}님은 현재 ${MEMBERSHIP_TIER_LABELS[currentTier]} 등급입니다.`
              : '로그인하면 멤버십 등급과 알림을 관리할 수 있습니다.'}
          </p>
        </section>

        {/* ── Current Tier (logged in) ── */}
        {isLoggedIn && (
          <section className="mb-10 rounded-xl border border-cyan-300/15 bg-gradient-to-r from-cyan-500/[0.06] to-emerald-500/[0.04] p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-200">현재 등급</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-4xl">{TIER_HIGHLIGHTS[currentTier].emoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{MEMBERSHIP_TIER_LABELS[currentTier]}</h2>
                    <p className="text-sm text-gray-400">{MEMBERSHIP_TIERS[currentTier].nameKr}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{TIER_HIGHLIGHTS[currentTier].price}</p>
                <p className="mt-1 text-xs text-gray-500">현재 플랜</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Tier Comparison ── */}
        <section className="mb-10">
          <div className="mb-6 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white">등급 비교</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {TIER_ORDER.map((tier, index) => {
              const info = MEMBERSHIP_TIERS[tier]
              const highlight = TIER_HIGHLIGHTS[tier]
              const isCurrent = isLoggedIn && tier === currentTier
              const isUpgrade = isLoggedIn && index > currentTierIndex
              const isLower = isLoggedIn && index < currentTierIndex

              return (
                <div
                  key={tier}
                  className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                    isCurrent
                      ? 'border-cyan-300/30 bg-cyan-300/[0.06] shadow-lg shadow-cyan-500/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-cyan-400/15 blur-2xl" />
                  )}

                  <div className="relative">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <span className="text-2xl">{highlight.emoji}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                          현재
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white">{info.name}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{info.nameKr}</p>

                    {/* Price */}
                    <p className="mt-3 text-lg font-bold text-white">{highlight.price}</p>

                    {/* Benefits */}
                    <ul className="mt-4 space-y-2 mb-6">
                      {info.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm leading-5 text-gray-300">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto">
                    {isCurrent ? (
                      <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-center text-sm font-semibold text-cyan-200">
                        현재 플랜
                      </div>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleUpgradeClick(tier)}
                        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-[#070b10] transition hover:opacity-90"
                      >
                        구독하기 →
                      </button>
                    ) : isLower ? (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-center text-sm text-gray-600">
                        이전 등급
                      </div>
                    ) : (
                      <Link href="/auth/login">
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/[0.08]">
                          {tier === 'cadet' ? '무료 시작' : '로그인 필요'}
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Upgrade Request Modal ── */}
        {showUpgradeForm && selectedUpgradeTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1520] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              {upgradeSubmitted ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">결제가 성공적으로 완료되었습니다!</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    축하합니다! 이제 <span className="font-bold text-cyan-300">{MEMBERSHIP_TIER_LABELS[selectedUpgradeTier]}</span> 등급의 회원 혜택이 적용됩니다. 모든 심화 교육 코스 및 리서치 아카이브 접근이 잠금 해제되었습니다.
                  </p>
                  <button
                    onClick={() => {
                      setShowUpgradeForm(false)
                      setCardNumber('')
                      setCardExpiry('')
                      setCardCvc('')
                      setCardPwd('')
                      setPayError('')
                    }}
                    className="mt-6 w-full rounded-lg bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-300" />
                      <h3 className="text-lg font-bold text-white">
                        멤버십 업그레이드 결제
                      </h3>
                    </div>
                    <button 
                      onClick={() => setShowUpgradeForm(false)} 
                      className="text-gray-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Card Simulation Badge */}
                  <div className="mb-4 relative h-40 w-full rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 p-5 text-white shadow-lg overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-indigo-200 font-medium">BEYONDFLEET PASS</p>
                        <p className="text-sm font-bold tracking-widest mt-0.5">{MEMBERSHIP_TIER_LABELS[selectedUpgradeTier]}</p>
                      </div>
                      <Crown className="h-6 w-6 text-amber-300" />
                    </div>
                    
                    <div className="text-base tracking-widest font-mono my-2 text-indigo-100">
                      {cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-center text-xs text-indigo-200">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-indigo-300">CARD HOLDER</p>
                        <p className="font-semibold">{displayName || 'MEMBER'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-indigo-300">EXPIRES</p>
                        <p className="font-semibold">{cardExpiry ? `${cardExpiry.slice(0,2)}/${cardExpiry.slice(2,4)}` : 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                    <span className="text-gray-400">결제 플랜</span>
                    <span className="font-bold text-white">{TIER_HIGHLIGHTS[selectedUpgradeTier].price}</span>
                  </div>

                  {payError && (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                      ⚠️ {payError}
                    </div>
                  )}

                  {/* Interactive Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-400">카드 번호 (16자리)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="1234567812345678"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-300/30 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">유효 기간 (MMYY)</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="1228"
                          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-300/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">CVC (3자리)</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="•••"
                          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-300/30 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-400">비밀번호 앞 2자리</label>
                      <input
                        type="password"
                        maxLength={2}
                        value={cardPwd}
                        onChange={(e) => setCardPwd(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••"
                        className="w-full max-w-[100px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-300/30 font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">🛡️ 256-bit SSL 암호화</span>
                    <span>카드 정보를 저장하지 않습니다</span>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      disabled={isPaying}
                      onClick={() => setShowUpgradeForm(false)}
                      className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-gray-400 transition hover:bg-white/[0.04] disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      disabled={isPaying}
                      onClick={handleUpgradeSubmit}
                      className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-[#070b10] transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isPaying ? '결제 승인 중...' : '안전 결제하기'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Email Notification Settings ── */}
        {isLoggedIn && (
          <section className="mb-10">
            <div className="mb-6 flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-bold text-white">📧 이메일 알림 설정</h2>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="space-y-5">
                {/* Brief Digest */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-cyan-500/10 p-2">
                      <Bell className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">데일리 브리프 알림</p>
                      <p className="mt-0.5 text-xs text-gray-500">매일 오전에 핵심 브리프 요약을 이메일로 받습니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, emailBriefDigest: !prev.emailBriefDigest }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifications.emailBriefDigest ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      notifications.emailBriefDigest ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="border-t border-white/[0.06]" />

                {/* Weekly Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">주간 학습 요약</p>
                      <p className="mt-0.5 text-xs text-gray-500">매주 월요일에 학습 진도와 활동 요약을 받습니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, emailWeeklySummary: !prev.emailWeeklySummary }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifications.emailWeeklySummary ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      notifications.emailWeeklySummary ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="border-t border-white/[0.06]" />

                {/* Tier Changes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2">
                      <Shield className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">등급 변경 알림</p>
                      <p className="mt-0.5 text-xs text-gray-500">멤버십 등급이 변경되면 이메일로 알립니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, emailTierChanges: !prev.emailTierChanges }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifications.emailTierChanges ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      notifications.emailTierChanges ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleNotificationSave}
                  disabled={notifSaving}
                  className="rounded-lg bg-cyan-500/20 px-6 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  {notifSaving ? '저장 중...' : '설정 저장'}
                </button>
                {notifSaved && (
                  <span className="flex items-center gap-1 text-sm text-emerald-400">
                    <Check className="h-4 w-4" />
                    저장되었습니다
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Access Philosophy ── */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8">
            <h3 className="text-xl font-bold text-white">접근 철학</h3>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              BeyondFleet의 멤버십은 지위 경쟁이 아니라 <strong className="text-gray-200">학습의 깊이</strong>를 위한 구조입니다.
              더 높은 등급은 더 많은 콘텐츠와 리서치 참여 기회를 의미하며,
              그 수익은 더 나은 편집, 학습 도구, 사색 시스템에 재투자됩니다.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8">
            <h3 className="text-xl font-bold text-white">수익 모델 및 유료화 제한</h3>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              BeyondFleet는 투기나 투자 조언을 유도하는 수익 모델을 일절 배제하며, 안전한 교육 기반 유료 모델만을 제한적으로 제공합니다:
            </p>
            <ul className="mt-2 text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>개인 프리미엄 멤버십 (학습 콘텐츠 확장)</li>
              <li>금융 리터러시 프로 코스 이용권</li>
              <li>심층 PDF 분석 리포트 다운로드권</li>
              <li>AI 코치 월간 학습 질문 한도 무제한 해제</li>
              <li>학교 및 기업 교육용 단체 라이선스</li>
            </ul>
          </div>
        </section>

        {/* ── CTA for non-logged-in ── */}
        {!isLoggedIn && (
          <section className="mt-10">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-200/[0.08] via-transparent to-emerald-200/[0.06] p-8 text-center sm:p-10">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="relative">
                <h2 className="text-2xl font-bold text-white">
                  지금 무료로 시작하세요
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-400">
                  데일리 브리프, 학습 트랙, 인텔리전스 대시보드를 무료로 이용할 수 있습니다.
                </p>
                <Link
                  href="/auth/login"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-100 px-6 py-3 text-sm font-bold text-[#070b10] transition hover:bg-white"
                >
                  회원가입 / 로그인
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
