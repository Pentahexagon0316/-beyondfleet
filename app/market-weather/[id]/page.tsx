import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, CircleDot, ShieldCheck } from 'lucide-react'
import MarketSignalJudgment from '@/components/market/MarketSignalJudgment'
import {
  ambientMarketSignals,
  getAmbientMarketSignal,
  getAmbientMarketSignalIds,
} from '@/lib/market/ambient-signals'

export function generateStaticParams() {
  return getAmbientMarketSignalIds().map((id) => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const signal = getAmbientMarketSignal(id)

  if (!signal) {
    return {
      title: 'Market Weather Context | BeyondFleet',
    }
  }

  return {
    title: `${signal.symbol} Context | BeyondFleet`,
    description: signal.context,
  }
}

function toneLabel(tone: string) {
  style: switch (tone) {
    case 'tight':
      return 'Tighter weather'
    case 'watch':
      return 'Worth watching'
    case 'mixed':
      return 'Mixed signal'
    default:
      return 'Calm context'
  }
}

export default async function MarketSignalContextPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const signal = getAmbientMarketSignal(id)

  if (!signal) {
    notFound()
  }

  const Icon = signal.icon
  const nearbySignals = ambientMarketSignals.filter((item) => item.id !== signal.id).slice(0, 3)

  return (
    <main className="min-h-screen bg-[#070b10] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto min-w-0 max-w-5xl overflow-hidden">
        <Link href="/briefs" className="mb-8 inline-flex items-center text-sm text-gray-500 transition hover:text-gray-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to brief
        </Link>

        <section className="bf-mobile-card bf-reading-panel rounded-lg p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-sm font-medium text-cyan-100">
              <Icon className="h-4 w-4" />
              Market weather
            </span>
            <span className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-sm text-gray-300">
              {toneLabel(signal.tone)}
            </span>
            <span className="text-sm text-gray-500">{signal.region}</span>
          </div>

          <h1 className="max-w-3xl break-words text-3xl font-semibold leading-tight text-white md:text-5xl">
            {signal.symbol}: {signal.name}
          </h1>
          <p className="mt-5 max-w-[28ch] break-words text-base leading-8 text-gray-400 sm:max-w-[68ch]">
            {signal.context}
          </p>

          <div className="mt-6">
            <Link
              href={`/journal/my?action=new&template=chart&indicator=${encodeURIComponent(signal.symbol)}&change=${encodeURIComponent(signal.status || '')}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-500/20 hover:from-cyan-400/30 hover:to-purple-500/30 px-5 py-3 text-sm font-bold text-cyan-200 border border-cyan-400/30 hover:border-cyan-400/50 shadow-lg shadow-cyan-950/40 transition hover:scale-[1.01]"
            >
              ✍️ 이 데이터로 관찰 노트 작성하기
            </Link>
          </div>
        </section>

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0 space-y-6">
            {[
              ['What changed', signal.whatChanged],
              ['Why markets care', signal.whyMarketsCare],
              ['What remains unclear', signal.unclear],
              ['One thing worth watching', signal.watch],
            ].map(([title, body]) => (
              <section key={title} className="bf-mobile-card overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.024] p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <CircleDot className="h-4 w-4 text-cyan-300" />
                  {title}
                </div>
                <p className="max-w-[30ch] break-words text-sm leading-7 text-gray-400 sm:max-w-[68ch]">{body}</p>
              </section>
            ))}

            <MarketSignalJudgment signalId={signal.id} />

            <section className="bf-mobile-card rounded-lg border border-white/[0.075] bg-white/[0.024] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                Data and trust note
              </div>
              <p className="max-w-[30ch] break-words text-sm leading-7 text-gray-400 sm:max-w-[68ch]">
                {signal.sourceNote}
              </p>
            </section>
          </article>

          <aside className="min-w-0 space-y-5 lg:sticky lg:top-28 lg:self-start">
            <section className="bf-mobile-card rounded-lg border border-white/[0.075] bg-white/[0.026] p-5">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-300" />
                <h2 className="font-semibold text-white">One related lesson</h2>
              </div>
              <Link
                href={signal.relatedLesson.href}
                className="block rounded-lg border border-white/[0.075] bg-black/15 p-4 transition hover:border-cyan-300/32 hover:bg-cyan-300/[0.035]"
              >
                <h3 className="text-sm font-semibold leading-6 text-white">{signal.relatedLesson.title}</h3>
                <p className="mt-2 text-xs leading-5 text-gray-500">{signal.relatedLesson.reason}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-100">
                  Open slowly
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </section>

            <section className="bf-mobile-card rounded-lg border border-white/[0.075] bg-white/[0.026] p-5">
              <h2 className="font-semibold text-white">Nearby weather</h2>
              <div className="mt-4 space-y-2">
                {nearbySignals.map((item) => (
                  <Link
                    key={item.id}
                    href={`/market-weather/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/12 px-3 py-3 text-sm text-gray-300 transition hover:border-white/15 hover:text-white"
                  >
                    <span>{item.symbol}</span>
                    <span className="truncate text-xs text-gray-500">{item.status}</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
