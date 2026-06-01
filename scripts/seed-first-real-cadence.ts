import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  evaluateFirstRealPublicationCadence,
  getFirstRealCadenceCmsPayloads,
} from '../lib/content/first-real-publication-cadence'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split('\n')
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const splitIndex = trimmed.indexOf('=')
    if (splitIndex === -1) return

    const key = trimmed.slice(0, splitIndex).trim()
    const value = trimmed.slice(splitIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  })
}

async function main() {
  loadLocalEnv()

  const shouldWrite = process.argv.includes('--write')
  const report = evaluateFirstRealPublicationCadence()
  const payloads = getFirstRealCadenceCmsPayloads()

  console.log(JSON.stringify({
    mode: shouldWrite ? 'write' : 'dry-run',
    report,
    payloads: payloads.map((payload) => ({
      date: payload.date,
      title: payload.title,
      is_published: payload.is_published,
      is_featured: payload.is_featured,
      scheduled_for: payload.scheduled_for,
      related_lesson_ids: payload.related_lesson_ids,
      editorial_quality_score: payload.editorial_quality_score,
    })),
  }, null, 2))

  if (report.issues.length > 0) {
    process.exit(1)
  }

  if (!shouldWrite) {
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --write')
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  for (const payload of payloads) {
    if (payload.is_featured) {
      const { error: clearError } = await supabase
        .from('daily_briefs')
        .update({ is_featured: false, updated_at: new Date().toISOString() })
        .eq('is_featured', true)

      if (clearError) throw clearError
    }

    const { data: existing, error: existingError } = await supabase
      .from('daily_briefs')
      .select('id')
      .eq('date', payload.date)
      .maybeSingle()

    if (existingError) throw existingError

    if (existing?.id) {
      const { error } = await supabase
        .from('daily_briefs')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) throw error
      console.log(`updated ${payload.date}: ${payload.title}`)
      continue
    }

    const { error } = await supabase
      .from('daily_briefs')
      .insert(payload)

    if (error) throw error
    console.log(`inserted ${payload.date}: ${payload.title}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
