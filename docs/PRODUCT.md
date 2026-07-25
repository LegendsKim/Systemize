# Systemize Marketing Site — Product Definition

- Client: Systemize
- Decision owner: Marlen Kimiagrov
- Boilerplate source: Systemize Boilerplate v1.0.1
- Status: awaiting owner approval
- Last reviewed: 2026-07-25

Raw input is preserved at `docs/discovery/CLIENT_BRIEF.md`. Implementation-governing
configuration lives in `AGENTS.client.md`. This document defines *what* is being built
and how completion is judged.

---

## 1. Objective and success criteria

Systemize is a business-automation and Excel/VBA services agency. The site is a public,
single-page marketing and lead-generation platform whose purpose is to convert business
visitors into qualified leads.

Success criteria:

1. A visitor can understand what Systemize does and how it works within one screen of
   the hero.
2. A visitor can quantify their own potential saving without contacting anyone.
3. A visitor can submit a lead in under a minute, and that lead is never lost.
4. The visual quality of the site is itself a sales argument — the hero must render
   identically proportioned on every viewport from 360px to 2560px.

Explicitly not a success criterion: authenticated admin tooling, multi-language support,
or e-commerce.

---

## 2. Users

| User | Access | May do | May not do |
|---|---|---|---|
| Public visitor | Anonymous | Read all public content, use the savings calculator, use the chat assistant, submit a lead | Read, list, enumerate, or modify any stored lead; read any other visitor's chat |
| Owner / operator | Supabase dashboard + Telegram | Read and manage leads, receive notifications | — (no in-app admin surface exists in the MVP) |

There is no sign-in anywhere on the site.

---

## 3. Scope

### 3.1 In scope — MVP

**Single-page marketing surface** (`/`), composed of:

1. **Hero** — 3D render background with an animated turquoise trail and four labelled
   process milestones (אפיון · תכנון · פיתוח · הטמעה), headline, sub-copy, and a primary
   call to action.
2. **Value proposition** — why systems are built around the business, not the reverse.
3. **Before / after automation** — a two-column comparison of manual versus automated
   workflow.
4. **Services and capabilities** — expandable accordions describing each service.
5. **Portfolio examples** — project cards. Placeholder content at MVP.
6. **Excel versus SaaS** — a semantic comparison table.
7. **Founder** — who is behind Systemize.
8. **Savings calculator** — a live client-side ROI estimate in ILS.
9. **Blueprint lead form** — the primary conversion surface.
10. **AI chat assistant** — a floating dialog that guides visitors toward conversion.

**Standalone indexable routes:** `/privacy`, `/terms`, `/accessibility`. These are real
pages, not modals.

**Server capabilities:** durable lead persistence, idempotent submission, distributed
rate limiting, best-effort Telegram notification, provider-neutral chat generation.

### 3.2 Out of scope — MVP

- Any authenticated area, admin dashboard, or lead management UI.
- Any locale other than Hebrew; any currency other than ILS.
- Payments, quotations, contracts, or scheduling/booking.
- Analytics, marketing pixels, cookie consent.
- Blog, CMS, or editorable content.
- Email delivery. Telegram is the only notification channel.
- File uploads or attachments on the lead form.

### 3.3 Deferred

| Item | Owner | Milestone |
|---|---|---|
| Real portfolio content and founder copy | Marlen Kimiagrov | Before public launch |
| Gemini API key, enabling the full chat path | Marlen Kimiagrov | Before public launch |
| Hosted Supabase project and preview RLS verification | Marlen Kimiagrov | Before production release |
| Firefox and WebKit visual coverage | Marlen Kimiagrov | Before public launch |
| Final legal copy authored by a competent party | Marlen Kimiagrov | Before public launch |

---

## 4. Critical journeys and acceptance criteria

### J1 — Submit a lead

*Given* a visitor has completed the Blueprint form with valid details,
*when* they submit,
*then* the lead is written to Supabase before any notification is attempted, a Telegram
message is sent on a best-effort basis, and the visitor sees an explicit success state.

Acceptance:
- Invalid input is rejected on the server with field-level, announced error messages.
- The pending state is visible and the submit control is disabled while in flight.
- Offline and rate-limited (429) states are distinct from a generic failure.
- The network call has an explicit timeout.
- No lead PII appears in any log line.

### J2 — Duplicate submission is safe

*Given* a visitor submits, and the response is lost or they submit twice,
*when* the same idempotency key arrives again,
*then* exactly one lead row exists and exactly one Telegram message was sent.

Acceptance: verified by an automated test that replays the identical key.

### J3 — Notification failure does not lose the lead

*Given* Telegram is unreachable or returns an error,
*when* a lead is submitted,
*then* the lead row persists, the visitor sees success, and the failure is recorded in
observability without PII.

Acceptance: verified by fault injection against the notification adapter.

### J4 — Estimate a saving

*Given* a visitor adjusts the calculator inputs,
*when* values change,
*then* the estimated annual saving updates immediately and is formatted as ILS via
`Intl.NumberFormat("he-IL", …)`.

Acceptance:
- The pure calculation function has unit tests covering zero, typical, and boundary
  inputs.
- The initial server and client render are identical — no `Date.now()`, no `Math.random()`,
  no `localStorage` in the first render.
- The result is announced in a polite live region.
- The output is labelled as an estimate, never as a quotation.

### J5 — Use the chat assistant

*Given* a visitor opens the chat dialog,
*when* they send a message,
*then* they receive a Hebrew reply within the configured timeout, or a clear, actionable
failure state.

Acceptance:
- The dialog traps focus, closes on Escape, blocks background interaction, and restores
  focus to the trigger.
- Incoming messages are announced in a live region.
- The message history is bounded; there is no unbounded polling or retry.
- With no Gemini key configured, the local Hebrew intent adapter answers instead, and
  the visitor is never shown a raw provider error.

### J6 — Hero renders proportionally at any viewport

*Given* any viewport between 360px and 2560px wide,
*when* the hero renders,
*then* the trail, its glow, and all four milestones remain anchored to the same points
of the background artwork.

Acceptance:
- All hero geometry is expressed in `viewBox` units or percentages. No hard-coded pixel
  coordinates for trail or milestone placement.
- The background image uses `object-fit: cover` and the overlay SVG uses
  `preserveAspectRatio="xMidYMid slice"` over an identical aspect ratio, so both crop
  identically.
- Portrait viewports receive the dedicated portrait render via art direction.
- Milestones are real focusable links with visible focus and a target size of at least
  24×24 CSS pixels.
- With `prefers-reduced-motion: reduce`, the trail is shown fully drawn and static.

---

## 5. Non-functional requirements

- **Accessibility:** WCAG 2.2 AA. Automated axe coverage on every indexable route plus
  manual keyboard verification of every interactive component.
- **Performance:** the hero background is the LCP element and is preloaded. No layout
  shift from hero or imagery. Hero plates are served as AVIF with a WebP fallback.
- **Reliability:** every outbound call has an explicit timeout; retries are bounded,
  jittered, and never applied to a non-idempotent mutation without a durable key.
- **Security:** deny-by-default RLS on every table; the anon key can neither read nor
  write leads. Service-role credentials are server-only. Origin/CSRF protection on
  sensitive mutations. Nonce-based CSP retained from the boilerplate.
- **Privacy:** lead PII is excluded from logs, error reports, and the chat transcript.
- **Rendering:** Server Components by default; `"use client"` only on the savings
  calculator, the lead form, and the chat widget, each at the smallest coherent subtree.
- **Layout:** logical CSS properties only. Physical directional utilities are rejected
  by `npm run check:architecture`.

---

## 6. Data

Single new table, `leads`:

| Field | Source | Notes |
|---|---|---|
| `id` | server | primary key |
| `created_at` | server | UTC |
| `full_name` | visitor | PII |
| `business_name` | visitor | PII |
| `phone` | visitor | PII |
| `email` | visitor | PII |
| `message` | visitor | free text; PII |
| `idempotency_key` | client, enforced server-side | unique constraint |
| `request_id` | server | correlation for observability |

RLS is deny-by-default. The anonymous role has insert-only access through the server
path and no select access. Existing boilerplate tables for idempotency and rate limiting
are reused unchanged.

---

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Hero artwork and SVG trail drift apart at extreme aspect ratios | The primary visual argument breaks | Identical crop maths on image and SVG; visual regression at desktop and mobile RTL; manual sweep 360→2560px |
| Placeholder content deployed publicly | Credibility damage | Content centralised in one module; launch checklist blocks on replacement |
| No hosted Supabase at build time | RLS unverified in production | Local Supabase CLI stack for development; RLS re-verified in preview before release |
| Chat adapter quality without Gemini | Weaker assistant than described | Local Hebrew intent fallback is scoped to conversion-oriented answers only |
| Hero plates are ~2MB PNGs | Poor LCP | Convert to AVIF/WebP with an explicit size budget of 250KB per plate |

---

## 8. Open questions

1. **Canonical domain.** Blocks `metadataBase`, canonical URLs, sitemap, and absolute
   Open Graph URLs. `OPEN — owner and decision date required`.
2. **Lead PII retention and deletion policy.** Blocks production release.
   `OPEN — owner and decision date required`.
3. **Real portfolio, founder, and legal copy.** Blocks public launch.
4. **Whether the owner wants an authenticated lead dashboard later.** Currently out of
   scope; would change the authentication model and RLS design.
