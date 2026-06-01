import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.coingecko.com https://min-api.cryptocompare.com https://api.whale-alert.io https://api.anthropic.com https://api.openai.com wss://*.supabase.co wss://stream.binance.com wss://*.walletconnect.com https://*.walletconnect.com wss://*.walletconnect.org https://*.walletconnect.org wss://*.bridge.walletconnect.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspDirectives)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
}

export function securityHeaders(_request: NextRequest) {
  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
}
