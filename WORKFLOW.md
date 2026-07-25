# Systemize Boilerplate Workflow

This document governs initial construction, client creation, releases, upgrades, and
backports.

## 1. Version policy

Use semantic versioning for released boilerplate tags:

- **PATCH** — compatible bug fix, test improvement, or documentation correction.
- **MINOR** — backward-compatible infrastructure or optional capability.
- **MAJOR** — required client migration or removed/changed contract.

Released code pins exact versions in `package-lock.json`.

Supported baseline:

- current security-patched Next.js Active LTS, App Router
- compatible React and React DOM versions
- Node.js supported by the pinned Next.js release, pinned in repository metadata
- strict TypeScript
- Tailwind CSS v4
- current supported stable Supabase clients

Never release a production template on canary dependencies. Verify official release and
security documentation before pinning exact versions.

Version-sensitive rules to recheck on every framework update:

- fetch caching defaults and cache APIs
- `revalidateTag`/`updateTag` signatures
- async request APIs
- `next/image` preload/deprecations
- proxy/middleware conventions
- runtime requirements and bundler flags
- React hydration behavior
- WCAG recommendation references

## 2. Initial Boilerplate Build

Build each stage as a reviewable commit or PR. Run its gate before continuing.

### Stage 0 — Scaffold and pin

Work:

- Create a clean Next.js App Router project with TypeScript, Tailwind, ESLint, `src/`,
  import alias, and the supported bundler.
- The governance files already make the root non-empty. Do not run a force scaffold over
  them. Either scaffold in a disposable sibling/temporary directory and transplant only
  reviewed framework files, or create the minimal foundation directly in the root.
- Before removing a disposable scaffold, verify its resolved path is outside important
  work and contains only generated temporary content.
- Add these governance files at the repository root.
- Configure package identity, license, Node engine/version, `.gitignore`,
  `.editorconfig`, and `.env.example`.
- Pin the supported dependency versions and commit the lockfile.
- Ensure no active `AGENTS.client.md` exists.

Gate:

- Clean install succeeds.
- Development and production builds start.
- No runtime secret is needed during build.
- Dependency versions match the documented baseline.

### Stage 1 — Quality toolchain

Work:

- Configure strict TypeScript and ESLint.
- Configure Vitest and Testing Library.
- Configure Playwright, axe, and visual tests.
- Add canonical scripts:

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:a11y
npm run test:visual
npm run check:architecture
npm run check
npm run build
```

- Add initial CI for locked install, checks, tests, and build.

Gate:

- `npm run check` and `npm run build` pass.
- A unit smoke test and browser smoke test pass.
- CI passes from a clean clone.

### Stage 2 — Layout, theme, and locale

Work:

- Define Tailwind v4 theme tokens.
- Load fonts through `next/font`.
- Create supported locale types and `getDirection(locale)`.
- Derive root `lang` and `dir` from locale configuration.
- Add one RTL and one LTR fixture.
- Add minimal accessible primitives: button, input/field, status, card, and dialog.

Gate:

- No forbidden physical directional layout.
- No hydration warning.
- RTL/LTR visual fixtures pass.
- Keyboard focus is visible and not obscured.

### Stage 3 — Environment, errors, and observability

Work:

- Add separate server/public environment schemas.
- Add root/route error boundaries and not-found UI.
- Add a provider-neutral observability interface.
- Add a safe development reporter and request/correlation ID strategy.
- Ensure reporting redacts secrets and PII.

Gate:

- Build succeeds without unavailable runtime-only secrets.
- Global error UI works without app providers.
- Expected and unexpected failures behave differently.
- Redaction tests pass.

### Stage 4 — Supabase foundation

Work:

- Add lazy browser, server-session, and admin client factories.
- Add local/test Supabase workflow.
- Add a generic migration with constraints, indexes, and deny-by-default RLS.
- Add generated database types.
- Add one domain-oriented repository interface and implementation.

Gate:

- Migrations apply to an empty test database.
- Type generation succeeds.
- Owner access succeeds.
- Anonymous and cross-user/cross-tenant access are denied.
- Admin/service-role modules cannot enter a client import graph.

### Stage 5 — Network, idempotency, and rate limits

Work:

- Implement explicit timeout and bounded retry behavior.
- Respect `Retry-After`.
- Separate retryable safe reads from non-idempotent mutations.
- Add durable idempotency storage/constraints.
- Add a distributed/platform rate-limit adapter.
- Normalize provider failure categories.

Gate:

- Transient safe requests retry within the cap.
- Ordinary 4xx does not retry.
- 429 respects server timing.
- Unsafe POST does not retry without idempotency.
- Repeated idempotency keys cannot create duplicate records.
- Timers and abort listeners do not leak.

### Stage 6 — Removable vertical slice

Build a generic feature such as `contact-request`:

- public Server Component page
- small accessible Client Component form
- shared schema
- Server Action
- Supabase repository and RLS
- durable idempotency and rate limit
- notification provider adapter
- typed success/failure states
- explicit cache decision
- metadata where applicable

Persistence must succeed before notification delivery. Notification failure must not
delete or roll back the durable record.

Gate:

- Validation, pending, offline, 429, provider failure, retry, and success states work.
- Duplicate submission is safe.
- No console, hydration, accessibility, or secret errors.

### Stage 7 — Security baseline

Work:

- Add origin/CSRF protections appropriate to sensitive mutations.
- Add security headers and CSP.
- Add dependency and secret scanning.
- Add webhook signature/replay utilities if webhook support is part of the template.
- Add PII logging tests.

Gate:

- Applicable `QUALITY.md` security gates pass.
- CSP works in preview.
- No secret enters source, logs, build output, or public variables.
- Authorization/RLS does not rely solely on proxy.

### Stage 8 — Architecture validators

Add precise validators for:

- incomplete/unapproved `AGENTS.client.md`
- forbidden physical RTL utilities/properties
- server-only imports entering client graphs
- `.env.example` versus environment schema
- required route/error conventions
- deprecated version-sensitive patterns
- accidental secrets

Each validator requires positive and negative fixtures. Avoid broad regex rules that
create routine false positives.

Gate:

- `npm run check:architecture` is part of CI.
- An unconfigured client template fails clearly.
- An approved fixture passes.

### Stage 9 — Full verification

Run:

- unit and integration tests
- production build
- E2E critical journey
- axe and manual keyboard verification
- RTL/LTR visual tests
- Supabase migration and RLS tests
- failure injection for persistence, provider, and rate limiter
- clean template creation in a new repository

Gate:

- Every applicable release gate in `QUALITY.md` is satisfied.
- No test calls production.
- A new contributor can follow only the repository documentation and reach green.

### Stage 10 — First release

- Remove dead code and unintentional placeholders.
- Confirm the demo vertical slice is removable.
- Update the changelog in this file.
- Review all governance documents for consistency.
- Protect `main` and require CI checks.
- Configure the repository as a GitHub Template.
- Create `v1.0.0` only after a clean template-created repository passes all gates.

## 3. Creating a client project

1. Create a new repository from an approved boilerplate tag/template.
2. Record the source tag.
3. Rename `CLIENT_BRIEF.template.md` to `CLIENT_BRIEF.md` and record the user's raw
   requirements without secrets or unnecessary real customer data.
4. Follow `CLIENT_INTAKE.md`; complete its clarification and explicit approval workflow
   before product implementation.
5. Copy `AGENTS.client.template.md` to `AGENTS.client.md`.
6. Complete all fields with the decision owner.
7. Set `configuration_status: APPROVED` only after explicit human approval.
8. Remove `AGENTS.client.template.md` from the client repository after approval; the
   mother repository remains its source of truth.
9. Validate routes/SEO, locales, timezone, currencies, auth, PII, retention,
   integrations, systems of record, domain invariants, and test depth.
10. Preserve the raw brief under `docs/discovery/CLIENT_BRIEF.md` and create the approved
    product definition at `docs/PRODUCT.md`.
11. Replace the boilerplate README with a client-specific project README.
12. Remove `CLIENT_INTAKE.md` and any unused brief template from the client repository
    after the intake handoff; keep them in the mother repository.
13. Commit configuration before business features.
14. Run clean install, `npm run check`, and `npm run build`.

An agent may draft the client file. A responsible human approves it.

## 4. Daily development

For each task:

1. Read the routed instruction documents.
2. Inspect repository and dirty worktree.
3. Define the smallest reviewable stage.
4. Add tests with business logic.
5. Run focused checks during implementation.
6. Run the complete applicable gate before handoff.
7. Update contracts, ADRs, and client decisions when the behavior changed.

## 5. Architecture decisions

Create an ADR under `docs/decisions/NNNN-short-title.md` when changing:

- framework/runtime or hosting
- auth/tenancy
- database/system of record
- locale/URL strategy
- caching or shared state model
- provider/observability/rate-limit architecture
- public API/webhook contract
- a LOCKED boilerplate rule

ADR template:

```md
# NNNN — Decision title

- Status: Proposed
- Date: YYYY-MM-DD
- Owner: Name
- Version: Boilerplate/client version

## Context
## Decision drivers
## Options considered
## Decision
## Consequences and trade-offs
## Security, privacy, accessibility, and locale impact
## Migration and rollback
## Verification
```

## 6. Backporting client improvements

1. Confirm the change is generic and contains no client names, secrets, branding, data,
   or domain rules.
2. Isolate it with its tests in a focused client commit.
3. Open an issue/ADR in the boilerplate.
4. Cherry-pick into a boilerplate branch.
5. Re-evaluate it against full boilerplate rules; client exceptions do not transfer.
6. Release it as PATCH/MINOR/MAJOR after all gates pass.

Do not manually copy untracked changes between repositories.

## 7. Upgrading dependencies

Before an upgrade:

- establish a green baseline
- read official release notes, upgrade guides, deprecations, and security advisories
- record current versions, visuals, and bundle behavior
- create a dedicated branch

During:

- upgrade Next.js/React/React DOM as a compatible set
- use official codemods
- update Node/CI runtimes
- avoid mixing product work with a framework major upgrade
- update code, tests, examples, and this documentation together

After:

- clean install
- all checks/build/E2E/a11y/visual/migration tests
- preview deployment inspection
- update changelog and source-version metadata
- release the boilerplate; migrate clients separately

A client is not “upgraded” because one configuration file was copied.

## 8. Release gate

Before any boilerplate release:

- documentation and pinned versions agree
- clean install, check, build, E2E, accessibility, visual, migration, RLS, secret, and
  dependency checks pass
- demo vertical slice works in development and production
- template creation from the candidate tag passes
- no client data or production secrets exist
- migration notes and rollback impact are documented

Before any client production release:

- `AGENTS.client.md` is approved and contains no `TODO`
- environment, migrations, authorization/RLS, providers, accessibility, SEO, and
  observability are verified in preview
- rollback point and owner are recorded
- post-deploy smoke tests and monitoring are ready

## 9. Maintenance cadence

- Security advisories: continuous.
- Dependency review: monthly.
- Governance and official-doc review: quarterly and on every framework major/minor.
- Clean template-creation rehearsal: before every MINOR or MAJOR release.

## 10. Changelog

### Unreleased

- No unreleased changes.

### 1.0.1 — 2026-07-25

- Added a client-ready free-form brief template and an AI intake/clarification protocol.
- Added explicit mother, client-bootstrap, and initialized-client mode detection.
- Documented the clean ZIP workflow and approval boundary before product code.
- Migration impact: none; documentation-only client initialization improvement.
- Rollback: clients may continue using the v1.0.0 manual initialization workflow.

### 1.0.0 — 2026-07-25

- Certified the first executable Next.js App Router mother boilerplate.
- Added strict static, unit, E2E, accessibility, visual RTL/LTR/mobile,
  migration/RLS, dependency, and architecture gates.
- Added durable Supabase persistence, database-backed idempotency and rate limiting,
  provider-neutral notifications, request correlation, and nonce-based CSP.
- Migration impact: first release; client repositories start from this version.
- Rollback: return to the preceding documentation-only commit before creating clients.
