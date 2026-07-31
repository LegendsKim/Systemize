---
configuration_status: APPROVED
boilerplate_version: "v1.0.1"
client_name: "SYSTEMIZE"
decision_owner: "Marlen Kimiagrov"
last_reviewed: "2026-07-31"
project_phase: "PORTAL_MVP_SLICE_4"
deployment_target: "Vercel"
data_classification: "confidential"
---

# Client Configuration — SYSTEMIZE Platform

This file configures TUNABLE decisions for the SYSTEMIZE marketing site and SYSTEMIZE
PORTAL. It grants no exemption from a LOCKED rule in `AGENTS.md`.

Authoritative product definition: `docs/PRODUCT.md`.
Preserved input: `docs/discovery/CLIENT_BRIEF.md`.

Portal implementation is authorized only within the approved staged scope in
`docs/PRODUCT.md`.

## 1. Product and stack

- **System type:** Public marketing site plus authenticated multi-company project
  delivery portal.
- **Business objective:** Convert qualified leads and then provide a transparent,
  documented workflow from discovery through contracting, payment, delivery, rollout,
  and support.
- **Primary user groups:** anonymous visitor, SYSTEMIZE owner, client owner.
- **Initial internal staff:** Marlen Kimiagrov only.
- **Framework:** Next.js App Router with strict TypeScript.
- **Database and authentication:** Supabase.
- **Hosting:** Vercel.
- **Required integrations:** Google OAuth, Web Push, existing Telegram lead
  notifications.
- **Deferred integrations:** automatic payment provider, WhatsApp Business API, direct
  AI provider.
- **Environments:** local, preview, production.

## 2. Locale and regional behavior

- **Supported locales:** `["he"]`
- **Default locale:** `he`
- **URL locale strategy:** unprefixed default.
- **Default timezone:** `Asia/Jerusalem`
- **Supported currencies:** `["ILS"]`
- **Direction:** RTL.
- **Customer-facing date locale:** `he-IL`.

Timestamps are stored in UTC. Money uses `Intl.NumberFormat` with explicit ILS.
Components use logical layout properties even while Hebrew is the sole locale.

## 3. Routes and indexing

### Public and indexable

- `/`
- `/projects`
- `/projects/athletetrack`
- `/projects/finquest`
- `/projects/guesto`
- `/privacy`
- `/terms`
- `/accessibility`

### Authentication and invitation, non-indexable

- `/invite/[token]`
- `/login`
- `/auth/callback`
- `/auth/error`

### Client portal, authenticated and non-indexable

- `/portal`
- `/portal/actions`
- `/portal/documents`
- `/portal/projects/[projectId]`
- `/portal/projects/[projectId]/discovery`
- `/portal/projects/[projectId]/actions`
- `/portal/projects/[projectId]/updates`
- `/portal/projects/[projectId]/documents`
- `/portal/projects/[projectId]/payments`
- `/portal/projects/[projectId]/people`
- `/portal/notifications`
- `/portal/settings`

### SYSTEMIZE owner surface, authenticated and non-indexable

- `/admin`
- `/admin/notifications`
- `/admin/companies`
- `/admin/companies/[companyId]`
- `/admin/projects/[projectId]`
- `/admin/projects/[projectId]/documents`
- `/admin/projects/[projectId]/updates`
- `/admin/projects/[projectId]/payments`
- `/admin/projects/[projectId]/people`
- `/admin/templates`

Route names are contracts. Changing the `/portal` or `/admin` root requires an ADR.
All authenticated routes explicitly emit noindex/noarchive behavior and are excluded
from sitemap generation.

Canonical marketing host is `https://www.systemize.co.il`. The final portal host
strategy is a production blocker and may remain same-origin under `/portal` for MVP.

## 4. Authentication and authorization

- Google OAuth is the only sign-in provider.
- Only Google-verified emails ending exactly in `@gmail.com` are allowed in the MVP.
- Google Workspace custom domains are denied.
- The SYSTEMIZE owner account is an explicit server-side allowlist entry.
- Client access requires both a valid identity and an active project membership.
- An invitation is single-use, expires after seven days, and is bound to one exact Gmail
  address, company, project, and intended role.
- Invitation tokens are random and stored only as cryptographic hashes.
- Account activation consumes the invitation and creates the membership atomically.
- Authentication does not grant implicit company or project access.
- Every sensitive Server Action and Route Handler re-authorizes membership and required
  capability.

The owner may revoke a membership or invitation. Revocation takes effect on the next
authorized request and does not delete the historical audit record.

## 5. Roles and capabilities

### `systemize_owner`

- Full application administration.
- Sole authority to record a manual payment.
- Sole publisher of client-visible updates in the MVP.
- Sole creator of companies, projects, templates, and invitations.

### `client_owner`

- Reads client-visible content for assigned projects.
- Answers questions, comments, signs eligible contracts, and completes client actions.
- Sees commercial information for assigned projects.
- Cannot record payment, publish SYSTEMIZE updates, manage templates, or access another
  project by guessing an identifier.

Future staff roles may be added without widening current permissions. They are not
invitable in the MVP.

## 6. Domain invariants

- A company may have multiple client owners and projects.
- Membership is project-scoped.
- A project always has one explicit current lifecycle state.
- Lifecycle changes create append-only events.
- A document approval or signature always references an immutable document version.
- Signed evidence cannot be updated or deleted through browser-facing roles.
- Signing does not equal commercial approval.
- Payment receipt is the event that makes commercial approval effective.
- Only the SYSTEMIZE owner records manual payment in the MVP.
- Project state advances past a payment gate only after an authoritative paid event.
- Structured AI import cannot publish or mutate progress without owner preview and
  confirmation.
- Durable state is committed before notification delivery.
- Notification failure never reverses a document, signature, payment, update, or stage
  event.

## 7. Data model and systems of record

Supabase Postgres is authoritative for:

- `profiles`
- `companies`
- `company_people`
- `projects`
- `project_memberships`
- `project_invitations`
- `project_events`
- `project_actions`
- `document_templates`
- `documents`
- `document_versions`
- `signature_requests`
- `signature_events`
- `payment_records`
- `project_updates`
- `project_update_imports`
- `questions`
- `comments`
- `notifications`
- `push_subscriptions`
- durable idempotency and rate-limit records

Exact migrations may refine names, but boundaries and invariants remain stable.

Supabase Auth is authoritative for Google identity. Private Supabase Storage is
authoritative for signed PDFs and future private project files. Vercel is the runtime,
not a system of record.

## 8. Documents, contracts, and signatures

- Documents originate from versioned editable templates.
- Published versions are immutable.
- Web and PDF render from the same structured source.
- Contract submission requires authority/read/agreement declarations and a drawn
  signature.
- The server validates the signature as bounded PNG input and hashes its decoded bytes.
- Evidence includes document and identity snapshots, declaration values, UTC time,
  signature hash, document hash, and bounded privacy-safe request evidence.
- Signature and evidence creation is one idempotent durable mutation.
- Signed PDF access is private and re-authorized.
- Contract language remains a production blocker until competent legal review.

CoachSync is a behavioral reference only. SYSTEMIZE receives its own domain model,
templates, copy, tests, and visual system.

## 9. Payments

- MVP payment capture is manual.
- Only `systemize_owner` may record a payment.
- Amount, currency, project, payer, effective time, and status are validated on the
  server.
- Recording is idempotent and auditable.
- The initial commercial flow is `signed → payment_pending → paid → approved`.
- Automatic payment processing is deferred behind a server-only provider adapter.
- A future provider mutation must reconcile timeouts by durable idempotency key.

## 10. Structured update ingestion

- SYSTEMIZE PORTAL does not call an AI provider in the MVP.
- The owner copies a versioned prompt and pastes back JSON.
- JSON is validated against a versioned schema with maximum lengths and collection
  bounds.
- Unknown fields are rejected unless explicitly introduced by a new schema version.
- The project reference must match the selected project.
- A deterministic fingerprint prevents duplicate import and publication.
- The owner receives a preview and may edit client-facing fields before publication.
- Internal technical notes never become client-visible by default.
- AI may propose a lifecycle or progress change; only an explicit owner action applies
  it.
- Every accepted session import updates a bounded current-context snapshot containing
  completed and partial task references, decisions, blockers, newly discovered work,
  and the recommended next-session goal.
- The next copied prompt is generated dynamically from the approved project plan,
  current-context snapshot, prior accepted session summary, open work, and current
  lifecycle state.
- Full session history remains durable, while the prompt uses a bounded rolling summary
  so prompt size cannot grow without limit.
- Project completion is calculated deterministically from owner-approved weighted
  milestones and task states. AI may propose task-state changes but never supplies the
  authoritative project percentage.

## 11. PWA and notification behavior

- Authenticated surfaces are installable as a PWA.
- In-app notifications are authoritative; Web Push is best-effort.
- Important events notify the affected opposite party.
- The actor does not receive a redundant self-notification.
- Notification recipients are derived server-side from memberships.
- Persistence precedes push delivery.
- Subscriptions are device-specific, revocable, and deleted after permanent provider
  rejection.
- Retry is bounded and applies only to retryable provider failures.
- Contractual, payment, security, and required-action notifications cannot be disabled.

Offline support may cache the application shell and previously safe public assets. It
must not expose private project responses through a shared or public cache, and it must
not queue a signature, payment, or publication mutation without an explicit durable
idempotency design.

## 12. PII and retention

PII includes:

- name;
- Gmail address;
- phone number;
- company and role;
- project free text;
- questions and comments;
- contract and signature evidence;
- payment metadata;
- push subscription endpoints.

PII is excluded from logs, analytics, error reports, notification provider payloads
beyond the minimum display copy, and non-production fixtures.

An approved retention, export, deletion, and revocation policy is required before portal
production launch. Signed contractual evidence and payment records are not deleted by a
normal account-deletion request; their retention period requires legal approval.

## 13. Caching and mutations

- User-specific and project-specific reads are request-scoped and never publicly cached.
- Shared mutable templates may use tagged cache entries only when authorization scope is
  preserved.
- Invitation, activation, signature, payment, update publication, and lifecycle
  mutations are idempotent.
- Every mutation invalidates only the project, action, document, payment, or notification
  entries it changed.
- Server Components call server-only services directly rather than internal HTTP routes.

## 14. Testing depth

Required automated coverage includes:

- Google callback allow/deny cases.
- Gmail-domain restriction and exact invitation-email match.
- Invitation expiry, reuse, revocation, mismatch, and atomic activation.
- Anonymous, cross-company, cross-project, revoked-member, client-owner, and
  SYSTEMIZE-owner RLS cases.
- Document version immutability and web/PDF source parity.
- Signature declarations, image validation, hashes, evidence immutability, and duplicate
  submission.
- Payment authorization, idempotency, and payment-gated lifecycle transition.
- Structured import valid, invalid, oversized, unknown-version, wrong-project, and
  duplicate cases.
- Notification recipient calculation and persistence-before-push failure behavior.
- PWA manifest, service worker lifecycle, invalid subscription cleanup, and safe caching.
- Critical mobile journey at 390×844.
- Automated axe plus manual keyboard and touch verification.
- Existing marketing-site lead, RTL, SEO, legal-route, and visual coverage.

## 15. Approved tunings and known blockers

No LOCKED rule is weakened.

The following block portal production but not approved local implementation:

- final contract text and legal review;
- production Google OAuth configuration and redirect allowlist;
- production Supabase migrations and RLS verification;
- approved PII retention/export/deletion policy;
- Web Push production configuration and device matrix;
- final portal host strategy;
- final wording and commercial values for document templates.

## 16. Approval

- **Configuration status:** `APPROVED`
- **Decision owner:** Marlen Kimiagrov
- **Approval requested:** 2026-07-29
- **Approved by:** Marlen Kimiagrov
- **Approval date:** 2026-07-29
- **Approval statement:** “יאללה בו נתקדם”
- **Implementation authorization:** granted for the staged portal MVP in
  `docs/PRODUCT.md`.

Approval means the owner accepts the product boundaries, Gmail-only authentication,
multi-owner project membership, signature evidence model, payment-gated approval,
manual-payment MVP, structured JSON import, PWA notification model, and production
blockers recorded above.
