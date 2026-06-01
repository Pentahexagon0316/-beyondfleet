import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/security/rate-limiter'
import { generateCSRFToken, CSRF_TOKEN_NAME, CSRF_HEADER_NAME } from '@/lib/security/csrf'
import { isUpstashRateLimitConfigured, limitRequest } from '@/lib/rate-limit'
import { applySecurityHeaders } from './middleware/security-headers'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Block access to Web3 / NFT routes in production/active state
  if (
    pathname.startsWith('/nft') || 
    pathname.startsWith('/api/nft') || 
    pathname.startsWith('/api/solana')
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const response = NextResponse.next()

  // Apply security headers to all responses
  applySecurityHeaders(response)

  // Only apply rate limiting and CSRF to API routes
  if (pathname.startsWith('/api')) {
    // Determine rate limit config based on endpoint
    const rateLimitConfig = getRateLimitConfig(pathname)
    const clientIP = getClientIP(request)
    const rateLimitKey = `${clientIP}:${pathname.split('/').slice(0, 4).join('/')}`

    const result = isUpstashRateLimitConfigured()
      ? await limitRequest(rateLimitKey)
      : rateLimit(rateLimitKey, rateLimitConfig)
    const limit = 'limit' in result ? result.limit : rateLimitConfig.maxRequests
    const resetTime = 'reset' in result ? Number(result.reset) : result.resetTime
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000))
          }
        }
      )
    }

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))

    // CSRF validation for mutating requests (POST, PUT, DELETE, PATCH)
    const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    if (mutatingMethods.includes(request.method)) {
      // Skip CSRF for certain endpoints (auth, cron, webhooks)
      const csrfExempt = ['/api/auth', '/api/cron', '/api/webhook']
      const isExempt = csrfExempt.some(prefix => pathname.startsWith(prefix))

      if (!isExempt) {
        const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
        const headerToken = request.headers.get(CSRF_HEADER_NAME)

        if (!cookieToken || !headerToken || !constantTimeCompare(cookieToken, headerToken)) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          )
        }
      }
    }
  }

  // Set CSRF token cookie if not present
  if (!request.cookies.has(CSRF_TOKEN_NAME)) {
    const token = generateCSRFToken()
    response.cookies.set(CSRF_TOKEN_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24
    })
  }

  return response
}

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith('/api/auth')) {
    return RATE_LIMITS.auth
  }
  if (pathname.startsWith('/api/ai')) {
    return RATE_LIMITS.ai
  }
  if (pathname.startsWith('/api/whale')) {
    return RATE_LIMITS.whale
  }
  if (pathname.startsWith('/api/cron')) {
    return RATE_LIMITS.cron
  }
  return RATE_LIMITS.default
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
