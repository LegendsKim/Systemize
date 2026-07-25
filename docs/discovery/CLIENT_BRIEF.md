# Client Brief — Systemize Marketing Site

Source: Systemize Boilerplate v1.0.1
Client: Systemize (Marlen Kimiagrov)
Captured: 2026-07-25

---

## Raw client brief

> The following is the client's original input, preserved verbatim.

# Systemize - Client Brief

## Business Objective & System Type
Systemize is a business-automation and Excel/VBA services agency. The system to be built is a public, single-page marketing and lead-generation platform. Its goal is to convert visitors into leads by showcasing automation value, calculating potential ROI, and offering an interactive AI chat experience.

## Primary User Groups
*   **Public Visitors:** Potential business clients looking for automation solutions.
*   **System Admin:** The agency owner receiving leads and managing the platform.

## Required Features & Critical Journeys
1.  **Marketing Sections:** Hero, value proposition, before/after automation comparison, services/capabilities accordions, portfolio examples, Excel-vs-SaaS comparison, and founder section.
2.  **Savings Calculator:** A live, interactive client-side ROI calculator (ILS currency).
3.  **"Blueprint" Lead Form:** A lead capture form that durably persists data to a database before attempting notification delivery.
4.  **AI Chat Assistant:** A Gemini-powered chat widget with a local Hebrew intent fallback, designed to guide users toward conversion.

## Data, Integrations & Boundaries
*   **System of Record (Database):** Supabase (must be used for durable lead storage).
*   **Notification-Only System:** Telegram (used strictly for best-effort lead notifications after Supabase persistence).
*   **External Provider:** Gemini SDK (for chat functionality, wrapped in a server-side provider-neutral adapter).
*   **Authentication:** None for public users.

## Locale, SEO & Regional Behavior
*   **Supported Locales:** `["he"]` (Hebrew only).
*   **Direction:** RTL (Right-to-Left).
*   **Default Timezone:** Asia/Jerusalem.
*   **Supported Currencies:** `["ILS"]`.
*   **SEO:** This is a public site. Full indexable routes, canonical tags, OG/Twitter metadata, and JSON-LD structured data (ProfessionalService, FAQ) are required.
*   **Legal Routes:** Privacy, terms, and accessibility pages must be standalone indexable routes, not modals.

## Technical Constraints & Invariants
*   The project inherits all [LOCKED] rules from the Systemize Boilerplate (Next.js App Router, React Server Components by default, Tailwind v4 with logical properties).
*   No physical directional utilities (e.g., `ml-`, `left-`) are allowed; only logical properties (e.g., `ms-`, `start-`).
*   Idempotency is required for the lead submission mutation.

---

## Additional client notes (Hebrew, verbatim)

> המטרה של האתר היא לבנות אתר תדמית ברמה גבוהה בכדי שאני אוכל למצוא לקוחות פוטנציאליים
> שיתרשמו מהעיצוב של האתר ומהפרויקטים שכבר עבדתי עליהם.
>
> אני רוצה שנשתמש בתמונות של Hero_Section_Vision.png בתור ההבנה של איך אני רוצה שהתצוגה
> הראשית תהיה.
>
> בקובץ Hero_Section_Clean.png אפשר למצוא את התמונה הנקיה, זה בעצם רק הרקע, ואני רוצה
> שבפתיחה של האתר, יהיה שביל טורקיז כמו ב Hero_Section_Vision.png
>
> ויש גם תמונה למובייל שאני רוצה שיהיה משהו דומה Mobile_Hero_Section_Clean.png
>
> חשוב לעשות שהשביל יוגדל ב % מהמסך ולא בנקודות ספציפיות בכדי שלא משנה מה יהיה גודל
> המסך, התצוגה תהיה זהה.

---

## Clarification round 1 — 2026-07-25

Answers given by the decision owner (Marlen Kimiagrov):

| Question | Answer |
|---|---|
| Where should the site be built, given that `Systemize New` is the boilerplate mother repository? | Use an existing clean copy of the boilerplate at `Systemize 2.0`. The mother repository stays generic. |
| How should the hero turquoise trail be implemented? | Background image plus an animated SVG overlay. Not a canvas/WebGL render, and not a single pre-baked image with the trail burned in. |
| What is the state of real site content (portfolio projects, copy)? | Placeholder content is needed for now; real project material will be supplied later. |
| Which external services are already provisioned and ready? | Telegram bot only. Supabase project and Gemini API key are not yet available. |

Consequences recorded from these answers:

- The Gemini chat adapter ships behind a provider-neutral interface; the local Hebrew
  intent fallback is the active path until a Gemini key exists. No code change is
  required when the key is added — selection is driven by environment configuration.
- Supabase work is developed against the local Supabase CLI stack. No production
  credentials are required for build or tests.
- Portfolio entries are clearly marked as placeholder content and are centralised in a
  single content module so they can be replaced without touching layout code.

---

## References and attachments

Local files, present in the repository root at intake time:

- `Hero_Section_Vision.png` — design reference for the hero. Reference only; must not be
  published as a site asset.
- `Hero_Section_Clean.png` — desktop hero background plate (3D render, no trail).
- `Mobile_Hero_Section_Clean.png` — mobile hero background plate (3D render, no trail).

No credentials, tokens, payment information, or real customer records are recorded in
this file or anywhere in this repository.

---

## Open questions (owner decision required)

1. **Canonical domain.** Required for `metadataBase`, canonical URLs, sitemap, and
   Open Graph absolute URLs. `OPEN — owner and decision date required`.
2. **Lead PII retention and deletion policy.** How long lead records are kept, who may
   access them, and how a deletion request is honoured. Required before production.
   `OPEN — owner and decision date required`.
3. **Real portfolio content.** Project descriptions, screenshots, and any permitted
   client names or metrics. Required before public launch.
4. **Legal page content ownership.** Who authors the privacy, terms, and accessibility
   statement text. The routes will ship with clearly marked placeholder copy.
