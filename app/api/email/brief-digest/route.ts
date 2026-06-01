import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDailyBriefDigest } from '@/lib/email/email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/email/brief-digest
 * Sends daily brief digest to all subscribers.
 * Triggered by Vercel Cron or manual call.
 *
 * Requires CRON_SECRET header for production security.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    const cronSecret = request.headers.get('x-cron-secret')
    if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Get today's brief
    const body = await request.json().catch(() => ({}))
    const briefTitle = body.briefTitle || '오늘의 시장 브리프'
    const briefSummary = body.briefSummary || '오늘의 핵심 시장 동향과 분석을 확인하세요.'
    const marketSignals = body.marketSignals || []

    // Get users who opted in for email notifications
    const { data: subscribers, error: subError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('email_brief_digest', true)

    // If notification_preferences table doesn't exist, fall back to all users
    let userIds: string[] = []

    if (subError || !subscribers?.length) {
      // Fallback: get all active users (limited for safety)
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 50 })
      userIds = users.filter(u => u.email).map(u => u.id)
    } else {
      userIds = subscribers.map(s => s.user_id)
    }

    if (userIds.length === 0) {
      return NextResponse.json({ message: 'No subscribers to notify', sent: 0 })
    }

    // Get user emails
    const results: Array<{ email: string; success: boolean; error?: string }> = []

    for (const userId of userIds) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        if (!user?.email) continue

        const result = await sendDailyBriefDigest(
          user.email,
          briefTitle,
          briefSummary,
          marketSignals,
        )

        results.push({
          email: user.email,
          success: result.success,
          error: result.error,
        })
      } catch (err) {
        console.error(`[BriefDigest] Error for user ${userId}:`, err)
      }
    }

    const sentCount = results.filter(r => r.success).length

    return NextResponse.json({
      message: `Brief digest sent to ${sentCount}/${results.length} subscribers`,
      sent: sentCount,
      total: results.length,
    })
  } catch (error) {
    console.error('[API] Brief digest error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
