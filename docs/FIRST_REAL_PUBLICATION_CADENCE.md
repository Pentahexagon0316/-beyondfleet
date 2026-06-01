# First Real Publication Cadence

This pass moves BeyondFleet from editorial system design into the first
operational rhythm test.

Use the CMS-ready payloads in:

```text
lib/content/first-real-publication-cadence.ts
```

Dry-run validation and payload preview:

```text
npm run content:cadence:check
```

Optional Supabase write, only after confirming the target database:

```text
npm run content:cadence:seed
```

The seed script uses service-role access and updates existing briefs by `date`.
Run it only against the intended database.

## Cadence

| Day | Status | Editorial Job | Reader Feeling |
| --- | --- | --- | --- |
| Monday | Publish-ready | Set the weekly macro question before CPI. | Calm attention |
| Tuesday | Scheduled-ready | Define what CPI would change before reacting. | Patient focus |
| Wednesday | Draft hold | Connect AI capex to the rate backdrop after CPI is known. | Disciplined curiosity |

The three-day thread is:

```text
Labor resilience -> CPI/rates -> AI financing discipline
```

This is intentionally narrow. The test is not whether the publication can fill
three days. The test is whether three days feel connected without becoming
repetitive or pressured.

## Source Grounding

Monday uses public institutional sources:

- BLS Employment Situation, April 2026
- BLS CPI, March 2026 and April release timing
- U.S. Treasury Daily Par Yield Curve Rates, May 8 2026
- Federal Reserve H.4.1, May 7 2026

Tuesday uses the same CPI and rate sources because it is a pre-release patience
brief. It should not include April CPI values before the official release.

Wednesday uses SEC EDGAR filings for AI infrastructure context, but remains a
draft hold until the April CPI result and rate response are added.

## CMS Flow

Recommended operating flow:

1. Run `npm run content:cadence:check`.
2. Review the three payload summaries.
3. In `/admin/briefs`, publish Monday as featured.
4. Schedule Tuesday as published but future-dated.
5. Keep Wednesday unpublished until CPI data is available.
6. After CPI, update one sentence in Wednesday's `what_happened` and `risk_conditions`.
7. Read `/briefs` sequentially as a reader before publishing Wednesday.

The CMS should feel like a calm editorial desk. If Wednesday creates pressure,
hold it. A draft hold is a valid editorial outcome.

## Fatigue Observation

Track operator effort across the three days:

- How much source checking was required?
- Did tone cleanup feel light or heavy?
- Did recommendations feel natural?
- Did any brief feel like it was manufacturing significance?
- Did Wednesday's hold reduce pressure or create anxiety?

Good outcome:

```text
The operator can publish, schedule, or hold without feeling the system is failing.
```

## Reading Flow Validation

Read the briefs in sequence:

- Monday should establish one question.
- Tuesday should narrow the test without repeating Monday.
- Wednesday should feel like a bridge into AI, not a new product lane.

Watch for:

- repetition around rates and CPI
- source notes becoming academic
- reflection prompts feeling like homework
- AI language becoming hype-like
- related lessons feeling automatic

## Mobile Reality Check

On mobile, confirm:

- source notes do not dominate the article
- reflection remains easy to write after reading
- related lessons stay visually secondary
- the scroll rhythm feels calm after two consecutive briefs
- Wednesday draft copy does not feel like a placeholder if published later

## Editorial Memory Check

Memory should appear as a quiet thread:

```text
Monday sets patience.
Tuesday tests patience.
Wednesday applies patience to AI financing.
```

Avoid:

- "we were right"
- prediction scorekeeping
- user behavior tracking
- timeline-heavy recaps

The reader should feel continuity, not monitoring.

## Recommendation Behavior

Each brief links to two lessons or fewer:

- Monday: rates, second-order thinking
- Tuesday: inflation, rates
- Wednesday: AI compute, rates

Do not add more lessons just because the brief touches more themes. If the
reader finishes with one better question, the recommendation system has done
enough.

## Operational Verdict

This cadence is suitable for the first live rhythm test with one important
boundary:

```text
Wednesday is not publish-ready until the official CPI result and rate response are added.
```

That boundary is part of the test. BeyondFleet should be comfortable waiting.
