# BeyondFleet Architecture Notes

BeyondFleet is a reflective intelligence product organized around one MVP loop:

```text
Daily Brief -> Learning Path -> Reflection -> Return Tomorrow
```

The architecture should keep that loop obvious. New systems should either make
the loop more reliable or make the product more useful for long-term judgment.

## Product Layers

## Invisible Intelligence Principle

Intelligence systems can become deeper internally, but the product surface
should stay quiet. Prefer one high-quality cue over several simultaneous
recommendations.

Implementation guidance:

- Keep recommendation scoring, continuity detection, and UI presentation
  separated.
- Return enough structured data for future use, but render only the most useful
  next step by default.
- Avoid turning reflection into analytics. Continuity cues should feel
  observational, not evaluative.
- Mobile surfaces should prioritize reading and reflection before secondary
  modules.
- Recommendation and continuity systems may return empty arrays when the signal
  is weak. Absence can be editorial judgment.
- New editorial modules should justify their surface area against
  `docs/LONG_TERM_EDITORIAL_SUSTAINABILITY.md`; do not add persistent UI
  sections for weak signals.
- CMS review should stay grouped and calm. Detailed checks can exist, but the
  operator should primarily see a small set of publish-or-wait questions.
- Publication memory should remain editorial and lightweight. Prefer one
  carry-forward thread over timeline dashboards or scorekeeping.

### Homepage

The homepage explains the daily judgment loop and sends users toward the brief
or learning path. It should stay focused and avoid broad ecosystem messaging.

Primary files:

- `app/page.tsx`
- `components/home/*`

### Daily Brief

The Daily Brief is the daily habit trigger. A complete brief should support:

- What changed
- Why it may matter
- What could change next
- What remains unclear
- Question to carry forward

Internally these map to observation, interpretation, second-order effect,
uncertainty, and assumption awareness. User-facing copy should stay softer than
the internal model.

Primary files:

- `app/briefs/page.tsx`
- `app/admin/briefs/page.tsx`
- `app/api/admin/daily-briefs/route.ts`
- `app/api/cosmic-radar/daily-brief/route.ts`
- `app/api/cosmic-radar/daily-brief/generate/route.ts`
- `lib/content/first-real-publication-cadence.ts`

Important constraints:

- Future scheduled briefs must remain hidden.
- Premium content must stay gated.
- Public/free brief content should remain readable without creating dead ends.
- Related lessons should link directly to lesson readers when possible.
- Live cadence drafts may be held intentionally when official source data has
  not arrived yet.

### Learning

Learning is structured as track-based cognitive training, not a course
marketplace. Tracks should make Daily Briefs easier to understand.

Primary files:

- `app/learn/page.tsx`
- `app/learn/[id]/page.tsx`

Core state:

- `learning_progress`
- `learning_user_stats`
- `learning_saved_lessons`
- `learning_recent_items`

Important constraints:

- Completion can update XP, level, rhythm, dashboard state, and recommendations internally.
- Visible progress should emphasize reflective continuity over reward mechanics.
- XP and levels should remain secondary signals, not the emotional center of the product.
- Streaks should be framed as gentle reading rhythm and should never punish breaks.
- Guest progress should remain useful before login.
- Authenticated progress should be stored in Supabase when available.
- Missing Supabase data should fall back to local state instead of breaking the flow.

### Access Control

Membership access uses `profiles.membership_tier` as the source of truth.
Shared tier comparison helpers live in `lib/membership/access.ts`.

Do not use `nft_tier` for product access decisions. NFTs can represent
milestones or archival recognition, but page/API access should use membership
tier.

See `docs/ACCESS_CONTROL.md`.

### Reflection

Reflection is a core differentiator. It should feel private, quiet, and useful
for pattern recognition.

Primary files:

- `app/briefs/page.tsx`
- `app/dashboard/page.tsx`
- `lib/client/beyondfleet-sync.ts`

Core state:

- `daily_reflections`
- `idea_journal_entries`
- `saved_assumptions`
- `reading_completions`

Important constraints:

- Reflection should not behave like social posting.
- Saved assumptions should be revisitable, not presented as final truth.
- Guest entries should sync after authentication without losing local data.
- Failed Supabase writes should not erase useful local state.

### Dashboard

The dashboard is a personal intelligence workspace. It should answer:

- What should I read today?
- What should I continue learning?
- What am I repeatedly thinking about?
- Which assumptions should I revisit?
- Is my reading rhythm sustainable?

Primary file:

- `app/dashboard/page.tsx`

Important constraints:

- Prefer calm, editorial modules over KPI-heavy analytics cards.
- Recommendations should be useful and explainable.
- Reflection and learning modules should be connected to actual stored state.
- Empty states should guide the user back into the daily loop.

### Recommendations

The recommendation engine is intentionally lightweight. It should remain
explainable and deterministic enough for maintainers to debug.

Primary files:

- `app/api/recommendations/route.ts`
- `lib/personalization/recommendation-engine.ts`
- `lib/content/intelligence-graph.ts`

Inputs:

- Completed lessons
- Saved lessons
- Recent learning and brief views
- Track progress
- Viewed briefs

Outputs:

- Interest profile
- Recommended lessons
- Recommended briefs
- Continue learning queue
- Suggested topics
- Trending topics
- Reflection continuity signals
- Opposing perspective prompts

Important constraints:

- Do not recommend unpublished or future scheduled briefs.
- Prefer helpful continuity over noisy novelty.
- Keep scoring easy to inspect before adding heavier AI personalization.

### Intelligence Graph

The intelligence graph is a lightweight content structure that connects:

- Macro themes
- Related lessons
- Reflection prompts
- Opposing lenses
- Revisit cues

It lives in `lib/content/intelligence-graph.ts` so the Daily Brief reader,
dashboard, admin CMS, and recommendation API can share the same content logic.

This should remain editorial and explainable before adding heavier automated
graphing or model-driven personalization.

## Persistence Model

BeyondFleet supports both guest and authenticated use.

Guest state is stored locally first. Authenticated state should sync to Supabase
and continue from the same user experience.

Important local key families:

- `beyondfleet:daily-reflections:v1`
- `beyondfleet:idea-journal:v1`
- `beyondfleet:saved-assumptions:v1`
- `beyondfleet:reading-completions:v1`
- `beyondfleet:learn-progress:v1`
- `beyondfleet:saved-lessons:v1`
- `beyondfleet:recent-learning:v1`

The sync layer should merge local guest records into user-scoped local keys and
then best-effort write to Supabase.

## Supabase Migrations

Schema changes live in `supabase/migrations/`. Production deployments should
apply database migrations before deploying code that depends on new columns or
tables.

Important recent migrations:

- `20260510_daily_brief_cms.sql`
- `20260510_learning_progress_system.sql`
- `20260510_personalization_engine.sql`
- `20260511_content_activation_phase.sql`

## Reliability Boundaries

Code should gracefully handle:

- Missing Supabase environment variables during build.
- Missing tables during local development.
- Guest users with no auth session.
- Network failures during sync.
- Future scheduled content.
- Reduced-motion accessibility preferences.
- Empty recommendation inputs.

When adding features, preserve these boundaries unless there is a deliberate
replacement plan.
