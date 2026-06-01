'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

import { ArrowLeft, Heart, Eye, TrendingUp, Calendar, Target, Award, Trash2, MessageCircle, Send, Sparkles } from 'lucide-react'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'


interface JournalEntry {
  id: string
  user_id?: string
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
  updated_at: string
}

interface Comment {
  id: string
  journal_id: string
  user_id?: string
  wallet_address?: string
  author_name: string
  content: string
  created_at: string
}

// 관리자 이메일 목록
const ADMIN_EMAILS = ['coinkim00@gmail.com']

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [username, setUsername] = useState<string>('')

  // Web3 wallet states disabled
  const isWalletConnected = false
  const walletAddress = null as any

  // 로그인 상태 (Supabase 또는 지갑)
  const isLoggedIn = !!user || isWalletConnected

  useEffect(() => {
    // 사용자 정보 가져오기
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user?.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
      }
      // 사용자 이름 가져오기
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
          if (profile?.username) {
            setUsername(profile.username)
          } else {
            setUsername(user.email?.split('@')[0] || '익명')
          }
        } catch (profileErr) {
          console.error('Error fetching user profile in challenges:', profileErr)
          setUsername(user.email?.split('@')[0] || '익명')
        }
      }
    }).catch(err => {
      console.error('Error in challenges getUser:', err)
    })

    if (params.id) {
      fetchEntry(params.id as string)
      fetchComments(params.id as string)
      checkIfLiked(params.id as string)
    }
  }, [params.id])

  // 지갑 연결 시 사용자 이름 설정
  useEffect(() => {
    if (isWalletConnected && walletAddress && !user) {
      const fetchWalletUsername = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('wallet_address', walletAddress)
          .single()
        if (profile?.username) {
          setUsername(profile.username)
        } else {
          setUsername(`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
        }
      }
      fetchWalletUsername()
    }
  }, [isWalletConnected, walletAddress, user])

  async function fetchEntry(id: string) {
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setError('성찰 글을 찾을 수 없습니다.')
        } else {
          setError('성찰 글을 불러오는 중 오류가 발생했습니다.')
        }
        return
      }

      setEntry({
        ...data,
        tags: data.tags || [],
        is_editors_choice: data.is_editors_choice || false
      })
      setLikeCount(data.likes || 0)

      // 본인 글인지 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser && data.user_id === currentUser.id) {
        setIsOwner(true)
      }

      // 조회수 증가
      await supabase
        .from('journal_entries')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id)

    } catch (err) {
      console.error('Error fetching entry:', err)
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 댓글 목록 가져오기 (로컬스토리지 + DB 하이브리드)
  async function fetchComments(journalId: string) {
    try {
      const localComments = JSON.parse(localStorage.getItem(`comments_${journalId}`) || '[]')
      setComments(localComments)
    } catch (err) {
      console.error('Error loading local comments:', err)
    }

    try {
      const { data, error } = await supabase
        .from('journal_comments')
        .select('*')
        .eq('journal_id', journalId)
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        setComments(data)
      }
    } catch (err) {
      console.log('Using local comments fallback')
    }
  }

  // 좋아요 여부 확인 (로컬스토리지 사용)
  function checkIfLiked(journalId: string) {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_journals') || '[]')
      if (likedPosts.includes(journalId)) {
        setHasLiked(true)
      }
    } catch (err) {
      // 로컬스토리지 무시
    }
  }

  // 공명(좋아요) 토글
  async function handleLike() {
    if (!isLoggedIn) {
      alert('생각을 공명하기 위해 먼저 로그인이 필요합니다.')
      return
    }
    if (!entry || liking) return

    setLiking(true)
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_journals') || '[]')

      if (hasLiked) {
        // 공명 취소
        const { error } = await supabase
          .from('journal_entries')
          .update({ likes: Math.max(0, likeCount - 1) })
          .eq('id', entry.id)

        if (error) throw error

        const newLikedPosts = likedPosts.filter((id: string) => id !== entry.id)
        localStorage.setItem('liked_journals', JSON.stringify(newLikedPosts))

        setHasLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        // 공명 추가
        const { error } = await supabase
          .from('journal_entries')
          .update({ likes: likeCount + 1 })
          .eq('id', entry.id)

        if (error) throw error

        likedPosts.push(entry.id)
        localStorage.setItem('liked_journals', JSON.stringify(likedPosts))

        setHasLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Resonance toggle error:', err)
      alert('처리에 실패했습니다.')
    } finally {
      setLiking(false)
    }
  }

  // 댓글 작성 (로컬스토리지 + DB 하이브리드)
  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      alert('코멘트를 작성하기 위해 로그인이 필요합니다.')
      return
    }
    if (!entry || !newComment.trim() || submittingComment) return

    setSubmittingComment(true)

    const newCommentData: Comment = {
      id: crypto.randomUUID(),
      journal_id: entry.id,
      user_id: user?.id,
      wallet_address: walletAddress || undefined,
      author_name: username || '익명',
      content: newComment.trim(),
      created_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('journal_comments')
        .insert({
          journal_id: entry.id,
          author_name: username || '익명',
          content: newComment.trim(),
          user_id: user?.id || null,
          wallet_address: walletAddress || null
        })
        .select()
        .single()

      if (!error && data) {
        setComments(prev => [...prev, data])
        setNewComment('')
        setSubmittingComment(false)
        return
      }
    } catch (err) {
      console.log('DB write failed, using local storage')
    }

    try {
      const localComments = JSON.parse(localStorage.getItem(`comments_${entry.id}`) || '[]')
      localComments.push(newCommentData)
      localStorage.setItem(`comments_${entry.id}`, JSON.stringify(localComments))
      setComments(prev => [...prev, newCommentData])
      setNewComment('')
    } catch (err) {
      console.error('LocalStorage comment save failed:', err)
      alert('코멘트 저장에 실패했습니다.')
    } finally {
      setSubmittingComment(false)
    }
  }

  // 댓글 삭제 (로컬스토리지 + DB 하이브리드)
  async function handleDeleteComment(commentId: string, commentUserId: string) {
    if (!isLoggedIn) return
    if (!entry) return

    if (!confirm('작성하신 코멘트를 정말 삭제하시겠습니까?')) return

    try {
      await supabase
        .from('journal_comments')
        .delete()
        .eq('id', commentId)
    } catch (err) {
      console.log('DB delete comment error')
    }

    try {
      const localComments = JSON.parse(localStorage.getItem(`comments_${entry.id}`) || '[]')
      const filtered = localComments.filter((c: Comment) => c.id !== commentId)
      localStorage.setItem(`comments_${entry.id}`, JSON.stringify(filtered))
    } catch (err) {
      console.log('LocalStorage delete comment error')
    }

    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const calculateProgress = (current?: number, goal?: number) => {
    if (!current || !goal || goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} sessions`
  }

  const canDelete = isOwner || isAdmin

  const handleDelete = async () => {
    if (!entry) return

    const confirmMessage = isAdmin && !isOwner
      ? '관리자 권한으로 이 성찰 글을 영구히 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.'
      : '작성하신 성찰 글을 영구히 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.'

    if (!confirm(confirmMessage)) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id)

      if (error) throw error

      alert('성찰 글이 삭제되었습니다.')
      router.push('/journal/challenges')
    } catch (err) {
      console.error('Delete reflection error:', err)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b10] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-3xl w-full border border-white/10 bg-white/[0.02] rounded-3xl p-8 animate-pulse">
          <div className="h-8 bg-cyan-500/10 rounded w-3/4 mb-4" />
          <div className="h-4 bg-cyan-500/10 rounded w-1/4 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-cyan-500/10 rounded w-full" />
            <div className="h-4 bg-cyan-500/10 rounded w-full" />
            <div className="h-4 bg-cyan-500/10 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-[#070b10] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-3xl w-full text-center">
          <Link href="/journal/challenges" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Community Reflections로 돌아가기</span>
          </Link>

          <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-black text-white mb-3">
              {sanitizeErrorMessage(error) || '성찰 글을 찾을 수 없습니다'}
            </h2>
            <p className="text-gray-400 mb-6">
              삭제되었거나 비공개로 전환된 사색 노트일 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/journal/challenges')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-[#071018] shadow-lg transition hover:scale-[1.01]"
            >
              다른 성찰 보러 가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progress = calculateProgress(entry.current_amount, entry.goal_amount)
  const isCompleted = entry.status === 'completed'

  return (
    <div className="min-h-screen bg-[#070b10] py-12 px-4 sm:px-6 lg:px-8 text-white relative">
      {/* Background glow gradient */}
      <div className="absolute left-1/4 top-1/6 w-96 h-96 rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 rounded-full bg-purple-500/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Back Link */}
        <Link href="/journal/challenges" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Community Reflections로 돌아가기</span>
        </Link>

        {/* Main Card with Editorial Design */}
        <div className={`overflow-hidden rounded-3xl border bg-gradient-to-b from-white/[0.03] to-[#070b10] shadow-2xl transition-all duration-300 ${
          isCompleted ? 'border-green-500/25 shadow-green-950/10' : 'border-white/10 shadow-cyan-950/10'
        }`}>
          {/* Header */}
          <div className={`p-6 sm:p-8 border-b border-white/[0.06] ${
            isCompleted
              ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5'
              : 'bg-gradient-to-r from-cyan-500/5 to-purple-500/5'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black uppercase ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-cyan-500 to-purple-500'
                }`}>
                  {entry.author_name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-white font-black text-base">{entry.author_name || '익명'}</p>
                  <p className="text-gray-400 text-xs flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {entry.is_editors_choice && (
                  <div className="flex items-center gap-1 bg-amber-400/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Editor&apos;s Choice</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-1.5 bg-green-500/15 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-bold">
                    <Award className="w-4 h-4" />
                    <span>계획 완료</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Delete Action */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {entry.title}
              </h1>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition shrink-0"
                  title={isAdmin && !isOwner ? '관리자 권한으로 삭제' : '삭제'}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    {deleting ? '삭제 중...' : isAdmin && !isOwner ? '관리자 삭제' : '삭제'}
                  </span>
                </button>
              )}
            </div>

            {/* Tags Display */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Progress Section */}
            {entry.goal_amount && entry.goal_amount > 0 && (
              <div className="mb-8 p-5 bg-white/[0.01] border border-white/[0.06] rounded-2xl">
                <div className="flex items-center gap-2 mb-3.5">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">나의 사색 목표 달성률</span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 text-xs">진행률</span>
                    <span className={`font-black text-sm ${isCompleted ? 'text-green-400' : 'text-cyan-400'}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#0a1017] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-[#0a1017]/60 rounded-xl border border-white/[0.04]">
                    <p className="text-gray-500 text-[10px] uppercase">현재 누적 기록</p>
                    <p className="text-cyan-400 text-lg font-black font-mono mt-0.5">
                      {formatCurrency(entry.current_amount || 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-[#0a1017]/60 rounded-xl border border-white/[0.04]">
                    <p className="text-gray-500 text-[10px] uppercase">목표 기록</p>
                    <p className="text-purple-400 text-lg font-black font-mono mt-0.5">
                      {formatCurrency(entry.goal_amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Text */}
            <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                성찰 노트 (Reflection Note)
              </h3>
              <div className="text-gray-200 leading-relaxed text-base whitespace-pre-wrap font-sans">
                {entry.content || '아직 reflection이 작성되지 않았습니다.'}
              </div>
            </div>

            {/* Interaction Buttons with Premium Resonance Glow */}
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/[0.06]">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                  hasLiked
                    ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/40 shadow-lg shadow-pink-950/20 scale-[1.02]'
                    : 'bg-[#0a1017] text-gray-400 border-white/10 hover:text-pink-400 hover:border-pink-500/20 hover:bg-pink-500/[0.03]'
                } disabled:opacity-50`}
              >
                <Heart className={`w-4 h-4 transition-transform duration-300 ${hasLiked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                <span>{likeCount} 공명함</span>
              </button>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-white/[0.06] bg-white/[0.01] px-4 py-2.5 rounded-full">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length} 사색 코멘트</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-white/[0.06] bg-white/[0.01] px-4 py-2.5 rounded-full">
                <Eye className="w-4 h-4" />
                <span>{(entry.views || 0) + 1} 읽음</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section with Editorial Culture Guide */}
        <div className="mt-8 border border-white/10 bg-gradient-to-b from-white/[0.02] to-[#070b10] rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            지적인 생각의 덧붙임 ({comments.length})
          </h3>

          {/* Comment Input */}
          {isLoggedIn ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 uppercase">
                  {username?.[0] || '?'}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="이 성찰에 깊이를 더해주는 사려 깊은 코멘트를 보태 주세요..."
                      className="w-full bg-[#0a1017] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                      maxLength={200}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-[#071018] font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 ml-1">
                    ⚠️ 감정 섞인 비방, 선동, 광고성 언급은 BeyondFleet 커뮤니티 신뢰 강령에 의해 숨김 처리될 수 있습니다.
                  </p>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-white/[0.01] border border-white/10 rounded-xl text-center text-gray-400 text-sm">
              지갑을 연결하거나 로그인하시면 조용한 사색 코멘트를 남길 수 있습니다.
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.005]">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">첫 번째 지적 코멘트를 남겨 이 성찰에 날개를 달아주세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3.5 p-4 bg-white/[0.015] border border-white/[0.04] rounded-2xl transition-all hover:bg-white/[0.025]">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase flex-shrink-0">
                    {comment.author_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-xs">{comment.author_name}</span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      
                      {/* Delete action */}
                      {isLoggedIn && (
                        (user && (user.id === comment.user_id || isAdmin)) ||
                        (walletAddress && comment.wallet_address &&
                          walletAddress.toLowerCase() === comment.wallet_address.toLowerCase())
                      ) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id, comment.user_id || '')}
                          className="ml-auto flex items-center gap-1 px-2 py-0.5 text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiet Cultural Encouragement Banner */}
        <div className="mt-8 border border-white/10 bg-gradient-to-r from-purple-950/[0.05] to-cyan-950/[0.05] rounded-2xl p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-bold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            BEYONDFLEET COMMUNITY TRUST PRINCIPLE
          </p>
          <p className="text-gray-400 text-xs mt-2 leading-relaxed">
            좋은 생각의 공유는 동료 투자자와 학습자들에게 귀중한 이정표가 됩니다.<br />
            차분하고 신중한 비판과 제언으로 건강한 공동체 지성을 키워가요.
          </p>
        </div>
      </div>
    </div>
  )
}
