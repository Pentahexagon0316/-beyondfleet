'use client'

import { useEffect } from 'react'

export default function BriefsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 4. 실제 에러는 서버 로그/개발자 콘솔에만 기록합니다.
    console.error('Runtime error in briefs segment:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b10] px-4 text-center">
      {/* Premium Glassmorphic card */}
      <div className="relative max-w-md w-full rounded-2xl border border-red-500/20 bg-[#0c111c]/60 p-8 backdrop-blur-md shadow-2xl">
        
        {/* Subtle decorative top light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        {/* Warning Icon with red glowing background */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <svg className="h-6 w-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        {/* 2. 런타임 에러를 사용자에게 직접 보여주지 마세요. */}
        {/* 3. 안전한 fallback UI 제공 */}
        <h2 className="text-xl font-bold text-white mb-3 tracking-tight">
          콘텐츠를 불러오는 중 문제가 발생했습니다.
        </h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          잠시 후 다시 시도해주세요.
        </p>

        {/* 5. production 환경에서 stack trace 노출 금지 */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 text-left bg-black/40 p-4 rounded-xl overflow-auto max-h-40 text-xs font-mono text-red-300 border border-red-500/10 leading-relaxed">
            <p className="font-semibold">{error.name}: {error.message}</p>
            {error.stack && <pre className="mt-2 text-[10px] opacity-75">{error.stack}</pre>}
          </div>
        )}

        <button
          onClick={() => reset()}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 py-3.5 font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.98] border border-cyan-400/20"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
