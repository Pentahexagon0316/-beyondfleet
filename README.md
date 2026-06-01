# BeyondFleet

BeyondFleet is an AI-native macro learning and reflective intelligence platform.

The product is designed to help people build better judgment in an uncertain
world through a simple daily loop:

```text
Daily Brief -> Learning Path -> Reflection -> Return Tomorrow
```

It is not a crypto hype platform, trading signal product, NFT marketplace, or
casino-style dashboard. The experience should feel calm, editorial,
trustworthy, and useful for long-term thinking.

## Product Principles

- Help users think better, not react faster.
- Prioritize learning, reflection, risk awareness, and judgment.
- Treat achievements as meaningful records of growth and contribution.
- Keep the MVP focused on Daily Briefs, Learning Paths, Reflection, and return behavior.
- Avoid speculative language, noisy trading UI, hype mechanics, and attention extraction.

## Current Product Surfaces

- `app/page.tsx` - focused homepage for the daily judgment loop.
- `app/briefs/page.tsx` - Daily Brief reader with reflection-oriented UX.
- `app/admin/briefs/page.tsx` - Daily Brief CMS for editorial operations.
- `app/learn/page.tsx` - track-based learning workspace.
- `app/learn/[id]/page.tsx` - lesson reader and completion tracking.
- `app/dashboard/page.tsx` - personal intelligence workspace.
- `app/api/recommendations/route.ts` - lightweight personalization and recommendation API.
- `lib/client/beyondfleet-sync.ts` - guest to authenticated persistence sync.
- `lib/personalization/recommendation-engine.ts` - scoring and routing logic.
- `supabase/migrations/` - database schema evolution.

## Architecture Overview

BeyondFleet is built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Vercel deployment

Key data systems:

- Daily Brief CMS and public reader
- Reflection persistence
- Saved assumptions
- Reading completion tracking
- Learning progress, XP, level, and streak state
- Saved lessons and recent learning items
- Recommendation and personalization scoring

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system notes.
See [docs/CONTENT_OPERATIONS.md](docs/CONTENT_OPERATIONS.md) for Daily Brief and reflection editorial standards.

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build locally before opening a pull request:

```bash
npm run build
```

Run repository safety checks:

```bash
npm run check:repo
```

## Environment Variables

Never commit `.env.local`, production secrets, Supabase service role keys, or
private API credentials.

Required for normal app behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BASE_URL`

Required for server-side admin, recommendations, and automation:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `CRON_SECRET`

Optional integrations:

- `WHALE_ALERT_API_KEY`
- `RESEND_API_KEY`
- `SOLANA_RPC_URL`
- `TREASURY_WALLET`
- `AUCTION_HOUSE_ADDRESS`
- `SELLER_FEE_BASIS_POINTS`

Use `.env.example` as the canonical template.

## Supabase Requirements

Apply migrations in order from `supabase/migrations/`.

The current MVP depends on the 2026 migrations for:

- Daily Brief CMS fields and publishing controls
- Learning progress and stats
- Personalization inputs
- Reflection, assumption, and reading completion persistence

Production databases must keep RLS policies enabled and should use the service
role key only from trusted server routes, Supabase functions, Vercel
environment variables, or secure automation.

## Git Workflow

The intended branch strategy is lightweight:

```text
main      -> production-ready stable branch
develop   -> active integration branch
feature/* -> isolated feature work
```

Commit messages should describe product evolution:

```text
feat: add reflection persistence sync
refactor: migrate lesson progress to learning_progress
fix: prevent scheduled briefs from recommendations
style: reduce motion transitions globally
docs: document repository workflow
```

See [docs/REPOSITORY_WORKFLOW.md](docs/REPOSITORY_WORKFLOW.md).

## Deployment

Expected production flow:

```text
GitHub push -> Vercel preview deploy -> review -> production deploy
```

Production deploys should come from `main`. Preview deploys can come from
`develop` and `feature/*` branches.

See [docs/OPERATIONS.md](docs/OPERATIONS.md) for release, rollback, and
environment safety notes.

## AI-Assisted Development

This repository should remain friendly to Codex, ChatGPT, Claude, and future AI
development agents:

- Keep feature code modular and predictably named.
- Prefer explicit types and stable data contracts.
- Avoid hidden coupling between UI, localStorage, and Supabase writes.
- Document strategic systems before they become hard to change.
- Keep work scoped to the product loop unless a broader change is intentional.

See [docs/AI_DEVELOPMENT.md](docs/AI_DEVELOPMENT.md).

## Product Safety Checklist

Before shipping user-facing changes, verify:

- Scheduled briefs are hidden until `scheduled_for`.
- Premium fields are gated consistently.
- Guest data survives login transition.
- Learning progress updates dashboard state.
- Reflection and saved assumptions persist.
- Missing Supabase data falls back gracefully.
- Reduced-motion users are not exposed to heavy animation.
- Mobile reading and dashboard layouts remain comfortable.

## License

Private product repository unless a separate license is added.
