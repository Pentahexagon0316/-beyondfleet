# Trust Calibration & Epistemic Clarity

BeyondFleet should help users think more carefully, not merely feel more
confident. The product should make it clear what is known, what is inferred,
what is assumed, and what remains uncertain.

## Epistemic Layers

Use these labels consistently across Daily Briefs, CMS workflows, AI prompts,
lessons, and dashboard language.

| Layer | Meaning | Editorial Cue |
| --- | --- | --- |
| Observation | What was observed, measured, reported, or changed. | "What changed?" |
| Sourced fact | A factual claim grounded in an external source or dataset. | "Source: ..." |
| Interpretation | BeyondFleet's reading of why the observation may matter. | "One interpretation is..." |
| Second-order effect | What behavior, policy reaction, or capital allocation may change next. | "This may affect..." |
| Assumption | A belief that should remain revisitable. | "This depends on..." |
| Uncertainty | What remains unclear or could weaken the view. | "This becomes weaker if..." |
| Carry forward | One question or condition worth watching next. | "What deserves continued attention?" |

## Daily Brief Structure

Daily Briefs should keep this sequence:

```text
What changed
-> Why it may matter
-> What could change next
-> What remains unclear
-> Question to carry forward
```

This maps to the existing CMS fields:

- `what_happened` = Observation
- `why_it_matters` = Interpretation
- `second_order_effects` = Second-order effect
- `risk_conditions` = uncertainty and conditions that would weaken the view
- `reflection_prompt` = carry-forward question

Do not collapse these into one confident narrative. The separation is part of
the product's trust model. On user-facing surfaces, use softer editorial labels
so the experience feels natural rather than procedural.

## Language Calibration

Favor measured language:

- "may"
- "could"
- "appears"
- "one interpretation is"
- "this assumption weakens if"
- "the evidence is mixed"
- "what remains unclear is"

Avoid false certainty:

- "proves"
- "guarantees"
- "inevitable"
- "without question"
- "the market will"
- "this confirms"

The goal is not weak writing. The goal is precise confidence.

## Editorial Intuition

Epistemic clarity should not turn the brief into an academic worksheet. Use the
structure to protect trust, then let the prose breathe.

See:

```text
docs/EDITORIAL_INTUITION_AND_PSYCHOLOGICAL_TRUST.md
lib/content/editorial-intuition.ts
```

Prefer human questions, open tension, and quiet curiosity over visible
frameworking.

## Fact vs Interpretation Rules

Facts:

- should be sourceable
- should be stated narrowly
- should include date or context when freshness matters
- should not include implied causality unless supported

Interpretations:

- should be marked as a reading, not a fact
- should name the assumption behind the inference
- should include what would weaken it
- should avoid deterministic forecasting

Example:

```text
Observation: The dollar index strengthened while risk assets were mixed.
Interpretation: One reading is that liquidity conditions are less supportive
than the surface equity move suggests.
Uncertainty: This weakens if funding stress remains low and breadth improves.
```

## AI Confidence Calibration

AI-generated briefs must not sound more certain than the evidence supports.

Generation prompts should require:

- observation and interpretation separation
- at least one uncertainty or condition that would weaken the view
- assumption-aware reflection prompt
- no deterministic forecasts
- no forced narrative coherence

If the draft feels too coherent, add the condition that could make it wrong.

## Reflection Prompt Standard

Reflection prompts should help the user identify assumptions, not perform
self-improvement.

Good:

- "What feels less certain now?"
- "What deserves more patience?"
- "What assumption are you carrying forward carefully?"
- "What would make this interpretation less reliable?"
- "What evidence would change your view tomorrow?"

Avoid:

- "How will you improve today?"
- "What action will you take?"
- "How can you stay motivated?"

Reflection is a pause for judgment, not a productivity ritual.

## Source Transparency

When the brief depends on an external fact:

- show the source in the article or source notes
- distinguish the sourced fact from BeyondFleet's interpretation
- state if data was transformed
- include accessed date when appropriate

Use `docs/DATA_TRUST_AND_LEGAL_SAFETY.md` and
`lib/content/source-policy.ts` for source governance.

## Trust Signals

Trust cues should remain quiet:

- source references
- "Today's reading" rather than "truth"
- reader-facing uncertainty notes
- carry-forward questions
- revision or editor notes in CMS

Avoid authority theater:

- excessive badges
- overconfident model claims
- "AI knows" framing
- prediction accuracy language

## Review Checklist

Before publishing:

- Observation is separated from interpretation.
- Important facts have source notes.
- Interpretation uses measured language.
- Uncertainty is visible.
- Assumption prompt is clear and short.
- No over-certainty language is present.
- The brief does not behave like a signal or prediction.
