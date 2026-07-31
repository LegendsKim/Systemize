# SYSTEMIZE Platform — Product Definition

- Client: SYSTEMIZE
- Product: SYSTEMIZE marketing site + SYSTEMIZE PORTAL
- Decision owner: Marlen Kimiagrov
- Boilerplate source: Systemize Boilerplate v1.0.1
- Status: approved by the decision owner on 2026-07-29
- Last reviewed: 2026-07-29

Raw requirements are preserved in `docs/discovery/CLIENT_BRIEF.md`.
Implementation-governing configuration lives in `AGENTS.client.md`.

## 1. Product vision

SYSTEMIZE is one continuous customer-delivery platform with two connected surfaces:

1. A public marketing site that explains the offer and captures qualified leads.
2. SYSTEMIZE PORTAL, which manages the relationship from the introductory call through
   discovery, contracting, payment, delivery, rollout, and ongoing service.

The differentiator is not merely that a customer has a portal. The differentiator is a
clear, documented, and transparent delivery process. At every point the customer should
understand:

- where the project stands;
- what changed;
- what requires their attention;
- what SYSTEMIZE is doing next;
- what has been approved, signed, or paid;
- which document version and decision are authoritative.

The product is Hebrew-first, RTL, mobile-first, installable as a PWA, and designed for
customers who are not expected to understand software development terminology.

## 2. Product principles

1. **One source of truth.** Project state, documents, approvals, payments, and updates
   are durable records, not chat-message history.
2. **Action before analytics.** A customer sees what requires action before charts or
   vanity metrics.
3. **Explicit state.** Every project has a current stage, next action, responsible party,
   and history.
4. **Versioned commitments.** A signed or approved document is an immutable snapshot.
5. **Human-reviewed automation.** Structured AI output is validated and previewed;
   SYSTEMIZE decides what is published.
6. **Persistence before notification.** An important event is committed before push
   delivery is attempted. Push failure never deletes or rolls back business state.
7. **Least privilege.** Authentication never substitutes for project-level
   authorization.

## 3. Users and roles

### 3.1 Public visitor

- Reads the marketing site and legal pages.
- Submits the Blueprint lead form.
- Has no access to stored leads or portal records.

### 3.2 SYSTEMIZE owner

The initial internal team contains one user: Marlen Kimiagrov.

- Creates and manages companies, people, projects, invitations, documents, contracts,
  payment records, stages, questions, and updates.
- Is the only user who may mark a manual payment as received.
- May preview the client experience.
- Receives in-app and push notifications for important customer actions.

The data model must support future SYSTEMIZE staff without enabling staff invitations in
the first release.

### 3.3 Client owner

A company may have more than one client owner.

- Belongs to one company and may be a member of one or more of that company's projects.
- May read project information exposed to clients.
- May comment, answer questions, sign contracts, and perform client actions.
- May view commercial information when granted that project permission.
- Receives in-app and push notifications for important SYSTEMIZE actions.

For the MVP, one eligible client-owner signature is sufficient unless a document
explicitly requires a different rule in a later release.

## 4. Company, project, and membership model

- A company can have multiple contacts and multiple owners.
- A company can have multiple projects, even though that is not expected to be common
  initially.
- A user receives access through a project membership, never because a client-supplied
  company or project ID was trusted.
- Each invitation belongs to exactly one email address, company, project, and intended
  role.
- Revoking one membership must not affect the company's other users or projects.
- The SYSTEMIZE owner is internal staff and is not represented as a client owner.

## 5. Authentication and invitations

### 5.1 Authentication

- Sign-in uses Google OAuth only.
- The initial allowlist accepts verified Google accounts whose email address ends in
  `@gmail.com`.
- Google Workspace custom-domain accounts are intentionally excluded from the MVP.
- Local passwords, phone OTP, and email magic links are not supported.
- The SYSTEMIZE owner also signs in through an explicitly allowlisted Gmail account.

### 5.2 Invitation activation

1. The SYSTEMIZE owner creates a person with name, Gmail address, phone, company,
   project, and role.
2. The system creates a random, single-use invitation token and stores only its hash.
3. The owner copies a prepared WhatsApp message containing the invitation link.
4. The recipient opens the link and chooses “Continue with Google”.
5. The server verifies that Google's verified Gmail address exactly matches the pending
   invitation.
6. The invitation is consumed atomically and a project membership is created.
7. Expired, revoked, reused, malformed, or mismatched invitations reveal no project
   information.

Invitation validity for the MVP is seven days. The owner may revoke and reissue an
invitation.

### 5.3 Pre-meeting guest intake

On first arrival a client is shown a one-time orientation covering the four stages of the
engagement, where each kind of thing lives, and the offer to enable device notifications.
Completion is recorded on the profile, and the screen is never shown again.

After invitation activation, a potential client sees only the guest side of the
assigned project. The first required action is a private, structured business-intake
document:

1. The client completes a five-part questionnaire covering the business, current
   workflow, problems, goals, users, required capabilities, integrations, data,
   automation, reporting, security, timetable, and commercial context.
2. Each field states how much has been written and, where an answer is required, how much
   is still missing. A rejected submission returns the client's own text to the screen and
   opens the step that carries the error.
3. Work is persisted continuously: to the device as it is typed, and to the server once
   typing pauses or the page is left. The explicit draft button remains. Submission locks
   the reviewed snapshot.
4. SYSTEMIZE receives a durable in-app notification and may approve the document or
   request a focused update.
5. A requested update survives a saved draft: the note stays on screen until the client
   actually re-submits. The client answers it in place and re-submits from wherever they
   are, and the answer reaches the owner beside the questionnaire.
6. Approval creates a notification for the client and unlocks owner-published meeting
   slots.
5. The client may reserve one available slot. Booking is atomic and advances the
   project to `intro_call_scheduled`. The saved booking then provisions one Zoom
   meeting and one Google Calendar invitation through a durable outbox. The client sees
   the date immediately and receives the join link when both providers are ready.
6. After the owner records the meeting as completed, the owner creates and publishes an
   immutable initial-summary version for the client.
7. Only after that version is published may the owner publish a secure external payment
   link for discovery, a future 40% implementation deposit, or the balance.
8. Payment is authoritative only after the SYSTEMIZE owner records receipt in the MVP.

The intake answers, review notes, meeting records, payment metadata, and notifications
are project-confidential. Anonymous users and users from other projects have no table
access. Durable workflow mutations are idempotent and persist before notifications.

## 6. Delivery lifecycle

The canonical project lifecycle is:

1. `lead`
2. `intro_call_scheduled`
3. `initial_summary_preparation`
4. `discovery_offer_awaiting_client`
5. `discovery_payment_pending`
6. `full_discovery_and_planning`
7. `solution_options_preparation`
8. `proposal_and_contract_awaiting_client`
9. `initial_payment_pending`
10. `delivery`
11. `client_review`
12. `rollout`
13. `support`
14. `completed`
15. `cancelled`

Transitions are server-authorized and recorded as append-only project events. A stage
change may require a prerequisite such as a signature or payment.

## 7. Commercial rule: approval means payment

Signing a proposal or contract records agreement but does not by itself approve the
commercial transition.

For the MVP:

```text
contract signed
→ awaiting payment
→ SYSTEMIZE owner records payment received
→ commercial approval becomes effective
→ project advances
```

Automatic payment processing is deferred. The payment model must already support an
external provider reference and idempotency key so a provider can replace the manual
step without changing the domain rule.

Prices, currency, paid amount, authoritative payment time, and payment status are
server-controlled. Currency is ILS.

## 8. Documents

### 8.1 Initial summary and paid-discovery offer

The first default document is:

**“Introductory call summary and proposal for discovery and planning”**

It contains:

1. Client company and contacts.
2. Current situation as described by the client.
3. Problems and operational friction reported by the client.
4. Desired business outcomes.
5. Known scope and assumptions.
6. Questions and facts still requiring validation.
7. What the paid discovery and planning stage includes.
8. Deliverables the client receives.
9. Estimated timetable.
10. Price and payment terms.
11. Exclusions.
12. Proposal validity.

### 8.2 Full discovery and planning document

The full document may contain:

- goals and success measures;
- users, roles, and permissions;
- current and future workflows;
- screens and primary actions;
- data and systems of record;
- integrations and automation;
- notifications;
- exceptions and edge cases;
- security and privacy requirements;
- migration and rollout;
- training and support;
- acceptance criteria;
- risks, assumptions, and open questions.

### 8.3 Document invariants

- Documents are created from editable templates.
- Every published document has an immutable version.
- Client-visible rendering and exported PDF derive from the same structured content.
- Approval and signature always reference a specific immutable version and content hash.
- Replacing content creates a new version; it never changes prior evidence.

## 9. Contract and signature

The SYSTEMIZE contract flow adopts the proven CoachSync evidence pattern with new
SYSTEMIZE branding and contract-specific language.

An eligible client owner:

1. Reviews the complete contract.
2. Confirms authority to sign.
3. Confirms the document was read.
4. Confirms agreement.
5. Draws a signature with pointer, mouse, or touch.
6. Submits once through an idempotent server mutation.

The durable evidence record includes:

- signer identity and project membership;
- signer name and Gmail snapshot;
- document title, version, full-content snapshot, and SHA-256 hash;
- declaration values;
- signature image and SHA-256 hash;
- UTC timestamp;
- bounded user-agent snapshot;
- privacy-preserving request evidence such as an IP-derived hash;
- immutable event identifier.

The signed PDF contains the contract snapshot, signature, declarations, evidence
summary, and verification hashes. The legal text requires review by a competent Israeli
legal professional before production use.

## 10. Updates and project progress

### 10.1 Manual and structured updates

The SYSTEMIZE owner can publish a manual update or import structured output produced by
an external AI tool. SYSTEMIZE PORTAL does not call an AI provider in the MVP.

The flow is:

```text
copy versioned prompt
→ use an external AI tool
→ paste its structured output
→ parse and validate
→ show a designed preview
→ allow owner edits
→ publish
→ persist notification records
→ attempt push delivery
```

### 10.2 Structured-output contract

The prompt requests JSON matching a versioned schema. The parser never depends on prose
headings or punctuation.

Required concepts include:

- schema version;
- project reference;
- update category;
- client-facing title and summary;
- completed items;
- client impact;
- changes from the prior plan;
- next steps;
- client action required;
- proposed stage or progress change;
- internal technical notes;
- visibility.

Invalid, oversized, unknown-version, wrong-project, or duplicate payloads are rejected
with an actionable preview error. Importing never publishes automatically.

Progress is derived from approved project events and milestones. AI output may propose a
change, but cannot directly overwrite project progress.

### 10.3 Dynamic project memory

SYSTEMIZE, rather than the external AI conversation, is the durable project memory.

Each accepted session records:

- session summary;
- completed task references;
- partially completed task references and proposed states;
- decisions made;
- blockers;
- newly discovered work;
- next-session goal;
- client-facing update proposal.

The next copied prompt is generated dynamically from the approved specification,
weighted plan, current task states, accepted decisions, open blockers, latest session
handoff, and requested goal. Full history remains durable, but the generated prompt uses
a bounded rolling context snapshot so it cannot grow without limit.

Project completion is not an AI-authored percentage. The owner-approved plan assigns
weights to milestones and tasks. Accepted task states contribute deterministic values:

- not started: 0%;
- started: 25%;
- in progress: 50%;
- awaiting verification: 75%;
- verified complete: 100%.

AI output proposes task-state and scope changes. The SYSTEMIZE owner reviews them, and
the application calculates the authoritative percentage only from accepted state.
Adding approved scope may keep the percentage unchanged or reduce it; the resulting
update explains why.

## 11. Notifications and PWA

The marketing site remains usable as a website. Authenticated portal surfaces are
installable as a PWA.

Every important durable event creates notification records for the affected party:

- invitation created, accepted, expired, revoked, or reissued;
- document published or superseded;
- signature requested, completed, or declined;
- payment requested, recorded, or disputed;
- question asked or answered;
- comment added or mention received;
- update published;
- stage or milestone changed;
- client action requested or completed;
- service request opened or updated.

Notification rules:

- Recipients are calculated on the server from memberships and event type.
- The actor does not receive a redundant notification for their own action.
- In-app notification persistence precedes best-effort Web Push.
- Push failure is observable and retryable within a bound but never rolls back the
  underlying event.
- Each user may control non-critical categories, but contractual, security, and payment
  notifications cannot be silently disabled.
- Push subscriptions are revocable, scoped to a user and device, and removed when the
  provider reports them permanently invalid.

## 12. Mobile information architecture

The client mobile navigation has five persistent destinations:

1. Home
2. Project
3. Actions
4. Documents
5. More

“Actions” is visually prominent and aggregates approvals, signatures, questions, and
other work awaiting the client.

The client home screen prioritizes:

1. current stage;
2. required action;
3. latest update;
4. next step.

The internal owner surface may expose denser controls but uses the same project state and
document records.

## 13. MVP delivery slices

### Slice 1 — foundation

- Updated product governance and architecture decisions.
- Google OAuth restricted to invited `@gmail.com` accounts.
- Company, people, project, membership, and invitation model.
- Owner-managed invitation lifecycle: live, expired, accepted, and revoked states;
  idempotent revocation and reissue; changing an unactivated contact Gmail revokes
  every stale pending invitation.
- Owner editing of company, project, and contact details. An activated Google identity
  keeps its Gmail address immutable.
- Protected internal and client shells.
- Client dashboard with current stage and required actions.
- Confidential guest intake, owner review, meeting-slot booking, manual payment-link
  publication, and durable in-app notifications.

### Slice 2 — documents and commercial flow

- Default initial-summary template. **Implemented.**
- Versioned documents and shared web/PDF rendering. **Implemented.**
- Contract declarations, drawn signature, evidence record, and signed PDF.
- Manual payment recording and payment-gated stage transition. **Implemented for the
  discovery payment; later contract payments remain in scope.**

### Slice 3 — transparent delivery

- Questions, comments, project events, milestones, and update timeline.
- Versioned structured-output prompt and deterministic parser.
- Preview, editing, publication, and duplicate protection.

### Slice 4 — PWA and notifications

- Manifest, icons, installable shell, service worker, and offline-safe navigation.
- In-app notification center and Web Push subscription.
- Important-event fan-out to SYSTEMIZE and client owners.

## 14. Public marketing site

The existing public site remains in scope:

- `/`
- `/projects`
- `/projects/athletetrack`
- `/projects/finquest`
- `/projects/guesto`
- `/privacy`
- `/terms`
- `/accessibility`

It continues to provide the hero, delivery process, workspace preview, FAQ, Blueprint
lead form, a three-product portfolio, durable Supabase persistence, and best-effort
Telegram lead notification.

Authenticated routes are non-indexable and excluded from the sitemap.

## 15. Systems of record

- **Supabase Postgres:** companies, people, memberships, projects, project events,
  documents, versions, signatures, payments, updates, notifications, push
  subscriptions, and idempotency.
- **Supabase Auth:** Google identity and server sessions.
- **Private object storage:** future signed PDFs and private project files. The initial
  summary PDF is generated on demand from its immutable database version.
- **Vercel:** application hosting and server runtime.
- **Web Push provider contract:** best-effort delivery only.
- **Zoom and Google Calendar:** server-only meeting providers. Provider failure never
  rolls back a booked slot, and only the participant Zoom URL becomes client-visible.
- **Telegram:** existing public-lead notification only.

## 16. Security and privacy

- Every non-public table has RLS and explicit allow/deny tests.
- Project access is re-authorized in every sensitive action and route.
- Invitation, signature, payment, and publication mutations require durable idempotency.
- Tokens are random, single-use, time-limited, and stored hashed.
- Signed evidence is append-only through trusted server boundaries.
- Private PDFs are never published through guessable URLs.
- Logs exclude names, full email addresses, phone numbers, document bodies, signatures,
  tokens, and project free text.
- Data export, revocation, retention, and deletion workflows are required before portal
  production launch.

## 17. Acceptance journeys

1. Owner creates a company, project, and two client owners.
2. Each owner receives a distinct invitation and only the matching Gmail account can
   activate it.
3. Cross-company and cross-project reads and mutations are denied.
4. Owner publishes the initial summary; the client sees the same content in web and PDF.
5. An authorized client owner signs the exact contract version and a verifiable signed
   PDF is generated.
6. Signing alone does not advance the project; recording payment does.
7. A structured AI payload is validated, previewed, edited, and published exactly once.
8. Publishing creates in-app notifications before push is attempted.
9. Push failure preserves the published update and remains observable.
10. The client completes the critical journey on a 390×844 viewport using keyboard or
    touch with no accessibility violations.

## 18. Production blockers

The following do not block architecture or local implementation, but block production
portal launch:

1. Final contract and signature language reviewed by a competent legal professional.
2. Production Supabase project, OAuth application, redirect allowlist, and Gmail admin
   allowlist.
3. Approved PII retention, export, deletion, and account-revocation policy.
4. Web Push production keys and browser/device verification.
5. Final canonical portal URL strategy.
6. Real template wording and commercial terms approved by the owner.
