'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Award, Compass, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'


interface ContentCard {
  type: 'content'
  id: number
  tag: string
  title: string
  content: string
  fact: string
  factSource: string
  soWhat: string
}

interface QuizCard {
  type: 'quiz'
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  xpReward: number
}

type ShortCard = ContentCard | QuizCard

const DEMO_CARDS: ShortCard[] = [
  {
    type: 'content',
    id: 1,
    tag: '유동성',
    title: '연준 대차대조표 4주 연속 급감',
    content: '미국 연방준비제도(Fed)의 자산 규모가 4주 연속 감소하며 양적긴축(QT) 속도가 유지되고 있습니다. 시중 유동성의 완만한 흡수가 진행 중입니다.',
    fact: '연준 총자산 규모는 전주 대비 약 180억 달러 감소한 7.2조 달러를 기록했습니다.',
    factSource: 'Source: FRED, Federal Reserve Bank of St. Louis, accessed 2026-05-23.',
    soWhat: '가장 끈적한 유동성 지표가 줄어들고 있으므로, 고위험 알트코인 포지션의 과도한 레버리지는 축소하는 것이 유리합니다.'
  },
  {
    type: 'content',
    id: 2,
    tag: '온체인',
    title: '장기 보유 고래들의 거래소 송금 최저치',
    content: '비트코인을 1년 이상 보유한 장기 투자자(Long-Term Holders)들이 거래소로 입금하는 물량이 6개월 기준 최저치를 달성했습니다. 시장 유통 공급량이 잠기고 있습니다.',
    fact: 'LTH 거래소 유입량은 하루 평균 2,500 BTC 미만으로 하락했습니다.',
    factSource: 'Source: Glassnode, On-chain flow metric, 2026-05-22.',
    soWhat: '공급 압력이 구조적으로 낮아지고 있음을 뜻합니다. 단기 소음(Noise)에 흔들리지 말고 장기적 관점을 고수할 좋은 근거입니다.'
  },
  {
    type: 'content',
    id: 3,
    tag: '매크로',
    title: '글로벌 유동성 주기의 반등 징후',
    content: 'M2 글로벌 통화량 공급 지표가 바닥을 다지고 우상향 반등을 모색하고 있습니다. 반면 미 달러화 지수(DXY)는 단기 저항선에서 조정을 받고 있습니다.',
    fact: '글로벌 M2 지표는 전월 대비 1.2% 상승했으며, DXY는 103.8 포인트선에서 후퇴했습니다.',
    factSource: 'Source: IMF International Financial Statistics, 2026-05.',
    soWhat: '자산 가격을 억누르던 달러 강세 압력이 완화되며, 크립토와 같은 글로벌 유동성 민감 자산의 숨통이 트일 환경이 조성되고 있습니다.'
  },
  {
    type: 'content',
    id: 4,
    tag: '인플레이션',
    title: 'CPI 둔화에도 연준이 금리를 안 내리는 이유',
    content: '헤드라인 CPI가 둔화되고 있지만, 연준은 금리 인하를 서두르지 않고 있습니다. 핵심 원인은 근원 서비스(core services) 물가의 끈적임과 여전히 탄탄한 노동 시장입니다. 임금 상승 → 서비스 물가 상승의 순환 고리가 쉽게 꺾이지 않고 있습니다.',
    fact: '2026년 5월 기준, 근원 CPI는 3.1%(YoY)로 헤드라인 CPI 2.4%보다 여전히 높은 수준을 유지하고 있습니다.',
    factSource: 'Source: U.S. Bureau of Labor Statistics, CPI Report, 2026-05.',
    soWhat: '시장이 기대하는 것보다 금리 인하가 늦어질 수 있어요. 금리에 민감한 성장주나 레버리지 포지션은 조정 리스크에 유의해야 합니다.'
  },
  {
    type: 'content',
    id: 5,
    tag: '비트코인',
    title: '비트코인 10만 달러 돌파의 진짜 의미',
    content: '비트코인이 $100,000을 돌파했습니다. 단순한 가격 이정표를 넘어, 이번 돌파의 핵심 동력은 비트코인 현물 ETF를 통한 기관 자금의 지속적인 유입입니다. 이제 비트코인은 개인 투기 자산에서 기관 포트폴리오 자산으로의 전환점에 서 있습니다.',
    fact: '비트코인 현물 ETF 총 순유입은 $35B(약 350억 달러)를 돌파했습니다 (2026년 5월 기준).',
    factSource: 'Source: Bloomberg Intelligence, ETF Flow Tracker, 2026-05.',
    soWhat: '기관 자금이 들어오면 변동성은 줄고, 전통 자산과의 상관관계가 높아질 수 있어요. "비트코인은 독립적인 자산"이라는 내러티브가 약해질 수 있습니다.'
  },
  {
    type: 'quiz',
    id: 6,
    question: '금리가 오르면 일반적으로 성장주 가격은?',
    options: ['오른다', '내린다', '변화없다'],
    correctIndex: 1,
    explanation: '금리가 오르면 미래 수익의 현재 가치가 낮아져서 성장주에 불리해요. 이걸 할인율 효과라고 합니다. 높은 금리 = 높은 할인율 = 미래 현금흐름의 현재 가치 하락.',
    xpReward: 25
  },
  {
    type: 'content',
    id: 7,
    tag: 'ETF',
    title: '이더리움 ETF, 왜 아직 비트코인만큼 인기 없을까',
    content: '비트코인 현물 ETF가 역사적 성공을 거둔 반면, 이더리움 ETF는 상대적으로 부진합니다. 핵심 이유는 두 가지입니다: 첫째, ETF 구조에 스테이킹 수익률이 포함되지 않아 이더리움 고유의 장점이 빠졌고, 둘째, "디지털 금" 같은 비트코인의 단순 명확한 내러티브에 비해 이더리움의 가치 제안이 복잡합니다.',
    fact: '이더리움 ETF 출시 후 6개월 순유입은 $4.2B으로, 같은 기간 비트코인 ETF $35B의 약 12%에 불과합니다.',
    factSource: 'Source: The Block Research, ETF Tracker, 2026-05.',
    soWhat: '이더리움은 \'디지털 금\'처럼 단순한 스토리가 아니라서 기관 투자자 설득이 더 어려워요. 스테이킹 포함 ETF 승인 여부가 이더리움의 기관 채택 속도를 결정할 핵심 변수입니다.'
  },
  {
    type: 'content',
    id: 8,
    tag: '달러',
    title: '강달러가 한국 투자자에게 미치는 영향',
    content: '달러 강세는 한국 투자자에게 양날의 검입니다. 원화가 약세를 보이면 해외 투자 자산의 원화 환산 수익률이 높아지는 환차익이 발생합니다. 반면 수입 물가 상승으로 국내 인플레이션 압력이 커지고, 외국인 투자자의 한국 시장 자금 이탈도 가속됩니다.',
    fact: '2026년 5월 기준 원/달러 환율은 1,370원대를 기록하고 있습니다.',
    factSource: 'Source: Bank of Korea, Exchange Rate Data, 2026-05.',
    soWhat: '원화 약세 시 해외 투자 수익은 환차익을 누릴 수 있지만, 국내 물가는 상승 압력을 받아요. 환율 헤지 여부를 투자 전략에 반드시 포함해야 합니다.'
  },
  {
    type: 'content',
    id: 9,
    tag: 'AI',
    title: 'AI 반도체 전쟁: NVIDIA vs AMD vs 자체 칩',
    content: 'NVIDIA가 AI 학습용 GPU 시장을 지배하고 있지만, 빅테크 기업들이 자체 칩 개발에 속도를 내고 있습니다. Google의 TPU, Amazon의 Trainium, Microsoft의 Maia 등 하이퍼스케일러들의 자체 실리콘 전략이 NVIDIA 독점 구도에 균열을 내고 있습니다.',
    fact: 'NVIDIA 데이터센터 매출은 분기당 $30B(약 30조 원)를 기록하고 있습니다 (2026년 기준).',
    factSource: 'Source: NVIDIA Earnings Report, Q1 FY2027, 2026-05.',
    soWhat: 'AI 칩 독점이 깨지면 NVIDIA 프리미엄이 줄어들 수 있지만, 전체 AI 시장 파이는 더 커져요. 칩 제조사보다 AI 인프라 전체에 분산 투자하는 전략이 리스크를 줄일 수 있습니다.'
  },
  {
    type: 'quiz',
    id: 10,
    question: 'ETF는 무엇의 약자일까요?',
    options: ['Electronic Trading Fund', 'Exchange Traded Fund', 'Equity Trust Fund'],
    correctIndex: 1,
    explanation: 'ETF는 Exchange Traded Fund의 약자로, 주식처럼 거래소에서 사고팔 수 있는 펀드예요. 여러 자산을 한 번에 투자할 수 있어서 초보자에게 인기가 많아요. 낮은 수수료와 실시간 거래가 가장 큰 장점입니다.',
    xpReward: 20
  }
]

export default function CosmicShorts() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({})
  const [quizSubmissions, setQuizSubmissions] = useState<Record<number, boolean>>({})
  const [xpGained, setXpGained] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)



  const currentCard = DEMO_CARDS[currentIndex]
  const isLastCard = currentIndex === DEMO_CARDS.length - 1
  const progressPercent = ((currentIndex + 1) / DEMO_CARDS.length) * 100

  const selectedAnswer = currentCard ? (selectedAnswers[currentCard.id] ?? null) : null
  const quizSubmitted = currentCard ? (quizSubmissions[currentCard.id] ?? false) : false

  const handleNext = () => {
    if (currentIndex < DEMO_CARDS.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleAnswerSelect = (cardId: number, index: number) => {
    if (quizSubmissions[cardId]) return
    setSelectedAnswers(prev => ({ ...prev, [cardId]: index }))
  }

  const handleQuizSubmit = async (quiz: QuizCard) => {
    const answer = selectedAnswers[quiz.id]
    if (answer === null || answer === undefined) return
    setQuizSubmissions(prev => ({ ...prev, [quiz.id]: true }))

    if (answer === quiz.correctIndex) {
      setXpGained(prev => prev + quiz.xpReward)
      setShowConfetti(true)

      // Supabase와 연결하여 XP 누적 업데이트 시도
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const targetUserId = user?.id

        if (targetUserId) {
          const { data: stats } = await supabase
            .from('learning_user_stats')
            .select('total_xp')
            .eq('user_id', targetUserId)
            .single()

          const currentXp = stats?.total_xp || 0
          await supabase
            .from('learning_user_stats')
            .upsert({
              user_id: targetUserId,
              total_xp: currentXp + quiz.xpReward,
              updated_at: new Date().toISOString()
            })
        }
      } catch (err) {
        console.error('Failed to update XP in database:', err)
      }
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setSelectedAnswers({})
    setQuizSubmissions({})
    setShowConfetti(false)
    setXpGained(0)
  }

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/16] max-h-[80vh] min-h-[580px] rounded-2xl border border-white/10 bg-[#091019]/80 shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col justify-between p-6">
      
      {/* Confetti Particles (CSS Only) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#22d3ee', '#38bdf8', '#818cf8', '#fbbf24', '#f43f5e'][i % 5],
                top: `-10px`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `fall ${1.5 + Math.random() * 2}s linear infinite`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
          <style jsx>{`
            @keyframes fall {
              0% { top: -10px; transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { top: 100%; transform: translateY(580px) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Top Navigation / Progress */}
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>Cosmic Shorts</span>
          </div>
          <span className="text-xs font-mono text-cyan-300">
            {currentIndex + 1} / {DEMO_CARDS.length}
          </span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center py-4 overflow-y-auto">
        {currentCard && currentCard.type === 'content' ? (
          /* 1분 리서치 카드 */
          <div className="w-full space-y-4 transition-all duration-300 ease-in-out">
            <div className="inline-block px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
              {currentCard.tag}
            </div>
            
            <h3 className="text-xl font-bold text-white leading-snug">
              {currentCard.title}
            </h3>

            <p className="text-sm leading-relaxed text-gray-300">
              {currentCard.content}
            </p>

            {/* Fact Box */}
            <div className="p-3.5 rounded-lg bg-black/30 border border-white/5 space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">FACT ANCHOR</span>
              <p className="text-xs leading-relaxed text-gray-400">
                {currentCard.fact}
              </p>
              <p className="text-[9px] text-gray-600 italic">
                {currentCard.factSource}
              </p>
            </div>

            {/* Interpretation Box */}
            <div className="p-3.5 rounded-lg bg-cyan-950/10 border border-cyan-500/10">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">SO WHAT? (해석)</span>
              <p className="text-xs leading-relaxed text-cyan-100/90 mt-1">
                {currentCard.soWhat}
              </p>
            </div>
          </div>
        ) : currentCard && currentCard.type === 'quiz' ? (
          /* 10초 회고 퀴즈 카드 */
          <div className="w-full space-y-4 transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center">
              <div className="inline-block px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                10s Reflection Quiz
              </div>
              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                +{currentCard.xpReward} XP
              </span>
            </div>

            <h3 className="text-base font-semibold text-white leading-relaxed">
              {currentCard.question}
            </h3>

            {/* Options */}
            <div className="space-y-2.5">
              {currentCard.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx
                let btnStyle = 'border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] text-gray-300'

                if (quizSubmitted) {
                  if (idx === currentCard.correctIndex) {
                    btnStyle = 'border-green-500/40 bg-green-500/10 text-green-300'
                  } else if (isSelected) {
                    btnStyle = 'border-red-500/40 bg-red-500/10 text-red-300'
                  } else {
                    btnStyle = 'border-white/5 text-gray-600 opacity-60'
                  }
                } else if (isSelected) {
                  btnStyle = 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(currentCard.id, idx)}
                    disabled={quizSubmitted}
                    className={`w-full p-3.5 text-left text-xs rounded-xl border transition-all duration-200 leading-relaxed flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="font-mono mt-0.5 opacity-60 font-semibold shrink-0">0{idx + 1}.</span>
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            {/* Quiz Feedback */}
            {quizSubmitted && (
              <div className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 border ${
                selectedAnswer === currentCard.correctIndex
                  ? 'bg-green-500/10 border-green-500/20 text-green-200/90'
                  : 'bg-red-500/10 border-red-500/20 text-red-200/90'
              }`}>
                {selectedAnswer === currentCard.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">정답입니다! +{currentCard.xpReward} XP 획득</p>
                      <p className="text-[11px] text-green-400/80 mt-0.5">{currentCard.explanation}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">오답입니다.</p>
                      <p className="text-[11px] text-red-400/80 mt-0.5">{currentCard.explanation}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="w-full pt-4 border-t border-white/5 flex gap-3">
        {currentIndex > 0 ? (
          <button
            onClick={handlePrev}
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.03] transition duration-200 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>
        ) : (
          <div className="flex-1 py-3 text-center text-xs text-gray-600 font-mono">
            Swipe to think
          </div>
        )}

        {currentCard && currentCard.type === 'quiz' && !quizSubmitted ? (
          <Button
            onClick={() => handleQuizSubmit(currentCard)}
            disabled={selectedAnswer === null}
            className="flex-1 text-xs py-3 px-4"
          >
            퀴즈 제출
          </Button>
        ) : isLastCard && quizSubmitted ? (
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition duration-200 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            처음부터 다시 보기
          </button>
        ) : (
          <Button
            onClick={handleNext}
            className="flex-1 text-xs py-3 px-4 flex items-center justify-center gap-1.5"
          >
            다음 보기
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
