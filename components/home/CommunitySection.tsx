'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ArrowRight, BookOpen, Heart, Eye, Sparkles, Award } from 'lucide-react'

interface PublicJournal {
  id: string
  author_name: string
  title: string
  content: string
  is_editors_choice?: boolean
  tags?: string[]
  likes: number
  views: number
  created_at: string
}

// 고품질 백업 성찰 기록 (DB에 자료가 없을 때 사용해 사용자 경험을 극대화)
const mockReflections: PublicJournal[] = [
  {
    id: 'mock-1',
    author_name: 'MacroLearner',
    title: '연준의 금리 동결과 장기 매크로 리스크 분석',
    content: '오늘 데일리 브리프를 읽고 금리 인하 지연이 가상자산과 주식 시장에 미칠 영향을 정리해 보았습니다. 단순한 가격 등락보다 유동성 축소 주기가 생각보다 길어질 수 있다는 점에 주목해야 합니다. 결국 핵심은 레버리지를 낮추고 장기적 시각을 유지하는 것입니다.',
    is_editors_choice: true,
    tags: ['macro', 'long-term', 'risk'],
    likes: 24,
    views: 189,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'mock-2',
    author_name: 'SolanaWanderer',
    title: 'Solana 생태계의 거래 수수료 구조와 확장성 고찰',
    content: '단순 전송 수수료가 싸다고 해서 항상 네트워크가 안정적인 것은 아닙니다. 최근 트래픽 폭증 시 발생했던 실패율을 보면서, 로컬 수수료 시장(Local Fee Markets)이 어떻게 부하를 제어하는지 분석했습니다. BeyondFleet의 학습 패스에서 배운 개념이 실체로 이해되었습니다.',
    is_editors_choice: true,
    tags: ['crypto', 'valuation'],
    likes: 18,
    views: 142,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'mock-3',
    author_name: 'QuietThinker',
    title: 'FOMO에 대처하는 투자자의 차분한 의사결정',
    content: '급등하는 알트코인들을 바라볼 때 솟구치는 충동을 억제하기 위해 나만의 일기를 남깁니다. 매주 경매에 올라오는 Voyage Pass도 결국 차분한 지식 누적이 동반되어야 진짜 보상이 됩니다. 가만히 앉아 호흡을 가다듬고 내 가설을 하나씩 검토해 봅니다.',
    is_editors_choice: false,
    tags: ['psychology', 'philosophy'],
    likes: 15,
    views: 98,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
]

export default function CommunitySection() {
  const [reflections, setReflections] = useState<PublicJournal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopReflections() {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('is_public', true)
          .order('likes', { ascending: false })
          .limit(3)

        if (error || !data || data.length === 0) {
          // DB 로드에 실패하거나 비어 있으면 풍성한 목업 데이터 사용
          setReflections(mockReflections)
        } else {
          // 태그나 에디터 추천이 없을 경우 기본값 병합 처리 (Product Safety Fallback)
          const formatted = data.map(item => ({
            ...item,
            tags: item.tags || ['general'],
            is_editors_choice: item.is_editors_choice || false
          }))
          setReflections(formatted)
        }
      } catch (err) {
        console.error('Error fetching community section posts:', err)
        setReflections(mockReflections)
      } finally {
        setLoading(false)
      }
    }

    fetchTopReflections()
  }, [])

  return (
    <section className="relative border-b border-white/[0.08] bg-[#070b10] px-4 py-20 sm:px-6 lg:px-8">
      {/* Background glowing effects for premium aesthetic */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 top-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/[0.04] blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-cyan-300 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              지적 연구 서클 (Intellectual Circle)
            </p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl tracking-tight leading-tight">
              차분하게 통찰을 공유하는<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                정제된 사색의 공간
              </span>
            </h2>
            <p className="mt-4 text-base text-gray-400">
              투자 선동과 노이즈가 넘치는 가벼운 토론방이 아닙니다.<br />
              BeyondFleet 회원들의 성실한 기록과 차분한 생각의 궤적을 확인해 보세요.
            </p>
          </div>
          
          <div className="mt-6 md:mt-0">
            <Link
              href="/journal/challenges"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-cyan-100 backdrop-blur-xl transition hover:border-cyan-500/30 hover:bg-cyan-500/[0.05]"
            >
              모든 사색 성찰 정독하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Reflections Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reflections.map((post) => (
              <Link key={post.id} href={`/journal/challenges/${post.id}`}>
                <article className="group relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-[#070b10] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-950/20">
                  {/* Hover glow line */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  
                  <div>
                    {/* Meta info & Editor's Choice Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                          {post.author_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-200">{post.author_name}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      {post.is_editors_choice && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Award className="w-3 h-3" />
                          Editor&apos;s Choice
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition duration-200 line-clamp-1">
                      {post.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-4">
                      {post.content}
                    </p>
                  </div>

                  {/* Footer (Tags & Interactions) */}
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Likes & Views */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1 group-hover:text-pink-400 transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                        <BookOpen className="w-3.5 h-3.5" />
                        {post.views}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
