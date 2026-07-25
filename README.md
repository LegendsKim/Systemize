# Systemize — Marketing Site

Public, single-page marketing and lead-generation site for Systemize, a business
automation and Excel/VBA services agency. Hebrew only, right-to-left.

- **Created from:** Systemize Boilerplate `v1.0.1`
- **Decision owner:** Marlen Kimiagrov
- **Deployment target:** Vercel

## Documentation map

| Document | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Engineering constitution. Authoritative, LOCKED rules. |
| [`AGENTS.client.md`](./AGENTS.client.md) | Client configuration — the TUNABLE decisions for this project. |
| [`docs/PRODUCT.md`](./docs/PRODUCT.md) | Approved product scope, journeys, and acceptance criteria. |
| [`docs/discovery/CLIENT_BRIEF.md`](./docs/discovery/CLIENT_BRIEF.md) | Preserved raw brief and clarification history. |
| [`docs/decisions/`](./docs/decisions/) | Architecture decision records. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Routes, modules, data flow, RSC boundaries, providers. |
| [`QUALITY.md`](./QUALITY.md) | Security, RLS, testing, CI, and accessibility verification. |
| [`WORKFLOW.md`](./WORKFLOW.md) | Release, upgrade, and backport process. |

Read `AGENTS.md` first, then `AGENTS.client.md`.

## Requirements

- Node.js 22 or newer (see `.node-version`)
- Supabase CLI, for local database work
- Docker, required by the local Supabase stack
- Playwright Chromium (`npx playwright install chromium`) for browser tests

## Setup

```bash
npm ci
cp .env.example .env.local   # then fill in local values
npx supabase start           # local Postgres, auth, and storage
npm run dev
```

No production credentials are required to build, test, or develop. Absent provider
credentials degrade to safe local behaviour:

- **Supabase** — the local CLI stack is the development database.
- **Telegram** — the notification adapter no-ops when unconfigured.
- **Gemini** — the chat falls back to the local Hebrew intent adapter.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run check` | lint, typecheck, unit tests, architecture, dependency audit |
| `npm run test` | Unit and integration tests |
| `npm run test:e2e` | Critical journey end-to-end tests |
| `npm run test:a11y` | axe accessibility scan |
| `npm run test:visual` | Visual regression, desktop and mobile RTL |
| `npm run test:db` | Reset the local database and run migration/RLS tests |
| `npm run check:architecture` | Structural validators, including client-config completeness |

`npm run check` fails while `AGENTS.client.md` is `UNCONFIGURED`. That is intentional —
it is the gate that blocks product implementation before the configuration is approved.

## Environments

| Environment | Database | Notes |
|---|---|---|
| local | Supabase CLI stack | No production secrets |
| preview | Supabase project | Pending provisioning |
| production | Supabase project | Blocked on canonical domain and PII retention policy |

## Open items before production

1. Canonical domain — required for `metadataBase`, canonical URLs, and sitemap.
2. Lead PII retention and deletion policy.
3. Replacement of placeholder portfolio, founder, and legal copy.
4. Gemini API key and a hosted Supabase project.

See [`docs/PRODUCT.md`](./docs/PRODUCT.md) §8.

## License

UNLICENSED — proprietary.
