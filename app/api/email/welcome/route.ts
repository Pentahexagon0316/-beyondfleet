import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/email/welcome
 * Sends a welcome email to a newly registered user.
 * Called from auth callback or manually triggered.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get display name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    const displayName = profile?.display_name || user.email.split('@')[0]

    const result = await sendWelcomeEmail(user.email, displayName)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      emailId: result.id,
      message: `Welcome email sent to ${user.email}`,
    })
  } catch (error) {
    console.error('[API] Welcome email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
