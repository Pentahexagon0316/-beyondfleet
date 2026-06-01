'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Eye,
  Heart,
  Lock,
  NotebookPen,
  PenTool,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'


interface PublicJournal {
  id: string
  author_name: string
  title: string
  content: string
  status: 'in_progress' | 'completed'
  likes: number
  views: number
  created_at: string
}

const reflectionPrompts = [
  "What changed in my view after today's brief?",
  'Which assumption should I revisit this week?',
  'What topic keeps returning in my notes?',
]

export default function JournalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [publicJournals, setPublicJournals] = useState<PublicJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [myJournalCount, setMyJournalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await fetchPublicJournals()

      if (user) {
        await fetchMyJournalCount(user.id)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchMyJournalCount(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPublicJournals() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (queryError) {
        if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
          setError('Reflection database table has not been created yet.')
        } else {
          setError(`Reflection entries could not be loaded: ${queryError.message}`)
        }
        setPublicJournals([])
        return
      }
      setPublicJournals(data || [])
    } catch (err) {
      console.error('Error fetching public journals:', err)
      setError('Network error. Please try again.')
      setPublicJournals([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyJournalCount(userId?: string) {
    if (!userId) return

    try {
      const { count, error } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      if (!error && count !== null) {
        setMyJournalCount(count)
      }
    } catch (error) {
      console.error('Error fetching journal count:', error)
    }
  }

  return (
    <main className="min-h-screen bg-space-deep px-4 py-16 sm:px-6 lg:px-8">
      {/* glowing backgrounds */}
      <div className="absolute left-1/10 top-1/4 w-96 h-96 rounded-full bg-cyan-500/[0.02] blur-3xl pointer-events-none" />
      <div className="absolute right-1/10 top-1/2 w-96 h-96 rounded-full bg-purple-500/[0.02] blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Compliance Warning banner */}
        <div className="mb-10 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5 backdrop-blur-md">
          <p className="text-center text-xs sm:text-sm font-semibold leading-relaxed text-cyan-200">
            ⚠️ 이 공간은 금융 리터러시와 의사결정 훈련을 위한 개인 학습 노트입니다. 투자 추천, 매매 신호, 수익 예측을 제공하지 않습니다.
          </p>
        </div>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-200/70">
              Thinking Lab & Research Notebook
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-normal text-white md:text-5xl leading-tight font-comic">
              가설을 세우고, 기록하고,<br />의사결정을 훈련하는 실험실
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300">
              뉴스, 차트, 매크로 데이터를 단순 소비하는 것에 머무르지 않고, 나만의 합리적인 의사결정 과정을 설계해 보세요. Thinking Lab은 배운 지식을 차분히 기록하고, 나만의 가설을 Assumption Tracker에 등록해 두며, 시간이 지난 후 실제 시장 데이터와 대조해 가설을 검증하고 다듬어가는 <strong>주도적 금융 학습 공간</strong>입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? '/journal/my' : '#'}
                onClick={(event) => {
                  if (!user) {
                    event.preventDefault()
                    alert('로그인이 필요합니다.')
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 shadow-lg shadow-cyan-950/40"
              >
                나의 Research Notebook 열기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/briefs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-gray-200 transition hover:border-cyan-200/40 hover:text-white"
              >
                오늘의 판단 브리프 읽기
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <NotebookPen className="h-6 w-6 text-cyan-200" />
              <div>
                <p className="text-xs text-gray-400">Research & Hypothesis prompts</p>
                <h2 className="text-lg font-bold text-white">사고와 의사결정을 자극하는 질문들</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {reflectionPrompts.map((prompt) => (
                <div key={prompt} className="rounded-xl border border-white/10 bg-slate-950/35 p-4 transition-all hover:bg-slate-950/50">
                  <p className="text-sm leading-6 text-gray-300">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          <Link
            href={user ? (myJournalCount > 0 ? '/journal/my' : '/journal/my?action=new') : '#'}
            onClick={(event) => {
              if (!user) {
                event.preventDefault()
                alert('로그인이 필요합니다.')
              }
            }}
            className="rounded-2xl border border-cyan-200/20 bg-slate-950/45 p-6 transition hover:-translate-y-0.5 hover:border-cyan-200/35 group relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 bg-gradient-to-r from-cyan-400 to-blue-500" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-200/10">
                <PenTool className="h-5 w-5 text-cyan-100" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">나의 Research Notebook</h2>
                <p className="mt-1 text-sm text-gray-400">내 가설 수립, 차트 관찰 기록, 리스크 점검 노트 작성 공간.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-cyan-100">
              <span>{myJournalCount > 0 ? `${myJournalCount}개의 작성된 가설/기록` : '첫 번째 리서치 노트 작성하기'}</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>


          <Link
            href="/journal/challenges"
            className="rounded-2xl border border-white/10 bg-slate-950/45 p-6 transition hover:-translate-y-0.5 hover:border-cyan-200/25 group relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 bg-green-500" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                <Users className="h-5 w-5 text-cyan-100" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">Community Research</h2>
                <p className="mt-1 text-sm text-gray-400">합리적 동료들이 공개적으로 나누는 가설 및 리스크 리포트 탐독.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-gray-300">
              <span>공유된 리서치 노트 둘러보기</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        </section>

        <section className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <BookOpen className="h-5 w-5 text-cyan-200" />
                최신 공개 리서치 노트
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                공유된 리포트는 투자 선동이나 감정이 없으며, 투명한 가설 검증과 배움을 지향합니다.
              </p>
            </div>
            <Link href="/journal/challenges" className="hidden text-sm text-cyan-100 hover:text-white sm:inline-flex">
              전체 보기
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-lg bg-white/[0.05]" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-6">
              <p className="text-sm text-amber-100">{sanitizeErrorMessage(error)}</p>
            </div>
          ) : publicJournals.length === 0 ? (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-8 text-center">
              <Lock className="mx-auto h-8 w-8 text-gray-500" />
              <p className="mt-4 text-gray-400">아직 공개된 리서치 노트가 없습니다.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {publicJournals.map((journal) => (
                <Link key={journal.id} href={`/journal/challenges/${journal.id}`}>
                  <article className="h-full rounded-2xl border border-white/10 bg-slate-950/45 p-5 transition hover:-translate-y-0.5 hover:border-cyan-200/25 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{new Date(journal.created_at).toLocaleDateString('ko-KR')}</p>
                      <h3 className="mt-3 line-clamp-2 text-lg font-bold text-white">{journal.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-400">
                        {journal.content && journal.content.startsWith('{') ? (
                          (() => {
                            try {
                              const parsed = JSON.parse(journal.content)
                              return parsed.noteText || journal.content
                            } catch {
                              return journal.content
                            }
                          })()
                        ) : (
                          journal.content || 'No content'
                        )}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-4 border-t border-white/10 pt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {journal.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {journal.views || 0}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
