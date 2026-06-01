'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Award, Compass, ShieldCheck, Timer, Trophy, Wallet } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'

interface Entry {
  id: string
  amount: number
  user_email: string
  created_at: string
}

export default function MembershipRewardPage() {
  const [entryPoints, setEntryPoints] = useState('')
  const [highestXP, setHighestXP] = useState(1850)
  const [participationHistory, setParticipationHistory] = useState<Entry[]>([
    { id: '1', amount: 1850, user_email: 'penta***@gmail.com', created_at: '10분 전' },
    { id: '2', amount: 1700, user_email: 'member***@beyondfleet.io', created_at: '1시간 전' },
    { id: '3', amount: 1500, user_email: 'learner***@gmail.com', created_at: '3시간 전' },
  ])
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState('02d 14h 45m 12s')
  const [entryError, setEntryError] = useState('')
  const [entrySuccess, setEntrySuccess] = useState('')
  const [user, setUser] = useState<any>(null)

  // Fetch Supabase user
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  // Timer countdown mockup (ends on Sunday 20:00 KST)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const nextSunday = new Date()
      nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7)
      nextSunday.setHours(20, 0, 0, 0)

      if (nextSunday.getTime() <= now.getTime()) {
        nextSunday.setDate(nextSunday.getDate() + 7)
      }

      const diff = nextSunday.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setTimeLeft(
        `${days.toString().padStart(2, '0')}일 ${hours
          .toString()
          .padStart(2, '0')}시간 ${minutes.toString().padStart(2, '0')}분 ${seconds
          .toString()
          .padStart(2, '0')}초`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Submit Entry
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEntryError('')
    setEntrySuccess('')
    setLoading(true)

    const parsedAmount = parseInt(entryPoints)

    if (isNaN(parsedAmount) || parsedAmount <= highestXP) {
      setEntryError(`최소 응모 포인트는 현재 최고 참여 포인트(${highestXP} XP)보다 높아야 합니다.`)
      setLoading(false)
      return
    }

    if (!user) {
      setEntryError('이벤트에 참여하려면 로그인이 필요합니다. 우측 상단의 로그인을 진행해주세요.')
      setLoading(false)
      return
    }

    try {
      const emailRepresentation = user.email || 'Anonymous'
      
      setHighestXP(parsedAmount)
      const newEntry: Entry = {
        id: Date.now().toString(),
        amount: parsedAmount,
        user_email: emailRepresentation,
        created_at: '방금 전'
      }
      setParticipationHistory(prev => [newEntry, ...prev])
      setEntrySuccess('축하합니다! 챌린지 응모 등록에 성공하였습니다. 마감 시까지 순위를 유지해보세요!')
      setEntryPoints('')
    } catch (err: any) {
      console.error(err)
      setEntryError('응모 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-space-deep px-4 py-16 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <section className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300 mb-4">
            <Trophy className="w-4 h-4" />
            <span>Weekly Learning Reward Event</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-white md:text-5xl lg:text-6xl leading-tight">
            BeyondFleet 멤버십 리워드
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-8 text-gray-400">
            매주 치열하게 사색하며 학습에 참여해주시는 회원 여러분을 위한 학습 포인트(XP) 리워드 프로그램입니다.
            보유하신 XP를 활용해 특별 혜택 응모에 동참하고, 한 단계 더 깊은 분석 통찰을 확보해 보세요.
          </p>
        </section>

        {/* main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          
          {/* Left: Graphic Card & Description */}
          <div className="space-y-6">
            
            {/* Visual Card Display */}
            <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1f35] to-[#070d14] p-8 md:p-12 shadow-2xl flex flex-col justify-between overflow-hidden aspect-[16/10]">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase block">BEYONDFLEET REWARD PACKAGE</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">REWARD PACKAGE #024</h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <span>응모 진행 중</span>
                </div>
              </div>

              <div className="my-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest">이 주의 멤버십 리워드 혜택</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                  🎁 프로 코스 1개월 이용권 & 멘토링 세션 신청권 패키지
                </h3>
              </div>

              <div className="flex justify-between items-end pt-5 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">현재 최고 응모 포인트</p>
                  <p className="text-2xl sm:text-3xl font-mono font-extrabold text-cyan-200 mt-1">{highestXP.toLocaleString()} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">남은 마감 시간</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-amber-300 flex items-center gap-1.5 justify-end mt-1">
                    <Timer className="w-4 h-4 animate-pulse" />
                    {timeLeft}
                  </p>
                </div>
              </div>
            </div>

            {/* How it works Guideline */}
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                리워드 프로그램 참여 안내
              </h3>
              <ul className="space-y-3.5 text-sm text-gray-400 leading-relaxed">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center">01</span>
                  <span>매주 일요일 저녁 8시 정각에 이벤트가 마감되며, 가장 높은 학습 포인트(XP)를 제출한 참여자에게 이번 주 리워드 패키지 혜택이 주어집니다.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center">02</span>
                  <span>당첨 시 마일스톤 달성을 기념하는 한정판 **학습 배지**가 멤버 프로필에 즉시 수여됩니다.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center">03</span>
                  <span>추가 혜택으로 리서치 역량 강화를 위해 엄선된 핵심 분석 보고서인 **리포트 PDF 다운로드권**이 리워드 혜택에 함께 매핑됩니다.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Right: Entry Input & History */}
          <div className="space-y-6">
            
            {/* Place Entry Form */}
            <div className="rounded-xl border border-white/10 bg-[#091019]/60 p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                챌린지 리워드 응모하기
              </h3>

              {entryError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                  {entryError}
                </div>
              )}

              {entrySuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-300">
                  {entrySuccess}
                </div>
              )}

              <form onSubmit={handleEntrySubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">응모할 학습 포인트 (XP)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={`최소 ${highestXP + 50} XP 이상 입력`}
                      value={entryPoints}
                      onChange={(e) => setEntryPoints(e.target.value)}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold font-mono text-cyan-300">XP</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full font-semibold shadow-lg shadow-cyan-950/30 py-3" 
                  disabled={loading}
                >
                  {loading ? '제출 처리 중...' : '학습 포인트 응모권 제출'}
                </Button>
              </form>
            </div>

            {/* Entry History */}
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
                <span>실시간 참여 현황</span>
                <span className="text-xs text-cyan-400 font-mono">총 {participationHistory.length}명 참여</span>
              </h3>
              
              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
                {participationHistory.map((entry, index) => (
                  <div key={entry.id} className="py-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-cyan-400 animate-pulse' : 'bg-gray-700'}`} />
                      <div>
                        <p className="font-semibold text-white font-mono">{entry.user_email}</p>
                        <p className="text-[10px] text-gray-500">{entry.created_at}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-200 font-mono">{entry.amount.toLocaleString()} XP</p>
                      {index === 0 && <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">HIGHEST</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Legal Disclaimer */}
        <footer className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            본 이벤트는 교육 및 커뮤니티 참여를 위한 보상 프로그램이며, 투자 수익 또는 금전적 이익을 보장하지 않습니다.
          </p>
        </footer>

      </div>
    </main>
  )
}
