'use client'

import { useEffect } from 'react'
import { sanitizeErrorMessage } from '@/lib/utils/error-sanitizer'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Safe clean console logging, stripping sensitive path data
    const safeMsg = sanitizeErrorMessage(error.message)
    console.error('Captured Runtime Error:', safeMsg)
  }, [error])

  return (
    <div className="min-h-screen py-16 px-4 flex flex-col items-center justify-center bg-[#070b10] text-white">
      <div className="max-w-md w-full glass rounded-2xl p-8 text-center border border-cyan-500/20">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-3">
          콘텐츠를 불러오는 중 문제가 발생했습니다.
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex justify-center py-2.5 px-5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold transition-all text-sm"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  )
}

