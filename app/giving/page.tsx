import Button from '@/components/ui/Button'

const impactItems = [
  {
    title: '어린이 코딩 교육 지원',
    amount: 'Learning grant',
    date: '2024.12',
    status: 'completed',
    votes: 245,
  },
  {
    title: '청년 창업 학습 기금',
    amount: 'Community grant',
    date: '2024.11',
    status: 'completed',
    votes: 189,
  },
]

export default function GivingPage() {
  return (
    <main className="min-h-screen bg-space-deep px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-200/70">
            Contribution
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white md:text-6xl">
            Growth should create useful contribution.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            BeyondFleet contribution is oriented around education, research participation,
            mentorship, and transparent community standards. This layer should feel calm and
            accountable, not like a reward market.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Contribution pool', value: 'Transparent', detail: 'Prepared for public reporting' },
            { label: 'Active proposals', value: '0', detail: 'Next proposal cycle pending' },
            { label: 'Completed impact', value: '2', detail: 'Education-oriented contributions' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-white">Contribution History</h2>
          <div className="mt-5 space-y-4">
            {impactItems.map((item) => (
              <article key={item.title} className="rounded-lg border border-white/10 bg-slate-950/45 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-400/10 px-2 py-1 text-xs text-green-200">
                        완료
                      </span>
                      <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-white">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-medium text-cyan-100">{item.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Community input</p>
                      <p className="text-sm font-medium text-gray-200">{item.votes}명 참여</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      상세 보기
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">How contribution works</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {[
              { title: 'Pool', desc: 'A transparent pool is prepared from platform revenue.' },
              { title: 'Proposal', desc: 'Members suggest education, research, or mentorship initiatives.' },
              { title: 'Review', desc: 'The community reviews impact, clarity, and alignment.' },
              { title: 'Report', desc: 'Selected contributions are recorded with public evidence.' },
            ].map((step, index) => (
              <div key={step.title}>
                <span className="text-xs text-cyan-200/70">0{index + 1}</span>
                <h3 className="mt-2 font-medium text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
