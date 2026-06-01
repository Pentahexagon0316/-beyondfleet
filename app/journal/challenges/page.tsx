'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, Heart, Eye, TrendingUp, Clock, Award, Search, Sparkles, Filter } from 'lucide-react'

interface PublicJournal {
  id: string
  author_name: string
  title: string
  content: string
  goal_amount?: number
  current_amount?: number
  status: 'in_progress' | 'completed'
  likes: number
  views: number
  is_editors_choice?: boolean
  tags?: string[]
  created_at: string
}

type SortOption = 'latest' | 'editors_choice' | 'popular' | 'completed'

const AVAILABLE_TAGS = [
  { id: 'all', label: '✨ 전체 보기' },
  { id: 'macro', label: '#매크로' },
  { id: 'crypto', label: '#가상자산' },
  { id: 'valuation', label: '#가치평가' },
  { id: 'psychology', label: '#투자심리' },
  { id: 'philosophy', label: '#투자철학' },
  { id: 'long-term', label: '#장기투자' },
  { id: 'risk', label: '#리스크관리' }
]

export default function ChallengesPage() {
  const [journals, setJournals] = useState<PublicJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')

  useEffect(() => {
    fetchJournals()
  }, [sortBy])

  async function fetchJournals() {
    setLoading(true)
    try {
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('is_public', true)

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'editors_choice') {
        query = query.eq('is_editors_choice', true).order('created_at', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('likes', { ascending: false })
      } else if (sortBy === 'completed') {
        query = query.eq('status', 'completed').order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(50)

      if (error) {
        // DB에 컬럼이 없는 하위 호환성 에러(42703) 처리
        if (sortBy === 'editors_choice' && (error.code === '42703' || error.message?.includes('is_editors_choice'))) {
          console.warn('is_editors_choice column missing, falling back to client-side filtering.')
          const fallbackQuery = supabase
            .from('journal_entries')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
          const { data: fallbackData } = await fallbackQuery.limit(50)
          
          const treated = (fallbackData || []).map(item => ({
            ...item,
            is_editors_choice: item.likes >= 10 || item.title.includes('금리') || item.title.includes('매크로') || item.title.includes('FOMO'),
            tags: item.tags || ['macro', 'long-term']
          })).filter(item => item.is_editors_choice)
          
          setJournals(treated)
          return
        }
        throw error
      }

      // 기본값 세팅 보강
      const formatted = (data || []).map(item => ({
        ...item,
        is_editors_choice: item.is_editors_choice || false,
        tags: item.tags || []
      }))

      setJournals(formatted)
    } catch (error) {
      console.error('Error fetching journals:', error)
      setJournals([])
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (current?: number, goal?: number) => {
    if (!current || !goal || goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} sessions`
  }

  // 검색 및 태그 필터링
  const filteredJournals = journals.filter(journal => {
    const matchesSearch = 
      journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.author_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTag = 
      selectedTag === 'all' || 
      (journal.tags && journal.tags.includes(selectedTag))

    return matchesSearch && matchesTag
  })

  const completedCount = journals.filter(j => j.status === 'completed').length
  const totalGoal = journals.reduce((sum, j) => sum + (j.goal_amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#070b10] py-12 px-4 sm:px-6 lg:px-8 text-white">
      {/* Background glowing effects */}
      <div className="absolute left-1/10 top-1/4 w-96 h-96 rounded-full bg-cyan-500/[0.03] blur-3xl pointer-events-none" />
      <div className="absolute right-1/10 top-1/2 w-96 h-96 rounded-full bg-purple-500/[0.03] blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <Link href="/journal" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Reflection Journal로 돌아가기</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-300 tracking-wider flex items-center gap-2 uppercase">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Community Research Notebooks
              </p>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-3">
                가설과 배움의 오픈 연구실
              </h1>
              <p className="text-gray-400 text-base mt-3 max-w-2xl leading-relaxed">
                시장 변동성 속에서도 주관적 감정이 아닌 데이터를 바탕으로 사고합니다.<br />
                동료 연구자들이 기록한 핵심 가설, 검증용 근거 신호, 그리고 진지한 배움의 기록을 통해 차분히 통찰을 나누어 보세요.
              </p>
            </div>
          </div>
        </div>


        {/* Stats Section with calm editorial aesthetics */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-5 text-center transition-all hover:bg-white/[0.04]">
            <div className="text-3xl font-black text-white font-mono">{journals.length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">공유된 성찰</div>
          </div>
          <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-5 text-center transition-all hover:bg-white/[0.04]">
            <div className="text-3xl font-black text-cyan-400 font-mono">{completedCount}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">완료된 계획</div>
          </div>
          <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-5 text-center transition-all hover:bg-white/[0.04]">
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">{formatCurrency(totalGoal)}</div>
            <div className="text-xs text-gray-400 mt-1.5 uppercase tracking-wider">지식 누적 목표</div>
          </div>
        </div>

        {/* Search and Filters Layout */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제목, 본문, 혹은 지은이로 성찰 검색..."
                className="w-full pl-12 pr-4 py-3 bg-[#0a1017] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {/* Sort options */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition flex items-center gap-2 border shrink-0 ${
                  sortBy === 'latest'
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30'
                    : 'bg-[#0a1017] text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                최신 성찰
              </button>
              <button
                onClick={() => setSortBy('editors_choice')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition flex items-center gap-2 border shrink-0 ${
                  sortBy === 'editors_choice'
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                    : 'bg-[#0a1017] text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                추천 성찰
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition flex items-center gap-2 border shrink-0 ${
                  sortBy === 'popular'
                    ? 'bg-purple-500/20 text-purple-200 border-purple-500/30'
                    : 'bg-[#0a1017] text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                인기 공명
              </button>
              <button
                onClick={() => setSortBy('completed')}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition flex items-center gap-2 border shrink-0 ${
                  sortBy === 'completed'
                    ? 'bg-green-500/20 text-green-200 border-green-500/30'
                    : 'bg-[#0a1017] text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                완료된 공부
              </button>
            </div>
          </div>

          {/* Tags Filtering Chips */}
          <div className="flex items-center gap-2.5 flex-wrap border-t border-white/[0.06] pt-4">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5" />
              태그 필터:
            </span>
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                  selectedTag === tag.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border-cyan-400/30'
                    : 'bg-[#0a1017] text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journals List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">
              {searchTerm || selectedTag !== 'all' ? '필터에 맞는 성찰이 없습니다.' : '아직 공유된 성찰 기록이 없습니다.'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm || selectedTag !== 'all' ? '검색어 또는 태그 필터를 해제해 보세요.' : '나의 성찰에서 첫 사색 노트를 공유해 보세요.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJournals.map((journal) => {
              const progress = calculateProgress(journal.current_amount, journal.goal_amount)
              const isCompleted = journal.status === 'completed'

              return (
                <Link key={journal.id} href={`/journal/challenges/${journal.id}`}>
                  <div className={`group relative h-full flex flex-col justify-between rounded-2xl p-6 border transition-all duration-300 bg-gradient-to-b from-white/[0.02] to-[#070b10] hover:-translate-y-1 hover:shadow-lg ${
                    isCompleted
                      ? 'border-green-500/20 hover:border-green-500/40 hover:shadow-green-950/10'
                      : 'border-white/10 hover:border-cyan-500/30 hover:shadow-cyan-950/10'
                  }`}>
                    
                    {/* Top Border Hover Glow Line */}
                    <div className={`absolute inset-x-0 top-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                    }`} />

                    <div>
                      {/* Author */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase ${
                            isCompleted
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                              : 'bg-gradient-to-br from-cyan-500 to-purple-500'
                          }`}>
                            {journal.author_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm group-hover:text-cyan-300 transition-colors">
                              {journal.author_name || '익명'}
                            </p>
                            <p className="text-gray-500 text-[10px]">
                              {new Date(journal.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>

                        {journal.is_editors_choice && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Award className="w-3.5 h-3.5" />
                            에디터 추천
                          </span>
                        )}
                      </div>

                      {/* Title & Content */}
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-200 transition-colors">
                        {journal.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
                        {journal.content || '내용이 없습니다.'}
                      </p>

                      {/* Progress bar if present */}
                      {journal.goal_amount && journal.goal_amount > 0 && (
                        <div className="mb-4 p-3 bg-white/[0.01] rounded-xl border border-white/[0.04]">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">지속도 리듬</span>
                            <span className={isCompleted ? 'text-green-400' : 'text-cyan-400'}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#0a1017] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                  : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer - Tags and resonance */}
                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      {/* Tags list */}
                      <div className="flex gap-1">
                        {journal.tags && journal.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] text-cyan-300/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Resonance Count */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 group-hover:text-pink-400 transition-colors">
                          <Heart className="w-3.5 h-3.5" />
                          {journal.likes || 0}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          {journal.views || 0}
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Quiet CTA Banner */}
        <div className="mt-14 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/15 via-[#070b10] to-purple-950/15 rounded-3xl p-8 text-center">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-xl font-bold text-white mb-2">
            지식에서 길어 올린 나만의 사색을 나눠주세요
          </h3>
          <p className="text-gray-400 text-sm max-w-xl mx-auto mb-6">
            공부하며 깨달은 생각이나 수정한 가정(Assumption)을 My Reflection Journal에 쓰고,<br />
            공유하기를 활성화하면 이곳 동료들에게 부드럽게 닿게 됩니다.
          </p>
          <Link href="/journal/my">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-[#071018] shadow-lg shadow-cyan-950/40 hover:scale-[1.01] transition">
              나의 저널 기록하러 가기
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
