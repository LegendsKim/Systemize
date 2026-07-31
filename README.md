# SYSTEMIZE Platform

The Hebrew, RTL platform for SYSTEMIZE: a public marketing site plus an authenticated
client portal for discovery, proposals, contracts, payments, delivery updates, and
project handoff.

- **Created from:** Systemize Boilerplate `v1.0.1`
- **Decision owner:** Marlen Kimiagrov
- **Deployment target:** Vercel
- **Application stack:** Next.js App Router, strict TypeScript, Supabase

## Documentation map

| Document | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Authoritative engineering constitution and locked rules |
| [`AGENTS.client.md`](./AGENTS.client.md) | Approved SYSTEMIZE-specific configuration |
| [`docs/PRODUCT.md`](./docs/PRODUCT.md) | Product scope, journeys, and acceptance criteria |
| [`docs/discovery/CLIENT_BRIEF.md`](./docs/discovery/CLIENT_BRIEF.md) | Preserved brief and clarification history |
| [`docs/decisions/`](./docs/decisions/) | Accepted architecture decisions |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Routes, modules, data flow, and provider boundaries |
| [`QUALITY.md`](./QUALITY.md) | Security, RLS, testing, CI, and accessibility requirements |
| [`WORKFLOW.md`](./WORKFLOW.md) | Release, upgrade, and backport workflow |

Read `AGENTS.md` first, then `AGENTS.client.md`.

## Requirements

- Node.js 22 or newer
- Docker Desktop and the Supabase CLI for local database work
- Playwright Chromium for browser verification

## Local setup

```bash
npm ci
cp .env.example .env.local
npx supabase start
npm run dev:https
```

Set `SYSTEMIZE_OWNER_GMAIL` to the exact Gmail account used by the initial SYSTEMIZE
owner. Google OAuth is configured in the Supabase dashboard; its client secret must not
be placed in this repository.

HTTPS is required to exercise installation and Web Push outside `localhost`. Generate a
VAPID key pair with `npm run pwa:keys`, then set
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and a random
`CRON_SECRET` of at least 16 characters in every deployed environment. Keep the private
key and cron secret server-only.

No production credentials are required for static checks or the production build.
Authenticated portal journeys and RLS tests require a running local or hosted Supabase
project.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run dev:https` | Start a local HTTPS server for PWA/device testing |
| `npm run pwa:keys` | Generate a Web Push VAPID key pair |
| `npm run build` | Create a production build |
| `npm run check` | Run lint, typecheck, unit tests, architecture checks, and dependency audit |
| `npm run test` | Run unit and integration tests |
| `npm run test:e2e` | Run critical browser journeys |
| `npm run test:e2e:portal` | Reset local Supabase and run the authenticated owner/client intake, document, PDF, and payment journey |
| `npm run test:a11y` | Run automated accessibility checks |
| `npm run test:visual` | Run desktop, mobile, and RTL visual regression checks |
| `npm run test:db` | Reset the local database and run migration/RLS tests |
| `npm run brand:og` | Regenerate the public and private-link social preview images |

## Environments

| Environment | Database | Status |
|---|---|---|
| local | Supabase CLI stack | Requires Docker Desktop |
| preview | Dedicated Supabase project | Pending provisioning |
| production | Dedicated Supabase project | Provisioned |

The recommended next infrastructure step is a separate SYSTEMIZE Supabase project in
Central EU (Frankfurt). Preview and production separation should be introduced before
real client or contract data is stored.

## Current portal foundation

- Gmail-only Google OAuth entry flow
- single-use, Gmail-bound project invitations
- multiple owners or contacts per company and project
- server-authorized owner and client surfaces
- RLS-protected companies, projects, memberships, invitations, and audit events
- deterministic owner/client pending-action views and shared project history
- invitation revoke/reissue controls and owner-managed company, project, and contacts
- intake, meeting scheduling, and manual payment-status gates
- immutable document versions with owner draft/publication controls
- one structured source for the client Web document and private, on-demand PDF
- a database-enforced rule that blocks payment requests until the initial summary is published
- branded, privacy-safe WhatsApp/Open Graph previews for login and invitation links
- responsive portal, lead inbox, and admin navigation
- installable PWA shell with a server-resolved `/app` entry point
- per-device Web Push subscriptions, user notification preferences, durable outbox,
  bounded retry delivery, and automatic invalid-subscription cleanup
- privacy-safe generic Push payloads; full notification content remains behind portal
  authentication
- a service worker that never caches authenticated HTML, RSC payloads, API responses,
  login/auth routes, cookies, or any response carrying `Set-Cookie`/`no-store`

The local authenticated E2E fixtures use fake `e2e.*@gmail.com` identities and are
recreated by `npm run test:e2e:portal`. They must never be copied to a hosted database.

### PWA production gate

Apply the Supabase migrations before enabling the VAPID variables. The durable Push
dispatcher is invoked immediately after relevant notification writes and by
`/api/push/dispatch`; Vercel must send `Authorization: Bearer <CRON_SECRET>`. The
linked Vercel Hobby project runs the recovery scan once daily at 03:00 UTC. Routine
delivery is still requested immediately through Next.js `after()`. If the project moves
to Pro, the recovery schedule may be tightened back to `*/5 * * * *`.

Before enabling Push for real users, verify on one current iPhone and one current
Android device:

1. Install from the browser, launch the icon, and confirm `/app` resolves the currently
   authenticated account and role.
2. Enable notifications from Settings, receive a test notification, and verify its click
   opens the intended authenticated destination.
3. Sign out, sign in as a different account, and confirm no private screen or data from
   the previous account appears, including while offline.
4. Revoke a device and confirm it no longer receives notifications.

The offline page is deliberately generic. Private portal data is never available from
the service-worker cache.

Contract signatures and the dynamic AI update importer remain future slices.
Payment-provider automation is also deferred; the current payment flow uses an external
link and an owner-authoritative receipt record.

## License

UNLICENSED — proprietary.
