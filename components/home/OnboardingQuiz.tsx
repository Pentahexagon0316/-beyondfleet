'use client'

import { useState, useEffect } from 'react'
import { Rocket, ChevronRight, Sparkles, Target, Clock, TrendingUp, BookOpen, Zap, Shield, BarChart3 } from 'lucide-react'

interface UserProfile {
  level: string
  interests: string[]
  dailyTime: string
  style: string
  nickname: string
  completedAt: string
}

const PROFILE_KEY = 'beyondfleet:user-profile:v1'

const steps = [
  {
    id: 'welcome',
    emoji: '👋',
    title: '반가워요!',
    subtitle: '몇 가지 질문으로 학습 관심사와 이해 수준을 파악합니다.',
    description: '민감한 금융정보나 투자 계좌 정보는 요청하지 않습니다. 딱 30초면 충분해요!',
  },
  {
    id: 'level',
    emoji: '📊',
    title: '투자나 경제 공부, 해본 적 있으세요?',
    subtitle: '솔직하게 골라주세요, 정답은 없어요!',
    options: [
      { value: 'beginner', emoji: '🌱', label: '완전 처음이에요', desc: '"비트코인이 뭐야?" 수준' },
      { value: 'basic', emoji: '📖', label: '조금은 알아요', desc: '뉴스는 보는데 용어가 어려워요' },
      { value: 'intermediate', emoji: '📈', label: '어느 정도 해봤어요', desc: '주식이나 코인 투자 경험 있어요' },
      { value: 'advanced', emoji: '🎯', label: '꽤 잘 알아요', desc: '거시경제, 온체인 데이터도 봐요' },
    ],
  },
  {
    id: 'interests',
    emoji: '💡',
    title: '어떤 분야가 궁금하세요?',
    subtitle: '여러 개 골라도 돼요!',
    multiSelect: true,
    options: [
      { value: 'bitcoin', emoji: '₿', label: '비트코인', desc: '디지털 금이라 불리는 그것' },
      { value: 'altcoin', emoji: '🪙', label: '알트코인', desc: 'ETH, SOL 등 다양한 코인들' },
      { value: 'stock', emoji: '📊', label: '주식/ETF', desc: '삼성전자부터 S&P500까지' },
      { value: 'macro', emoji: '🌍', label: '세계 경제', desc: '금리, 환율, 물가 이야기' },
      { value: 'nft', emoji: '💡', label: '차세대 금융 트렌드', desc: '디지털 혁신, 핀테크, AI 경제 흐름' },
      { value: 'realestate', emoji: '🏠', label: '부동산', desc: '아파트, 전세, 월세 트렌드' },
    ],
  },
  {
    id: 'time',
    emoji: '⏰',
    title: '하루에 얼마나 시간 쓸 수 있어요?',
    subtitle: '부담 없이 시작하세요',
    options: [
      { value: '3min', emoji: '☕', label: '3분', desc: '커피 한 모금 할 동안' },
      { value: '10min', emoji: '🍽️', label: '10분', desc: '점심 먹으면서 읽기' },
      { value: '30min', emoji: '📚', label: '30분 이상', desc: '진지하게 공부할 거예요' },
    ],
  },
  {
    id: 'style',
    emoji: '🎨',
    title: '투자 성향은 어떤 편이에요?',
    subtitle: '당신의 스타일에 맞게 맞춰드려요',
    options: [
      { value: 'safe', emoji: '🛡️', label: '안전 제일!', desc: '잃지 않는 게 중요해요' },
      { value: 'balanced', emoji: '⚖️', label: '균형잡힌 편', desc: '적당히 리스크, 적당히 수익' },
      { value: 'aggressive', emoji: '🚀', label: '공격적으로!', desc: '높은 수익을 위해 도전해요' },
    ],
  },
  {
    id: 'result',
    emoji: '🎉',
    title: '프로필 완성!',
    subtitle: '당신만을 위한 학습 여정이 시작됩니다',
  },
]

const levelLabels: Record<string, string> = {
  beginner: '🌱 입문자',
  basic: '📖 초보자',
  intermediate: '📈 중급자',
  advanced: '🎯 숙련자',
}

const styleLabels: Record<string, string> = {
  safe: '🛡️ 안전형',
  balanced: '⚖️ 균형형',
  aggressive: '🚀 도전형',
}

const timeLabels: Record<string, string> = {
  '3min': '☕ 하루 3분',
  '10min': '🍽️ 하루 10분',
  '30min': '📚 하루 30분+',
}

const interestLabels: Record<string, string> = {
  bitcoin: '₿ 비트코인',
  altcoin: '🪙 알트코인',
  stock: '📊 주식/ETF',
  macro: '🌍 세계경제',
  nft: '💡 차세대 금융 트렌드',
  realestate: '🏠 부동산',
}

export default function OnboardingQuiz({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [level, setLevel] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [dailyTime, setDailyTime] = useState('')
  const [style, setStyle] = useState('')
  const [animateIn, setAnimateIn] = useState(true)

  const step = steps[currentStep]
  const totalSteps = steps.length
  const progress = ((currentStep) / (totalSteps - 1)) * 100

  const canProceed = () => {
    switch (step.id) {
      case 'welcome': return true
      case 'level': return level !== ''
      case 'interests': return interests.length > 0
      case 'time': return dailyTime !== ''
      case 'style': return style !== ''
      case 'result': return true
      default: return false
    }
  }

  const handleNext = () => {
    if (!canProceed()) return

    if (step.id === 'result') {
      const profile: UserProfile = {
        level,
        interests,
        dailyTime,
        style,
        nickname: getPersonaName(),
        completedAt: new Date().toISOString(),
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      onComplete()
      return
    }

    setAnimateIn(false)
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setAnimateIn(true)
    }, 200)
  }

  const handleSelect = (value: string) => {
    switch (step.id) {
      case 'level':
        setLevel(value)
        break
      case 'interests':
        setInterests(prev =>
          prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        )
        return // Don't auto-advance for multi-select
      case 'time':
        setDailyTime(value)
        break
      case 'style':
        setStyle(value)
        break
    }
    // Auto-advance after short delay for single-select
    if (!step.multiSelect) {
      setTimeout(() => {
        setAnimateIn(false)
        setTimeout(() => {
          setCurrentStep(prev => prev + 1)
          setAnimateIn(true)
        }, 200)
      }, 300)
    }
  }

  const getPersonaName = () => {
    if (level === 'beginner') return '호기심 탐험가'
    if (level === 'basic') return '성장형 학습자'
    if (level === 'intermediate') return '인사이트 수집가'
    return '매크로 전략가'
  }

  const getPersonaDesc = () => {
    if (level === 'beginner') return '기초부터 차근차근! 쉬운 설명으로 시작할게요.'
    if (level === 'basic') return '기본기를 탄탄히! 용어와 개념을 잡아드릴게요.'
    if (level === 'intermediate') return '한 단계 더 깊이! 분석력을 키워드릴게요.'
    return '프로를 위한 시야! 거시적 인사이트를 전해드릴게요.'
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b10]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip button */}
      {currentStep < totalSteps - 1 && (
        <button
          onClick={() => {
            const profile: UserProfile = {
              level: level || 'beginner',
              interests: interests.length > 0 ? interests : ['bitcoin', 'macro'],
              dailyTime: dailyTime || '3min',
              style: style || 'balanced',
              nickname: '탐험가',
              completedAt: new Date().toISOString(),
            }
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
            onComplete()
          }}
          className="absolute top-6 right-6 text-xs text-gray-500 hover:text-gray-300 transition z-10"
        >
          건너뛰기 →
        </button>
      )}

      {/* Main content */}
      <div className={`relative z-10 w-full max-w-lg mx-4 transition-all duration-300 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Step: Welcome */}
        {step.id === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="text-7xl animate-bounce">{step.emoji}</div>
            <h1 className="text-4xl font-black text-white">{step.title}</h1>
            <p className="text-xl text-gray-300">{step.subtitle}</p>
            <p className="text-sm text-gray-500">{step.description}</p>
            <button
              onClick={handleNext}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-base font-bold text-[#070b10] shadow-lg shadow-cyan-950/40 transition-all hover:scale-105 hover:shadow-cyan-500/30"
            >
              시작할게요!
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Steps with options */}
        {step.id !== 'welcome' && step.id !== 'result' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">{step.emoji}</span>
              <h2 className="text-2xl font-bold text-white mt-3">{step.title}</h2>
              <p className="text-sm text-gray-400">{step.subtitle}</p>
            </div>

            <div className={`grid gap-3 ${step.options && step.options.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {step.options?.map((opt) => {
                const isSelected = step.id === 'interests'
                  ? interests.includes(opt.value)
                  : (step.id === 'level' ? level : step.id === 'time' ? dailyTime : style) === opt.value

                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-950/30 scale-[1.02]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{opt.emoji}</span>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm ${isSelected ? 'text-cyan-200' : 'text-white'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#070b10]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Next button for multi-select */}
            {step.multiSelect && interests.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-[#070b10] transition-all hover:scale-105"
                >
                  {interests.length}개 선택 완료
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Result */}
        {step.id === 'result' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-black text-white">
                당신은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{getPersonaName()}</span>!
              </h2>
              <p className="text-base text-gray-300">{getPersonaDesc()}</p>
            </div>

            {/* Profile summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">레벨</p>
                <p className="text-sm font-bold text-white">{levelLabels[level] || level}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">투자 성향</p>
                <p className="text-sm font-bold text-white">{styleLabels[style] || style}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">학습 시간</p>
                <p className="text-sm font-bold text-white">{timeLabels[dailyTime] || dailyTime}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">관심 분야</p>
                <p className="text-sm font-bold text-white">{interests.length}개 선택</p>
              </div>
            </div>

            {/* Interest tags */}
            <div className="flex flex-wrap gap-2 justify-center">
              {interests.map(i => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                  {interestLabels[i] || i}
                </span>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-8 py-4 text-base font-black text-[#070b10] shadow-lg shadow-cyan-950/40 transition-all hover:scale-105 hover:shadow-cyan-500/30"
              >
                <Rocket className="w-5 h-5" />
                나만의 여정 시작하기!
              </button>
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-10">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-cyan-400'
                  : idx < currentStep
                  ? 'w-4 bg-cyan-400/40'
                  : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        setProfile(JSON.parse(saved))
      }
    } catch {}
    setLoading(false)
  }, [])

  return { profile, loading, hasProfile: !!profile }
}
