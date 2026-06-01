'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { 
  Plus, Trash2, Edit3, NotebookPen, TrendingUp, CheckCircle2, 
  Circle, ArrowLeft, Lock, Sparkles, HelpCircle, Calendar, 
  Brain, FileText, BarChart4, AlertTriangle, RefreshCw 
} from 'lucide-react'

interface Assumption {
  assumption_text: string
  topic: string
  related_topic: string
  confidence_level: 'low' | 'medium' | 'high'
  review_date: string
  status: 'active' | 'revised' | 'invalidated' | 'confirmed'
  evidence_to_watch: string
}

interface JournalEntry {
  id: string
  user_id?: string
  title: string
  content: string // Can be plain text or serialized JSON containing noteText, templateType, and assumption
  goal_amount?: number
  current_amount?: number
  status: 'in_progress' | 'completed' | 'paused' | 'draft'
  is_public: boolean
  created_at: string
  updated_at: string
}

type TemplateType = 'threeMin' | 'news' | 'chart' | 'learn' | 'hypothesis' | 'free'

const TEMPLATES: Record<TemplateType, { label: string; icon: string; defaultContent: string }> = {
  threeMin: {
    label: '3분 작성 모드',
    icon: '⚡',
    defaultContent: `### [3분 작성 모드]

- **오늘 본 것**: 
- **왜 중요할까?**: 
- **내 가설**: 
- **반대 가능성**: 
- **다음에 확인할 것**: `
  },
  news: {
    label: '뉴스로 쓰기',
    icon: '📰',
    defaultContent: `### [뉴스 기반 리서치]

- **오늘 본 뉴스**: 
- **왜 중요할까?**: 
- **내 가설**: 
- **반대 가설**: 
- **다음에 확인할 데이터**: `
  },
  chart: {
    label: '차트로 쓰기',
    icon: '📊',
    defaultContent: `### [차트/지표 관찰 리서치]

- **관찰한 차트/지표**: 
- **왜 중요할까?**: 
- **내 가설**: 
- **반대 가설**: 
- **다음에 확인할 지표**: `
  },
  learn: {
    label: '오늘 배운 것 쓰기',
    icon: '💡',
    defaultContent: `### [오늘 배운 지식/개념]

- **오늘 배운 것**: 
- **왜 중요할까?**: 
- **나의 의문점**: 
- **나의 결론**: 
- **추가 학습할 주제**: `
  },
  hypothesis: {
    label: '내 가설 쓰기',
    icon: '🧠',
    defaultContent: `### [핵심 가설 검증 리서치]

- **나의 가설**: 
- **가설의 근거 데이터**: 
- **반대 데이터/시나리오**: 
- **가설 검증 시점**: `
  },
  free: {
    label: '자유 리서치',
    icon: '✍️',
    defaultContent: `### [자유 가설 리서치]

- **관찰한 사실**: 
- **왜 중요할까?**: 
- **내 가설**: 
- **반대 가설**: 
- **확인할 데이터**: 
- **다시 볼 날짜**: `
  }
}

function NotebookContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'notebook' | 'report'>('notebook')

  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(TEMPLATES.threeMin.defaultContent)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('threeMin')
  const [isPublic, setIsPublic] = useState(false)

  // Assumption Tracker states
  const [hasAssumption, setHasAssumption] = useState(false)
  const [assumptionText, setAssumptionText] = useState('')
  const [relatedTopic, setRelatedTopic] = useState('macro')
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [reviewDate, setReviewDate] = useState('')
  const [assumptionStatus, setAssumptionStatus] = useState<Assumption['status']>('active')
  const [evidenceToWatch, setEvidenceToWatch] = useState('')

  // AI Coach states
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Check login state
  const isLoggedIn = !!user

  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        await fetchUsername(currentUser.id)
        await fetchEntriesByUser(currentUser.id)
      } else {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUsername(session.user.id)
        await fetchEntriesByUser(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle incoming query parameters for news/chart note creation
  useEffect(() => {
    if (!loading && isLoggedIn) {
      const action = searchParams.get('action')
      const template = searchParams.get('template')

      if (action === 'new') {
        resetForm()
        setShowForm(true)

        if (template === 'news') {
          const newsTitle = searchParams.get('title') || ''
          const newsSource = searchParams.get('source') || ''
          const newsDate = searchParams.get('publishedAt') || ''
          const newsCategory = searchParams.get('category') || 'macro'
          const newsUrl = searchParams.get('url') || ''

          setTitle(`[뉴스 분석] ${newsTitle.slice(0, 40)}${newsTitle.length > 40 ? '...' : ''}`)
          setSelectedTemplate('news')
          
          const metaHeader = `> **참고 뉴스**: [${newsTitle}](${newsUrl}) (${newsSource})\n> **발행 시각**: ${new Date(newsDate).toLocaleString('ko-KR')}\n\n`;
          setContent(metaHeader + TEMPLATES.news.defaultContent)

          // Enable assumption pre-fill
          setHasAssumption(true)
          setAssumptionText(`[${newsTitle.slice(0, 30)}...] 뉴스 기반 매크로 판단 가설`)
          setRelatedTopic(newsCategory)
          setConfidenceLevel('medium')
          setReviewDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        } 
        else if (template === 'chart') {
          const indicator = searchParams.get('indicator') || ''
          const change = searchParams.get('change') || ''

          setTitle(`[지표 관찰] ${indicator} 변동 가설`)
          setSelectedTemplate('chart')

          const metaHeader = `> **관찰 대상**: ${indicator}\n> **최근 변화/상태**: ${change}\n\n`;
          setContent(metaHeader + TEMPLATES.chart.defaultContent)

          setHasAssumption(true)
          setAssumptionText(`${indicator} 지표의 (${change}) 변화에 따른 가격 유동성 영향 가설`)
          setRelatedTopic('markets')
          setConfidenceLevel('medium')
          setReviewDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        }
      }
    }
  }, [searchParams, loading, isLoggedIn])

  async function fetchUsername(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      if (data?.username) {
        setUsername(data.username)
      }
    } catch (error) {
      console.error('Error fetching username:', error)
    }
  }

  async function fetchEntriesByUser(userId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Parse entry content gracefully (JSON wrapper or plain text fallback)
  const parseEntry = (entry: JournalEntry) => {
    try {
      if (entry.content && entry.content.startsWith('{')) {
        const parsed = JSON.parse(entry.content)
        return {
          noteText: parsed.noteText || '',
          templateType: (parsed.templateType as TemplateType) || 'free',
          assumption: parsed.assumption ? {
            ...parsed.assumption,
            topic: parsed.assumption.topic || parsed.assumption.related_topic || 'macro',
            related_topic: parsed.assumption.related_topic || parsed.assumption.topic || 'macro'
          } : null
        }
      }
    } catch (e) {
      // JSON parse failed, treat as legacy plain text
    }
    return {
      noteText: entry.content || '',
      templateType: 'free' as TemplateType,
      assumption: null
    }
  }

  const handleTemplateChange = (tmpl: TemplateType) => {
    setSelectedTemplate(tmpl)
    setContent(TEMPLATES[tmpl].defaultContent)
  }

  // AI Coach triggering logic
  const askAICoach = async () => {
    if (!title.trim() || !content.trim()) {
      alert('가설 피드백을 받으려면 제목과 내용을 먼저 입력해 주세요.')
      return
    }

    setAiLoading(true)
    setAiFeedback(null)
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          templateType: TEMPLATES[selectedTemplate].label
        })
      })

      if (!res.ok) throw new Error('AI Coach response failed')
      const data = await res.json()
      setAiFeedback(data.feedback)
    } catch (err) {
      console.error('AI Coach failure:', err)
      setAiFeedback('AI 코치가 일시적인 유동성 문제로 응답하지 못했습니다. 잠시 후 다시 가설 피드백을 요청해 주세요.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!title.trim()) return

    // Prepare serializable JSON content
    const assumptionObj: Assumption | null = hasAssumption ? {
      assumption_text: assumptionText.trim(),
      topic: relatedTopic,
      related_topic: relatedTopic,
      confidence_level: confidenceLevel,
      review_date: reviewDate || new Date().toISOString().split('T')[0],
      status: assumptionStatus,
      evidence_to_watch: evidenceToWatch.trim()
    } : null

    const finalContent = JSON.stringify({
      noteText: content.trim(),
      templateType: selectedTemplate,
      assumption: assumptionObj
    })

    const entryData = {
      title: title.trim(),
      content: finalContent,
      goal_amount: 10, // constant to satisfy table constraint if any
      current_amount: 1,
      status: 'in_progress' as const,
      is_public: isPublic,
      author_name: username || user.email?.split('@')[0] || '익명 리포터',
      user_id: user.id
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update({
            ...entryData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEntry.id)

        if (error) throw error

        setEntries(prev =>
          prev.map(entry =>
            entry.id === editingEntry.id
              ? { ...entry, ...entryData, updated_at: new Date().toISOString() } as JournalEntry
              : entry
          )
        )
      } else {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([entryData])
          .select()
          .single()

        if (error) throw error
        if (data) {
          setEntries(prev => [data, ...prev])
        }
      }

      resetForm()
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('노트 저장에 실패했습니다. 데이터를 다시 확인해 주세요.')
    }
  }

  const handleEdit = (entry: JournalEntry) => {
    const parsed = parseEntry(entry)
    setEditingEntry(entry)
    setTitle(entry.title)
    setContent(parsed.noteText)
    setSelectedTemplate(parsed.templateType)
    setIsPublic(entry.is_public)

    if (parsed.assumption) {
      setHasAssumption(true)
      setAssumptionText(parsed.assumption.assumption_text)
      setRelatedTopic(parsed.assumption.related_topic)
      setConfidenceLevel(parsed.assumption.confidence_level)
      setReviewDate(parsed.assumption.review_date)
      setAssumptionStatus(parsed.assumption.status)
      setEvidenceToWatch(parsed.assumption.evidence_to_watch)
    } else {
      setHasAssumption(false)
      setAssumptionText('')
      setRelatedTopic('macro')
      setConfidenceLevel('medium')
      setReviewDate('')
      setAssumptionStatus('active')
      setEvidenceToWatch('')
    }

    setAiFeedback(null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('가설과 함께 노트를 정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent(TEMPLATES.threeMin.defaultContent)
    setSelectedTemplate('threeMin')
    setIsPublic(false)
    setHasAssumption(false)
    setAssumptionText('')
    setRelatedTopic('macro')
    setConfidenceLevel('medium')
    setReviewDate('')
    setAssumptionStatus('active')
    setEvidenceToWatch('')
    setAiFeedback(null)
    setEditingEntry(null)
    setShowForm(false)
  }

  // Calculate statistics for Weekly Cognitive Report
  const getWeeklyStats = () => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0,0,0,0)

    const weeklyNotes = entries.filter(e => new Date(e.created_at) >= startOfWeek)
    
    let hypothesesCount = 0
    let reviewedHypotheses = 0
    const topics: Record<string, number> = {}

    entries.forEach(e => {
      const parsed = parseEntry(e)
      if (parsed.assumption) {
        hypothesesCount++
        if (parsed.assumption.status !== 'active') {
          reviewedHypotheses++
        }
        const tVal = parsed.assumption.topic || parsed.assumption.related_topic || 'macro'
        topics[tVal] = (topics[tVal] || 0) + 1
      }
    })

    let favoriteTopic = 'N/A'
    let maxCount = 0
    Object.entries(topics).forEach(([topic, count]) => {
      if (count > maxCount) {
        maxCount = count
        favoriteTopic = topic === 'macro' ? 'Macro' : topic === 'ai' ? 'AI' : topic === 'markets' ? 'Markets' : topic
      }
    })

    return {
      noteCount: weeklyNotes.length,
      hypothesesCount,
      reviewedHypotheses,
      favoriteTopic,
      weeklyLessons: weeklyNotes.length > 0 ? "인플레이션 기대 수준에 따른 할인율 결정 구조 학습" : "가설을 기록하고 피드백을 받아보세요.",
      nextWeekQuestion: "중앙은행의 긴축 선회가 신흥국 수출에 미치는 2차 경로?"
    }
  }

  const stats = getWeeklyStats()

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-cyan-500/20 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-cyan-500/20 rounded w-32 animate-pulse" />
          </div>
          <div className="glass rounded-xl p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-cyan-500/20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl p-8 text-center border border-cyan-500/20">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2 font-comic">로그인이 필요합니다</h2>
          <p className="text-gray-400 mb-6">나만의 Thinking Lab 가설 노트를 작성하고 AI 코칭을 받으려면 로그인해주세요.</p>
          <Link href="/journal" className="inline-flex justify-center w-full py-3 px-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 rounded-xl font-bold transition hover:opacity-90">
            Thinking Lab 소개 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-space-deep relative">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Compliance Warning banner */}
        <div className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4 backdrop-blur-md">
          <p className="text-center text-xs leading-relaxed text-cyan-200">
            💡 BeyondFleet는 투자 자문, 투자 일임, 매매 추천, 수익 보장을 제공하지 않습니다. 모든 콘텐츠는 금융 리터러시와 의사결정 교육을 위한 참고 자료입니다.
          </p>
        </div>

        {/* Navigation back */}
        <Link href="/journal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Thinking Lab 홈으로</span>
        </Link>

        {/* Tab Buttons & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white font-comic tracking-tight">
              My Research Notebook
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              스스로 생각하는 힘을 기르는 금융 리터러시 연습장
            </p>
          </div>
          <div className="flex items-center gap-2 bg-space-950/40 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('notebook')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'notebook' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              📓 연구 노트 목록
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'report' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              🧠 주간 사고 리포트
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'report' ? (
          <div className="glass rounded-2xl p-8 border border-purple-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-purple-500/[0.03] blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Brain className="text-purple-400" />
              이번 주 사고 리포트 (Weekly Cognitive Report)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-white/5 bg-slate-950/40 p-5 rounded-xl text-center">
                <span className="text-3xl font-black text-white font-mono">{stats.noteCount}</span>
                <p className="text-xs text-gray-400 mt-1.5">이번 주 작성한 리서치 노트</p>
              </div>
              <div className="border border-white/5 bg-slate-950/40 p-5 rounded-xl text-center">
                <span className="text-3xl font-black text-cyan-400 font-mono">{stats.hypothesesCount}</span>
                <p className="text-xs text-gray-400 mt-1.5">생성한 누적 가설</p>
              </div>
              <div className="border border-white/5 bg-slate-950/40 p-5 rounded-xl text-center">
                <span className="text-3xl font-black text-purple-400 font-mono">{stats.reviewedHypotheses}</span>
                <p className="text-xs text-gray-400 mt-1.5">검토/수정한 가설 수</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-white/5 bg-slate-950/20 p-5 rounded-xl flex items-start gap-4">
                <FileText className="w-6 h-6 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">가장 심도 깊게 다룬 분야</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    현재 가설 보관함에서 가장 비중이 큰 주제는 <span className="text-cyan-300 font-semibold">{stats.favoriteTopic}</span> 입니다.
                  </p>
                </div>
              </div>

              <div className="border border-white/5 bg-slate-950/20 p-5 rounded-xl flex items-start gap-4">
                <TrendingUp className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">이번 주 축적된 지식</h4>
                  <p className="text-sm text-gray-300 mt-1">{stats.weeklyLessons}</p>
                </div>
              </div>

              <div className="border border-white/5 bg-slate-950/20 p-5 rounded-xl flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">다음 주를 선도할 핵심 질문</h4>
                  <p className="text-sm text-amber-200 mt-1 font-medium">{stats.nextWeekQuestion}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Note Dashboard Main and Create Button */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-gray-400">
                총 {entries.length}개의 기록된 가설 / 노트가 존재합니다.
              </span>
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="py-3 px-5 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold rounded-xl flex items-center gap-2 hover:scale-[1.01] transition-transform"
              >
                <Plus className="w-5 h-5" />
                새 리서치 노트 작성
              </button>
            </div>

            {/* Note List */}
            {entries.length === 0 ? (
              <div className="glass rounded-xl p-16 text-center border border-white/5">
                <NotebookPen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-xl font-medium">Research Notebook이 비어있습니다.</p>
                <p className="text-gray-500 text-sm mt-2 mb-6">
                  오늘 읽은 경제 뉴스나 차트 스냅샷에 포함된 데이터에 근거해 나만의 가설을 수립해 보세요.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="py-3 px-6 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold transition-all"
                >
                  가설 노트 작성하기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {entries.map((entry) => {
                  const parsed = parseEntry(entry)

                  return (
                    <div
                      key={entry.id}
                      className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Tags / Header */}
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-space-800 rounded-lg text-gray-300 flex items-center gap-1.5 border border-white/5">
                            {TEMPLATES[parsed.templateType]?.icon}
                            {TEMPLATES[parsed.templateType]?.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                          {entry.title}
                        </h3>

                        {/* Assumption Badge in List */}
                        {parsed.assumption && (
                          <div className="my-3 p-3 bg-cyan-500/[0.04] border border-cyan-500/10 rounded-xl">
                            <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1">
                              <Brain className="w-3.5 h-3.5" />
                              가설 트래커 활성됨
                            </span>
                            <p className="text-xs text-cyan-200 mt-1 line-clamp-2">
                              {parsed.assumption.assumption_text}
                            </p>
                            <div className="flex gap-3 text-[10px] text-gray-500 mt-2">
                              <span>주제: {parsed.assumption.topic || parsed.assumption.related_topic}</span>
                              <span>신뢰도: {parsed.assumption.confidence_level}</span>
                              <span className="text-amber-400/80">검토일: {parsed.assumption.review_date}</span>
                            </div>
                          </div>
                        )}

                        {/* Content text */}
                        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed mt-2">
                          {parsed.noteText}
                        </p>
                      </div>

                      {/* Card actions */}
                      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Lock className="w-3.5 h-3.5" />
                          <span>개인 학습용</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-300 rounded-lg transition-colors border border-white/5"
                            title="수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors border border-white/5"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Creation/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-cyan-500/30 flex flex-col md:flex-row gap-6 relative">
              
              {/* Form Content Left */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white font-comic flex items-center gap-2">
                    {editingEntry ? '✏️ 리서치 가설 수정' : '📓 새 리서치 가설 수립'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs border border-white/10"
                  >
                    닫기
                  </button>
                </div>

                {/* Templates Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    노트 템플릿 선택
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(TEMPLATES).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTemplateChange(key as TemplateType)}
                        className={`p-2.5 rounded-xl text-left text-xs font-medium border transition flex items-center gap-2 ${
                          selectedTemplate === key
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                            : 'bg-space-950/40 text-gray-400 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <span>{value.icon}</span>
                        <span className="truncate">{value.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      가설 노트 제목 *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 경기 둔화 시그널과 반도체 수급 가설"
                      className="w-full px-4 py-3 bg-space-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm"
                      required
                    />
                  </div>

                  {/* Textarea Content */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      리서치 본문 (템플릿에 맞추어 기록)
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-space-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm resize-none font-mono"
                    />
                  </div>

                  {/* Assumption Tracker Toggle Block */}
                  <div className="p-4 bg-space-900/60 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-cyan-300" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Assumption Tracker 활성화</h4>
                          <p className="text-[11px] text-gray-500">이 노트의 핵심 가설을 주기적으로 추적·검증할 가설로 지정합니다.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasAssumption(!hasAssumption)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          hasAssumption ? 'bg-cyan-500' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          hasAssumption ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {hasAssumption && (
                      <div className="space-y-4 border-t border-white/5 pt-4 text-xs">
                        <div>
                          <label className="block text-gray-400 font-bold mb-1">내 핵심 가설 요약</label>
                          <input
                            type="text"
                            value={assumptionText}
                            onChange={(e) => setAssumptionText(e.target.value)}
                            placeholder="예: 미국의 긴축 중단이 지속된다면 금리가 3%대로 빠르게 수렴할 것이다."
                            className="w-full px-3 py-2 bg-space-950 border border-white/5 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 text-xs"
                            required={hasAssumption}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-400 font-bold mb-1">관련 분야</label>
                            <select
                              value={relatedTopic}
                              onChange={(e) => setRelatedTopic(e.target.value)}
                              className="w-full px-3 py-2 bg-space-950 border border-white/5 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-xs"
                            >
                              <option value="macro">Macro (거시경제)</option>
                              <option value="ai">AI (인공지능)</option>
                              <option value="technology">Technology (기술)</option>
                              <option value="policy">Policy (정책/규제)</option>
                              <option value="markets">Markets (시장 변동)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-400 font-bold mb-1">가설 신뢰도 (Confidence)</label>
                            <select
                              value={confidenceLevel}
                              onChange={(e) => setConfidenceLevel(e.target.value as any)}
                              className="w-full px-3 py-2 bg-space-950 border border-white/5 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-xs"
                            >
                              <option value="low">Low (직관/탐색 수준)</option>
                              <option value="medium">Medium (부분 데이터 지지)</option>
                              <option value="high">High (강력한 이론/지표 지지)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-400 font-bold mb-1">검토 목표 시점</label>
                            <input
                              type="date"
                              value={reviewDate}
                              onChange={(e) => setReviewDate(e.target.value)}
                              className="w-full px-3 py-2 bg-space-950 border border-white/5 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-400 font-bold mb-1">가설 검증 상태</label>
                            <select
                              value={assumptionStatus}
                              onChange={(e) => setAssumptionStatus(e.target.value as any)}
                              className="w-full px-3 py-2 bg-space-950 border border-white/5 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-xs"
                            >
                              <option value="active">Active (검증 대기/활성)</option>
                              <option value="revised">Revised (데이터 대조 후 수정)</option>
                              <option value="invalidated">Invalidated (가설 폐기)</option>
                              <option value="confirmed">Confirmed (가설 참으로 확인)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-400 font-bold mb-1">관찰할 신호 / 데이터 (Evidence to Watch)</label>
                          <textarea
                            value={evidenceToWatch}
                            onChange={(e) => setEvidenceToWatch(e.target.value)}
                            placeholder="예: 미국 2년물 및 10년물 스프레드 차이, FOMC 점도표 동향"
                            rows={2}
                            className="w-full px-3 py-2 bg-space-950 border border-white/5 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 text-xs resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission and warning disclaimer */}
                  <div className="border border-cyan-500/20 bg-cyan-950/10 p-3 rounded-lg text-[10px] text-cyan-200">
                    ⚠️ BeyondFleet는 투자 자문, 투자 일임, 매매 추천, 수익 보장을 제공하지 않습니다. 모든 콘텐츠는 금융 리터러시와 의사결정 교육을 위한 참고 자료입니다.
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors text-sm"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 rounded-xl font-bold transition hover:opacity-90 text-sm"
                    >
                      {editingEntry ? '수정 저장' : '연구 노트 저장'}
                    </button>
                  </div>
                </form>
              </div>

              {/* AI Coach Window Right */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between max-h-[80vh]">
                <div className="space-y-4 overflow-y-auto">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="font-bold text-sm">Thinking Lab AI Coach</h3>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-normal">
                    AI 코치는 정답이나 매매 추천을 주지 않습니다. 가설의 타당성을 검증하기 위한 <strong>반대 신호와 비판적 질문</strong>만을 전달합니다.
                  </p>

                  {/* Coach Chat bubble */}
                  {aiLoading ? (
                    <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/20 animate-pulse flex flex-col gap-2">
                      <div className="h-4 bg-cyan-500/20 rounded w-3/4" />
                      <div className="h-4 bg-cyan-500/20 rounded w-5/6" />
                      <div className="h-4 bg-cyan-500/20 rounded w-1/2" />
                    </div>
                  ) : aiFeedback ? (
                    <div className="p-4 bg-cyan-950/15 border border-cyan-500/20 rounded-2xl relative">
                      <div className="absolute -left-1.5 top-5 w-3 h-3 bg-cyan-950 rotate-45 border-l border-b border-cyan-500/20 hidden md:block" />
                      <span className="text-[10px] font-bold text-cyan-400 block mb-1">📢 AI 코치의 검토 질문</span>
                      <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
                    </div>
                  ) : (
                    <div className="p-5 border border-dashed border-white/10 rounded-xl text-center text-xs text-gray-500">
                      가설 수립 후 아래 피드백 요청 버튼을 클릭하면 AI 코치의 질문을 받아볼 수 있습니다.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={askAICoach}
                  disabled={aiLoading}
                  className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-purple-600/30 to-cyan-500/30 hover:from-purple-600/40 hover:to-cyan-500/40 text-cyan-200 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  AI 코치 가설 피드백 요청
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function MyJournalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="h-10 bg-cyan-500/20 rounded w-48 mb-2 animate-pulse" />
      </div>
    }>
      <NotebookContent />
    </Suspense>
  )
}
