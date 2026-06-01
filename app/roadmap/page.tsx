import Link from 'next/link'
import { ArrowRight, BookOpen, FileText, NotebookPen, Route, ShieldCheck, UsersRound } from 'lucide-react'

const roadmapData = [
  {
    phase: 'Phase 1',
    title: 'Daily Intelligence Foundation',
    period: 'MVP',
    status: 'completed',
    icon: FileText,
    items: ['Daily Brief reader', 'Brief CMS', 'AI summary area', 'premium/public separation'],
  },
  {
    phase: 'Phase 2',
    title: 'Learning Loop',
    period: 'Now',
    status: 'in_progress',
    icon: BookOpen,
    items: ['Track-based learning', 'lesson completion', 'XP and level UI', 'continue learning queue'],
  },
  {
    phase: 'Phase 3',
    title: 'Reflection System',
    period: 'Next',
    status: 'upcoming',
    icon: NotebookPen,
    items: ['today reflection', 'weekly thinking patterns', 'saved assumptions', 'reading rhythm'],
  },
  {
    phase: 'Phase 4',
    title: 'Personal Intelligence',
    period: 'Next',
    status: 'upcoming',
    icon: Route,
    items: ['interest profile', 'recommended briefs', 'adaptive learning routes', 'AI suggested topics'],
  },
  {
    phase: 'Phase 5',
    title: 'Community Trust Layer',
    period: 'Later',
    status: 'upcoming',
    icon: UsersRound,
    items: ['research circles', 'mentor review', 'contribution archive', 'transparent standards'],
  },
]

function getStatusLabel(status: string) {
  if (status === 'completed') return '완료'
  if (status === 'in_progress') return '진행 중'
  return '예정'
}

function getStatusClass(status: string) {
  if (status === 'completed') return 'border-green-400/25 text-green-200 bg-green-400/10'
  if (status === 'in_progress') return 'border-cyan-200/30 text-cyan-100 bg-cyan-200/10'
  return 'border-white/10 text-gray-400 bg-white/[0.04]'
}

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-space-deep px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-200/70">
            Product Roadmap
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white md:text-6xl">
            Build the daily judgment loop before expanding the ecosystem.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            The roadmap prioritizes Daily Brief quality, structured learning, reflection,
            personalization, and community trust. Speculative mechanics are intentionally not
            part of the MVP focus.
          </p>
        </section>

        <section className="mt-14 space-y-5">
          {roadmapData.map((phase, index) => {
            const Icon = phase.icon
            return (
              <article
                key={phase.phase}
                className="rounded-lg border border-white/10 bg-slate-950/45 p-6"
              >
                <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                    <Icon className="h-5 w-5 text-cyan-100" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-gray-500">0{index + 1} / {phase.period}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs ${getStatusClass(phase.status)}`}>
                        {getStatusLabel(phase.status)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{phase.title}</h2>
                    <ul className="mt-5 grid gap-3 md:grid-cols-2">
                      {phase.items.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-gray-300">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className="text-sm text-gray-500">{phase.phase}</span>
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-14 rounded-lg border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
                <h2 className="text-xl font-semibold text-white">MVP principle</h2>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
                Every near-term product decision should reinforce: Read today&apos;s brief,
                continue a learning path, reflect on what changed, and return tomorrow.
              </p>
            </div>
            <Link
              href="/briefs"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              Read Today&apos;s Brief
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
