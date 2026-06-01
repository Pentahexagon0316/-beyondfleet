import Link from 'next/link'
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock3,
  FileText,
  NotebookPen,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

const milestones = [
  {
    title: '100-day learning streak',
    description: 'A quiet marker of consistency, not a speculative collectible.',
    meta: 'Daily habit',
    icon: Clock3,
  },
  {
    title: 'Macro Foundations completion',
    description: 'Proof that a member can connect rates, liquidity, dollar cycles, and risk.',
    meta: 'Learning depth',
    icon: BookOpen,
  },
  {
    title: 'Community contributor',
    description: 'Recognition for thoughtful notes, helpful answers, and research participation.',
    meta: 'Contribution',
    icon: UsersRound,
  },
  {
    title: 'Research mentor',
    description: 'A long-term archive of guidance, review, and calm leadership.',
    meta: 'Mentorship',
    icon: ShieldCheck,
  },
]

const principles = [
  'Milestones reflect learning history and contribution.',
  'Recognition is archival, minimal, and human-centered.',
  'No marketplace rankings, price anchoring, countdowns, or speculative framing.',
]

export default function GrowthArchivePage() {
  return (
    <main className="min-h-screen bg-space-deep px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-200/70">
              Growth Archive
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal text-white md:text-6xl">
              A record of learning, contribution, and long-term growth.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              BeyondFleet achievements are designed as personal history: what you studied,
              what you returned to, and how you contributed to the community&apos;s judgment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
              >
                Continue learning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/journal"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-cyan-200/40 hover:text-white"
              >
                Open reflection journal
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber-200/20 bg-amber-200/10">
                <Award className="h-5 w-5 text-amber-100" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Archive philosophy</p>
                <h2 className="text-lg font-semibold text-white">Recognition without speculation</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {principles.map((principle) => (
                <div key={principle} className="flex gap-3 text-sm leading-6 text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200/70" />
                  <span>{principle}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {milestones.map((item) => {
            const Icon = item.icon
            return (
              <article
                key={item.title}
                className="rounded-lg border border-white/10 bg-slate-950/45 p-6 transition hover:-translate-y-0.5 hover:border-cyan-200/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Icon className="h-5 w-5 text-cyan-100" />
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                    {item.meta}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">{item.description}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-16 rounded-lg border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FileText, label: 'Briefs read', value: 'Daily context' },
              { icon: NotebookPen, label: 'Reflections saved', value: 'Thinking record' },
              { icon: ShieldCheck, label: 'Standards upheld', value: 'Community trust' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex gap-4">
                  <Icon className="mt-1 h-5 w-5 text-cyan-200" />
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
