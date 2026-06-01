# Access Control

BeyondFleet uses membership tiers for access depth, not status pressure.

The source of truth is `profiles.membership_tier`.

```text
cadet -> navigator -> pilot -> commander -> admiral
```

Use the shared helpers in `lib/membership/access.ts` whenever a page, component,
or API needs tier comparison.

## Rules

- Do not compare tiers with local arrays inside pages.
- Do not use `nft_tier` for product access. Use `membership_tier`.
- UI gating is for guidance only. Sensitive data must also be filtered or gated
  at the API/database layer.
- Locked states should explain the learning value of the next tier without
  creating status pressure.

## Current Access Pattern

- Daily Brief: public summary plus tier-filtered premium sections.
- Lessons: each lesson can define `required_tier`.
- News premium categories: tier checks use shared access helpers.
- Dashboard: shows the user's membership label from `membership_tier`.

## Tone

Prefer access language such as:

- "requires Analyst access"
- "available in the next research layer"
- "upgrade for deeper archive access"

Avoid:

- "exclusive alpha"
- "VIP only"
- "unlock superior signals"
- "premium advantage"
