# Content Operations

BeyondFleet should feel alive because each day connects to the last one.

The editorial goal is not to publish more information. The goal is to help a
reader build better judgment through continuity.

## Editorial Identity

BeyondFleet should read like a calm macro journal, not an AI content feed.

Favor:

- compressed judgment
- grounded uncertainty
- stable structure
- optional recommendations
- quiet reflection
- careful omission

Avoid:

- urgency language
- dramatic certainty
- motivational coaching
- insight stacking
- inflated AI essay tone
- generic "what this means for you" endings
- forced significance when not much changed

## Editorial Intuition Boundary

BeyondFleet should remain human, calm, and psychologically trustworthy. The
epistemic structure is an internal guardrail, not a script the reader should
feel on every paragraph.

Use:

```text
docs/EDITORIAL_INTUITION_AND_PSYCHOLOGICAL_TRUST.md
lib/content/editorial-intuition.ts
```

Good writing may leave a question open. Avoid over-clean packaging, academic
rigidity, and repeated uncertainty warnings. The reader should feel respected,
not managed.

For the first human-reader validation draft and interview protocol, use:

```text
docs/FIRST_HUMAN_READER_VALIDATION.md
lib/content/first-human-reader-validation.ts
```

For the first real Monday-to-Wednesday publication cadence, use:

```text
docs/FIRST_REAL_PUBLICATION_CADENCE.md
lib/content/first-real-publication-cadence.ts
```

This cadence should be treated as a living rhythm test: Monday can publish,
Tuesday can schedule, and Wednesday should remain a draft until the official CPI
result and rate response are added.

## Editorial Selectivity Boundary

BeyondFleet should become more valuable by omitting more noise. Not every macro
event deserves a Daily Brief, continuation cue, or recommendation.

Use:

```text
docs/EDITORIAL_SELECTIVITY_AND_SIGNAL_DISCIPLINE.md
lib/content/editorial-selectivity.ts
```

Before surfacing anything, ask whether it changes an assumption, clarifies a
risk condition, or deserves follow-through. If the fit is weak, leave it quiet.
It is acceptable for the product to show no recommendation.

## Long-Term Sustainability Boundary

BeyondFleet should resist editorial entropy over months of publishing. Daily
operation should remain calm enough that quality can be sustained.

Use:

```text
docs/LONG_TERM_EDITORIAL_SUSTAINABILITY.md
lib/content/editorial-sustainability.ts
```

Avoid adding new frameworks, sections, recommendation surfaces, or continuity
cues just because the product can support them. Trust compounds when the product
can stay quiet.

## Editorial Operations Calmness

The publication process should feel sustainable for the operator. The CMS
should guide gently rather than create validation anxiety.

Use:

```text
docs/EDITORIAL_OPERATIONS_CALMNESS.md
lib/content/editorial-operations-calmness.ts
```

The editor should be able to publish, wait, save a draft, attach no
recommendations, or write "not much changed" without feeling that the system is
failing.

## Publication Memory Boundary

BeyondFleet should gradually feel historically aware without becoming a
timeline dashboard or prediction scoreboard.

Use:

```text
docs/PUBLICATION_MEMORY_AND_EDITORIAL_CONTINUITY.md
lib/content/publication-memory.ts
```

Memory should surface one useful recurring thread, unresolved assumption, or
carry-forward question. Avoid surveillance language, retrospective certainty,
and heavy editorial bookkeeping.

## Data Trust Boundary

BeyondFleet is an editorial intelligence layer, not a raw data vendor, terminal,
or news redistribution platform. Facts and data should come from trusted
sources; product value should come from interpretation, uncertainty framing, and
reflection.

For source classification, attribution rules, AI summarization boundaries, and
commercial data review requirements, use:

```text
docs/DATA_TRUST_AND_LEGAL_SAFETY.md
lib/content/source-policy.ts
```

Before publishing sourced claims:

- cite the source clearly
- separate facts from BeyondFleet interpretation
- avoid reproducing proprietary reporting
- avoid exposing licensed data outside permitted terms
- keep the framing educational, not signal-like

## Epistemic Clarity Boundary

BeyondFleet should distinguish observation, sourced fact, interpretation,
assumption, uncertainty, and carry-forward questions. Use:

```text
docs/TRUST_CALIBRATION_AND_EPISTEMIC_CLARITY.md
lib/content/epistemic-clarity.ts
```

Daily Brief structure should read as:

```text
What changed
-> Why it may matter
-> What could change next
-> What remains unclear
-> Question to carry forward
```

The product should make uncertainty visible without making the experience feel
anxious or indecisive.

## Daily Brief Standard

Each Daily Brief should answer:

- What changed?
- Why does it matter?
- What assumption weakens?
- What risks deserve attention?
- What should the reader carry forward?

Avoid headline aggregation. A brief should feel curated, calm, and useful.

## Required Structure

Use the five-part ritual internally:

```text
What changed
Why it may matter
What could change next
What remains unclear
Question to carry forward
```

The reflection prompt is not optional. It is the bridge from reading to personal
judgment.

On the reader surface, do not expose every analytical branch at once. The UI
should usually show one summary, one risk condition, one continuity cue, and one
reflection prompt.

## Cadence Consistency

Daily content should feel stable across weeks.

- Keep the same brief structure each day.
- Keep section density similar from day to day.
- Avoid sudden verbosity spikes after quiet days.
- Avoid dramatic emotional shifts unless the underlying risk truly changed.
- Prefer one central macro question over several competing theses.

The reader should know what kind of thinking session they are entering.

## AI Drift Prevention

AI-generated drafts must be edited against these risks:

- repetitive phrasing
- generic "important because" explanations
- over-explaining simple relationships
- inflated intellectual tone
- urgency or excitement that the product did not earn
- too many recommendations attached to one signal
- forced significance when not much changed

Every generated brief should be compressed before publishing. If a sentence does
not clarify what changed, what weakens the view, or what to carry forward, cut
or rewrite it.

## Theme Discipline

Use stable themes from `lib/content/intelligence-graph.ts` when connecting
briefs, lessons, and dashboard modules.

Current theme families:

- Liquidity, rates, inflation, bonds, dollar
- AI compute, automation, data economy, AI agents
- Probability, second-order thinking, cognitive bias, risk management

New themes should be added only when they create a durable content path, not
for one-off headlines.

## Continuity Cues

Surface continuity sparingly. The system may track many relationships, but the
reader should usually see only one thoughtful cue or revisit prompt at a time.

Good continuity cues:

- "You previously reflected on liquidity conditions."
- "AI compute has appeared in several recent notes."
- "This assumption should be revisited after the next policy event."
- "This lesson gives structure to a question from today’s brief."

Avoid:

- Streak pressure
- Social comparison
- Urgency language
- Generic recommendations
- XP or level language as the main motivation
- Completion pressure that makes breaks feel like failure

## Quiet Recognition

Progress should recognize depth rather than activity volume. Treat reflection,
assumption revisits, and thoughtful continuity as higher-quality signals than
raw completion.

Good recognition cues:

- "This question has stayed with you."
- "You revisited this assumption after new evidence."
- "This lesson now gives language to a prior reflection."

Avoid:

- "Keep your streak alive"
- "Earn more XP"
- "Level up now"
- "Complete everything"

## Related Lessons

Every substantial brief may link to zero to two lessons. The goal is concept
discovery:

```text
Brief signal -> Concept -> Lesson -> Reflection -> Revisit
```

If a brief touches many themes, pick the lessons that best improve judgment
rather than listing every possible connection. If no lesson clearly improves
the reader's judgment, do not attach one.

## Cognitive Density Limits

Use these as product-wide defaults:

- Daily Brief reader: one reflection prompt visible.
- Dashboard: one primary action and one continuity cue.
- Recommendations: two lessons and two briefs at most in normal surfaces.
- Related lessons: zero to two per brief.
- Reflection: one primary writing surface; assumption and idea capture can stay secondary.
- Mobile: hide secondary metrics, saved lists, and extra recommendation panels by default.

These limits prevent gradual density creep as the intelligence layer becomes
deeper.

## Assumptions

Saved assumptions should be written as revisitable claims:

Good:

```text
Liquidity may matter more than isolated headlines until funding stress rises.
Revisit after the next policy statement and dollar move.
```

Weak:

```text
Markets are bullish.
```

## Editorial Review Checklist

Before publishing:

- The brief names what changed.
- The brief explains why it matters beyond the first reaction.
- Second-order effects are concrete.
- Risk conditions can invalidate the view.
- Reflection prompt is specific and quiet.
- Related lessons are connected.
- Tone is calm and educational.
- The draft contains no hype or urgency language.
- The page surfaces one primary next action.
