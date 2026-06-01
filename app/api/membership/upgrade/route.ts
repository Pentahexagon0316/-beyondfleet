import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, requestedTier } = await request.json()

    if (!userId || !requestedTier) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Update profile membership_tier in database
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ membership_tier: requestedTier })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    // Update metadata inside supabase auth table
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { membership_tier: requestedTier } }
    )

    if (authError) {
      console.warn('Auth user metadata update failed:', authError)
    }

    return NextResponse.json({
      success: true,
      message: `${requestedTier} 등급으로 정상 업그레이드 되었습니다.`,
    })
  } catch (error: any) {
    console.error('Upgrade API error:', error)
    return NextResponse.json(
      { error: error?.message || '업그레이드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
