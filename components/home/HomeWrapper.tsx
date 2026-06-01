'use client'

import { useState, useEffect } from 'react'
import OnboardingQuiz, { useUserProfile } from './OnboardingQuiz'

const PROFILE_KEY = 'beyondfleet:user-profile:v1'

export default function HomeWrapper({ children }: { children: React.ReactNode }) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (!saved) {
        setShowQuiz(true)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  if (!mounted) return <>{children}</>

  if (showQuiz) {
    return <OnboardingQuiz onComplete={() => setShowQuiz(false)} />
  }

  return <>{children}</>
}
