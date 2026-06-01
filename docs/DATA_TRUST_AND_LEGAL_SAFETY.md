# Data Trust & Legal Safety

BeyondFleet is an editorial intelligence layer. It should help readers think
better by interpreting trusted sources, not by becoming a raw data vendor, a
real-time terminal, or a news redistribution product.

This framework is operational guidance, not legal advice. Any commercial data
contract, redistribution workflow, or paywalled editorial use should be reviewed
before production launch.

## Core Rules

- Use trusted sources for facts and data.
- Add BeyondFleet value through interpretation, second-order analysis,
  uncertainty framing, and reflection.
- Do not reproduce full articles or proprietary analysis.
- Do not use AI to paraphrase paywalled journalism into substitute summaries.
- Separate facts, data, and editorial interpretation.
- Attribute sources consistently.
- Keep educational and commentary-first positioning visible.

## Source Classification

Source policies are encoded in:

```text
lib/content/source-policy.ts
```

### Public Institutional Sources

Examples:

- FRED
- IMF
- World Bank
- OECD
- ECB
- BLS
- SEC EDGAR

Default use:

- macro indicators
- historical context
- official releases
- filings and institutional disclosures

Operating rule:

- Prefer direct institutional sources for facts.
- Cite source name, dataset or release, link when available, and accessed date.
- State when data has been transformed or interpreted by BeyondFleet.
- Respect API rate limits and fair access expectations.
- Check dataset metadata for third-party restrictions.

### Commercial Licensed APIs

Examples:

- TradingEconomics
- Polygon
- Finnhub
- Alpha Vantage
- Nasdaq Data Link

Default use:

- only after commercial license review
- only on permitted product surfaces
- only within caching, display, and redistribution terms

Operating rule:

- No commercial API should be treated as open by default.
- Each provider needs a documented plan, allowed usage, cache duration,
  redistribution permission, and attribution requirement.
- Do not expose raw data outside the permitted license.
- Do not let the UI become a replacement market terminal unless the license
  explicitly permits that product use.

### Editorial Sources

Examples:

- Bloomberg
- Reuters
- Financial Times
- Wall Street Journal

Default use:

- cited reporting reference only
- context for editorial interpretation
- link-and-citation, not content replication

Operating rule:

- Do not reproduce full articles.
- Do not summarize paywalled journalism in a way that substitutes for reading
  the original.
- Do not use AI to rewrite proprietary analysis.
- Prefer "Reuters reported..." or "Bloomberg reporting indicated..." only when
  the claim depends on that reporting.
- BeyondFleet's value should be commentary and judgment framing, not copied
  reporting.

### Internal Editorial Analysis

Examples:

- BeyondFleet Daily Brief interpretation
- second-order analysis
- assumptions and reflection prompts
- lesson connections

Default use:

- primary product value layer

Operating rule:

- Label interpretation as interpretation.
- Avoid implying that an internal read is a sourced fact.
- Use uncertainty-aware language.
- Keep financial advice disclaimers visible in reader surfaces.

## Attribution Standard

Use a short, consistent pattern.

For institutional data:

```text
Source: FRED, Federal Reserve Bank of St. Louis, [series name], accessed [date].
Source: International Monetary Fund, [database name], accessed [date].
Source: World Bank, [indicator/dataset], accessed [date].
Source: U.S. Bureau of Labor Statistics, [release/series], accessed [date].
Source: SEC EDGAR, [company], [filing type], filed [date].
```

For editorial reporting:

```text
Source: Reuters reporting, [topic/article], [date].
Source: Bloomberg reporting, [topic/article], [date].
```

For interpretation:

```text
Interpretation: BeyondFleet editorial analysis.
```

For transformed data:

```text
Source: IMF, [dataset], accessed [date]. BeyondFleet transformed the data for
charting and commentary.
```

## AI Summarization Discipline

AI may help:

- compare institutional data
- extract themes from permitted source notes
- draft internal commentary
- identify uncertainty and second-order implications
- create reflection prompts

AI must not:

- rewrite paywalled articles into substitute summaries
- reproduce proprietary article structure or sequence
- create near-copy summaries of journalism
- imply that editorial interpretation is sourced fact
- remove source attribution from facts

Prompt rule:

```text
Use source material only to identify factual anchors. Produce original
BeyondFleet commentary that frames uncertainty, assumptions, and second-order
effects. Do not paraphrase article text or recreate proprietary analysis.
```

## Editorial Verification Layer

Before publishing any Daily Brief with external claims:

- Identify the factual claim.
- Identify the source category.
- Confirm the source can be used on the intended product surface.
- Add attribution.
- Separate the factual claim from BeyondFleet interpretation.
- State uncertainty where the data does not support a strong conclusion.
- Avoid turning the claim into a financial signal.

Example:

```text
Fact: BLS CPI data showed services inflation remained sticky.
Source: U.S. Bureau of Labor Statistics, CPI release, accessed 2026-05-11.
Interpretation: BeyondFleet reads this as a reason to keep rate-cut assumptions
conditional, not as a directional market call.
```

## Redistribution Safety

Allowed:

- short factual references with attribution
- links to sources
- transformed charts when source terms permit
- original commentary
- second-order analysis
- assumption framing
- reflection prompts

Restricted:

- full article reproduction
- large excerpts from journalism
- paywalled article paraphrases
- raw licensed market data feeds exposed to users
- downloadable licensed datasets unless contractually permitted
- provider logos or implied endorsements unless permitted

## Product Safety Positioning

BeyondFleet should consistently communicate:

- educational purpose
- commentary and learning orientation
- not financial advice
- no promise of returns
- no trade signal positioning
- source transparency
- uncertainty awareness

Avoid product language such as:

- "signals"
- "calls"
- "buy/sell"
- "alpha"
- "real-time terminal"
- "exclusive data feed"
- "guaranteed insight"

Prefer:

- "what changed"
- "why it matters"
- "what assumption weakens"
- "what deserves attention"
- "what to carry forward"

## Source Intake Checklist

Before adding a new data or editorial source:

- What is the source category?
- Is commercial use allowed?
- Is redistribution allowed?
- Is caching allowed?
- Is attribution required?
- Are there rate limits or fair access rules?
- Does the source include third-party data?
- Can we show raw data, or only transformed commentary?
- Does the product surface make us look like a data vendor?
- Who owns renewal and terms review?

## Implementation Requirements

- New sources should be added to `lib/content/source-policy.ts`.
- Product surfaces should display source attribution when facts or data are
  externally sourced.
- CMS workflows should capture source notes before publication.
- AI-generated briefs should cite factual anchors and distinguish interpretation.
- Commercial APIs require explicit approval before production use.
- Editorial reporting should stay link-and-citation only unless a license says
  otherwise.

## Strategic Boundary

BeyondFleet's defensibility should come from:

- editorial trust
- careful interpretation
- reflective learning loops
- source transparency
- continuity of judgment

It should not depend on copying proprietary information or appearing to own
exclusive market data.
