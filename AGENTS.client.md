---
configuration_status: UNCONFIGURED
boilerplate_version: "v1.0.1"
client_name: "Systemize"
decision_owner: "Marlen Kimiagrov"
last_reviewed: "2026-07-25"
project_phase: "MVP"
deployment_target: "Vercel"
data_classification: "confidential"
---

# Client Configuration — Systemize Marketing Site

This file configures **TUNABLE** decisions for the Systemize marketing and
lead-generation site. It does not grant exemptions from **LOCKED** rules in `AGENTS.md`.

Authoritative product definition: `docs/PRODUCT.md`.
Preserved raw input: `docs/discovery/CLIENT_BRIEF.md`.

## 1. Product and stack

- **System type:** Public, single-page marketing and lead-generation site.
- **Business objective:** Convert business visitors into qualified leads by
  demonstrating automation value, quantifying ROI, and offering a guided AI chat.
- **Primary user groups:**
  - *Public visitor* — anonymous prospective business client. May read all public
    content, use the savings calculator, use the chat assistant, and submit one lead.
    May not read, list, or modify any stored lead.
  - *Owner / operator* — Marlen Kimiagrov. Receives Telegram notifications and reads
    leads directly in the Supabase dashboard. **No authenticated admin UI is in scope
    for the MVP.**
- **Required integrations:** Supabase (database), Telegram Bot API (notifications),
  Google Gemini (chat generation, behind a provider-neutral adapter).
- **Database:** Supabase.
- **Authentication model:** none — the public site has no sign-in.
- **Environments:** local, preview, production.

## 2. Locale and regional behavior

- **Supported locales:** `["he"]`
- **Default locale:** `he`
- **URL locale strategy:** unprefixed default — a single locale means no locale segment.
- **Default timezone:** `Asia/Jerusalem`
- **Supported currencies:** `["ILS"]`
- **RTL locales:** `["he"]` — the entire site renders `dir="rtl"`.

Timestamps are stored and transmitted in UTC and formatted at the presentation edge with
an explicit `he-IL` locale and the `Asia/Jerusalem` IANA timezone. Money is formatted
with `Intl.NumberFormat` and the explicit `ILS` currency code.

## 3. Public routes and SEO

- **Public/indexable routes:** `/`, `/privacy`, `/terms`, `/accessibility`
- **Authenticated/non-indexable routes:** none. `/api/chat` is a Route Handler, not an
  indexable document.
- **Canonical host:** `OPEN — owner and decision date required`. Until it is decided,
  `metadataBase` reads from `NEXT_PUBLIC_SITE_URL` and defaults to the local
  development origin. No production release may occur while this is open.
- **Required structured-data types:** `ProfessionalService`, `FAQPage`. Both derive from
  the same content source as the visible text.
- **Sitemap policy:** all four indexable routes listed; no route is excluded.
- **Analytics/consent requirements:** no analytics and no marketing cookies in the MVP,
  therefore no consent banner is required. Adding analytics later requires a new
  decision recorded in this file.

Explicit SEO exceptions, with reason:

- The hero background uses a raw `<picture>` element instead of `next/image`. Reason:
  `next/image` does not support art direction, and the hero requires a different render
  for portrait viewports. Explicit `width`/`height` are set to reserve layout space, and
  the LCP candidate is preloaded. This is the documented exception to `AGENTS.md` §9.

## 4. Testing depth

The locked floor for money, authorization, data integrity, persistence, and destructive
operations always applies.

- **Critical end-to-end journeys:**
  1. Visitor submits the Blueprint lead form successfully.
  2. Duplicate submission of the same lead creates exactly one record.
  3. Lead persistence succeeds while Telegram notification fails — the visitor still
     sees success and the record survives.
  4. Visitor adjusts the savings calculator and sees a correctly formatted ILS result.
  5. Visitor opens the chat assistant, sends a message, and receives a reply.
- **Required browser/device matrix:** latest Chromium desktop (1440×900) and mobile
  viewport (390×844). Firefox and WebKit are deferred.
- **Visual regression scope:** home page and the three legal routes, each at desktop RTL
  and mobile RTL. The hero is included because it is the primary conversion surface.
- **Accessibility verification scope:** automated axe on every indexable route, plus
  manual keyboard verification of the hero milestones, services accordion, savings
  calculator, lead form, and chat dialog.
- **Deferred non-critical coverage:** cross-browser Firefox/WebKit visual coverage —
  owner Marlen Kimiagrov, target milestone: before public launch.

## 5. Domain invariants

Business rules that must never be inferred or altered by an agent.

- A lead is durably persisted to Supabase **before** any notification delivery is
  attempted. A Telegram failure never deletes, rolls back, or hides the stored lead, and
  never turns a successful submission into a user-visible error.
- Every lead submission is protected by a durable idempotency key. Replaying the same
  key never creates a second lead record and never sends a second notification.
- Lead identity, ownership, and audit fields — `id`, `created_at`, request correlation —
  are generated on the server. A client-supplied value for any of them is ignored.
- Lead records are never hard-deleted by application code. Deletion is an explicit,
  manual operator action tied to the retention policy.
- The savings calculator is an illustrative estimate, not a quotation. Its output must
  never be persisted as a commercial commitment or presented as a binding price.
- The chat assistant never asks for, echoes, or stores payment details, credentials, or
  government identifiers.

## 6. Data and integration boundaries

- **Systems of record:** Supabase — the sole durable store for leads, idempotency keys,
  and rate-limit counters.
- **Notification-only systems:** Telegram Bot API. Best-effort, non-authoritative. Its
  failure is logged and swallowed after the lead is stored.
- **Inbound webhook contracts:** none.
- **Outbound provider contracts:**
  - Telegram `sendMessage` — explicit timeout, no retry on ordinary 4xx, bounded
    backoff with jitter on network failure/429/transient 5xx, honours `Retry-After`.
  - Google Gemini text generation — explicit timeout, same retry policy. Selected only
    when its API key is configured; otherwise the local Hebrew intent adapter serves.
- **PII fields and retention:** collected on the lead form — full name, business name,
  phone number, email address, and a free-text description of the need. Purpose:
  responding to a business enquiry. Retention: `OPEN — owner and decision date
  required`; must be resolved before production. Access: owner only, via Supabase.
  Deletion/export: manual operator action on request.
  Lead PII must never appear in logs, error reports, analytics, or the chat transcript.
- **Idempotency requirements:** mandatory on lead submission. Key is generated on the
  client per form session, enforced by a unique database constraint.
- **Rate-limit policy:** database-backed and therefore distributed, never process-local.
  Lead submission: 5 requests per IP per hour. Chat messages: 30 requests per IP per
  hour. Both return a typed, user-visible rate-limit state rather than a generic error.

## 7. Approved tunings and exceptions

Only rules explicitly marked **TUNABLE** in `AGENTS.md` may be configured here.

| Rule | Decision | Reason | Owner | Review date |
|---|---|---|---|---|
| §9 SEO and assets — `next/image` for content images | Hero background plates use a raw `<picture>` element with explicit dimensions and an LCP preload | `next/image` has no art-direction support; the hero needs distinct landscape and portrait renders | Marlen Kimiagrov | 2026-10-25 |
| §10 Testing depth — browser matrix | Chromium desktop and mobile only for the MVP | Single-locale marketing site; cross-browser visual coverage deferred to pre-launch | Marlen Kimiagrov | 2026-10-25 |

## 8. Known deviations

This section documents existing non-compliance. It does not authorize new violations of
a **LOCKED** rule.

| Deviation | Risk | Remediation | Owner | Target date |
|---|---|---|---|---|
| Portfolio, founder, and legal copy ship as clearly marked placeholder content | A premature deploy could publish non-final text | Replace from a single content module before public launch; the launch checklist blocks on it | Marlen Kimiagrov | Before public launch |
| No Gemini API key is provisioned; the local Hebrew intent adapter is the active chat path | Chat answers are narrower than the brief describes | Provide `GEMINI_API_KEY`; adapter selection is environment-driven and needs no code change | Marlen Kimiagrov | Before public launch |
| No hosted Supabase project; development runs against the local Supabase CLI stack | Production RLS and migrations are unverified against the real project | Provision the project, apply migrations, re-run RLS tests in preview | Marlen Kimiagrov | Before production release |

## 9. Approval

- **Configuration status:** pending explicit owner approval
- **Approved by:** pending
- **Approval date:** pending
- **Notes:** Three items remain `OPEN` and block a production release, not development:
  canonical host, lead PII retention policy, and final content. Approval of this file
  authorizes implementation against the local Supabase stack and placeholder content.
