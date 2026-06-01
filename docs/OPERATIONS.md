# Operations and Deployment

This document captures the minimum operational discipline needed for
BeyondFleet to remain reliable as the product grows.

## Deployment Flow

Expected flow:

```text
GitHub push -> Vercel preview deploy -> review -> production deploy
```

Recommended branch mapping:

- `main` deploys to production.
- `develop` and `feature/*` deploy to previews.

Production deploys should not depend on local machine state. All required
environment variables must be configured in Vercel and Supabase.

## Required Vercel Environment Variables

Public:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BASE_URL`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional:

- `WHALE_ALERT_API_KEY`
- `RESEND_API_KEY`
- `SOLANA_RPC_URL`
- `TREASURY_WALLET`
- `AUCTION_HOUSE_ADDRESS`
- `SELLER_FEE_BASIS_POINTS`

Never expose service keys with a `NEXT_PUBLIC_` prefix.

## Supabase Release Order

When a feature requires database changes:

1. Add an additive migration under `supabase/migrations/`.
2. Apply the migration to staging or preview database.
3. Deploy preview branch.
4. Validate affected flows.
5. Apply migration to production.
6. Deploy production code from `main`.

Avoid removing columns or changing semantics in the same release that introduces
new code. Use two-step migrations for destructive changes.

## Core Runtime Checks

After a deploy, verify:

- `/`
- `/briefs`
- `/learn`
- `/dashboard`
- `/admin/briefs`
- `/api/recommendations`

Product loop check:

```text
Landing -> Read Brief -> Start Learning -> Save Reflection -> Dashboard -> Continue Learning
```

## Scheduled Brief Safety

Daily Brief visibility rules:

- `is_published = false` stays hidden.
- Future `scheduled_for` stays hidden.
- Featured brief selection must not surface future content.
- Recommendation API must not recommend future scheduled briefs.

## Persistence Safety

Guest and authenticated state should be treated as a continuity problem:

- Local guest records should not be lost on login.
- Supabase sync should be best-effort.
- Failed sync should keep user-visible local state.
- Dashboard should tolerate missing cloud rows.

## Rollback Plan

If a production deploy fails:

1. Roll Vercel back to the previous successful deployment.
2. If the issue is code-only, revert the offending PR.
3. If the issue is data-related, stop scheduled jobs before further writes.
4. Apply forward-fix migrations only when rollback is not possible.

Because Supabase migrations are harder to reverse than Vercel deploys, prefer
additive schema changes and feature flags or safe fallbacks.

## Monitoring Priorities

Short-term:

- Build status
- Vercel runtime errors
- Supabase API failures
- Brief generation failures
- Recommendation API errors
- Reflection sync failures

Product-quality signals:

- Daily brief reads
- Reading completion rate
- Reflection saves
- Lesson completions
- Return next day behavior

## Accessibility and Motion

Reduced-motion support is part of production safety. Ambient motion should
respect `prefers-reduced-motion`, and the reading experience should never rely
on animation to be understandable.
