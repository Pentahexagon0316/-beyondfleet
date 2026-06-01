/**
 * BeyondFleet Email Service
 * Server-side email sending via Resend
 */

import { Resend } from 'resend'
import {
  welcomeEmailTemplate,
  tierUpgradeEmailTemplate,
  dailyBriefDigestTemplate,
  weeklySummaryTemplate,
} from './templates'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not configured')
    _resend = new Resend(key)
  }
  return _resend
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'BeyondFleet <noreply@beyondfleet.io>'

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send welcome email to new member
 */
export async function sendWelcomeEmail(
  to: string,
  displayName: string,
): Promise<EmailResult> {
  try {
    const { subject, html } = welcomeEmailTemplate(displayName)

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Welcome email failed:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Welcome email sent to ${to}, id: ${data?.id}`)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Welcome email error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Send tier upgrade notification email
 */
export async function sendTierUpgradeEmail(
  to: string,
  displayName: string,
  newTier: string,
  newTierLabel: string,
  benefits: string[],
): Promise<EmailResult> {
  try {
    const { subject, html } = tierUpgradeEmailTemplate(displayName, newTier, newTierLabel, benefits)

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Tier upgrade email failed:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Tier upgrade email sent to ${to}, id: ${data?.id}`)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Tier upgrade email error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Send daily brief digest email
 */
export async function sendDailyBriefDigest(
  to: string,
  briefTitle: string,
  briefSummary: string,
  marketSignals: Array<{ symbol: string; change: string; up: boolean }>,
): Promise<EmailResult> {
  try {
    const { subject, html } = dailyBriefDigestTemplate(briefTitle, briefSummary, marketSignals)

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Brief digest email failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Brief digest email error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummary(
  to: string,
  displayName: string,
  stats: {
    briefsRead: number
    lessonsCompleted: number
    reflections: number
    streak: number
    totalXp: number
  },
): Promise<EmailResult> {
  try {
    const { subject, html } = weeklySummaryTemplate(displayName, stats)

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Weekly summary email failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Weekly summary email error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
