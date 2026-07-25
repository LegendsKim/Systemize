@AGENTS.md

# Claude Code project memory — Systemize marketing site

This is an **initialized client repository**, created from Systemize Boilerplate v1.0.1.
`AGENTS.client.md` is `APPROVED`.

`AGENTS.md` is the single authoritative engineering constitution. Do not duplicate or
reinterpret it here.

Read before acting on any task:

1. `AGENTS.md` — LOCKED rules.
2. `AGENTS.client.md` — the approved TUNABLE configuration for this project.
3. `docs/PRODUCT.md` — approved scope, journeys, and acceptance criteria.
4. The task-relevant reference document from the routing table in `AGENTS.md` §1.

Project shape:

- Public, single-page Hebrew marketing and lead-generation site. RTL throughout.
- No authentication anywhere. There is no admin UI.
- Supabase is the only system of record. Telegram is notification-only, best-effort.
- Gemini sits behind a provider-neutral server adapter with a local Hebrew intent
  fallback that is the active path until an API key is configured.

Standing constraints for this repository:

- Server Components by default. `"use client"` is limited to the savings calculator,
  the lead form, and the chat widget, each at the smallest coherent subtree.
- Logical CSS properties only. `npm run check:architecture` rejects physical directional
  layout, and it must never be bypassed.
- A lead is persisted to Supabase before any notification is attempted. Notification
  failure never rolls back, hides, or fails the submission.
- Every lead submission is guarded by a durable idempotency key.
- Lead PII must not appear in logs, error reports, or chat transcripts.
- Hero geometry is expressed in `viewBox` units or percentages, never in fixed pixels.
- Builds and tests must never require real production credentials.

Before declaring work complete, run `npm run check` and `npm run build`, plus the
task-relevant E2E, accessibility, visual, and migration tests. Report the exact commands
and their results.

Ask for input only when a missing choice changes product scope, paid providers, external
infrastructure, or irreversible behavior. Otherwise use the documented defaults and
continue.
