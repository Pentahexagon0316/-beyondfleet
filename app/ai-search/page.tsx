'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Search, Sparkles, Clock, ArrowRight, MessageCircle } from 'lucide-react'

const STORAGE_KEY = 'beyondfleet:ai-search-history:v1'

const SUGGESTED_QUESTIONS = [
  '비트코인이 뭐예요?',
  '금리가 오르면 주식은 왜 떨어져요?',
  '인플레이션이 뭔가요?',
  'ETF가 뭐예요?',
  '달러가 강해지면 한국 경제에 어떤 영향?',
  '스테이블코인은 안전한가요?',
]

interface SearchHistoryItem {
  query: string
  timestamp: string
}

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const saveToHistory = useCallback((q: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query !== q)
      const updated = [{ query: q, timestamp: new Date().toISOString() }, ...filtered].slice(0, 10)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      return updated
    })
  }, [])

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim()
      if (!q || q.length < 2) return

      setIsLoading(true)
      setError('')
      setAnswer('')
      setQuery(q)

      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '오류가 발생했어요.')
          return
        }

        setAnswer(data.answer)
        saveToHistory(q)
      } catch {
        setError('네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요.')
      } finally {
        setIsLoading(false)
      }
    },
    [query, saveToHistory]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-[#070b10] text-white">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-7 h-7 text-yellow-400" />
            AI 학습 검색 🔍
          </h1>
          <p className="text-gray-400 text-base">
            금융 리터러시와 의사결정 역량을 기르는 매크로 학습 보조 도구입니다. 관점 비교와 리서치 요약을 제공합니다.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="flex items-center bg-[#131a24] border border-[#1e2a3a] rounded-2xl overflow-hidden focus-within:border-blue-500/60 transition-colors shadow-lg">
            <Search className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="경제 개념, 시장 맥락, 의사결정 훈련 등 학습하고 싶은 내용을 입력해 보세요..."
              className="w-full bg-transparent text-white placeholder-gray-500 px-4 py-4 text-base outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || query.trim().length < 2}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-5 py-2 mr-2 rounded-xl font-medium text-sm transition-colors"
            >
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-[#131a24] border border-[#1e2a3a] rounded-2xl p-8 mb-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-gray-400 text-sm">AI가 답변을 생성하고 있어요...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-6 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Answer Card */}
        {answer && !isLoading && (
          <div className="bg-[#131a24] border border-[#1e2a3a] rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">AI 답변</span>
            </div>
            <div className="text-gray-200 text-[15px] leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!answer && !isLoading && !error && (
          <div className="text-center py-8 mb-6">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-gray-400 text-base mb-2">아직 질문이 없어요!</p>
            <p className="text-gray-500 text-sm">아래 추천 질문을 눌러보거나, 직접 검색해보세요.</p>
          </div>
        )}

        {/* Suggested Questions */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            추천 질문
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q)
                  handleSearch(q)
                }}
                disabled={isLoading}
                className="bg-[#131a24] border border-[#1e2a3a] hover:border-blue-500/50 hover:bg-[#1a2332] text-gray-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Search History */}
        {history.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              최근 검색
            </h2>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <button
                  key={`${item.query}-${idx}`}
                  onClick={() => {
                    setQuery(item.query)
                    handleSearch(item.query)
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between bg-[#0d1318] hover:bg-[#131a24] border border-[#1e2a3a]/50 rounded-xl px-4 py-3 text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-300 text-sm truncate">{item.query}</span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pb-8">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
