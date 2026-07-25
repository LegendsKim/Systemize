# Quality, Security, and Verification

This document defines the executable quality baseline for the Systemize boilerplate.
Client configuration may increase test depth but cannot waive the locked risk floor.

## 1. Threat and failure model

Assume:

- Every client payload is malformed or hostile.
- Hidden fields and browser state are attacker-controlled.
- A valid session may lack permission.
- External providers fail, rate-limit, time out, or return unexpected data.
- A timed-out mutation may have completed remotely.
- Serverless processes are ephemeral and do not share memory.
- Logs and preview deployments may have wider visibility than production records.
- Users navigate with keyboards, assistive technology, RTL, zoom, and reduced motion.

Quality gates must demonstrate behavior under these conditions.

## 2. Environment variables and secrets

- Commit `.env.example`; never commit real environment files.
- Validate server and public variables with separate schemas.
- Public variables require deliberate `NEXT_PUBLIC_` naming and review.
- Service-role keys, provider tokens, webhook secrets, and database credentials are
  server-only.
- Do not require runtime-only secrets during `next build`.
- Initialize secret-dependent SDKs lazily.
- Separate development, preview, staging, and production credentials.
- Scan source and build artifacts for secrets in CI.
- Rotate any exposed or suspect credential immediately.

Tests prove missing/invalid production configuration fails safely and secrets never
enter client bundles or observability payloads.

## 3. Supabase security

### Clients

- Browser client: publishable/anon key only.
- Server session client: current session with RLS enforced.
- Admin client: service role, server-only, explicit, rare, and audited.

### Database

- Enable RLS before exposing non-public tables.
- Deny by default, then add the smallest required policies.
- Enforce durable invariants with constraints, uniqueness, foreign keys, and transactions.
- Add indexes for policy/query predicates.
- Ship schema, functions, policies, indexes, and triggers through migrations.
- Regenerate TypeScript database types after schema changes.
- Do not place real PII in seeds or fixtures.

### Required tests

- migrations apply from an empty database
- owner access succeeds
- anonymous access is denied where required
- cross-user and cross-tenant access are denied
- admin client stays server-only
- idempotency/uniqueness constraints prevent duplication
- migration rollback or forward-fix is documented

## 4. Authentication and authorization

- Resolve identity from the trusted server session, not browser-supplied IDs or roles.
- Re-authorize inside every sensitive Server Action and Route Handler.
- Proxy may redirect early but is never the sole authorization layer.
- Prevent open redirects.
- Define session duration, refresh, logout, revocation, recovery, and recent-auth rules.
- Authentication UX targets WCAG 2.2 accessible authentication requirements.
- Avoid unnecessary account-enumeration differences.

Tests cover allow and deny paths, including organization/tenant boundaries.

## 5. Input and output boundaries

- Validate body, query, path, headers, webhooks, forms, and provider responses where
  relevant.
- Set maximum lengths, collection sizes, pagination sizes, upload sizes, and MIME types.
- Normalize optional and nullable fields deliberately.
- IDs crossing API boundaries are strings.
- Timestamps crossing boundaries are UTC ISO 8601.
- Generate authoritative ownership, timestamps, price, and audit fields on the server.
- Use parameterized database access.
- Do not render untrusted HTML without an approved sanitizer.
- Public error envelopes are stable and exclude stack traces/provider secrets.

Tests cover valid, malformed, oversized, missing, and unexpected provider payloads.

## 6. Mutations, idempotency, and data integrity

- Retried non-idempotent mutations require a durable idempotency key.
- Enforce idempotency with database constraints/storage, never an in-memory map.
- Persist enough result state to reconcile a timeout.
- Durable system-of-record writes happen before notification-only providers unless a
  documented domain transaction requires otherwise.
- Notification failure must not silently delete a durable record.
- Destructive operations resolve and authorize exact targets and prefer recoverability.
- Invalidate all actually affected cache entries and no unrelated paths.

Required tests:

- duplicate key produces one durable mutation
- timeout followed by retry reconciles correctly
- provider failure preserves committed system-of-record data
- unauthorized mutation has no side effect
- partial failure produces observable, recoverable state

## 7. Network and provider behavior

- Every outbound request has an explicit timeout.
- Retry only network errors, timeouts, 429, and selected transient 5xx.
- Never retry ordinary 4xx.
- Respect `Retry-After`; otherwise use bounded exponential backoff with jitter.
- Do not retry non-idempotent mutations without durable idempotency.
- Restrict provider destinations and remote image patterns.
- Do not build arbitrary server-side fetch proxies.
- Normalize provider failures into invalid request, configuration/auth, rate limit,
  timeout, transient failure, and permanent rejection.
- Public rate limiting is distributed or platform-enforced.
- Client features expose relevant pending, offline, rate-limited, failure, and retry UI.

Required tests:

- success
- validation/auth rejection
- timeout and cancellation
- network error
- selected 5xx
- 429 with and without `Retry-After`
- exhausted retry cap
- unmount/abort cleanup
- offline transition
- safe versus unsafe retry behavior

## 8. Webhooks and uploads

Webhooks:

- verify signatures against the raw body
- enforce timestamp/replay windows
- apply idempotency
- acknowledge only according to provider contract
- record safe correlation/provider IDs

Uploads, when enabled:

- limit count and size before buffering
- allowlist MIME and verify file signature
- generate storage paths server-side
- separate public/private buckets
- apply storage RLS/policies
- scan risky formats where appropriate
- use safe content disposition/headers
- never execute or import user uploads

## 9. Browser and platform security

Define and verify in deployed responses:

- Content Security Policy
- Strict Transport Security on production HTTPS
- `X-Content-Type-Options: nosniff`
- Referrer Policy
- Permissions Policy
- frame/embed policy

Avoid inline scripts/styles unless the CSP strategy explicitly supports them. Review
analytics, chat, maps, payments, and embeds before expanding policy.

Sensitive cookie-based mutations require transport-appropriate origin/CSRF protection.
CORS is not authentication or abuse prevention.

## 10. PII, logging, and observability

Client configuration identifies PII fields, collection purpose, system of record,
retention, export/deletion process, and approved providers.

Logs and error reports exclude:

- passwords and one-time codes
- access/refresh tokens
- API/service keys and webhook signatures
- full payment data
- full private chat/free-text content
- unnecessary names, emails, phones, and addresses

Prefer request IDs, entity IDs, safe categories, counts, and redacted suffixes.

The observability adapter supports:

- exception capture
- structured safe context
- request/correlation IDs
- provider/status categories
- a no-secret development implementation

Error UI remains usable when observability itself fails.

## 11. Accessibility verification

Target WCAG 2.2 AA.

Automated:

- axe on representative pages and interactive states
- semantic/label/live-region assertions
- contrast tooling where stable
- visual focus and reduced-motion fixtures

Manual keyboard verification:

- natural Tab/Shift+Tab order
- visible, unobscured focus
- Escape and focus restoration
- dialog focus containment
- arrow-key behavior for custom widgets
- skip/navigation landmarks
- zoom/reflow and target size

Automated tools do not replace the manual keyboard pass.

## 12. Testing layers

### Static checks

- TypeScript and ESLint
- client/server import boundaries
- forbidden directional utilities
- client configuration completeness
- environment schema/example parity
- route/error conventions
- deprecated version-sensitive patterns
- secrets

### Unit tests

Pure calculations, parsing, schemas, locale formatting, retry decisions, provider error
mapping, and exhaustive domain states.

Do not unit-test static values or framework implementation details.

### Integration tests

Forms, validation feedback, Server Actions, Route Handlers, repositories, RLS,
authorization, client failure states, and accessible widgets.

### End-to-end tests

Critical authentication, conversion, and business workflows; durable duplicate-safe
mutations; error recovery; RTL/LTR; keyboard behavior; and public metadata.

### Visual tests

Representative RTL/LTR, desktop/mobile, theme, empty/loading/error/populated,
long-content, dialog, and overlay states.

Mask only genuinely non-deterministic content.

## 13. Test design

- Test observable behavior, not hook internals.
- Inject time, randomness, and providers for deterministic tests.
- Mock at provider boundaries and never call production.
- Keep fixtures minimal, typed, and free of real PII.
- Prefer whole-result assertions for domain results.
- Reset test database state predictably.
- Do not export production internals solely for testing.
- Coverage percentage is diagnostic; it never replaces required scenario coverage.

## 14. Canonical commands and CI

The executable boilerplate provides stable entry points:

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

Recommended CI jobs:

1. locked install
2. client-config/architecture validation
3. lint and typecheck
4. unit/integration tests
5. production build
6. E2E/accessibility
7. visual comparison
8. migration/RLS tests
9. dependency/secret scans

Protect `main` with required checks. Retain failure reports and screenshots as artifacts.

## 15. Boilerplate release gate

Before a boilerplate tag:

- [ ] Governance documents agree and version-sensitive guidance was verified.
- [ ] Clean install, `check`, and production build pass.
- [ ] E2E, accessibility, visual, migration, and RLS tests pass.
- [ ] Dependency and secret scans pass.
- [ ] Demo vertical slice works and is removable.
- [ ] Timeout, offline, 429, retry exhaustion, and duplicate mutation are demonstrated.
- [ ] RTL and LTR fixtures pass.
- [ ] CSP and security headers pass in preview.
- [ ] No client branding, PII, production secret, or active client config exists.
- [ ] A new repository created from the candidate template reaches green.
- [ ] Migration notes, semantic version, and rollback impact are documented.

## 16. Client production release gate

- [ ] `AGENTS.client.md` is approved and contains no `TODO`.
- [ ] Exact boilerplate source version is recorded.
- [ ] Environment, auth, RLS, PII, retention, and providers match approved decisions.
- [ ] Critical E2E, accessibility, and RTL/LTR visual reviews pass in preview.
- [ ] Production migrations and rollback/forward-fix are reviewed.
- [ ] Provider failure cannot lose durable data.
- [ ] Metadata, canonical host, robots, sitemap, icons, and OG assets are verified.
- [ ] Observability receives safe events without PII.
- [ ] Deployment owner, rollback point, smoke tests, and monitoring are ready.

Every handoff reports exact commands, results, tests not run, and remaining manual checks.
