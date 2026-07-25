# Systemize Engineering Constitution

This is the authoritative instruction file for AI agents and contributors.

## 1. Read order and scope

Always read:

1. `AGENTS.md`
2. `AGENTS.client.md`, when working in a client repository
3. Task-relevant reference documents from the routing table below

| Task | Additional document |
|---|---|
| Initial boilerplate build, client creation, upgrade, backport, release | `WORKFLOW.md` |
| New client intake from a natural-language brief | `CLIENT_INTAKE.md` |
| Routes, modules, data flow, RSC boundaries, providers, Supabase structure | `ARCHITECTURE.md` |
| Security, auth, RLS, PII, network, testing, CI, accessibility verification | `QUALITY.md` |

The boilerplate repository intentionally has no active `AGENTS.client.md`. A client
repository must copy `AGENTS.client.template.md` to `AGENTS.client.md`, complete every
`TODO`, set `configuration_status: APPROVED`, and obtain owner approval before product
implementation.

Client instructions may configure only rules marked **TUNABLE**. They may not silently
weaken a **LOCKED** rule. User instructions define the requested outcome but do not
silently authorize unrelated or unsafe changes.

Rule words:

- **MUST / MUST NOT** — build-blocking.
- **SHOULD / SHOULD NOT** — strong default; deviation requires a documented reason.
- **MAY** — optional.

## 2. Architecture — LOCKED

- Use Next.js App Router and strict TypeScript.
- Pages, layouts, and components are Server Components by default.
- Add `"use client"` only for state, events, effects, browser APIs, or client-only
  libraries. Put a one-line reason directly after the directive.
- Keep client boundaries at the smallest coherent interactive subtree.
- Mark sensitive modules `server-only`; never leak secrets or admin SDKs into client
  import graphs.
- Keep server data on the server and shareable view state in the URL.
- Use local state locally, composition before Context, scoped Context for real subtree
  state, and Zustand only for justified high-frequency cross-branch client state.
- Zustand uses selectors. Every in-memory collection has a bound or eviction policy.
- Database and provider access belongs in server-only repositories/adapters, not UI.
- Initialize database, queue, Redis, email, and provider SDK clients lazily.
- Public APIs, schemas, URLs, webhooks, and exported contracts stay small and stable.

See `ARCHITECTURE.md`.

## 3. Hydration and effects — LOCKED

- The initial server and client render must be deterministic.
- Do not initially render browser state, ambient timezone/locale output, `Date.now()`,
  `Math.random()`, dimensions, or `localStorage`.
- `suppressHydrationWarning` is a reviewed last resort.
- Do not mutate React-owned DOM outside a documented integration.
- Effects have exhaustive dependencies.
- Listeners, timers, observers, intervals, sockets, and subscriptions always clean up.
- Async client work must be abortable or prevent updates after unmount.
- Unbounded polling, retries, and client memory growth are forbidden.

## 4. Data, caching, and mutations — LOCKED

- Every server `fetch()` states cache intent explicitly:
  - `cache: "force-cache"` plus tags for shared cacheable data.
  - `next: { revalidate, tags }` for time-bounded shared data.
  - `cache: "no-store"` for request-specific or mutation traffic.
- Do not assume the framework fetch default.
- Cache tags are required only for mutable cacheable resources.
- A mutation invalidates every cache entry it actually affects. Do not add meaningless
  invalidation when no cached resource changes.
- Do not call an internal Route Handler from a Server Component when both can call the
  same server-only service directly.
- Same-render duplicate reads use a shared/memoized data function.
- Expected failures return typed results. Unexpected failures reach a safe boundary.
- Dynamic/third-party route segments have `error.tsx`.
- `global-error.tsx` is self-contained and does not depend on app providers.

## 5. Reliability and idempotency — LOCKED

- Every client and server network call has an explicit timeout.
- Retry only network failures, timeouts, 429, and selected transient 5xx.
- Ordinary 4xx responses are not retried.
- Retries are bounded exponential backoff with jitter and honor `Retry-After`.
- Never retry a non-idempotent mutation unless a durable idempotency key is enforced.
- A timeout does not prove a remote mutation failed; reconcile by idempotency key.
- Client network features expose relevant pending, offline, rate-limit, failure, and
  recovery states.
- Serverless rate limiting is distributed or platform-enforced, never process-local.

## 6. Security and Supabase — LOCKED

- Validate environment variables and every untrusted payload at server boundaries.
- Authentication does not imply authorization. Re-authorize inside every sensitive
  Server Action and Route Handler.
- Browser clients use publishable credentials only. Supabase service-role credentials
  are server-only, rare, and audited.
- Non-public tables enable RLS and ship allow/deny policy tests.
- Database changes are migrations; production dashboard-only schema edits are forbidden.
- Generate authoritative timestamps, identity, ownership, and audit fields on the server.
- Sensitive mutations use transport-appropriate origin/CSRF protection.
- Logs exclude secrets, tokens, full private payloads, and unnecessary PII.
- Webhooks verify signatures, raw body, and replay windows.

See `QUALITY.md`.

## 7. Locale, RTL, dates, and money — LOCKED

- Locale, timezone, currency, and route strategy come from client configuration.
- Root `<html lang>` and `dir` are derived from the active locale configuration.
- Semantic layout uses logical Tailwind utilities/CSS properties: `ms`, `me`, `ps`,
  `pe`, `start`, `end`, `text-start`, and logical borders/radii.
- Physical directional layout utilities (`ml`, `mr`, `pl`, `pr`, `left`, `right`,
  `text-left`, `text-right`, physical borders/radii) are forbidden.
- Directional icons mirror in RTL; non-directional symbols do not.
- Store/transmit UTC timestamps. Format at the presentation edge with explicit locale
  and IANA timezone.
- Format money with `Intl.NumberFormat` and an explicit ISO currency code.

## 8. Accessibility — LOCKED

- Target WCAG 2.2 AA.
- Prefer native semantic elements over custom roles.
- Never use clickable generic elements when a button/link/input/details/dialog applies.
- Custom widgets follow WAI-ARIA Authoring Practices.
- Use audited dialog/menu primitives when possible.
- Dialogs trap focus, close on Escape, block background interaction, and restore focus.
- Keyboard order follows visual order; `tabIndex > 0` is forbidden.
- Inputs have associated labels and actionable, announced errors.
- Dynamic status uses appropriate live regions.
- Images have correct meaningful/decorative alternatives.
- Verify contrast, focus visibility, focus not obscured, target size, and reduced motion.

## 9. SEO and assets — TUNABLE

- Client configuration identifies public/indexable routes.
- Every indexable page has route-appropriate title, description, canonical, Open Graph,
  Twitter Card, and robots policy.
- Non-indexable pages explicitly define robots behavior.
- Dynamic metadata and structured data use the same source as visible content.
- Missing dynamic entities call `notFound()`.
- Content images use `next/image` with reserved dimensions; inline SVG icons and
  framework-generated metadata images are valid exceptions.
- Use the preload mechanism supported by the pinned Next.js version for the LCP image.
- Fonts use `next/font` or approved self-hosting.
- Public sites provide sitemap, robots, icons, and an Open Graph image.

## 10. Testing and code quality — LOCKED FLOOR, TUNABLE DEPTH

- Money, authorization, RLS, data integrity, persistence, idempotency, migrations, and
  destructive behavior always require tests.
- Pure domain logic gets unit tests; user behavior gets integration tests; critical
  journeys get E2E tests.
- UI changes receive visual coverage when tooling exists.
- Accessibility-critical flows get automated and manual keyboard verification.
- Tests are deterministic and never call production services.
- Strict TypeScript is required. Avoid `any`; narrow `unknown` at boundaries.
- Keep exports and props minimal. Domain unions are exhaustively handled.
- Avoid dumping-ground modules and unnecessary abstraction.
- Target modules below 500 lines and reviewable changes below roughly 800 changed lines.
- Preserve unrelated user work and disclose breaking contract changes.

See `QUALITY.md`.

## 11. Completion gate

Before declaring work complete:

- Run the repository's canonical `check` command and production build.
- Run task-relevant E2E, accessibility, visual, migration, and provider tests.
- Report exact commands and results.
- Confirm no unconfigured client placeholders, secrets, hydration warnings, physical RTL
  layout, unsafe retries, missing authorization, or unbounded collections remain.
- Update documentation when architecture, contracts, dependencies, or workflow changed.

Manual checklist claims never replace executable CI checks.
