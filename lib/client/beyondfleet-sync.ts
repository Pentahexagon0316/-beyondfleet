import type { SupabaseClient } from '@supabase/supabase-js'

const REFLECTION_STORAGE_KEY = 'beyondfleet:daily-reflections:v1'
const ASSUMPTION_STORAGE_KEY = 'beyondfleet:saved-assumptions:v1'
const IDEA_STORAGE_KEY = 'beyondfleet:idea-journal:v1'
const READING_COMPLETION_KEY = 'beyondfleet:reading-completions:v1'
const RECENT_ITEMS_KEY = 'beyondfleet:recent-learning:v1'

interface ReflectionRow {
  brief_id?: string | null
  prompt?: string
  content?: string
  created_at?: string
  title?: string
}

interface AssumptionRow {
  brief_id?: string | null
  assumption?: string
  revisit_trigger?: string
  created_at?: string
  title?: string
}

interface CompletionRow {
  brief_id?: string
  completed_at?: string
  reading_progress?: number
}

interface RecentItemRow {
  item_type?: 'lesson' | 'brief'
  item_id?: string
  title?: string
  href?: string
  viewed_at?: string
  metadata?: Record<string, unknown>
}

function storageKey(baseKey: string, userId: string) {
  return `${baseKey}:${userId}`
}

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

function writeArray<T>(key: string, rows: T[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(rows))
}

function mergeGuestRows<T>(
  baseKey: string,
  userId: string,
  keyForRow: (row: T) => string,
  limit = 50
) {
  const guestKey = storageKey(baseKey, 'guest')
  const userKey = storageKey(baseKey, userId)
  const guestRows = readArray<T>(guestKey)

  if (guestRows.length === 0) return []

  const userRows = readArray<T>(userKey)
  const seen = new Set<string>()
  const merged: T[] = []

  for (const row of [...guestRows, ...userRows]) {
    const key = keyForRow(row)
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(row)
  }

  writeArray(userKey, merged.slice(0, limit))
  window.localStorage.removeItem(guestKey)
  return guestRows
}

export async function syncGuestReflectionActivity(supabase: SupabaseClient, userId: string) {
  if (typeof window === 'undefined') return

  const reflections = mergeGuestRows<ReflectionRow>(
    REFLECTION_STORAGE_KEY,
    userId,
    (row) => `${row.brief_id || 'brief'}:${row.created_at || 'time'}:${row.content || ''}`,
    50
  )
  const ideas = mergeGuestRows<ReflectionRow>(
    IDEA_STORAGE_KEY,
    userId,
    (row) => `${row.brief_id || 'brief'}:${row.created_at || 'time'}:${row.content || ''}`,
    50
  )
  const assumptions = mergeGuestRows<AssumptionRow>(
    ASSUMPTION_STORAGE_KEY,
    userId,
    (row) => `${row.brief_id || 'brief'}:${row.created_at || 'time'}:${row.assumption || ''}`,
    50
  )
  const completions = mergeGuestRows<CompletionRow>(
    READING_COMPLETION_KEY,
    userId,
    (row) => row.brief_id || '',
    50
  )
  const recentItems = mergeGuestRows<RecentItemRow>(
    RECENT_ITEMS_KEY,
    userId,
    (row) => `${row.item_type || 'item'}:${row.item_id || ''}`,
    20
  )

  const reflectionRows = [
    ...reflections.map((row) => ({ ...row, insight_type: 'daily' })),
    ...ideas.map((row) => ({ ...row, insight_type: 'idea' })),
  ]
    .filter((row) => row.content?.trim())
    .map((row) => ({
      user_id: userId,
      brief_id: row.brief_id || null,
      prompt: row.prompt || (row.insight_type === 'idea' ? 'Idea journal' : 'Daily reflection'),
      content: row.content,
      insight_type: row.insight_type,
      visibility: 'private',
      created_at: row.created_at || new Date().toISOString(),
    }))

  const assumptionRows = assumptions
    .filter((row) => row.assumption?.trim())
    .map((row) => ({
      user_id: userId,
      brief_id: row.brief_id || null,
      assumption: row.assumption,
      revisit_trigger: row.revisit_trigger || 'Revisit when new evidence changes the brief.',
      status: 'active',
      created_at: row.created_at || new Date().toISOString(),
    }))

  const completionRows = completions
    .filter((row) => row.brief_id)
    .map((row) => ({
      user_id: userId,
      brief_id: row.brief_id,
      completed_at: row.completed_at || new Date().toISOString(),
      reading_progress: row.reading_progress || 100,
    }))

  const recentRows = recentItems
    .filter((row) => row.item_type && row.item_id && row.title && row.href)
    .map((row) => ({
      user_id: userId,
      item_type: row.item_type,
      item_id: row.item_id,
      title: row.title,
      href: row.href,
      viewed_at: row.viewed_at || new Date().toISOString(),
      metadata: row.metadata || {},
    }))

  await Promise.allSettled([
    reflectionRows.length ? supabase.from('daily_reflections').insert(reflectionRows) : Promise.resolve(),
    assumptionRows.length ? supabase.from('saved_assumptions').insert(assumptionRows) : Promise.resolve(),
    completionRows.length
      ? supabase.from('reading_completions').upsert(completionRows, { onConflict: 'user_id,brief_id' })
      : Promise.resolve(),
    recentRows.length
      ? supabase.from('learning_recent_items').upsert(recentRows, { onConflict: 'user_id,item_type,item_id' })
      : Promise.resolve(),
  ])
}
