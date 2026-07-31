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
- Portfolio entries were initially centralised as placeholders. On 2026-07-30 the owner
  supplied the real project set — AthleteTrack, FinQuest and Guesto — and approved
  presenting AthleteTrack as client work and the other two as personal projects, with
  current home-page screenshots.

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
3. **Portfolio refinement.** The initial real product descriptions and screenshots are
   approved for local implementation. Final copy can be refined before deployment; no
   client names, testimonials or performance metrics are currently used.
4. **Legal page content ownership.** Who authors the privacy, terms, and accessibility
   statement text. The routes will ship with clearly marked placeholder copy.

---

## Portal expansion brief — 2026-07-28 to 2026-07-29

The decision owner expanded SYSTEMIZE from a marketing site into a connected customer
delivery platform. The marketing site remains part of the same product.

### Owner requirements preserved from the conversation

> אני רוצה לבנות אזור אישי ללקוחות מצד אחד, אבל מצד שני בשבילי ובשביל הצוות העתידי שלי.

> לאחר מכן, אני שולח לו לווצאפ קוד עם טוקן שיצרתי במערכת בצד שלי.

The owner clarified that this should behave as a single-use invitation link like the
existing CoachSync flow. Each partner receives a separate project invitation.

> אני חושב שאימות נעשה רק דרך GMAIL

The owner later clarified that the MVP should accept only addresses ending in
`@gmail.com`, not custom-domain Google Workspace accounts.

> אם הוא מאשר ומשלם את התשלום, אנחנו עוברים לשלב הבא, שלב של התכנון והאפיון המלא.

> אם הוא מחליט ללכת על משהו, אנחנו סוגרים עסקה, הוא משלם לי נגיד 50% מהסכום שקבענו,
> אני מתחיל לעבוד והוא מקבל התראות מהאפלקיציה.

> אישור = תשלום

For the manual-payment MVP, signing records agreement and the SYSTEMIZE owner records
payment. Payment is the authoritative event that activates commercial approval and the
next lifecycle transition.

> כל פעם שיש התקדמות, פיטצ'ר שסיימתי, או כל דבר כזה או אחר, אני יעדכן אותו ויכתוב
> במערכת מה עודכן, מה השתנה בעקבות העדכון וכו'

> בלחיצת כפתור אנחנו נעתיק PROMPT מדויק שיכריח את הAI שאנחנו עובדים איתו לתת לנו
> תשובה מדוייקת שהאלגוריתם יודע לפענח מראש

The MVP does not call an AI provider. It copies a versioned prompt, accepts pasted
structured JSON, validates it deterministically, shows an editable preview, and publishes
only after an explicit owner action.

> בהתחלה המערכת לא תשלח הודעות אלא המערכת תהיה אתר PWA ולקוחות יורידו את האתר ויקבלו
> התראות לפלאפון

> כל אירוע חשוב מצד הלקוח או ממני, אנחנו נתריע אחד לשני.

The durable notification center is authoritative. Web Push is best-effort and follows
successful event persistence.

> אני רוצה חתימה וחוזה כמו שיש לנו בCoacSync רק עם עיצוב ווייב של Systemize

CoachSync is the behavioral reference for declarations, drawn signature, immutable
evidence, hashing, and proof PDF. SYSTEMIZE uses its own document model and visual
language.

### Confirmed product decisions

| Decision | Owner answer |
|---|---|
| Product surfaces | Build the internal and client surfaces together because their integration improves process accuracy. |
| Company model | Multiple contacts and multiple client owners; architecture supports multiple projects per company. |
| Internal team | Marlen is the only internal user in the MVP; future staff remain structurally possible. |
| Authentication | Google OAuth restricted to verified `@gmail.com` addresses. |
| Client access | Separate single-use invitation for every project participant. |
| Contract | CoachSync-style signature flow with SYSTEMIZE branding. |
| Commercial approval | Payment is the authoritative approval event. |
| Payments | Manual in the MVP; automatic payment integration later. |
| Notifications | In-app and PWA push for every important opposite-party event. |
| AI processing | External AI, copied prompt, pasted deterministic structured output, owner preview and publication. |
| Brand | Existing SYSTEMIZE mark and lockup; formal design-system standardization required. |
| First document | No existing copy; create a stable default template and refine it iteratively. |
| Product name | SYSTEMIZE PORTAL. |

No credentials, OAuth secrets, push keys, payment data, contract signatures, or real
customer records belong in this brief.
