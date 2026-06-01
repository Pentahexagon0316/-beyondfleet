import Link from 'next/link'

const primaryLinks = [
  { href: '/briefs', label: 'Brief' },
  { href: '/learn', label: 'Learn' },
  { href: '/dashboard', label: 'Market Context' },
  { href: '/market-weather/us10y', label: 'Market Weather' },
]

const accountLinks = [
  { href: '/membership', label: 'Access' },
  { href: '/journal', label: 'Thinking Lab' },
  { href: '/faq', label: 'FAQ' },
]

const policyLinks = [
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-space-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-200">
                BF
              </span>
              <span className="text-xl font-semibold text-white">BeyondFleet</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
              A calm daily thinking space for briefs, concepts, Thinking Lab, and ambient market weather.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Core Flow</h3>
            <ul className="mt-4 space-y-3">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">정책</h3>
            <ul className="mt-4 space-y-3">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
            <p className="text-center text-xs leading-5 text-amber-100/80">
              본 서비스는 정보 제공 및 교육 목적입니다. 매수, 매도, 보유 권유가 아니며 모든 투자 판단과 책임은 사용자에게 있습니다. BeyondFleet는 투자 자문, 투자 일임, 매매 추천, 수익 보장을 제공하지 않습니다. 모든 콘텐츠는 금융 리터러시와 의사결정 교육을 위한 참고 자료입니다.
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} BeyondFleet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
