'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Mail, Search } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  id: string
  label: string
  title: string
  items: FAQItem[]
}

const faqData: FAQCategory[] = [
  {
    id: 'intro',
    label: '01',
    title: 'BeyondFleet 소개',
    items: [
      {
        question: 'BeyondFleet이 뭔가요?',
        answer: 'BeyondFleet은 Daily Brief, 구조화된 학습, reflection을 통해 더 나은 판단력을 쌓도록 돕는 AI-native macro learning and intelligence platform입니다.',
      },
      {
        question: '투자 조언을 제공하나요?',
        answer: '아니요. BeyondFleet은 정보 제공과 교육 목적의 플랫폼입니다. 매수, 매도, 보유 권유를 제공하지 않습니다.',
      },
      {
        question: '무료로 사용할 수 있나요?',
        answer: '기본 Daily Brief와 Learning Path는 무료로 시작할 수 있습니다. 일부 깊이 있는 brief archive와 연구 기능은 access level에 따라 열릴 수 있습니다.',
      },
    ],
  },
  {
    id: 'brief',
    label: '02',
    title: 'Daily Brief',
    items: [
      {
        question: 'Daily Brief는 무엇을 다루나요?',
        answer: '주요 macro shift, AI economy signal, risk condition, key events, 그리고 오늘 생각해볼 reflection prompt를 다룹니다.',
      },
      {
        question: '왜 매일 돌아와야 하나요?',
        answer: '좋은 판단력은 한 번의 정보가 아니라 반복적인 관찰, 학습, 회고에서 만들어집니다. Daily Brief는 이 반복 루프의 시작점입니다.',
      },
    ],
  },
  {
    id: 'learning',
    label: '03',
    title: 'Learning Path',
    items: [
      {
        question: '학습은 어떤 구조인가요?',
        answer: 'Macro Foundations, Crypto Macro, AI Economy 같은 track 기반 구조로, lesson completion, XP, level, continue learning queue를 제공합니다.',
      },
      {
        question: '온라인 강의 플랫폼과 무엇이 다른가요?',
        answer: 'BeyondFleet은 강의 목록보다 daily intelligence loop에 초점을 둡니다. Brief에서 출발해 관련 lesson으로 이어지고, reflection으로 생각을 정리합니다.',
      },
    ],
  },
  {
    id: 'reflection',
    label: '04',
    title: 'Reflection',
    items: [
      {
        question: 'Reflection Journal은 왜 필요한가요?',
        answer: '읽은 내용을 기록하고, 바뀐 생각과 다시 점검할 가정을 남기면 단순 소비가 아니라 장기적 판단력으로 이어집니다.',
      },
      {
        question: '공개 reflection은 어떤 톤이어야 하나요?',
        answer: '조용하고 근거 있는 생각, 학습 기록, 질문 중심의 글을 권장합니다. 과장된 수익 인증이나 자극적인 참여 유도는 지양합니다.',
      },
    ],
  },
  {
    id: 'access',
    label: '05',
    title: 'Access & Growth Archive',
    items: [
      {
        question: 'Membership은 무엇을 의미하나요?',
        answer: 'Membership은 status나 투기 대상이 아니라 더 깊은 brief, 연구 참여, reflection tools, community standards를 지원하는 access layer입니다.',
      },
      {
        question: 'Growth Archive는 무엇인가요?',
        answer: '학습 streak, track completion, contribution, mentorship 같은 장기 성장 이력을 차분하게 보관하는 archive입니다.',
      },
    ],
  },
  {
    id: 'security',
    label: '06',
    title: '계정 & 보안',
    items: [
      {
        question: '지갑 연결이 필요한가요?',
        answer: '기본 사용에는 이메일 로그인이 우선입니다. 지갑 연결은 필요한 기능에서만 보조적으로 사용되며, 자산 이동 권한을 요청하지 않는 방향을 유지합니다.',
      },
      {
        question: '비밀번호를 잊어버렸어요.',
        answer: '로그인 화면에서 비밀번호 재설정을 진행하세요.',
      },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle }: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-white/[0.035]"
      >
        <span className="pr-4 font-medium text-white">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-cyan-200 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-4 pb-4 leading-7 text-gray-400">
          {item.answer}
        </p>
      </div>
    </div>
  )
}

function CategorySection({ category, searchQuery }: {
  category: FAQCategory
  searchQuery: string
}) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const filteredItems = useMemo(() => {
    if (!searchQuery) return category.items
    const query = searchQuery.toLowerCase()
    return category.items.filter(
      item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    )
  }, [category.items, searchQuery])

  if (filteredItems.length === 0) return null

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-cyan-100">
          {category.label}
        </span>
        <h2 className="text-xl font-semibold text-white">{category.title}</h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
        {filteredItems.map((item, index) => (
          <AccordionItem
            key={item.question}
            item={item}
            isOpen={openItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </section>
  )
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const hasResults = useMemo(() => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return faqData.some(category =>
      category.items.some(
        item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      )
    )
  }, [searchQuery])

  return (
    <main className="min-h-screen bg-space-deep px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <section className="mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-200/70">
            FAQ
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white md:text-6xl">
            Clear answers for a calmer product.
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            BeyondFleet is designed around Daily Briefs, structured learning, reflection,
            and long-term judgment.
          </p>
        </section>

        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="질문 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/45 py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition focus:border-cyan-200/40"
          />
        </div>

        {hasResults ? (
          faqData.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              searchQuery={searchQuery}
            />
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-10 text-center">
            <p className="text-gray-400">
              &quot;{searchQuery}&quot;에 대한 결과를 찾을 수 없습니다.
            </p>
          </div>
        )}

        <section className="mt-16 rounded-lg border border-white/10 bg-white/[0.035] p-8">
          <h3 className="text-2xl font-semibold text-white">찾는 답이 없나요?</h3>
          <p className="mt-3 leading-7 text-gray-400">
            제품 방향, access, brief, learning loop에 대한 질문은 이메일로 보내주세요.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:support@beyondfleet.io"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              <Mail className="h-4 w-4" />
              이메일 문의
            </a>
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-cyan-200/40 hover:text-white"
            >
              Product roadmap
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
