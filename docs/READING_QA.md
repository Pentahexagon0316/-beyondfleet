# Reading QA Notes

BeyondFleet should be evaluated as a reading and thinking environment, not only
as an application.

## Screen Goals

- Homepage: calm curiosity
- Dashboard: focused continuity
- Daily Brief: thoughtful clarity
- Lesson reader: deep understanding
- Reflection: quiet pause

## Comfort Criteria

- No horizontal clipping on mobile.
- Body copy should stay within a comfortable reading width.
- Long text should use generous line height and paragraph spacing.
- Mobile should prioritize reading before secondary panels.
- Reflection inputs should feel private, spacious, and low-pressure.
- Borders, shadows, and glow effects should remain subtle.

## Editorial Energy Rules

- Each screen should surface one dominant next action.
- Reflection prompts should appear after meaningful reading, not before the user has context.
- Recommendations should be selective and visually quieter than the current task.
- Secondary systems should stay collapsed or hidden on mobile unless the user asks for them.
- Avoid stacking prompts, metrics, recommendations, and CTAs in the same viewport.
- Continuity cues should feel observational, not like performance analytics.

## Current QA Coverage

Performed in this pass:

- Production build validation.
- Route smoke tests for the core reading loop.
- Chrome headless viewport captures for homepage, brief reader, and lesson reader.
- Mobile clipping check for hero copy and lesson copy.
- Mobile card-density reduction on brief and learning surfaces.
- First human-reader validation fixture and interview protocol:
  `docs/FIRST_HUMAN_READER_VALIDATION.md`.

Not completed in this environment:

- Physical phone testing.
- Physical tablet testing.
- 10-15 minute human reading session.
- Live human reader interviews.
- Authenticated dashboard review on a real device.

## Real Device Checklist

When testing on physical devices, spend several minutes on each flow:

- Read the Daily Brief without using the sidebar.
- Open a related lesson and read past the first screen.
- Type a reflection with the mobile keyboard open.
- Return to the dashboard and check whether the next step feels calm.
- Confirm there is no horizontal scroll or clipped text.
- Confirm the user feels guided, not rushed.
