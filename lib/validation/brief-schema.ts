import { z } from 'zod'

export const BriefSchema = z.object({
  title: z.string().trim().min(5).max(200),
  content: z.string().trim().min(20),
  category: z.string().trim().min(1).max(80),
  confidence: z.number().min(0).max(1),
})

export const DailyBriefCmsSchema = z.object({
  date: z.string().trim().min(8),
  title: z.string().trim().min(5).max(200),
  summary: z.string().trim().min(20).max(600),
  full_content: z.string().trim().min(20),
  category: z.string().trim().min(1).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  is_premium: z.boolean().default(false),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  what_happened: z.string().trim().max(1200).optional(),
  why_it_matters: z.string().trim().max(1200).optional(),
  second_order_effects: z.string().trim().max(1200).optional(),
  risk_conditions: z.string().trim().max(1200).optional(),
  reflection_prompt: z.string().trim().max(220).optional(),
  related_lesson_ids: z.array(z.string().trim().min(1).max(80)).max(2).default([]),
  editorial_quality_score: z.number().int().min(0).max(100).optional(),
  reading_level: z.string().trim().max(40).optional(),
  scheduled_for: z.string().datetime().nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  editor_notes: z.string().trim().max(4000).optional(),
})

export type BriefInput = z.infer<typeof BriefSchema>
export type DailyBriefCmsInput = z.infer<typeof DailyBriefCmsSchema>
