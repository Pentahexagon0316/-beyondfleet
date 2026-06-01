# Editorial Simulation Week

This simulation validates BeyondFleet as a repeated reading ritual, not a
one-off feature demo. The week is designed to test cadence, continuity,
reflection quality, and cognitive load across seven consecutive Daily Briefs.

Full structured CMS-ready fixtures live in:

```text
lib/content/editorial-simulation-week.ts
```

## Week Cadence

| Day | Date | Cadence | Editorial Job |
| --- | --- | --- | --- |
| Monday | 2026-05-11 | Macro Reset | Establish one weekly question: is risk appetite broadening or narrow? |
| Tuesday | 2026-05-12 | Rates / Liquidity | Test the Monday question against rate and bond conditions. |
| Wednesday | 2026-05-13 | AI Economy | Connect AI capex to the macro financing backdrop. |
| Thursday | 2026-05-14 | Risk Thinking | Name one condition that would make the week view less reliable. |
| Friday | 2026-05-15 | Weekly Reflection | Close the week by naming what became less certain. |
| Saturday | 2026-05-16 | Assumptions Revisit | Revisit one saved assumption without adding more analysis. |
| Sunday | 2026-05-17 | Carry Forward | Carry one question into the next Monday reset. |

## Brief Deck

### Monday - Macro Reset

Title: The Week Opens With a Liquidity Breadth Test

Core read: The week starts by asking whether risk appetite is broadening or
staying concentrated in narrow leadership.

Reflection prompt: What evidence would suggest that risk appetite is broadening
rather than only concentrated?

Related lessons:

- `macro-foundations-liquidity`
- `risk-thinking-second-order`

### Tuesday - Rates / Liquidity

Title: Rates Matter Most When Liquidity Looks Comfortable

Core read: Liquidity can look easier while rates quietly decide whether the
calm is durable.

Reflection prompt: What rate signal would make Monday's liquidity read less
reliable?

Related lessons:

- `macro-foundations-rates`
- `macro-foundations-bonds`

### Wednesday - AI Economy

Title: AI Capex Needs Macro Conditions, Not Just Conviction

Core read: AI demand can be real while still depending on financing conditions,
power, compute, and credible future cash flows.

Reflection prompt: Which AI infrastructure assumption needs more evidence
before it becomes part of your long-term view?

Related lessons:

- `ai-economy-compute`
- `ai-economy-data`

### Thursday - Risk Thinking

Title: The Better Question Is What Would Make the View Wrong

Core read: After three days of structure, the week should slow down and name
the assumption that would break the chain.

Reflection prompt: What single condition would make this week's macro view less
reliable?

Related lessons:

- `risk-thinking-probability`
- `risk-thinking-bias`

### Friday - Weekly Reflection

Title: What Changed in the Way You Read the Week?

Core read: The close should not add more noise. It should identify what changed
in the reader's judgment process.

Reflection prompt: What did you become less certain about this week?

Related lessons:

- `risk-thinking-second-order`
- `risk-thinking-risk-management`

### Saturday - Assumptions Revisit

Title: Revisit the Assumption Before Adding a New One

Core read: Weekend review should revisit one assumption from the week without
turning rest into analysis.

Reflection prompt: Which assumption from this week should you keep, rewrite, or
retire?

Related lessons:

- `risk-thinking-probability`
- `risk-thinking-bias`

### Sunday - Carry Forward

Title: Carry Forward One Question, Not a Full Dashboard

Core read: The week ends by reducing the system to one question worth carrying
into Monday.

Reflection prompt: What one question would make tomorrow's brief easier to
read?

Related lessons:

- `macro-foundations-dollar`
- `risk-thinking-second-order`

## Editorial Consistency Review

Passed:

- The week has one stable arc: liquidity breadth -> rates -> AI financing ->
  open condition -> reflection -> revisit -> carry forward.
- Each day has one central question.
- Reflection prompts are short, calm, and uncertainty-aware.
- Related lessons stay within the zero to two lesson limit.
- Weekend content lowers cognitive load instead of adding new themes.
- No brief relies on urgency, social proof, hype, or speculative language.

Needs watch:

- Monday and Tuesday both reference liquidity. This is intentional continuity,
  but the actual published versions should vary the sentence cadence.
- Wednesday could drift into technology commentary if expanded. Keep it tied to
  financing conditions.
- Thursday is conceptually dense. It should remain shorter in the reader than in
  the CMS draft.

## Cognitive Fatigue Review

Potential fatigue points:

- The phrase "the week" appears often because this is a simulation. In live
  publishing, vary this with "today's read", "this question", or the concrete
  theme.
- Three consecutive macro-heavy days may feel dry if the summaries become too
  abstract. Keep each summary anchored to a practical reading action.
- Risk Thinking on Thursday can feel demanding. It works best after the first
  three briefs have already created context.

Fatigue controls used:

- One reflection prompt per brief.
- Zero to two related lessons per brief.
- Weekend briefs reduce scope rather than expanding it.
- Friday asks for less certainty, not more productivity.
- Sunday carries forward one question, not a task list.

## Reflection Cadence Review

The prompt sequence is deliberately progressive:

1. Monday asks whether breadth is real.
2. Tuesday asks what would weaken the liquidity read.
3. Wednesday asks what AI assumption needs evidence.
4. Thursday asks what would make the view less reliable.
5. Friday asks what became less certain.
6. Saturday asks what to keep, rewrite, or retire.
7. Sunday asks what question to carry forward.

This avoids prompt fatigue because each prompt changes the cognitive action:
observe, test, evidence-check, hold lightly, reflect, revisit, carry forward.

## Assumption Revisit Quality

The weekend review works if the reader can end with one of three outcomes:

- Keep: the assumption still matters and has a clear revisit trigger.
- Rewrite: the assumption is useful but too broad.
- Retire: the assumption no longer improves judgment.

The review should feel useful because it removes noise. If it creates a longer
list, it is failing.

## Publication Memory Check

The week should carry one thread forward rather than asking the reader to manage
a timeline. In this simulation, the thread is liquidity breadth moving through
rates, AI financing, risk conditions, and weekend reflection.

Good memory behavior:

- Monday creates the question.
- Midweek tests it without adding a second arc.
- Friday names what became less certain.
- Weekend review keeps, rewrites, or retires one assumption.
- Sunday carries one question into Monday.

Avoid turning this into a scoreboard. The publication should remember with
humility: what continued to matter, what faded quietly, and what deserves more
patience.

## CMS Workflow Validation

Using the current CMS workflow, the simulation maps cleanly to production:

- `title`, `summary`, and structured fields are ready for entry.
- `full_content` can be generated from the five structured sections.
- `related_lesson_ids` stays at or below the editorial limit.
- `reflection_prompt` stays as one question.
- `editor_notes` explains the emotional goal for each day.
- `scheduled_for` supports the daily cadence without manual timing decisions.

Expected CMS quality behavior:

- The quality checklist should pass for all seven drafts after copy entry.
- Drift penalty should remain zero.
- Suggested lessons should align with the selected tags and body text.
- Weekend briefs should score well even though they intentionally feel quieter.

## Longitudinal Reading Verdict

The simulated week feels cohesive enough to test in production because the
reader is not asked to start over each day. Each brief narrows or revisits the
same evolving question.

The strongest flow is:

```text
Macro breadth question
-> rate condition test
-> AI financing bridge
-> open condition
-> weekly uncertainty
-> assumption revisit
-> carry-forward question
```

This supports BeyondFleet's product identity: a calm weekly intellectual ritual,
not an AI content machine.

## Production Notes

Before using this as live content:

- Replace simulated framing with current market facts.
- Keep the same structure and cadence.
- Update `key_events` with real calendar items.
- Keep the reflection prompts unless the real week creates a more precise
  question.
- Use only one brief as `is_featured` at a time.
