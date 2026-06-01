# Repository Workflow

GitHub is the source of truth for BeyondFleet. The repository should preserve a
clear product evolution history and make rollback safe.

## Branch Strategy

Use a lightweight branch model:

```text
main      -> production-ready stable branch
develop   -> active integration branch
feature/* -> isolated feature work
```

Recommended flow:

1. Branch from `develop` for normal work.
2. Open pull requests into `develop`.
3. Promote `develop` into `main` only after build, preview deploy, and product review pass.
4. Deploy production from `main`.

For urgent production fixes:

```text
main -> hotfix/<short-name> -> main -> develop
```

## Commit Standards

Use product-readable Conventional Commits.

Good examples:

```text
feat: add reflection persistence sync
feat: build daily brief CMS
refactor: migrate lesson progress to learning_progress
fix: prevent scheduled briefs from recommendations
style: reduce motion transitions globally
docs: document repository workflow
chore: add GitHub CI build check
```

Avoid:

```text
fix
update
changes
final
asdf
```

## Pull Request Standards

Each PR should include:

- What changed
- Why it changed
- Product surfaces affected
- Supabase migrations required, if any
- Environment variables required, if any
- Verification performed
- Known risks or follow-up work

Prefer small PRs with clear ownership. Large product passes should be split into
coherent milestones when possible.

## Review Checklist

Before merging:

- `npm run check:repo` passes.
- `npm run build` passes.
- No secrets or `.env.local` files are tracked.
- New Supabase migrations are documented.
- Guest and authenticated states are considered.
- Mobile reading and dashboard density are considered.
- Reduced-motion behavior is not regressed.
- Copy still supports the reflective intelligence product direction.

## Branch Creation

If `develop` does not exist yet:

```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

For new feature work:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/reflection-system
```

Do not create long-lived feature branches that become alternate product
versions. Merge or close them quickly.

## Rollback Safety

Every production release should be reversible by:

- Reverting the merge commit.
- Rolling Vercel back to the previous production deployment.
- Keeping Supabase migrations backward-compatible when possible.

Avoid destructive migrations in MVP iteration. Prefer additive migrations and
follow-up cleanup after production data shape is known.
