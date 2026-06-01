import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Send welcome email for newly created users (created within last 60 seconds)
    if (data?.user) {
      const createdAt = new Date(data.user.created_at).getTime()
      const now = Date.now()
      const isNewUser = now - createdAt < 60_000

      if (isNewUser) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
          await fetch(`${baseUrl}/api/email/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id }),
          })
        } catch (err) {
          // Non-critical: log but don't block auth flow
          console.error('[Auth Callback] Welcome email trigger failed:', err)
        }
      }
    }
  }

  // Redirect to home page after successful auth
  return NextResponse.redirect(new URL('/', request.url))
}
