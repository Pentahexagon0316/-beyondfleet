'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { extractThemeIdsFromText, getThemeById, getThemeLessonIds } from '@/lib/content/intelligence-graph'
import {
  EDITORIAL_SURFACE_LIMITS,
  countEditorialDriftHits,
  isDisciplinedReflectionPrompt,
} from '@/lib/content/editorial-discipline'
import {
  EPISTEMIC_BRIEF_STRUCTURE,
  evaluateEpistemicClarity,
} from '@/lib/content/epistemic-clarity'
import {
  HUMAN_REFLECTION_PROMPTS,
  countMechanicalFramingHits,
  hasHumanReflectionTone,
} from '@/lib/content/editorial-intuition'
import {
  countOverinterpretationHits,
  evaluateSignalSelectivity,
} from '@/lib/content/editorial-selectivity'
import {
  countFrameworkCreepHits,
  evaluateEditorialSustainability,
} from '@/lib/content/editorial-sustainability'
import {
  countOperationalPressureHits,
  evaluateOperationalCalmness,
} from '@/lib/content/editorial-operations-calmness'
import {
  countSurveillanceMemoryHits,
  evaluatePublicationMemory,
} from '@/lib/content/publication-memory'
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Globe2,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Tags,
  Trash2,
} from 'lucide-react'

type Sentiment = 'bullish' | 'bearish' | 'neutral'

interface DailyBrief {
  id: string
  date: string
  title: string
  summary: string
  full_content: string
  market_sentiment: Sentiment | null
  category: string | null
  tags: string[] | null
  is_premium: boolean | null
  is_published: boolean | null
  is_featured: boolean | null
  what_happened: string | null
  why_it_matters: string | null
  second_order_effects: string | null
  risk_conditions: string | null
  reflection_prompt: string | null
  related_lesson_ids: string[] | null
  editorial_quality_score: number | null
  reading_level: string | null
  scheduled_for: string | null
  published_at: string | null
  editor_notes: string | null
  created_at: string
  updated_at: string
}

interface BriefForm {
  id?: string
  date: string
  title: string
  summary: string
  full_content: string
  market_sentiment: Sentiment
  category: string
  tagsInput: string
  is_premium: boolean
  is_published: boolean
  is_featured: boolean
  what_happened: string
  why_it_matters: string
  second_order_effects: string
  risk_conditions: string
  reflection_prompt: string
  relatedLessonIdsInput: string
  editorial_quality_score: number
  reading_level: string
  scheduled_for: string
  editor_notes: string
}

const CATEGORIES = [
  { value: 'market', label: 'Market' },
  { value: 'macro', label: 'Macro' },
  { value: 'ai', label: 'AI Economy' },
  { value: 'risk', label: 'Risk' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'education', label: 'Education' },
]

const DEFAULT_REFLECTION_PROMPTS = [
  ...HUMAN_REFLECTION_PROMPTS,
]

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'published', label: '공개' },
  { value: 'draft', label: '초안' },
  { value: 'premium', label: '프리미엄' },
  { value: 'public', label: '무료 공개' },
]

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  bullish: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  bearish: 'border-red-400/30 bg-red-500/10 text-red-300',
  neutral: 'border-gray-400/30 bg-gray-500/10 text-gray-300',
}

function todayISO() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function isScheduledForFuture(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
}

function createEmptyForm(): BriefForm {
  return {
    date: todayISO(),
    title: '',
    summary: '',
    full_content: '',
    market_sentiment: 'neutral',
    category: 'market',
    tagsInput: '',
    is_premium: true,
    is_published: false,
    is_featured: false,
    what_happened: '',
    why_it_matters: '',
    second_order_effects: '',
    risk_conditions: '',
    reflection_prompt: DEFAULT_REFLECTION_PROMPTS[0],
    relatedLessonIdsInput: '',
    editorial_quality_score: 0,
    reading_level: 'foundational',
    scheduled_for: '',
    editor_notes: '',
  }
}

function formFromBrief(brief: DailyBrief): BriefForm {
  return {
    id: brief.id,
    date: brief.date,
    title: brief.title || '',
    summary: brief.summary || '',
    full_content: brief.full_content || '',
    market_sentiment: brief.market_sentiment || 'neutral',
    category: brief.category || 'market',
    tagsInput: (brief.tags || []).join(', '),
    is_premium: brief.is_premium !== false,
    is_published: brief.is_published === true,
    is_featured: brief.is_featured === true,
    what_happened: brief.what_happened || '',
    why_it_matters: brief.why_it_matters || '',
    second_order_effects: brief.second_order_effects || '',
    risk_conditions: brief.risk_conditions || '',
    reflection_prompt: brief.reflection_prompt || DEFAULT_REFLECTION_PROMPTS[0],
    relatedLessonIdsInput: (brief.related_lesson_ids || []).join(', '),
    editorial_quality_score: brief.editorial_quality_score || 0,
    reading_level: brief.reading_level || 'foundational',
    scheduled_for: formatDateTimeLocal(brief.scheduled_for),
    editor_notes: brief.editor_notes || '',
  }
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).slice(0, 12)
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatInline(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-cyan-200">$1</code>')
}

function renderMarkdown(markdown: string) {
  const lines = escapeHtml(markdown).split('\n')
  let html = ''
  let inList = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      return
    }

    if (trimmed.startsWith('### ')) {
      closeList()
      html += `<h3 class="mt-5 text-lg font-semibold text-white">${formatInline(trimmed.slice(4))}</h3>`
      return
    }

    if (trimmed.startsWith('## ')) {
      closeList()
      html += `<h2 class="mt-6 text-xl font-bold text-white">${formatInline(trimmed.slice(3))}</h2>`
      return
    }

    if (trimmed.startsWith('# ')) {
      closeList()
      html += `<h1 class="mt-6 text-2xl font-bold text-white">${formatInline(trimmed.slice(2))}</h1>`
      return
    }

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="my-4 space-y-2 pl-5 text-gray-300">'
        inList = true
      }
      html += `<li class="list-disc">${formatInline(trimmed.slice(2))}</li>`
      return
    }

    if (trimmed.startsWith('> ')) {
      closeList()
      html += `<blockquote class="my-4 border-l-2 border-cyan-400/50 pl-4 text-cyan-100/90">${formatInline(trimmed.slice(2))}</blockquote>`
      return
    }

    closeList()
    html += `<p class="my-3 leading-7 text-gray-300">${formatInline(trimmed)}</p>`
  })

  closeList()
  return html
}

function buildSummaryFromMarkdown(markdown: string) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plain) return ''

  return plain.length > 240 ? `${plain.slice(0, 237)}...` : plain
}

function buildStructuredMarkdown(form: BriefForm) {
  const sections = [
    ['What changed', form.what_happened],
    ['Why it may matter', form.why_it_matters],
    ['What could change next', form.second_order_effects],
    ['What remains unclear', form.risk_conditions],
    ['Question to carry forward', form.reflection_prompt],
  ]

  return sections
    .map(([title, body]) => `## ${title}\n\n${body || '_작성 필요_'}`)
    .join('\n\n')
}

function calculateEditorialQuality(form: BriefForm) {
  let score = 0
  const epistemicReview = evaluateEpistemicClarity(form)
  const driftHits = countEditorialDriftHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' '))
  const mechanicalHits = countMechanicalFramingHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' '))
  const operationalPressureHits = countOperationalPressureHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' '))
  const publicationMemoryReview = evaluatePublicationMemory(form)
  const selectivityReview = evaluateSignalSelectivity({
    ...form,
    related_lesson_ids: parseTags(form.relatedLessonIdsInput),
  })
  const sustainabilityReview = evaluateEditorialSustainability({
    ...form,
    related_lesson_ids: parseTags(form.relatedLessonIdsInput),
  })
  const operationsReview = evaluateOperationalCalmness({
    ...form,
    related_lesson_ids: parseTags(form.relatedLessonIdsInput),
    visible_review_count: 5,
  })

  if (form.title.trim().length >= 12) score += 8
  if (form.summary.trim().length >= 80) score += 10
  if (form.full_content.trim().length >= 700) score += 12
  if (form.what_happened.trim().length >= 80) score += 12
  if (form.why_it_matters.trim().length >= 80) score += 12
  if (form.second_order_effects.trim().length >= 80) score += 14
  if (form.risk_conditions.trim().length >= 80) score += 14
  if (isDisciplinedReflectionPrompt(form.reflection_prompt)) score += 6
  if (hasHumanReflectionTone(form.reflection_prompt)) score += 4
  if (parseTags(form.tagsInput).length >= 2) score += 5
  if (parseTags(form.relatedLessonIdsInput).length > 0) score += 5
  if (epistemicReview.observationPresent && epistemicReview.interpretationPresent) score += 4
  if (epistemicReview.uncertaintyVisible) score += 4
  if (epistemicReview.assumptionPromptVisible) score += 4
  if (selectivityReview.materialSignalVisible) score += 4
  if (selectivityReview.followThroughEarned) score += 4
  if (selectivityReview.restraintVisible) score += 3
  if (selectivityReview.recommendationMinimal) score += 3
  if (sustainabilityReview.sustainableCadenceVisible) score += 3
  if (sustainabilityReview.sectionCountOk) score += 3
  if (sustainabilityReview.relatedLessonCountOk) score += 3
  if (operationsReview.lowPressureCadenceVisible) score += 3
  if (operationsReview.visibleReviewLoadOk) score += 3
  if (publicationMemoryReview.memoryCueVisible) score += 3

  return Math.max(0, Math.min(100, score - Math.min(24, (
    driftHits
    + epistemicReview.overcertaintyHits
    + mechanicalHits
    + selectivityReview.overinterpretationHits
    + sustainabilityReview.frameworkCreepHits
    + operationalPressureHits
    + publicationMemoryReview.surveillanceHits
    + (sustainabilityReview.verbosityRisk ? 1 : 0)
  ) * 4)))
}

export default function DailyBriefCMSPage() {
  const [briefs, setBriefs] = useState<DailyBrief[]>([])
  const [activeBrief, setActiveBrief] = useState<DailyBrief | null>(null)
  const [form, setForm] = useState<BriefForm>(() => createEmptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    fetchBriefs()
  }, [filterCategory, filterStatus])

  const filteredBriefs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return briefs

    return briefs.filter((brief) => {
      const haystack = [
        brief.title,
        brief.summary,
        brief.category,
        ...(brief.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [briefs, searchQuery])

  const stats = useMemo(() => {
    return {
      total: briefs.length,
      published: briefs.filter((brief) => brief.is_published).length,
      premium: briefs.filter((brief) => brief.is_premium !== false).length,
      featured: briefs.find((brief) => brief.is_featured),
    }
  }, [briefs])
  const detectedThemes = useMemo(() => {
    const themeIds = extractThemeIdsFromText([
      form.title,
      form.summary,
      form.category,
      form.tagsInput,
      form.what_happened,
      form.why_it_matters,
      form.second_order_effects,
      form.risk_conditions,
      form.reflection_prompt,
      form.full_content,
    ])

    return themeIds
      .map(getThemeById)
      .filter((theme): theme is NonNullable<ReturnType<typeof getThemeById>> => Boolean(theme))
      .slice(0, 4)
  }, [form])
  const suggestedLessonIds = useMemo(() => {
    return getThemeLessonIds(detectedThemes.map((theme) => theme.id), Math.min(2, EDITORIAL_SURFACE_LIMITS.relatedLessonsMax))
  }, [detectedThemes])
  const editorialDriftHits = useMemo(() => countEditorialDriftHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' ')), [form])
  const mechanicalFramingHits = useMemo(() => countMechanicalFramingHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' ')), [form])
  const overinterpretationHits = useMemo(() => countOverinterpretationHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' ')), [form])
  const frameworkCreepHits = useMemo(() => countFrameworkCreepHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' ')), [form])
  const operationalPressureHits = useMemo(() => countOperationalPressureHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' ')), [form])
  const surveillanceMemoryHits = useMemo(() => countSurveillanceMemoryHits([
    form.title,
    form.summary,
    form.what_happened,
    form.why_it_matters,
    form.second_order_effects,
    form.risk_conditions,
    form.reflection_prompt,
    form.full_content,
  ].join(' ')), [form])
  const selectivityReview = useMemo(() => evaluateSignalSelectivity({
    ...form,
    related_lesson_ids: parseTags(form.relatedLessonIdsInput),
  }), [form])
  const sustainabilityReview = useMemo(() => evaluateEditorialSustainability({
    ...form,
    related_lesson_ids: parseTags(form.relatedLessonIdsInput),
  }), [form])
  const operationsReview = useMemo(() => evaluateOperationalCalmness({
    ...form,
    related_lesson_ids: parseTags(form.relatedLessonIdsInput),
    visible_review_count: 5,
  }), [form])
  const publicationMemoryReview = useMemo(() => evaluatePublicationMemory(form), [form])
  const epistemicReview = useMemo(() => evaluateEpistemicClarity(form), [form])
  const detailedEditorialChecks = [
    { label: 'Signal earns attention', done: selectivityReview.materialSignalVisible },
    { label: 'What changed?', done: form.what_happened.trim().length >= 80 },
    { label: 'Interpretation held lightly', done: form.why_it_matters.trim().length >= 80 },
    { label: 'Second-order effect is concrete', done: form.second_order_effects.trim().length >= 80 },
    { label: 'Uncertainty feels calm', done: form.risk_conditions.trim().length >= 80 && epistemicReview.uncertaintyVisible },
    { label: 'Follow-through is earned', done: selectivityReview.followThroughEarned },
    { label: 'Comfortable saying less', done: selectivityReview.restraintVisible },
    { label: 'Sustainable cadence', done: sustainabilityReview.sustainableCadenceVisible },
    { label: 'No density creep', done: sustainabilityReview.sectionCountOk && sustainabilityReview.relatedLessonCountOk },
    { label: 'Reflection feels human', done: isDisciplinedReflectionPrompt(form.reflection_prompt) && epistemicReview.assumptionPromptVisible && hasHumanReflectionTone(form.reflection_prompt) },
    { label: 'Recommendations are selective', done: selectivityReview.recommendationMinimal },
    { label: 'No hype/drift language', done: editorialDriftHits === 0 },
    { label: 'No false certainty', done: epistemicReview.overcertaintyHits === 0 },
    { label: 'No procedural framing', done: mechanicalFramingHits === 0 },
    { label: 'No overinterpretation', done: overinterpretationHits === 0 },
    { label: 'No framework creep', done: frameworkCreepHits === 0 && !sustainabilityReview.verbosityRisk },
    { label: 'No operational pressure', done: operationalPressureHits === 0 && operationsReview.visibleReviewLoadOk },
    { label: 'Memory stays editorial', done: publicationMemoryReview.memoryCueVisible && surveillanceMemoryHits === 0 },
  ]
  const calmReviewGroups = [
    {
      label: 'Worth publishing',
      helper: 'Signal is real enough, or quiet enough, to publish without forcing meaning.',
      done: selectivityReview.materialSignalVisible && form.what_happened.trim().length >= 80 && selectivityReview.followThroughEarned,
    },
    {
      label: 'Tone feels grounded',
      helper: 'Interpretation is light, uncertainty is visible, and reflection remains human.',
      done: form.why_it_matters.trim().length >= 80
        && form.risk_conditions.trim().length >= 80
        && epistemicReview.uncertaintyVisible
        && isDisciplinedReflectionPrompt(form.reflection_prompt)
        && hasHumanReflectionTone(form.reflection_prompt),
    },
    {
      label: 'Surface stays light',
      helper: 'Lessons, sections, and recommendations stay selective.',
      done: selectivityReview.recommendationMinimal
        && sustainabilityReview.sectionCountOk
        && sustainabilityReview.relatedLessonCountOk,
    },
    {
      label: 'No entropy signs',
      helper: 'No hype, false certainty, procedural framing, overinterpretation, or framework creep.',
      done: editorialDriftHits === 0
        && epistemicReview.overcertaintyHits === 0
        && mechanicalFramingHits === 0
        && overinterpretationHits === 0
        && frameworkCreepHits === 0
        && !sustainabilityReview.verbosityRisk,
    },
    {
      label: 'Operator energy preserved',
      helper: 'The draft can be published, delayed, or kept quiet without pressure.',
      done: operationsReview.lowPressureCadenceVisible
        && operationsReview.visibleReviewLoadOk
        && operationsReview.sectionLoadCalm
        && operationalPressureHits === 0,
    },
  ]
  const completedReviewGroups = calmReviewGroups.filter((item) => item.done).length

  async function getAuthHeaders(includeContentType = false) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('관리자 세션이 만료되었습니다. 다시 로그인해주세요.')
    }

    return {
      ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${session.access_token}`,
      'x-csrf-token': getCookie('csrf-token'),
    }
  }

  async function fetchBriefs() {
    setLoading(true)
    setError('')

    try {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams({
        category: filterCategory,
        status: filterStatus,
      })

      const response = await fetch(`/api/admin/daily-briefs?${params.toString()}`, {
        headers,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Daily Brief 목록을 불러오지 못했습니다.')
      }

      const nextBriefs = payload.briefs || []
      setBriefs(nextBriefs)

      const nextActive = activeBrief
        ? nextBriefs.find((brief: DailyBrief) => brief.id === activeBrief.id) || nextBriefs[0] || null
        : nextBriefs[0] || null

      setActiveBrief(nextActive)
      setForm(nextActive ? formFromBrief(nextActive) : createEmptyForm())
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Daily Brief 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function selectBrief(brief: DailyBrief) {
    setActiveBrief(brief)
    setForm(formFromBrief(brief))
    setPreviewMode('edit')
    setNotice('')
    setError('')
  }

  function startNewBrief() {
    setActiveBrief(null)
    setForm(createEmptyForm())
    setPreviewMode('edit')
    setNotice('')
    setError('')
  }

  function updateForm<K extends keyof BriefForm>(key: K, value: BriefForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function generateSummary() {
    const summary = buildSummaryFromMarkdown(form.full_content)

    if (!summary) {
      setError('본문을 먼저 작성하면 AI summary 초안을 만들 수 있습니다.')
      return
    }

    updateForm('summary', summary)
    setNotice('본문 기준으로 summary 초안을 생성했습니다.')
  }

  function applyStructuredTemplate() {
    const nextContent = buildStructuredMarkdown(form)
    updateForm('full_content', form.full_content.trim() ? `${nextContent}\n\n${form.full_content}` : nextContent)
    setNotice('관찰, 해석, 불확실성, 질문의 흐름을 차분한 본문 템플릿으로 적용했습니다.')
  }

  function applySuggestedLessons() {
    if (suggestedLessonIds.length === 0) {
      setError('감지된 theme이 없어 추천 lesson을 만들 수 없습니다.')
      return
    }

    const current = new Set(parseTags(form.relatedLessonIdsInput))
    suggestedLessonIds.forEach((lessonId) => current.add(lessonId))
    updateForm('relatedLessonIdsInput', Array.from(current).join(', '))
    setNotice('감지된 macro theme 기준으로 related lessons를 연결했습니다.')
  }

  async function saveBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    if (!form.title.trim() || !form.date || !form.summary.trim() || !form.full_content.trim()) {
      setError('날짜, 제목, summary, 본문은 필수입니다.')
      setSaving(false)
      return
    }

    try {
      const headers = await getAuthHeaders(true)
      const method = form.id ? 'PUT' : 'POST'
      const body = {
        id: form.id,
        date: form.date,
        title: form.title,
        summary: form.summary,
        full_content: form.full_content,
        market_sentiment: form.market_sentiment,
        category: form.category,
        tags: parseTags(form.tagsInput),
        is_premium: form.is_premium,
        is_published: form.is_published,
        is_featured: form.is_featured,
        what_happened: form.what_happened,
        why_it_matters: form.why_it_matters,
        second_order_effects: form.second_order_effects,
        risk_conditions: form.risk_conditions,
        reflection_prompt: form.reflection_prompt,
        related_lesson_ids: parseTags(form.relatedLessonIdsInput),
        editorial_quality_score: form.editorial_quality_score,
        reading_level: form.reading_level,
        scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null,
        editor_notes: form.editor_notes,
      }

      const response = await fetch('/api/admin/daily-briefs', {
        method,
        headers,
        body: JSON.stringify(body),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Daily Brief 저장에 실패했습니다.')
      }

      setActiveBrief(payload.brief)
      setForm(formFromBrief(payload.brief))
      setNotice(form.id ? 'Daily Brief가 업데이트되었습니다.' : 'Daily Brief가 생성되었습니다.')
      await fetchBriefs()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Daily Brief 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBrief(id: string) {
    if (!confirm('이 Daily Brief를 삭제하시겠습니까?')) return

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/admin/daily-briefs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Daily Brief 삭제에 실패했습니다.')
      }

      setNotice('Daily Brief가 삭제되었습니다.')
      startNewBrief()
      await fetchBriefs()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Daily Brief 삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-6 text-white lg:p-8">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
            <FileText className="h-4 w-4" />
            Daily Brief CMS
          </div>
          <h1 className="text-3xl font-bold lg:text-4xl">마켓 브리핑 운영 콘솔</h1>
          <p className="mt-3 max-w-3xl text-gray-400">
            공개/프리미엄 분리, 마크다운 원고, AI summary, 오늘의 브리핑 고정을 한 곳에서 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startNewBrief}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            새 Brief
          </button>
          <button
            type="button"
            onClick={fetchBriefs}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between text-gray-400">
            <FileText className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.18em]">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="mt-1 text-sm text-gray-500">최근 Brief</p>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between text-emerald-300">
            <Eye className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.18em]">Published</span>
          </div>
          <div className="text-2xl font-bold">{stats.published}</div>
          <p className="mt-1 text-sm text-emerald-200/60">현재 공개</p>
        </div>
        <div className="rounded-lg border border-purple-400/20 bg-purple-500/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between text-purple-300">
            <LockKeyhole className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.18em]">Premium</span>
          </div>
          <div className="text-2xl font-bold">{stats.premium}</div>
          <p className="mt-1 text-sm text-purple-200/60">멤버십 전용</p>
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between text-amber-300">
            <Star className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.18em]">Pinned</span>
          </div>
          <div className="line-clamp-1 text-lg font-bold">{stats.featured?.title || '없음'}</div>
          <p className="mt-1 text-sm text-amber-200/60">오늘의 브리핑</p>
        </div>
      </section>

      {error && (
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-white/10 bg-space-800/80">
          <div className="border-b border-white/10 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="제목, 태그, 카테고리 검색"
                className="w-full rounded-lg border border-white/10 bg-space-900 py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
                className="rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-cyan-400/50"
              >
                <option value="all">모든 카테고리</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-cyan-400/50"
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-[calc(100vh-330px)] min-h-[380px] overflow-y-auto p-3">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                불러오는 중
              </div>
            ) : filteredBriefs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-8 text-center text-gray-500">
                <FileText className="mb-3 h-8 w-8" />
                조건에 맞는 Brief가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBriefs.map((brief) => {
                  const isActive = activeBrief?.id === brief.id

                  return (
                    <button
                      type="button"
                      key={brief.id}
                      onClick={() => selectBrief(brief)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        isActive
                          ? 'border-cyan-400/50 bg-cyan-500/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {brief.date}
                        </span>
                        {brief.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                            <Star className="h-3 w-3" />
                            Today
                          </span>
                        )}
                        {isScheduledForFuture(brief.scheduled_for) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">
                            <CalendarDays className="h-3 w-3" />
                            Scheduled
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 font-semibold text-white">{brief.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">{brief.summary}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${SENTIMENT_STYLES[brief.market_sentiment || 'neutral']}`}>
                          {brief.market_sentiment || 'neutral'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                          {brief.category || 'market'}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                          brief.is_premium !== false
                            ? 'border-purple-400/30 bg-purple-500/10 text-purple-200'
                            : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                        }`}>
                          {brief.is_premium !== false ? <LockKeyhole className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}
                          {brief.is_premium !== false ? 'Premium' : 'Public'}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                          brief.is_published
                            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-gray-400/20 bg-gray-500/10 text-gray-300'
                        }`}>
                          {brief.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {brief.is_published
                            ? isScheduledForFuture(brief.scheduled_for)
                              ? '예약'
                              : '공개'
                            : '초안'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        <form onSubmit={saveBrief} className="rounded-lg border border-white/10 bg-space-800/80">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
                {form.id ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {form.id ? 'Brief 수정' : 'Brief 작성'}
              </div>
              <h2 className="mt-1 text-xl font-bold">{form.title || '새 Daily Brief'}</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.id && (
                <button
                  type="button"
                  onClick={() => deleteBrief(form.id as string)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-400/40 bg-purple-500/20 px-5 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                저장
              </button>
            </div>
          </div>

          <div className="grid gap-6 p-5 2xl:grid-cols-[minmax(0,1.1fr)_360px]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">날짜</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm('date', event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-white outline-none focus:border-cyan-400/50"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">제목</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                    placeholder="예: 물가 기대 변화와 유동성 조건 재점검"
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50"
                  />
                </label>
              </div>

              <label className="block rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                  <CalendarDays className="h-4 w-4 text-cyan-300" />
                  예약 발행 시간
                </span>
                <input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(event) => updateForm('scheduled_for', event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-white outline-none focus:border-cyan-400/50"
                />
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  공개 상태여도 예약 시간이 미래라면 Reader에는 노출되지 않습니다.
                </p>
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">카테고리</span>
                  <select
                    value={form.category}
                    onChange={(event) => updateForm('category', event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-white outline-none focus:border-cyan-400/50"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">Context tone</span>
                  <select
                    value={form.market_sentiment}
                    onChange={(event) => updateForm('market_sentiment', event.target.value as Sentiment)}
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Tags className="h-4 w-4" />
                    태그
                  </span>
                  <input
                    value={form.tagsInput}
                    onChange={(event) => updateForm('tagsInput', event.target.value)}
                    placeholder="inflation, liquidity, AI"
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateForm('is_published', !form.is_published)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    form.is_published
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                      : 'border-white/10 bg-white/[0.03] text-gray-300'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">공개 상태</span>
                    <span className="text-xs opacity-70">{form.is_published ? '사이트에 노출' : '초안 저장'}</span>
                  </span>
                  {form.is_published ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => updateForm('is_premium', !form.is_premium)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    form.is_premium
                      ? 'border-purple-400/30 bg-purple-500/10 text-purple-100'
                      : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">접근 범위</span>
                    <span className="text-xs opacity-70">{form.is_premium ? '멤버십 전용' : '무료 공개'}</span>
                  </span>
                  {form.is_premium ? <LockKeyhole className="h-5 w-5" /> : <Globe2 className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => updateForm('is_featured', !form.is_featured)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    form.is_featured
                      ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                      : 'border-white/10 bg-white/[0.03] text-gray-300'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">오늘의 브리핑</span>
                    <span className="text-xs opacity-70">{form.is_featured ? '상단 고정' : '일반 노출'}</span>
                  </span>
                  <Star className="h-5 w-5" />
                </button>
              </div>

              <section className="rounded-lg border border-cyan-400/20 bg-cyan-500/[0.06] p-4">
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                      <Bot className="h-4 w-4" />
                      AI Summary 영역
                    </div>
                    <p className="mt-1 text-sm text-cyan-100/60">공개 미리보기와 요약 카드에 쓰이는 핵심 문장입니다.</p>
                  </div>
                  <button
                    type="button"
                    onClick={generateSummary}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    초안 생성
                  </button>
                </div>
                <textarea
                  value={form.summary}
                  onChange={(event) => updateForm('summary', event.target.value)}
                  rows={4}
                  placeholder="3줄 이내로 시장 맥락, 핵심 리스크, 행동 기준을 요약하세요."
                  className="w-full resize-y rounded-lg border border-cyan-400/20 bg-space-900/80 px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/60"
                />
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
	                  <div>
	                    <h3 className="text-lg font-semibold">Editorial trust rhythm</h3>
	                    <p className="mt-1 text-sm text-gray-500">
	                      구조는 내부 기준으로 유지하되, 독자에게는 자연스러운 판단 흐름처럼 읽히게 만듭니다.
	                    </p>
	                    <div className="mt-3 flex flex-wrap gap-2">
	                      {EPISTEMIC_BRIEF_STRUCTURE.map((layer) => (
	                        <span key={layer.field} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-gray-400">
	                          {layer.title}
	                        </span>
	                      ))}
	                    </div>
	                  </div>
                  <button
                    type="button"
                    onClick={applyStructuredTemplate}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
                  >
                    <FileText className="h-4 w-4" />
                    본문 템플릿 적용
                  </button>
                </div>

                <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.045] p-4">
                    <p className="text-sm font-semibold text-cyan-100">Detected intelligence themes</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detectedThemes.length > 0 ? detectedThemes.map((theme) => (
                        <span key={theme.id} className="rounded-full border border-cyan-300/20 bg-black/20 px-2.5 py-1 text-xs text-cyan-50">
                          {theme.label}
                        </span>
                      )) : (
                        <span className="text-xs leading-5 text-gray-500">본문과 구조 필드를 채우면 macro theme이 감지됩니다.</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={applySuggestedLessons}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.12]"
                    >
                      <Tags className="h-3.5 w-3.5" />
                      Related lessons 연결
                    </button>
                    {suggestedLessonIds.length > 0 && (
                      <p className="mt-2 text-xs leading-5 text-gray-500">{suggestedLessonIds.join(', ')}</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.045] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-amber-100">Calm editorial review</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {completedReviewGroups}/{calmReviewGroups.length} quiet checks complete. Publish only if the draft feels worth the reader's attention.
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-300/20 bg-black/20 px-2.5 py-1 text-xs text-amber-100">
                        low-pressure
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {calmReviewGroups.map((item) => (
                        <div key={item.label} className="flex items-start gap-2 text-xs text-gray-300">
                          <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${item.done ? 'text-emerald-300' : 'text-gray-600'}`} />
                          <div>
                            <p className="font-medium text-gray-200">{item.label}</p>
                            <p className="mt-0.5 leading-5 text-gray-500">{item.helper}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <details className="mt-4 border-t border-white/10 pt-3">
                      <summary className="cursor-pointer text-xs font-medium text-gray-500">
                        Technical signals
                      </summary>
                      <div className="mt-3 grid gap-2">
                        {detailedEditorialChecks.map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-xs text-gray-400">
                            <CheckCircle2 className={`h-3.5 w-3.5 ${item.done ? 'text-emerald-300' : 'text-gray-600'}`} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-gray-500">
                        Limits: 0-2 related lessons, one reflection prompt, one continuity cue, {sustainabilityReview.sectionCount || 0}/6 article sections. Pressure hits: {operationalPressureHits}. Framework hits: {frameworkCreepHits}. Memory cues: {publicationMemoryReview.memoryCueCount}. Surveillance hits: {surveillanceMemoryHits}.
                      </p>
                    </details>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
	                  <label className="block">
	                    <span className="mb-2 block text-sm font-medium text-gray-300">1. What changed</span>
	                    <textarea
	                      value={form.what_happened}
	                      onChange={(event) => updateForm('what_happened', event.target.value)}
	                      rows={4}
	                      placeholder="관찰 가능한 변화, 데이터, 정책, 자금 흐름을 먼저 정리하세요. 해석은 다음 칸에 둡니다."
	                      className="w-full resize-y rounded-lg border border-white/10 bg-space-900 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
	                    />
	                  </label>
	                  <label className="block">
	                    <span className="mb-2 block text-sm font-medium text-gray-300">2. Why it may matter</span>
	                    <textarea
	                      value={form.why_it_matters}
	                      onChange={(event) => updateForm('why_it_matters', event.target.value)}
	                      rows={4}
	                      placeholder="이 관찰이 왜 중요할 수 있는지 설명하세요. 단정 대신 가능성과 조건을 남깁니다."
	                      className="w-full resize-y rounded-lg border border-white/10 bg-space-900 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
	                    />
	                  </label>
	                  <label className="block">
	                    <span className="mb-2 block text-sm font-medium text-gray-300">3. What could change next</span>
	                    <textarea
	                      value={form.second_order_effects}
	                      onChange={(event) => updateForm('second_order_effects', event.target.value)}
	                      rows={4}
	                      placeholder="정말 달라질 수 있는 행동, 정책 반응, 자본 배분만 적으세요. 약한 신호라면 크게 달라진 것이 없다고 써도 됩니다."
	                      className="w-full resize-y rounded-lg border border-white/10 bg-space-900 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
	                    />
	                  </label>
	                  <label className="block">
	                    <span className="mb-2 block text-sm font-medium text-gray-300">4. What remains unclear</span>
	                    <textarea
	                      value={form.risk_conditions}
	                      onChange={(event) => updateForm('risk_conditions', event.target.value)}
	                      rows={4}
	                      placeholder="아직 불확실한 점, 이 해석이 약해지는 조건, 조용히 넘겨도 되는 배경 소음을 적으세요."
	                      className="w-full resize-y rounded-lg border border-white/10 bg-space-900 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
	                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="block">
	                    <span className="mb-2 block text-sm font-medium text-gray-300">5. Question to carry forward</span>
                    <input
                      value={form.reflection_prompt}
                      onChange={(event) => updateForm('reflection_prompt', event.target.value)}
	                      placeholder="What feels less certain now?"
                      className="w-full rounded-lg border border-amber-300/20 bg-space-900 px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-amber-300/50"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DEFAULT_REFLECTION_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => updateForm('reflection_prompt', prompt)}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-gray-300 transition hover:border-amber-300/30 hover:text-white"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-300">Editorial quality</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.editorial_quality_score}
                      onChange={(event) => updateForm('editorial_quality_score', Number(event.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateForm('editorial_quality_score', calculateEditorialQuality(form))
	                        setNotice('신뢰도, 불확실성, 인간적인 reflection tone, related lessons 기준으로 품질 점수를 계산했습니다.')
                      }}
                      className="mt-2 inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/[0.08]"
                    >
                      품질 점수 계산
                    </button>
	                    <p className="mt-2 text-xs leading-5 text-gray-500">출처 명확성, 관찰/해석 분리, 차분한 불확실성, 인간적인 reflection 기준.</p>
                  </label>
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Markdown 본문</h3>
                    <p className="mt-1 text-sm text-gray-500">제목, 리스트, 굵은 글씨, 인라인 코드를 미리보기로 확인할 수 있습니다.</p>
                  </div>
                  <div className="inline-flex rounded-lg border border-white/10 bg-space-900 p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('edit')}
                      className={`rounded-md px-3 py-1.5 text-sm transition ${
                        previewMode === 'edit' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      작성
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('preview')}
                      className={`rounded-md px-3 py-1.5 text-sm transition ${
                        previewMode === 'preview' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      미리보기
                    </button>
                  </div>
                </div>

                {previewMode === 'edit' ? (
                  <textarea
                    value={form.full_content}
                    onChange={(event) => updateForm('full_content', event.target.value)}
                    rows={20}
                    placeholder={`## What changed\n\n- 핵심 변화\n- 확인된 신호\n\n## What remains unclear\n\n차분하게 더 지켜볼 조건을 작성하세요.`}
                    className="min-h-[520px] w-full resize-y rounded-lg border border-white/10 bg-space-900 px-4 py-4 font-mono text-sm leading-7 text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50"
                  />
                ) : (
                  <div
                    className="min-h-[520px] rounded-lg border border-white/10 bg-space-900 px-5 py-4"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(form.full_content || '미리볼 본문이 없습니다.') }}
                  />
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  발행 체크
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-400">필수 필드</span>
                    <span className={form.title && form.summary && form.full_content ? 'text-emerald-300' : 'text-amber-300'}>
                      {form.title && form.summary && form.full_content ? '완료' : '작성 필요'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-400">공개 범위</span>
                    <span className="text-gray-200">{form.is_premium ? 'Premium' : 'Public'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-400">사이트 노출</span>
                    <span className={form.is_published ? 'text-emerald-300' : 'text-gray-400'}>
                      {form.is_published
                        ? form.scheduled_for && new Date(form.scheduled_for).getTime() > Date.now()
                          ? '예약'
                          : '공개'
                        : '초안'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-400">상단 고정</span>
                    <span className={form.is_featured ? 'text-amber-300' : 'text-gray-400'}>
                      {form.is_featured ? '오늘의 브리핑' : '일반'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
	                    <span className="text-gray-400">판단 흐름</span>
                    <span className={
                      form.what_happened && form.why_it_matters && form.second_order_effects && form.risk_conditions && form.reflection_prompt
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }>
                      {form.what_happened && form.why_it_matters && form.second_order_effects && form.risk_conditions && form.reflection_prompt ? '완료' : '작성 필요'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Flame className="h-4 w-4 text-orange-300" />
                  추천 학습 연결
                </div>
                <p className="text-sm leading-6 text-gray-400">
                  Brief의 태그, 카테고리, lesson id는 reader와 dashboard의 추천 학습 섹션에 연결됩니다.
                </p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-500">Related lesson ids</span>
                  <input
                    value={form.relatedLessonIdsInput}
                    onChange={(event) => updateForm('relatedLessonIdsInput', event.target.value)}
                    placeholder="macro-foundations-rates, risk-thinking-second-order"
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-500">Reading level</span>
                  <select
                    value={form.reading_level}
                    onChange={(event) => updateForm('reading_level', event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-space-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-cyan-400/50"
                  >
                    <option value="foundational">Foundational</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  {parseTags(form.tagsInput).length > 0 ? (
                    parseTags(form.tagsInput).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">태그를 입력하면 여기에 표시됩니다.</span>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Edit2 className="h-4 w-4 text-amber-300" />
                  Editorial notes
                </div>
                <textarea
                  value={form.editor_notes}
                  onChange={(event) => updateForm('editor_notes', event.target.value)}
                  rows={5}
                  placeholder="출처 검토, 다음 업데이트, 품질 체크 메모"
                  className="w-full resize-y rounded-lg border border-white/10 bg-space-900 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/50"
                />
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  사용자 노출 미리보기
                </div>
                <div className="rounded-lg border border-white/10 bg-space-900 p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                      {form.category}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${SENTIMENT_STYLES[form.market_sentiment]}`}>
                      {form.market_sentiment}
                    </span>
                    {form.is_featured && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                        Today
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold leading-7">{form.title || '브리핑 제목'}</h3>
                  <p className="mt-3 line-clamp-5 text-sm leading-6 text-gray-400">
                    {form.summary || 'AI summary가 여기에 표시됩니다.'}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    {form.is_premium ? <LockKeyhole className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
                    {form.is_premium ? '멤버십 콘텐츠' : '전체 공개 콘텐츠'}
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}
