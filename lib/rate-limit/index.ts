import { Redis } from '@upstash/redis/cloudflare'
import { Ratelimit } from '@upstash/ratelimit'

const DEFAULT_LIMIT = 20
const DEFAULT_WINDOW = '1 m'

let cachedRatelimit: Ratelimit | null | undefined

export function isUpstashRateLimitConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export function getUpstashRatelimit() {
  if (cachedRatelimit !== undefined) return cachedRatelimit

  if (!isUpstashRateLimitConfigured()) {
    cachedRatelimit = null
    return cachedRatelimit
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  })

  cachedRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(DEFAULT_LIMIT, DEFAULT_WINDOW),
    analytics: true,
  })

  return cachedRatelimit
}

export const ratelimit = getUpstashRatelimit()

export async function limitRequest(identifier: string) {
  const limiter = getUpstashRatelimit()

  if (!limiter) {
    return {
      success: true,
      limit: DEFAULT_LIMIT,
      remaining: DEFAULT_LIMIT,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
      reason: 'upstash-not-configured' as const,
    }
  }

  return limiter.limit(identifier)
}
