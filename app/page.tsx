import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CircleDot,
  Compass,
  FileText,
  NotebookPen,
  ShieldCheck,
  Award,
  PlaneTakeoff,
  TrendingUp,
  Sparkles,
  Zap,
  Trophy,
  Rocket,
} from 'lucide-react'
import CosmicShorts from '@/components/home/CosmicShorts'
import HomeWrapper from '@/components/home/HomeWrapper'
import Button from '@/components/ui/Button'
import CommunitySection from '@/components/home/CommunitySection'

const coreFlow = [
  {
    label: '📰 오늘의 브리프',
    body: '3분이면 충분해요. 오늘 꼭 알아야 할 변화 하나만 쏙 골라드려요.',
    href: '/briefs',
    icon: FileText,
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    label: '📚 쉬운 학습',
    body: '어려운 경제 용어? 여기선 친구한테 설명하듯 쉽게 알려드려요.',
    href: '/learn',
    icon: BookOpen,
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    label: '✍️ 나의 생각',
    body: '오늘 느낀 점을 짧게 메모해보세요. 나만의 투자 일기가 됩니다.',
    href: '/dashboard',
    icon: NotebookPen,
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
  },
]

const whyUs = [
  {
    emoji: '🎯',
    title: '하루 3분이면 끝',
    desc: '긴 리포트 읽을 필요 없어요. 핵심만 쏙쏙.',
  },
  {
    emoji: '🧠',
    title: '이해가 쌓이는 구조',
    desc: '매일 하나씩, 어느새 시장이 보이기 시작해요.',
  },
  {
    emoji: '🎮',
    title: '재미있는 퀴즈 & 보상',
    desc: '퀴즈 풀고 XP 모아서 특별 멤버십 챌린지에 응모해 보세요!',
  },
  {
    emoji: '🤝',
    title: '초보자도 환영',
    desc: '"비트코인이 뭐야?" 수준부터 시작해도 OK.',
  },
]

const trustPrinciples = [
  { emoji: '📖', text: '교육 목적 우선, 투자 권유가 아닙니다' },
  { emoji: '🔒', text: '여러분의 데이터는 안전하게 보호됩니다' },
  { emoji: '🚫', text: '순위 경쟁이나 압박 없이 나만의 속도로' },
  { emoji: '💚', text: '쉬고 싶을 때 쉬고, 돌아오고 싶을 때 돌아오세요' },
]

export default function Home() {
  return (
    <HomeWrapper>
    <div className="min-h-screen bg-[#070b10] text-white">
      {/* ─── HERO SECTION ─── */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#070b10]">
        <Image
          src="/images/home/intelligence-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="bf-hero-image -z-30 object-cover opacity-64"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,#070b10_0%,rgba(7,11,16,0.92)_38%,rgba(7,11,16,0.62)_72%,rgba(7,11,16,0.88)_100%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(7,11,16,0.16)_0%,rgba(7,11,16,0.2)_56%,#070b10_100%)]" />
        <div className="bf-intelligence-grid absolute inset-0 -z-10 opacity-25" />

        <div className="mx-auto grid min-h-[calc(100svh-13rem)] max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[0.98fr_1.02fr] lg:px-8 lg:py-16">
          <div className="flex min-w-0 flex-col justify-center">
            <p className="bf-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200/25 bg-black/20 px-4 py-2 text-sm font-medium text-cyan-100 backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-amber-300" />
              매일 3분, 세상이 보이기 시작해요 ✨
            </p>
            <h1 className="bf-mobile-copy bf-fade-up mt-8 max-w-[14ch] break-words text-[2.15rem] font-bold leading-[1.15] text-white sm:max-w-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              복잡한 시장,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                쉽게 읽어요.
              </span>
            </h1>
            <p className="bf-mobile-copy bf-fade-up mt-6 max-w-[34ch] break-words text-base leading-8 text-gray-300 sm:max-w-2xl sm:text-lg md:text-xl md:leading-9">
              BeyondFleet는 투자 정보를 제공하는 서비스가 아니라, 시장과 경제를 이해하고 스스로 판단하는 힘을 기르는 AI 기반 금융 리터러시 교육 플랫폼입니다.
            </p>
            <p className="bf-mobile-copy bf-fade-up mt-3 max-w-[35ch] break-words text-sm leading-7 text-cyan-50/60 sm:max-w-2xl">
              🙌 전문가가 아니어도 괜찮아요. 합리적 의사결정을 훈련하는 하루 3분 습관.
            </p>

            <div className="bf-fade-up mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/briefs"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 text-sm font-bold text-[#071018] shadow-lg shadow-cyan-950/40 transition-all duration-300 hover:shadow-cyan-500/25 hover:scale-[1.02]"
              >
                오늘의 브리프 읽기
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.045] px-6 py-3.5 text-sm font-semibold text-gray-100 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]"
              >
                처음부터 배우기
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center w-full mt-12 lg:mt-0">
            <CosmicShorts />
          </div>
        </div>
      </section>

      {/* ─── WHY BEYONDFLEET ─── */}
      <section className="border-b border-white/[0.075] bg-[#090d14] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-cyan-300 tracking-wide">왜 BeyondFleet인가요?</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              누구나 쉽게, 매일 조금씩 💡
            </h2>
            <p className="mt-4 text-base text-gray-400 max-w-2xl mx-auto">
              어려운 금융 용어 대신 친근한 설명, 긴 리포트 대신 핵심 요약.
              <br />매일 3분이면 시장의 흐름이 느껴지기 시작해요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/[0.075] bg-white/[0.02] p-6 transition-all duration-300 hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] hover:shadow-lg hover:shadow-cyan-950/20"
              >
                <span className="text-3xl">{item.emoji}</span>
                <p className="mt-4 text-base font-bold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CORE FLOW ─── */}
      <section className="border-b border-white/10 bg-[#070b10] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-300 tracking-wide">매일의 루틴</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              이렇게 3단계면 끝! 🎯
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {coreFlow.map((item, idx) => (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative overflow-hidden rounded-2xl border ${item.border} bg-gradient-to-br ${item.gradient} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="absolute top-4 right-4 text-5xl font-black text-white/[0.04]">
                  {idx + 1}
                </div>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] ${item.iconColor}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-lg font-bold text-white">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{item.body}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-300 group-hover:text-cyan-200 transition">
                  시작하기 <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BEYONDFLEET CHALLENGE REWARDS ─── */}
      <section className="border-b border-white/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#070b10] to-[#070b10] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#091522] to-[#070c14] p-8 md:p-12 shadow-2xl">
            {/* Background glowing effect */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300">
                  <Trophy className="w-4 h-4" />
                  <span>🔥 매주 일요일 저녁 8시 학습 챌린지 마감!</span>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl md:text-5xl leading-none">
                  학습에 열중하셨다면?<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">멤버십 리워드</span> 응모!
                </h2>
                
                <p className="text-base text-gray-300 leading-relaxed max-w-2xl">
                  매일 배포되는 데일리 브리프를 차분히 읽고, 관련 학습 퀴즈를 맞혀 XP를 모아보세요.
                  모인 XP를 활용하여 매주 진행되는 특별 리워드 챌린지에 응모하면 <strong className="text-amber-300">프로 코스 이용권 및 전문가 1:1 멘토링 세션 신청권</strong>을 획득할 수 있습니다.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                  <div className="flex items-start gap-2.5">
                    <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">학습 집중 보상 🏅</p>
                      <p className="text-xs text-gray-500 mt-0.5">매일 학습 성취 = 프로 코스 1개월권 & 리포트 PDF 다운로드권</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">성장형 커뮤니티 ⚡</p>
                      <p className="text-xs text-gray-500 mt-0.5">획득한 학습 배지로 프로필을 커스터마이징하고 역량을 증명</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/events">
                    <Button variant="primary" className="font-bold shadow-lg shadow-cyan-950/50 text-base px-8 py-3">
                      🎫 이번 주 챌린지 참여하기
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Graphic Ticket Card */}
              <div className="relative flex justify-center">
                <div className="w-72 aspect-[1.58/1] rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-[#0a1e33]/90 to-purple-500/10 p-5 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">BEYONDFLEET CHALLENGE</p>
                      <h4 className="text-sm font-bold text-white mt-1">REWARD PACKAGE #024</h4>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 animate-pulse">LIVE</span>
                  </div>

                  <div className="my-4">
                    <p className="text-[10px] text-gray-500">LEARNING REWARD</p>
                    <p className="text-xs text-gray-300 font-medium mt-0.5">🎁 프로 코스 1개월 이용권 & 멘토링</p>
                  </div>

                  <div className="flex justify-between items-end pt-3 border-t border-white/10">
                    <div>
                      <p className="text-[9px] text-gray-500">CURRENT HIGHEST</p>
                      <p className="text-xs font-bold text-white font-mono">1,850 XP</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-500">CHALLENGE ENDS</p>
                      <p className="text-[10px] font-bold text-amber-300 font-mono">SUN 20:00 KST</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTELLECTUAL COMMUNITY SECTION ─── */}
      <CommunitySection />

      {/* ─── TRUST & SAFETY ─── */}
      <section className="bg-[#070b10] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-8 md:p-10">
                <ShieldCheck className="h-10 w-10 text-cyan-300" />
                <p className="mt-6 text-sm font-semibold text-cyan-300">안심하고 이용하세요 🛡️</p>
                <h2 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">
                  편하게 와서,<br />편하게 배우세요.
                </h2>
                <p className="mt-6 text-base leading-7 text-gray-400">
                  BeyondFleet은 여러분의 학습 파트너예요.
                  <br />더 많은 자극보다 <strong className="text-gray-200">더 차분한 이해</strong>를 추구합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-0 border-t border-white/10 lg:border-l lg:border-t-0">
                {trustPrinciples.map((principle) => (
                  <div key={principle.text} className="flex items-start gap-3.5 border-b border-white/10 p-5 last:border-b-0">
                    <span className="text-xl mt-0.5">{principle.emoji}</span>
                    <p className="text-sm leading-6 text-gray-300">{principle.text}</p>
                  </div>
                ))}
                <Link
                  href="/briefs"
                  className="flex items-center justify-between bg-gradient-to-r from-cyan-500/[0.08] to-purple-500/[0.08] p-5 text-sm font-bold text-cyan-100 transition duration-300 hover:from-cyan-500/[0.15] hover:to-purple-500/[0.15]"
                >
                  🚀 지금 바로 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </HomeWrapper>
  )
}
