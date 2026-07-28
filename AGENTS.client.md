---
configuration_status: APPROVED
boilerplate_version: "v1.0.1"
client_name: "Systemize"
decision_owner: "Marlen Kimiagrov"
last_reviewed: "2026-07-26"
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
  demonstrating automation value and the delivery process behind it.
- **Offer, as stated by the owner on 2026-07-26:** bespoke cloud management systems for
  small and medium businesses in any trade. The customer-facing word is *cloud*, not
  *web*. The site's central claim is that the business dictates how the software is
  built, and the breadth of the client range is the evidence. See `docs/PRODUCT.md` §1;
  the scope-change entry is in §8 below.
- **Primary user groups:**
  - *Public visitor* — anonymous prospective business client. May read all public
    content and submit one lead. May not read, list, or modify any stored lead.
  - *Owner / operator* — Marlen Kimiagrov. Receives Telegram notifications and reads
    leads directly in the Supabase dashboard. **No authenticated admin UI is in scope
    for the MVP.**
- **Required integrations:** Supabase (database), Telegram Bot API (notifications).
  Google Gemini is deferred with the chat assistant; see §8.
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
- **Authenticated/non-indexable routes:** none.
- **Canonical host:** not yet decided — see the production-release blockers in §10.
  Until it is decided, `metadataBase` reads from `NEXT_PUBLIC_SITE_URL` and defaults to
  the local development origin. No production release may occur while this is open.
- **Required structured-data types:** `ProfessionalService`, `FAQPage`. Both derive from
  the same content source as the visible text.
- **Sitemap policy:** all four indexable routes listed; no route is excluded.
- **Analytics/consent requirements:** a compact consent panel is required. Necessary
  cookies are always active; preferences, analytics, and marketing categories default to
  off and remain user-selectable. The choice is stored in a first-party consent cookie
  for 180 days and can be reopened from the footer. No analytics, pixels, or marketing
  providers are currently installed; adding one requires gating it on the relevant
  consent category and updating the privacy text before activation.

Explicit SEO exceptions, with reason:

- The hero background is rendered as a raw `<img>` inside a `<picture>`, from srcSets
  produced by `getImageProps()`. Reason: the `<source>` media query is what keeps the
  artwork off portrait viewports entirely — `display: none` does not reliably prevent a
  fetch, whereas an unmatched `<source>` is never selected, so a phone downloads a 43-byte
  transparent pixel instead of a megabyte. The optimizer still supplies AVIF negotiation
  and responsive variants. This is the documented exception to `AGENTS.md` §9.

## 4. Testing depth

The locked floor for money, authorization, data integrity, persistence, and destructive
operations always applies.

- **Critical end-to-end journeys:**
  1. Visitor submits the Blueprint lead form successfully.
  2. Duplicate submission of the same lead creates exactly one record.
  3. Lead persistence succeeds while Telegram notification fails — the visitor still
     sees success and the record survives.
  4. Visitor navigates the hero's four process milestones from the keyboard, in both
     the landscape and the portrait composition.
- **Required browser/device matrix:** latest Chromium desktop (1440×900) and mobile
  viewport (390×844). Firefox and WebKit are deferred.
- **Visual regression scope:** home page and the three legal routes, each at desktop RTL
  and mobile RTL. The hero is included because it is the primary conversion surface.
- **Accessibility verification scope:** automated axe on every indexable route, plus
  keyboard verification of the hero milestones, FAQ disclosures and the lead form,
  and a reduced-motion check that every hero animation resolves to its finished state.
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
- The hero's trail, its milestone markers and the terrain they stand on are derived from
  one coordinate list. A marker is never positioned independently of the artwork.

## 6. Data and integration boundaries

- **Systems of record:** Supabase — the sole durable store for leads, idempotency keys,
  and rate-limit counters.
- **Notification-only systems:** Telegram Bot API. Best-effort, non-authoritative. Its
  failure is logged and swallowed after the lead is stored.
- **Inbound webhook contracts:** none.
- **Outbound provider contracts:**
  - Telegram `sendMessage` — explicit timeout, no retry on ordinary 4xx, bounded
    backoff with jitter on network failure/429/transient 5xx, honours `Retry-After`.
  - Google Gemini text generation — deferred with the chat assistant; see §8.
- **PII fields and retention:** collected on the lead form — full name, business name,
  phone number, email address, and a free-text description of the need. Purpose:
  responding to a business enquiry. Retention: not yet decided — see the
  production-release blockers in §10. Access: owner only, via Supabase.
  Deletion/export: manual operator action on request.
  Lead PII must never appear in logs, error reports, or analytics.
- **Idempotency requirements:** mandatory on lead submission. Key is generated on the
  client per form session, enforced by a unique database constraint.
- **Rate-limit policy:** database-backed and therefore distributed, never process-local.
  Lead submission: 5 requests per IP per hour, returning a typed, user-visible
  rate-limit state rather than a generic error.

## 7. Approved tunings and exceptions

Only rules explicitly marked **TUNABLE** in `AGENTS.md` may be configured here.

| Rule | Decision | Reason | Owner | Review date |
|---|---|---|---|---|
| §9 SEO and assets — `next/image` for content images | The hero plate is rendered as a raw `<img>` inside a `<picture>`, from `getImageProps()` srcSets | An unmatched `<source>` media query is the only reliable way to keep the artwork off portrait viewports; the optimizer is still used | Marlen Kimiagrov | 2026-10-25 |
| §10 Testing depth — browser matrix | Chromium desktop and mobile only for the MVP | Single-locale marketing site; cross-browser visual coverage deferred to pre-launch | Marlen Kimiagrov | 2026-10-25 |

## 8. Scope changes since approval

Recorded at the owner's direction on the dates given.

| Item | Decision | Effect |
|---|---|---|
| Positioning and vocabulary (2026-07-26) | Systemize builds **bespoke cloud management systems for small and medium businesses in any trade**, not specifically an automation-and-Excel/VBA agency. *Cloud* is the customer-facing word. | Site copy states the offer at its real scope. The "Excel versus SaaS" section becomes **off-the-shelf versus built around you** — same marketing job, correct positioning. No LOCKED rule, route, data field, or integration changes. |
| Savings calculator | **Removed from scope.** Not required at all. | Journey J4 and its rate-limit and formatting requirements no longer apply. `Intl` money formatting stays in `src/lib/i18n` for the lead flow. |
| AI chat assistant | **Deferred.** Not required now. | Journey J5, the Gemini adapter, the chat route and its rate limit are out of the current build. The provider-neutral boundary is still the design if it returns. |
| Cookie preferences (2026-07-27) | **Added.** A compact Systemize-branded consent panel lets visitors accept all, keep only necessary cookies, or choose preferences, analytics, and marketing individually. | Consent is explicit, optional categories default off, the first-party choice expires after 180 days, and settings remain reachable from the footer. No analytics or marketing provider is activated by this UI alone. |

Neither change weakens a LOCKED rule; both narrow the product surface.

## 9. Known deviations

This section documents existing non-compliance. It does not authorize new violations of
a **LOCKED** rule.

| Deviation | Risk | Remediation | Owner | Target date |
|---|---|---|---|---|
| Portfolio, founder, and legal copy ship as clearly marked placeholder content | A premature deploy could publish non-final text | Replace from a single content module before public launch; the launch checklist blocks on it | Marlen Kimiagrov | Before public launch |
| No hosted Supabase project; development runs against the local Supabase CLI stack | Production RLS and migrations are unverified against the real project | Provision the project, apply migrations, re-run RLS tests in preview | Marlen Kimiagrov | Before production release |

## 10. Approval

- **Configuration status:** `APPROVED`
- **Approved by:** Marlen Kimiagrov
- **Approval date:** 2026-07-25
- **Notes:** This approval authorizes implementation against the local Supabase CLI
  stack with clearly marked placeholder content. Three tracked items below block a
  **production release**, not development. They are owned by Marlen Kimiagrov and due
  before the production release.

### Production-release blockers

| Item | Why it blocks | Owner | Due |
|---|---|---|---|
| Canonical domain | `metadataBase`, canonical URLs, sitemap, and absolute Open Graph URLs cannot be correct without it | Marlen Kimiagrov | Before production release |
| Lead PII retention and deletion policy | Personal data is collected without a defined lifetime or deletion path | Marlen Kimiagrov | Before production release |
| Real portfolio, founder, and legal copy | Placeholder text must not be published | Marlen Kimiagrov | Before public launch |
