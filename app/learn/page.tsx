'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  X,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  History,
  Lock,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

type CourseId = 'basic' | 'pro'

interface Lesson {
  id: string
  title: string
  description: string
  duration: number
  xp: number
  tag: string
  recommended?: boolean
  ai_generated?: boolean
}

interface Course {
  id: CourseId
  emoji: string
  title: string
  subtitle: string
  description: string
  accent: string
  border: string
  surface: string
  locked: boolean
}

const STORAGE_PREFIX = 'beyondfleet:learn-progress:v1'
const SAVED_STORAGE_PREFIX = 'beyondfleet:saved-lessons:v1'
const RECENT_STORAGE_PREFIX = 'beyondfleet:recent-learning:v1'

interface LearningRecentItem {
  item_type: 'lesson' | 'brief'
  item_id: string
  title: string
  href: string
  viewed_at: string
  metadata?: {
    trackId?: string
    tag?: string
  }
}

interface PersonalizationResponse {
  interestProfile: {
    topics: Array<{ id: string; label: string; score: number; reason: string }>
    dominantTrack: string
    learningStage: 'beginner' | 'intermediate' | 'adaptive'
    confidence: number
    rationale: string
  }
  continueQueue: Array<{ id: string; title: string; reason: string; score: number }>
  recommendedLessons: Array<{ id: string; title: string; reason: string; score: number }>
  recommendedBriefs: Array<{ id: string; title: string; summary: string; category: string; reason: string; score: number }>
  suggestedTopics: Array<{ id: string; label: string; score: number; reason: string }>
  trendingTopics: Array<{ id: string; label: string; score: number; reason: string }>
  mode: 'personalized' | 'guest'
}

const COURSES: Course[] = [
  {
    id: 'basic',
    emoji: '📘',
    title: '기초 코스',
    subtitle: '경제를 읽는 첫 걸음',
    description: '금리, 물가, 달러 같은 핵심 개념을 쉽게 배워요. 누구나 무료로 수강할 수 있어요.',
    accent: 'text-cyan-300',
    border: 'border-cyan-400/30',
    surface: 'bg-cyan-400/10',
    locked: false,
  },
  {
    id: 'pro',
    emoji: '🔥',
    title: '프로 코스',
    subtitle: '의사결정 사고력 심화',
    description: 'AI 경제, 리스크 모델 설계, 의사결정 프레임워크를 깊이 있게 다뤄요. 멤버십 회원 전용이에요.',
    accent: 'text-amber-300',
    border: 'border-amber-400/30',
    surface: 'bg-amber-400/10',
    locked: false, // dynamically set based on userTier
  },
]

const BEGINNER_START_STEPS = [
  {
    label: '1. 금리부터',
    body: '금리가 바뀌면 기업, 가계, 자산 가격의 기준도 달라집니다.',
    href: '/learn/macro-foundations-rates',
  },
  {
    label: '2. 물가를 다음으로',
    body: 'CPI 같은 물가 지표는 중앙은행과 시장 기대가 바뀔 수 있는 신호입니다.',
    href: '/learn/macro-foundations-inflation',
  },
  {
    label: '3. 리스크 사고로 마무리',
    body: '맞히려 하기보다 어떤 조건에서 내 생각이 틀릴 수 있는지 먼저 적습니다.',
    href: '/learn/risk-thinking-risk-management',
  },
]

function getUserLevel(totalXp: number) {
  const level = Math.floor(totalXp / 250) + 1
  const currentLevelXp = (level - 1) * 250
  const nextLevelXp = level * 250
  const xpIntoLevel = totalXp - currentLevelXp
  const percent = Math.min(100, Math.round((xpIntoLevel / 250) * 100))

  return {
    level,
    title: level >= 5 ? 'Macro Operator' : level >= 3 ? 'Context Builder' : 'Cadet Analyst',
    xpIntoLevel,
    nextLevelXp,
    percent,
  }
}

function getStorageKey(userId: string | null) {
  return `${STORAGE_PREFIX}:${userId || 'guest'}`
}

function getSavedStorageKey(userId: string | null) {
  return `${SAVED_STORAGE_PREFIX}:${userId || 'guest'}`
}

function getRecentStorageKey(userId: string | null) {
  return `${RECENT_STORAGE_PREFIX}:${userId || 'guest'}`
}

function getLocalDate() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function isYesterday(previousDate: string | null, today: string) {
  if (!previousDate) return false
  const previous = new Date(`${previousDate}T00:00:00`)
  const current = new Date(`${today}T00:00:00`)
  return current.getTime() - previous.getTime() === 24 * 60 * 60 * 1000
}

export default function LearnPage() {
  const [activeCourse, setActiveCourse] = useState<CourseId>('basic')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(true)
  const [userTier, setUserTier] = useState<'cadet' | 'navigator' | 'operator'>('cadet')
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [savedLessons, setSavedLessons] = useState<Set<string>>(new Set())
  const [recentItems, setRecentItems] = useState<LearningRecentItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [storageKey, setStorageKey] = useState(getStorageKey(null))
  const [savedStorageKey, setSavedStorageKey] = useState(getSavedStorageKey(null))
  const [recentStorageKey, setRecentStorageKey] = useState(getRecentStorageKey(null))
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local')
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null)
  const [personalization, setPersonalization] = useState<PersonalizationResponse | null>(null)
  const [userProfile, setUserProfile] = useState<{ level: string; interests: string[]; style: string } | null>(null)
  const [showLevelBanner, setShowLevelBanner] = useState(true)

  const activeCourseData = COURSES.find((c) => c.id === activeCourse) || COURSES[0]
  const isProLocked = activeCourse === 'pro' && userTier === 'cadet'
  const allLessons = lessons
  const completedCount = allLessons.filter((lesson) => completedLessons.has(lesson.id)).length
  const totalXp = allLessons.reduce((sum, lesson) => (
    completedLessons.has(lesson.id) ? sum + lesson.xp : sum
  ), 0)
  const overallPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0
  const userLevel = getUserLevel(totalXp)
  const engineContinueLessonId = personalization?.continueQueue[0]?.id
  const engineRecommendedLessonId = personalization?.recommendedLessons[0]?.id
  const lastRecentLesson = recentItems.find((item) => item.item_type === 'lesson')
  const continueLesson = allLessons.find((lesson) => lesson.id === engineContinueLessonId && !completedLessons.has(lesson.id))
    || allLessons.find((lesson) => lesson.id === lastRecentLesson?.item_id && !completedLessons.has(lesson.id))
    || allLessons.find((lesson) => !completedLessons.has(lesson.id))
    || allLessons[0]
  const nextRecommended = allLessons.find((lesson) => lesson.id === engineRecommendedLessonId && !completedLessons.has(lesson.id))
    || allLessons.find((lesson) => lesson.recommended && !completedLessons.has(lesson.id))
    || allLessons.find((lesson) => !completedLessons.has(lesson.id))
    || allLessons[0]
  const savedLessonCards = allLessons.filter((lesson) => savedLessons.has(lesson.id)).slice(0, 3)
  const recentLearningItems = recentItems.slice(0, 5)

  function findLesson(lessonId: string) {
    return allLessons.find((lesson) => lesson.id === lessonId) || null
  }

  function findCourseForLesson(_lessonId: string) {
    return activeCourseData
  }

  function readLocalArray<T>(key: string): T[] {
    try {
      const saved = window.localStorage.getItem(key)
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed as T[] : []
    } catch {
      return []
    }
  }

  function mergeLocalArray<T>(targetKey: string, rows: T[], keyForRow: (row: T) => string, limit = 80) {
    const current = readLocalArray<T>(targetKey)
    const seen = new Set<string>()
    const merged: T[] = []

    for (const row of [...rows, ...current]) {
      const key = keyForRow(row)
      if (!key || seen.has(key)) continue
      seen.add(key)
      merged.push(row)
    }

    window.localStorage.setItem(targetKey, JSON.stringify(merged.slice(0, limit)))
  }

  async function syncGuestLearningProgress(nextUserId: string) {
    const guestProgressKey = getStorageKey(null)
    const guestSavedKey = getSavedStorageKey(null)
    const guestRecentKey = getRecentStorageKey(null)

    const guestCompleted = readLocalArray<string>(guestProgressKey)
    const guestSaved = readLocalArray<string>(guestSavedKey)
    const guestRecent = readLocalArray<LearningRecentItem>(guestRecentKey)

    if (guestCompleted.length === 0 && guestSaved.length === 0 && guestRecent.length === 0) return

    const now = new Date().toISOString()
    const progressRows = guestCompleted
      .map((lessonId) => {
        const lesson = findLesson(lessonId)
        if (!lesson) return null
        const track = findCourseForLesson(lessonId)
        return {
          user_id: nextUserId,
          lesson_id: lesson.id,
          track_id: track.id,
          lesson_title: lesson.title,
          lesson_xp: lesson.xp,
          completed: true,
          completed_at: now,
          last_viewed_at: now,
          updated_at: now,
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))

    const savedRows = guestSaved
      .map((lessonId) => {
        const lesson = findLesson(lessonId)
        if (!lesson) return null
        const track = findCourseForLesson(lessonId)
        return {
          user_id: nextUserId,
          lesson_id: lesson.id,
          track_id: track.id,
          lesson_title: lesson.title,
          saved_at: now,
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))

    const recentRows = guestRecent
      .filter((item) => item.item_type && item.item_id && item.title && item.href)
      .map((item) => ({
        user_id: nextUserId,
        item_type: item.item_type,
        item_id: item.item_id,
        title: item.title,
        href: item.href,
        viewed_at: item.viewed_at || now,
        metadata: item.metadata || {},
      }))

    await Promise.allSettled([
      progressRows.length
        ? supabase.from('learning_progress').upsert(progressRows, { onConflict: 'user_id,lesson_id' })
        : Promise.resolve(),
      savedRows.length
        ? supabase.from('learning_saved_lessons').upsert(savedRows, { onConflict: 'user_id,lesson_id' })
        : Promise.resolve(),
      recentRows.length
        ? supabase.from('learning_recent_items').upsert(recentRows, { onConflict: 'user_id,item_type,item_id' })
        : Promise.resolve(),
    ])

    mergeLocalArray(getStorageKey(nextUserId), guestCompleted, (lessonId) => lessonId)
    mergeLocalArray(getSavedStorageKey(nextUserId), guestSaved, (lessonId) => lessonId)
    mergeLocalArray(getRecentStorageKey(nextUserId), guestRecent, (item) => `${item.item_type}:${item.item_id}`)

    const guestStreak = window.localStorage.getItem(`${guestProgressKey}:streak`)
    const guestLongestStreak = window.localStorage.getItem(`${guestProgressKey}:longest-streak`)
    const guestLastActivity = window.localStorage.getItem(`${guestProgressKey}:last-activity`)
    const guestTotalXp = allLessons.reduce((sum, lesson) => (
      guestCompleted.includes(lesson.id) ? sum + lesson.xp : sum
    ), 0)
    const guestLevel = getUserLevel(guestTotalXp)
    const nextCurrentStreak = Number(guestStreak || 0)
    const nextLongestStreak = Number(guestLongestStreak || nextCurrentStreak)

    if (guestCompleted.length > 0 || nextCurrentStreak > 0) {
      await supabase
        .from('learning_user_stats')
        .upsert({
          user_id: nextUserId,
          total_xp: guestTotalXp,
          current_level: guestLevel.level,
          current_streak: nextCurrentStreak,
          longest_streak: Math.max(nextLongestStreak, nextCurrentStreak),
          last_activity_date: guestLastActivity || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
    }

    if (guestStreak && !window.localStorage.getItem(`${getStorageKey(nextUserId)}:streak`)) {
      window.localStorage.setItem(`${getStorageKey(nextUserId)}:streak`, guestStreak)
    }
    if (guestLongestStreak && !window.localStorage.getItem(`${getStorageKey(nextUserId)}:longest-streak`)) {
      window.localStorage.setItem(`${getStorageKey(nextUserId)}:longest-streak`, guestLongestStreak)
    }
    if (guestLastActivity && !window.localStorage.getItem(`${getStorageKey(nextUserId)}:last-activity`)) {
      window.localStorage.setItem(`${getStorageKey(nextUserId)}:last-activity`, guestLastActivity)
    }

    window.localStorage.removeItem(guestProgressKey)
    window.localStorage.removeItem(guestSavedKey)
    window.localStorage.removeItem(guestRecentKey)
    window.localStorage.removeItem(`${guestProgressKey}:streak`)
    window.localStorage.removeItem(`${guestProgressKey}:longest-streak`)
    window.localStorage.removeItem(`${guestProgressKey}:last-activity`)
  }

  useEffect(() => {
    let mounted = true

    async function resolveProgressKey() {
      const { data: { user } } = await supabase.auth.getUser()
      if (mounted) {
        const nextUserId = user?.id || null
        setUserId(nextUserId)
        setSyncMode(nextUserId ? 'cloud' : 'local')
        setStorageKey(getStorageKey(nextUserId))
        setSavedStorageKey(getSavedStorageKey(nextUserId))
        setRecentStorageKey(getRecentStorageKey(nextUserId))
      }
    }

    resolveProgressKey()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id || null
      setUserId(nextUserId)
      setSyncMode(nextUserId ? 'cloud' : 'local')
      setStorageKey(getStorageKey(nextUserId))
      setSavedStorageKey(getSavedStorageKey(nextUserId))
      setRecentStorageKey(getRecentStorageKey(nextUserId))
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function fetchLessons() {
      setLessonsLoading(true)
      try {
        const response = await fetch(`/api/lessons?course=${activeCourse}`)
        if (!response.ok) throw new Error('Failed to fetch lessons')
        const data = await response.json()
        if (mounted) {
          setLessons(data.lessons || [])
        }
      } catch {
        if (mounted) {
          setLessons([])
        }
      } finally {
        if (mounted) {
          setLessonsLoading(false)
        }
      }
    }

    fetchLessons()

    return () => {
      mounted = false
    }
  }, [activeCourse])

  useEffect(() => {
    let mounted = true

    async function loadProgress() {
      setProgressLoaded(false)

      if (userId) {
        try {
          await syncGuestLearningProgress(userId)

          const [progressResult, savedResult, recentResult, statsResult] = await Promise.all([
            supabase
              .from('learning_progress')
              .select('lesson_id, completed')
              .eq('user_id', userId),
            supabase
              .from('learning_saved_lessons')
              .select('lesson_id')
              .eq('user_id', userId),
            supabase
              .from('learning_recent_items')
              .select('item_type, item_id, title, href, viewed_at, metadata')
              .eq('user_id', userId)
              .order('viewed_at', { ascending: false })
              .limit(8),
            supabase
              .from('learning_user_stats')
              .select('total_xp, current_level, current_streak, longest_streak, last_activity_date')
              .eq('user_id', userId)
              .maybeSingle(),
          ])

          if (!mounted) return

          const completed = progressResult.data
            ?.filter((row) => row.completed)
            .map((row) => row.lesson_id) || []
          const saved = savedResult.data?.map((row) => row.lesson_id) || []
          const computedTotalXp = allLessons.reduce((sum, lesson) => (
            completed.includes(lesson.id) ? sum + lesson.xp : sum
          ), 0)
          const computedLevel = getUserLevel(computedTotalXp)
          const nextCurrentStreak = statsResult.data?.current_streak || 0
          const nextLongestStreak = statsResult.data?.longest_streak || 0
          const nextLastActivityDate = statsResult.data?.last_activity_date || null

          setCompletedLessons(new Set(completed))
          setSavedLessons(new Set(saved))
          setRecentItems((recentResult.data || []) as LearningRecentItem[])
          setCurrentStreak(nextCurrentStreak)
          setLongestStreak(nextLongestStreak)
          setLastActivityDate(nextLastActivityDate)

          if (statsResult.data?.total_xp !== computedTotalXp || statsResult.data?.current_level !== computedLevel.level) {
            await supabase
              .from('learning_user_stats')
              .upsert({
                user_id: userId,
                total_xp: computedTotalXp,
                current_level: computedLevel.level,
                current_streak: nextCurrentStreak,
                longest_streak: nextLongestStreak,
                last_activity_date: nextLastActivityDate,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              })
          }
        } catch {
          loadLocalProgress()
        } finally {
          if (mounted) setProgressLoaded(true)
        }
        return
      }

      loadLocalProgress()
      setProgressLoaded(true)
    }

    function loadLocalProgress() {
      try {
        const completedSaved = window.localStorage.getItem(storageKey)
        const completedParsed = completedSaved ? JSON.parse(completedSaved) as string[] : []
        const savedSaved = window.localStorage.getItem(savedStorageKey)
        const savedParsed = savedSaved ? JSON.parse(savedSaved) as string[] : []
        const recentSaved = window.localStorage.getItem(recentStorageKey)
        const recentParsed = recentSaved ? JSON.parse(recentSaved) as LearningRecentItem[] : []

        setCompletedLessons(new Set(completedParsed))
        setSavedLessons(new Set(savedParsed))
        setRecentItems(recentParsed)
        setCurrentStreak(Number(window.localStorage.getItem(`${storageKey}:streak`) || 0))
        setLongestStreak(Number(window.localStorage.getItem(`${storageKey}:longest-streak`) || 0))
        setLastActivityDate(window.localStorage.getItem(`${storageKey}:last-activity`))
      } catch {
        setCompletedLessons(new Set())
        setSavedLessons(new Set())
        setRecentItems([])
        setCurrentStreak(0)
        setLongestStreak(0)
        setLastActivityDate(null)
      }
    }

    loadProgress()

    return () => {
      mounted = false
    }
  }, [userId, storageKey, savedStorageKey, recentStorageKey])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('beyondfleet:user-profile:v1')
      if (saved) setUserProfile(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (!progressLoaded || userId) return
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(completedLessons)))
  }, [completedLessons, progressLoaded, storageKey, userId])

  useEffect(() => {
    if (!progressLoaded || userId) return
    window.localStorage.setItem(savedStorageKey, JSON.stringify(Array.from(savedLessons)))
  }, [savedLessons, progressLoaded, savedStorageKey, userId])

  useEffect(() => {
    if (!progressLoaded || userId) return
    window.localStorage.setItem(recentStorageKey, JSON.stringify(recentItems))
  }, [recentItems, progressLoaded, recentStorageKey, userId])

  useEffect(() => {
    let mounted = true

    async function loadPersonalization() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch('/api/recommendations', { headers })
        if (!response.ok) return

        const payload = await response.json()
        if (mounted) {
          setPersonalization(payload)
        }
      } catch {
        if (mounted) {
          setPersonalization(null)
        }
      }
    }

    loadPersonalization()

    return () => {
      mounted = false
    }
  }, [userId, completedCount, savedLessons.size, recentItems.length])

  async function updateLearningStats(nextCompletedLessons: Set<string>, countAsStreak: boolean) {
    const nextTotalXp = allLessons.reduce((sum, lesson) => (
      nextCompletedLessons.has(lesson.id) ? sum + lesson.xp : sum
    ), 0)
    const nextLevel = getUserLevel(nextTotalXp)
    const today = getLocalDate()

    let nextCurrentStreak = currentStreak
    let nextLongestStreak = longestStreak
    let nextLastActivityDate = lastActivityDate

    if (countAsStreak) {
      if (lastActivityDate === today) {
        nextCurrentStreak = Math.max(1, currentStreak)
      } else if (isYesterday(lastActivityDate, today)) {
        nextCurrentStreak = currentStreak + 1
      } else {
        nextCurrentStreak = 1
      }

      nextLongestStreak = Math.max(longestStreak, nextCurrentStreak)
      nextLastActivityDate = today
      setCurrentStreak(nextCurrentStreak)
      setLongestStreak(nextLongestStreak)
      setLastActivityDate(today)
    }

    if (userId) {
      await supabase
        .from('learning_user_stats')
        .upsert({
          user_id: userId,
          total_xp: nextTotalXp,
          current_level: nextLevel.level,
          current_streak: nextCurrentStreak,
          longest_streak: nextLongestStreak,
          last_activity_date: nextLastActivityDate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
    } else {
      window.localStorage.setItem(`${storageKey}:streak`, String(nextCurrentStreak))
      window.localStorage.setItem(`${storageKey}:longest-streak`, String(nextLongestStreak))
      if (nextLastActivityDate) {
        window.localStorage.setItem(`${storageKey}:last-activity`, nextLastActivityDate)
      }
    }
  }

  async function recordLessonView(lessonId: string) {
    const lesson = findLesson(lessonId)
    if (!lesson) return

    const track = findCourseForLesson(lessonId)
    const item: LearningRecentItem = {
      item_type: 'lesson',
      item_id: lesson.id,
      title: lesson.title,
      href: `/learn/${lesson.id}`,
      viewed_at: new Date().toISOString(),
      metadata: {
        trackId: track.id,
        tag: lesson.tag,
      },
    }

    setRecentItems((current) => [
      item,
      ...current.filter((existing) => !(existing.item_type === item.item_type && existing.item_id === item.item_id)),
    ].slice(0, 8))

    if (userId) {
      await supabase
        .from('learning_recent_items')
        .upsert({
          user_id: userId,
          item_type: item.item_type,
          item_id: item.item_id,
          title: item.title,
          href: item.href,
          viewed_at: item.viewed_at,
          metadata: item.metadata,
        }, {
          onConflict: 'user_id,item_type,item_id',
        })

      await supabase
        .from('learning_progress')
        .upsert({
          user_id: userId,
          lesson_id: lesson.id,
          track_id: track.id,
          lesson_title: lesson.title,
          lesson_xp: lesson.xp,
          completed: completedLessons.has(lesson.id),
          last_viewed_at: item.viewed_at,
          updated_at: item.viewed_at,
        }, {
          onConflict: 'user_id,lesson_id',
        })
    }
  }

  async function toggleLessonComplete(lessonId: string) {
    const lesson = findLesson(lessonId)
    if (!lesson) return

    const track = findCourseForLesson(lessonId)
    const willComplete = !completedLessons.has(lessonId)
    const now = new Date().toISOString()
    const next = new Set(completedLessons)

    if (willComplete) {
      next.add(lessonId)
    } else {
      next.delete(lessonId)
    }

    setCompletedLessons(next)
    await recordLessonView(lessonId)

    if (userId) {
      await supabase
        .from('learning_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          track_id: track.id,
          lesson_title: lesson.title,
          lesson_xp: lesson.xp,
          completed: willComplete,
          completed_at: willComplete ? now : null,
          last_viewed_at: now,
          updated_at: now,
        }, {
          onConflict: 'user_id,lesson_id',
        })
    }

    await updateLearningStats(next, willComplete)
  }

  async function toggleSavedLesson(lessonId: string) {
    const lesson = findLesson(lessonId)
    if (!lesson) return

    const track = findCourseForLesson(lessonId)
    const next = new Set(savedLessons)
    const willSave = !savedLessons.has(lessonId)

    if (willSave) {
      next.add(lessonId)
    } else {
      next.delete(lessonId)
    }

    setSavedLessons(next)

    if (userId) {
      if (willSave) {
        await supabase
          .from('learning_saved_lessons')
          .upsert({
            user_id: userId,
            lesson_id: lessonId,
            track_id: track.id,
            lesson_title: lesson.title,
            saved_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,lesson_id',
          })
      } else {
        await supabase
          .from('learning_saved_lessons')
          .delete()
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
      }
    }
  }



  return (
    <div className="min-h-screen bg-[#070b10] px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="bf-mobile-card bf-reading-panel mb-10 rounded-lg p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-cyan-400/24 bg-cyan-400/[0.08] px-3 py-2 text-sm font-medium text-cyan-200">
                <BookOpen className="h-4 w-4" />
                Learn
              </div>
              <h1 className="bf-mobile-copy max-w-[12ch] text-3xl font-semibold leading-tight tracking-normal text-white sm:max-w-3xl md:text-5xl">
                처음엔 흐름만 잡아도 됩니다.
              </h1>
              <p className="bf-mobile-copy mt-5 max-w-[24ch] text-base leading-8 text-gray-400 sm:max-w-[66ch]">
                처음부터 다 알 필요는 없습니다. 오늘 브리프에 필요한 개념 하나만 천천히 봅니다.
              </p>
            </div>

            <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-white/[0.075] bg-white/[0.024] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">나의 여정</p>
                    <p className="mt-1 text-base font-semibold text-white">{userLevel.title}</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  조용한 방향이지, 쫓아야 할 목표가 아닙니다.
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.075] bg-white/[0.024] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">나만의 리듬</p>
                    <p className="mt-1 text-base font-semibold text-white">편할 때 돌아오세요</p>
                  </div>
                  <History className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-400">
                  쉬어도 괜찮습니다{lastActivityDate ? ` · 마지막 ${lastActivityDate}` : ''}.
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.075] bg-white/[0.024] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-gray-500">조용히 저장됨</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 px-2 py-0.5 text-[11px] text-cyan-100/80">
                    <Database className="h-3 w-3" />
                    {syncMode === 'cloud' ? 'Supabase' : 'Local'}
                  </span>
                </div>
                <p className="mt-1 text-base font-semibold text-white">열어본 학습 기록</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  기록은 조용히 남아 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 hidden sm:block">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">학습 경로</span>
              <span className="font-medium text-cyan-200">{overallPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300 transition-all"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              돌아온 흐름을 조용히 기록한 것일 뿐입니다.
            </p>
          </div>
        </section>

        <section className="bf-mobile-card mb-10 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <PlayCircle className="h-4 w-4" />
                처음이면 이 순서로 시작하세요
              </div>
              <h2 className="text-2xl font-semibold text-white">먼저 흐름을 잡습니다.</h2>
              <p className="mt-3 max-w-[26ch] text-sm leading-7 text-gray-400 sm:max-w-[58ch]">
                초보자에게 중요한 것은 용어 암기가 아니라 반복해서 보는 기준입니다.
                금리, 물가, 리스크 조건만 잡아도 Daily Brief가 훨씬 편하게 읽힙니다.
              </p>
            </div>

            <div className="grid gap-3">
              {BEGINNER_START_STEPS.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="group rounded-lg border border-white/[0.06] bg-black/12 p-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.045]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cyan-100">{step.label}</p>
                      <p className="mt-2 break-words text-sm leading-6 text-gray-400">{step.body}</p>
                    </div>
                    <ArrowRight className="mt-1 hidden h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-cyan-200 sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {userProfile && showLevelBanner && (() => {
          const level = userProfile.level
          const bannerConfig = {
            beginner: {
              emoji: '🌱',
              title: '입문자를 위한 추천 코스',
              gradient: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
              border: 'border-emerald-400/30',
              links: [
                { label: '금리와 할인율', href: '/learn/macro-foundations-rates' },
                { label: '유동성의 흐름', href: '/learn/macro-foundations-liquidity' },
                { label: '확률적 사고', href: '/learn/risk-thinking-probability' },
              ],
            },
            basic: {
              emoji: '📖',
              title: '기초를 탄탄히!',
              gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
              border: 'border-cyan-400/30',
              links: [
                { label: '기초 코스 전체 보기', href: '#', onClick: () => setActiveCourse('basic') },
                { label: '물가와 기대의 차이', href: '/learn/macro-foundations-inflation' },
                { label: '채권금리와 경기 신호', href: '/learn/macro-foundations-bonds' },
              ],
            },
            intermediate: {
              emoji: '📈',
              title: '한 단계 더!',
              gradient: 'from-violet-500/20 via-amber-500/10 to-transparent',
              border: 'border-violet-400/30',
              links: [
                { label: 'AI Compute 인프라', href: '/learn/ai-economy-compute' },
                { label: 'AI Agents 의사결정', href: '/learn/ai-economy-agents' },
                { label: '리스크 매니지먼트', href: '/learn/risk-thinking-risk-management' },
              ],
            },
            advanced: {
              emoji: '🎯',
              title: '프로를 위한 딥다이브',
              gradient: 'from-amber-500/20 via-rose-500/10 to-transparent',
              border: 'border-amber-400/30',
              links: [
                { label: 'Data Economy 심화', href: '/learn/ai-economy-data' },
                { label: 'Second-Order Thinking', href: '/learn/risk-thinking-second-order' },
                { label: 'Dollar Cycle 분석', href: '/learn/macro-foundations-dollar' },
              ],
            },
          }
          const config = bannerConfig[level as keyof typeof bannerConfig] || bannerConfig.beginner
          return (
            <section className={`bf-mobile-card mb-10 rounded-lg border ${config.border} bg-gradient-to-r ${config.gradient} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                    <span className="text-2xl">{config.emoji}</span>
                    {config.title}
                  </div>
                  <p className="mb-4 text-sm leading-6 text-gray-400">
                    {level === 'beginner' && '처음이라면 금리와 유동성부터 시작하세요. 가장 자주 쓰이는 개념입니다.'}
                    {level === 'basic' && 'Macro Foundations를 마스터하면 Daily Brief가 훨씬 편하게 읽힙니다.'}
                    {level === 'intermediate' && 'AI 경제와 리스크 사고를 추가하면 분석의 깊이가 달라집니다.'}
                    {level === 'advanced' && '모든 트랙을 자유롭게 탐색하세요. 깊이 있는 학습이 기다립니다.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={'onClick' in link ? (link as { onClick: () => void }).onClick : undefined}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.08] hover:text-white"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowLevelBanner(false)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-gray-300"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </section>
          )
        })()}

        <section className="bf-mobile-card mb-10">
          <div className="grid grid-cols-2 gap-3">
            {COURSES.map((course) => {
              const isActive = course.id === activeCourse
              const isLocked = course.id === 'pro' && userTier === 'cadet'

              return (
                <button
                  key={course.id}
                  onClick={() => setActiveCourse(course.id)}
                  className={`rounded-xl border p-5 text-left transition-all duration-200 ${
                    isActive
                      ? `${course.border} ${course.surface} ring-1 ring-white/10`
                      : 'border-white/[0.075] bg-white/[0.024] hover:border-white/15 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl">{course.emoji}</span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                        <Lock className="h-3 w-3" />
                        멤버십
                      </span>
                    )}
                  </div>
                  <h2 className={`text-lg font-semibold ${isActive ? 'text-white' : 'text-gray-200'}`}>{course.title}</h2>
                  <p className={`mt-1 text-sm font-medium ${isActive ? course.accent : 'text-gray-500'}`}>{course.subtitle}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-400">{course.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        {continueLesson && (
        <section className="bf-mobile-card mb-10 rounded-lg border border-white/[0.075] bg-white/[0.024] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" />
            나에게 맞는 학습
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr_0.9fr]">
            <div className="rounded-lg border border-cyan-400/18 bg-cyan-400/[0.055] p-5">
              <p className="text-xs font-medium uppercase text-cyan-200/80">이어서 읽기</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{continueLesson.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{continueLesson.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => toggleLessonComplete(continueLesson.id)}
                  className="whitespace-nowrap"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  읽음으로 기록
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => recordLessonView(continueLesson.id)}
                  className="whitespace-nowrap"
                >
                  <History className="mr-2 h-4 w-4" />
                  이어보기
                </Button>
                <Link
                  href={`/learn/${continueLesson.id}`}
                  onClick={() => recordLessonView(continueLesson.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.08]"
                >
                  읽기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {nextRecommended && (
            <div className="hidden rounded-lg border border-amber-400/14 bg-amber-400/[0.035] p-5 md:block">
              <p className="text-xs font-medium uppercase text-amber-200/80">준비되면</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{nextRecommended.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{nextRecommended.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">{nextRecommended.duration} min</span>
                <span className="font-medium text-cyan-300">선택 사항</span>
              </div>
              <Link
                href={`/learn/${nextRecommended.id}`}
                onClick={() => recordLessonView(nextRecommended.id)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300/20 bg-transparent px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/[0.08]"
              >
                천천히 열기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            )}

            <div className="hidden rounded-lg border border-white/[0.075] bg-black/15 p-5 md:block">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-gray-400">저장한 레슨</p>
                <Bookmark className="h-4 w-4 text-gray-500" />
              </div>
              {savedLessonCards.length > 0 ? (
                <div className="space-y-2">
                  {savedLessonCards.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/learn/${lesson.id}`}
                      onClick={() => recordLessonView(lesson.id)}
                      className="block w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-gray-300 transition hover:border-cyan-300/30 hover:text-white"
                    >
                      {lesson.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-gray-500">저장한 lesson이 여기에 표시됩니다.</p>
              )}
            </div>
          </div>

          <div className="mt-5 hidden rounded-lg border border-white/[0.075] bg-black/15 p-4 md:block">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
              <History className="h-4 w-4 text-cyan-300" />
              최근 본 브리핑/레슨
            </div>
            {recentLearningItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {recentLearningItems.map((item) => (
                  <Link
                    key={`${item.item_type}-${item.item_id}`}
                    href={item.href}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 transition hover:border-white/20 hover:text-white"
                  >
                    <span className="mr-2 text-xs uppercase text-gray-500">{item.item_type}</span>
                    {item.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">학습 또는 브리핑을 열면 최근 활동이 표시됩니다.</p>
            )}
          </div>

          <div className="mt-5 hidden rounded-lg border border-white/[0.075] bg-black/15 p-4 md:block">
            <p className="text-xs font-medium uppercase text-gray-500">나만의 경로</p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {personalization?.interestProfile.rationale || 'Start with Macro Foundations.'}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              {personalization?.interestProfile.topics?.[0]
                ? `Your current path is leaning toward ${personalization.interestProfile.topics[0].label}. One lesson at a time is enough.`
                : 'The learning workspace stays simple: continue one track, read one lesson, then connect it back to the daily brief.'}
            </p>
          </div>
        </section>
        )}

        <section className="relative">
          {lessonsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex gap-4">
                    <div className="h-11 w-11 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-white/10" />
                      <div className="h-5 w-2/3 rounded bg-white/10" />
                      <div className="h-3 w-full rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {isProLocked && (
                <div className="pointer-events-none absolute inset-0 z-10 rounded-xl backdrop-blur-sm" />
              )}

              {isProLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-xl border border-amber-400/30 bg-[#0c1018]/95 p-8 text-center shadow-2xl backdrop-blur-md">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                      <Lock className="h-6 w-6 text-amber-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">프로 코스는 Navigator 이상 회원만 수강할 수 있어요</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-400">
                      AI 경제, 리스크 모델 설계, 의사결정 프레임워크 등 심화 콘텐츠를 잠금 해제하세요.
                    </p>
                    <Link
                      href="/pricing"
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-amber-400 hover:to-orange-400"
                    >
                      <Sparkles className="h-4 w-4" />
                      멤버십 업그레이드
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {allLessons.map((lesson, index) => {
                  const isComplete = completedLessons.has(lesson.id)
                  const isSaved = savedLessons.has(lesson.id)

                  return (
                    <article
                      key={lesson.id}
                      className={`rounded-lg border p-5 transition ${
                        isComplete
                          ? 'border-emerald-400/25 bg-emerald-400/[0.06]'
                          : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]'
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
                            isComplete
                              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                              : `${activeCourseData.border} ${activeCourseData.surface} ${activeCourseData.accent}`
                          }`}>
                            {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                          </div>

                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300">
                                {lesson.tag}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock3 className="h-3.5 w-3.5" />
                                {lesson.duration} min
                              </span>
                              {lesson.ai_generated && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[11px] font-medium text-violet-300">
                                  🤖 AI 생성
                                </span>
                              )}
                              <span className="text-xs font-medium text-cyan-300">조용한 성장</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">{lesson.description}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 md:flex-col">
                          <Button
                            variant={isComplete ? 'outline' : 'secondary'}
                            size="sm"
                            onClick={() => toggleLessonComplete(lesson.id)}
                            className="min-w-[118px]"
                          >
                            {isComplete ? (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                완료됨
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                읽음 기록
                              </>
                            )}
                          </Button>
                          <Button
                            variant={isSaved ? 'outline' : 'ghost'}
                            size="sm"
                            onClick={() => toggleSavedLesson(lesson.id)}
                            className="min-w-[118px]"
                          >
                            {isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                            {isSaved ? '저장됨' : '저장'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => recordLessonView(lesson.id)}
                            className="min-w-[118px]"
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            이어보기
                          </Button>
                          <Link
                            href={`/learn/${lesson.id}`}
                            onClick={() => recordLessonView(lesson.id)}
                            className="inline-flex min-w-[118px] items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.08]"
                          >
                            읽기
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
