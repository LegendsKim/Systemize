# Systemize Marketing Site — Product Definition

- Client: Systemize
- Decision owner: Marlen Kimiagrov
- Boilerplate source: Systemize Boilerplate v1.0.1
- Status: approved 2026-07-25; scope narrowed the same day (§3.2); positioning restated
  by the owner on 2026-07-26 (§1, §3.1.6)
- Last reviewed: 2026-07-26

Raw input is preserved at `docs/discovery/CLIENT_BRIEF.md`. Implementation-governing
configuration lives in `AGENTS.client.md`. This document defines *what* is being built
and how completion is judged.

---

## 1. Objective and success criteria

Systemize builds bespoke cloud management systems for small and medium businesses, in
any trade — a judo coach tracking memberships and attendance, or a company tracking
cleanroom inventory. The delivery model is the product: learn the client's existing
workflow, specify, plan, build with the client in the loop, and roll the system out.

The claim that carries the site: *software does not dictate how the business works; the
business dictates how the software is built.* The breadth of the client range is itself
the proof — two businesses with nothing in common both received a system cut to fit.

"Cloud" is the customer-facing word, not "web". It names the benefit the buyer is
actually purchasing: reachable from anywhere, nothing to install, no server in the
office. The site is a public, single-page marketing and lead-generation platform whose
purpose is to convert business visitors into qualified leads.

This restates the positioning captured at intake, which described an
automation-and-Excel/VBA services agency. The owner narrowed nothing and removed no
capability — the offer is stated at its real scope. Recorded 2026-07-26 at the owner's
direction.

Success criteria:

1. A visitor can understand what Systemize does and how it works within one screen of
   the hero.
2. A visitor can see the four-stage delivery process at a glance, on any device.
3. A visitor can submit a lead in under a minute, and that lead is never lost.
4. The visual quality of the site is itself a sales argument — the hero must render
   identically proportioned on every viewport from 360px to 2560px.

Explicitly not a success criterion: authenticated admin tooling, multi-language support,
or e-commerce.

---

## 2. Users

| User | Access | May do | May not do |
|---|---|---|---|
| Public visitor | Anonymous | Read all public content and submit a lead | Read, list, enumerate, or modify any stored lead |
| Owner / operator | Supabase dashboard + Telegram | Read and manage leads, receive notifications | — (no in-app admin surface exists in the MVP) |

There is no sign-in anywhere on the site.

---

## 3. Scope

### 3.1 In scope — MVP

**Single-page marketing surface** (`/`), composed of:

1. **Hero** — two compositions from one set of markup. On landscape, the topographic
   render with an animated turquoise trail and four milestones (אפיון · תכנון · פיתוח ·
   הטמעה) plotted onto its terraces. On portrait, no artwork at all: the headline arrives
   word by word over a generated contour field, and the same four stages draw down a
   vertical track. Headline, sub-copy and one primary call to action in both.
2. **Delivery process** — the four stages from introductory mapping through planning,
   development, rollout, and ongoing service.
3. **Client workspace journey** — a responsive two-state preview that explains what the
   prospect receives after the introductory call (agreement, detailed preferences and
   discovery questionnaire, delivery options, pricing, and payment terms), and what opens
   after approval and payment (project progress, update history, comments, service
   requests, and direct contact). This is intentionally presented as cards rather than a
   comparison table on mobile.
4. **FAQ** — purchasing and delivery questions that support a complete system project.
5. **Blueprint lead form** — the primary conversion surface.

**Standalone indexable routes:** `/privacy`, `/terms`, `/accessibility`. These are real
pages, not modals.

**Server capabilities:** durable lead persistence, idempotent submission, distributed
rate limiting, best-effort Telegram notification. The public shell also includes
first-party cookie preference management with optional categories disabled by default.

### 3.2 Out of scope — MVP

- Any authenticated area, admin dashboard, or lead management UI.
- Any locale other than Hebrew; any currency other than ILS.
- Payments, quotations, contracts, or scheduling/booking.
- A savings/ROI calculator. Removed from scope by the owner on 2026-07-25.
- The AI chat assistant. Deferred by the owner on 2026-07-25; not in the current build.
- Analytics and marketing pixels. The consent interface exists, but no analytics or
  marketing provider is activated by it.
- Blog, CMS, or editorable content.
- Email delivery. Telegram is the only notification channel.
- File uploads or attachments on the lead form.

### 3.3 Deferred

| Item | Owner | Milestone |
|---|---|---|
| Real portfolio content and founder copy | Marlen Kimiagrov | Before public launch |
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

### J4 — Read the process on any device

*Given* any viewport,
*when* the hero renders,
*then* the four delivery stages are present as real, focusable links with readable text.

Acceptance:
- Exactly one `<h1>` and exactly four milestone links exist in the document, whichever
  composition is displayed. Neither is duplicated per orientation.
- Each milestone has an accessible name that states its stage and its position in the
  sequence.
- The keyboard order matches the visual reading order.
- With `prefers-reduced-motion: reduce`, every hero animation is at its finished state
  within the first paint.

### J5 — Hero renders proportionally at any viewport

*Given* any viewport between 320px and 2560px wide,
*when* the hero renders,
*then* the trail, its glow, and all four milestones remain anchored to the same points
of the background artwork.

Acceptance:
- All hero geometry is expressed in `viewBox` units or percentages. No hard-coded pixel
  coordinates for trail or milestone placement.
- The artwork layer and the marker layer take their size from one shared pair of CSS
  variables, so they cannot diverge.
- Portrait viewports download no artwork: the `<source>` media query does not match, so
  the browser resolves to a transparent pixel.
- Milestones are real focusable links with visible focus and a target size of at least
  24×24 CSS pixels.
- With `prefers-reduced-motion: reduce`, the trail is shown fully drawn and static.

---

## 5. Non-functional requirements

- **Accessibility:** WCAG 2.2 AA. Automated axe coverage on every indexable route plus
  manual keyboard verification of every interactive component.
- **Performance:** on landscape the hero plate is the LCP element. On portrait no
  artwork is fetched at all — the largest element is text, and the topographic background
  is a 46KB generated vector — so the page paints without waiting on an image.
- **Reliability:** every outbound call has an explicit timeout; retries are bounded,
  jittered, and never applied to a non-idempotent mutation without a durable key.
- **Security:** deny-by-default RLS on every table; the anon key can neither read nor
  write leads. Service-role credentials are server-only. Origin/CSRF protection on
  sensitive mutations. Nonce-based CSP retained from the boilerplate.
- **Privacy:** lead PII is excluded from logs, error reports, and analytics.
- **Rendering:** Server Components by default; `"use client"` only on the lead form, at
  the smallest coherent subtree. The hero is entirely server-rendered — every animation
  in it is CSS.
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
| The hero artwork is a wide panorama unsuited to a tall screen | A cropped, cramped hero on the platform most visitors use | Portrait gets its own composition built from type, vector and motion; the artwork is never cropped to fit |

---

## 8. Open questions

1. **Canonical domain.** Blocks `metadataBase`, canonical URLs, sitemap, and absolute
   Open Graph URLs. `OPEN — owner and decision date required`.
2. **Lead PII retention and deletion policy.** Blocks production release.
   `OPEN — owner and decision date required`.
3. **Real portfolio, founder, and legal copy.** Blocks public launch.
4. **Whether the owner wants an authenticated lead dashboard later.** Currently out of
   scope; would change the authentication model and RLS design.
5. **Whether the AI chat assistant returns.** Deferred on 2026-07-25, not cancelled.
