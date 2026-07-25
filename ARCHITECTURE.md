# Architecture Reference

This document defines the default architecture of the executable Systemize boilerplate.
It is explanatory; `AGENTS.md` remains the normative rule source.

## 1. Goals

- Server-rendered by default.
- Small, auditable client islands.
- Explicit data ownership and dependency direction.
- RTL/LTR and locale correctness from the first route.
- Supabase persistence with RLS and migration discipline.
- Replaceable third-party providers through server-only adapters.
- Failure states designed as part of each feature.
- A structure that remains useful for both public sites and authenticated systems.

## 2. Default project structure

```text
src/
  app/
    (public)/
    (app)/
    api/
    layout.tsx
    error.tsx
    global-error.tsx
    not-found.tsx
    robots.ts
    sitemap.ts
  components/
    ui/
    shared/
  features/
    feature-name/
      components/
      schemas.ts
      actions.ts
      queries.ts
      types.ts
      __tests__/
  lib/
    env/
    i18n/
    network/
    observability/
    supabase/
  server/
    adapters/
    repositories/
    services/
supabase/
  migrations/
  seed.sql
scripts/
tests/
  e2e/
  visual/
```

Create a directory only when it has a real consumer. Empty “future architecture”
folders are not required.

## 3. Dependency direction

Allowed dependency flow:

```text
app/routes
  ↓
feature UI / actions / queries
  ↓
domain services
  ↓
repositories and provider adapters
  ↓
Supabase and external providers
```

Rules:

- UI does not import Supabase SDKs directly.
- Repositories do not import React.
- Provider adapters do not import feature UI.
- Shared UI primitives do not import business features.
- Client Components do not import server-only repositories, env modules, or admin SDKs.
- Route Handlers orchestrate boundaries; they do not become large domain services.

## 4. Rendering model

### Server Components

Use for:

- Pages, layouts, navigation, metadata, and static content.
- Initial authenticated data.
- Database queries and server-only provider calls.
- JSON-LD and canonical content.

### Client Components

Use for:

- Local interaction and controlled inputs.
- Browser APIs.
- Effects and event handlers.
- Client-only accessible primitives.

A Client Component may receive serializable data and server functions through supported
framework boundaries. Do not mark a page client-side merely to host one interactive
control.

## 5. Route organization

- `(public)` contains public/indexable pages.
- `(app)` contains authenticated application pages.
- API endpoints live under `app/api` only when a Route Handler is the correct boundary.
- Server Actions are preferred for same-application form mutations.
- Route Handlers are preferred for public APIs, webhooks, streaming, and integrations.
- Route groups organize code but do not define security. Authorization still happens at
  the sensitive server boundary.

## 6. Locale and direction

Provide one source of truth:

```ts
export const supportedLocales = ["he", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}
```

Client projects configure the actual locale set. Layouts derive `lang` and `dir` from
that configuration. Components use logical spacing and positioning even when the
initial project supports only one direction.

Formatting helpers require explicit:

- locale
- IANA timezone
- currency code

## 7. Supabase boundaries

The boilerplate supplies separate lazy factories:

- Browser client: anon/publishable credentials only.
- Server user client: request cookies/session, RLS enforced.
- Admin client: service-role credentials, server-only, rare and audited.

Repositories expose domain-oriented functions rather than generic table access:

```ts
export interface LeadRepository {
  create(input: CreateLeadRecord): Promise<LeadRecord>;
  findByIdempotencyKey(key: string): Promise<LeadRecord | null>;
}
```

Database types are generated from the migrated schema. Migrations, RLS policies, indexes,
constraints, and triggers are reviewed together.

## 8. Mutations and idempotency

A mutation flow should be:

```text
untrusted input
  → schema validation
  → authentication/authorization
  → rate-limit/origin checks
  → idempotency lookup
  → durable transaction
  → cache invalidation
  → best-effort notification
  → typed result
```

Persistence is completed before a notification provider is called unless the documented
domain transaction explicitly requires another order.

## 9. Provider adapters

Email, chat, Telegram, payments, storage, and analytics integrations use narrow
server-only contracts.

```ts
/** Sends a notification after the related record is durably persisted. */
export interface NotificationProvider {
  send(notification: Notification): Promise<NotificationResult>;
}
```

Adapters normalize provider errors into domain-safe categories:

- invalid request
- unauthorized/configuration
- rate limited
- timeout
- transient provider failure
- permanent provider rejection

Provider SDK objects are initialized lazily.

## 10. Fetching and caching

Each query documents:

- source of truth
- freshness requirement
- cache scope
- cache tags
- authorization scope
- invalidation owner

Do not share user-specific data through a public cache. Avoid fetching an internal Route
Handler from a Server Component when the component can call the same server service
directly.

## 11. Error and observability model

Expected failures are typed results rendered close to the interaction. Unexpected
failures are logged once with:

- request/correlation ID
- route/action name
- safe error category
- provider/status metadata
- no unnecessary PII

The observability module exposes a provider-neutral interface and a safe development
implementation. Error UI must still work when every provider fails.

## 12. Reference vertical slice

The boilerplate's demo feature must prove the architecture:

- public Server Component page
- accessible client form leaf
- shared schema
- Server Action
- Supabase repository with RLS
- idempotent persistence
- notification adapter
- cache decision
- observability
- unit, integration, E2E, accessibility, and failure tests

If the demo cannot be removed without breaking core infrastructure, it is too coupled.

## 13. Architecture Decision Records

Use ADRs for durable decisions affecting multiple features, public contracts, security,
deployment, or maintenance. The workflow and template live in `WORKFLOW.md`.

An ADR is required for:

- runtime, framework, or hosting strategy
- authentication or tenancy
- database/system-of-record selection
- URL and locale strategy
- caching or shared-state architecture
- observability, queue, rate-limit, or provider platform
- public API/webhook contracts
- any proposed change to a LOCKED boilerplate rule

Routine component choices do not require ADRs.

Accepted ADRs live under `docs/decisions/` and are immutable except for status and links
to a superseding decision. A replacement decision creates a new ADR.
