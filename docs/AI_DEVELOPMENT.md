# AI-Assisted Development Guide

BeyondFleet is expected to be developed with help from Codex, ChatGPT, Claude,
and future AI coding agents. The repository should make that safe.

## Working Principles

- Keep the core product loop visible in code and documentation.
- Make data flow explicit.
- Prefer typed objects and named helpers over hidden side effects.
- Keep localStorage keys stable and documented.
- Keep Supabase table names aligned with feature names.
- Avoid speculative refactors during product passes.
- Preserve guest, authenticated, and missing-data behavior.

## Safe AI Task Shape

Good task scopes:

- Add a field to Daily Brief CMS and reader.
- Connect one dashboard module to existing persisted state.
- Add one recommendation signal.
- Add one Supabase migration and update the exact surfaces that depend on it.
- Improve one product flow with build verification.

Risky task scopes:

- Rewrite all auth and persistence at once.
- Change table semantics without a migration plan.
- Mix visual redesign with schema changes and recommendation logic.
- Replace fallback behavior without testing guest mode.

## Context to Read First

For product direction:

- `README.md`
- `docs/ARCHITECTURE.md`

For workflow:

- `docs/REPOSITORY_WORKFLOW.md`
- `.github/pull_request_template.md`

For operational safety:

- `docs/OPERATIONS.md`

For current implementation:

- `app/briefs/page.tsx`
- `app/learn/page.tsx`
- `app/learn/[id]/page.tsx`
- `app/dashboard/page.tsx`
- `lib/client/beyondfleet-sync.ts`
- `lib/personalization/recommendation-engine.ts`

## Naming Conventions

Use product language consistently:

- `brief` for daily intelligence content
- `lesson` for learning units
- `track` for learning paths
- `reflection` for personal insight entries
- `assumption` for revisitable beliefs
- `recommendation` for generated next steps
- `achievement` or `milestone` for growth records

Avoid product language that pulls the system back toward speculation:

- alpha
- 100x
- floor price
- rarity ranking
- trading signal
- mint hype

## Verification Standard

At minimum, run:

```bash
npm run check:repo
npm run build
```

For user loop work, also smoke test:

```text
/
/briefs
/learn
/learn/<lesson-id>
/dashboard
/api/recommendations
```

Document any verification that was not possible.
