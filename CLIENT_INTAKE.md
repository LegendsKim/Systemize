# AI Protocol — Bootstrap a Client Project from a Natural-Language Brief

This file is an instruction protocol for AI coding agents. It applies only to a fresh
client copy of the Systemize Boilerplate when `CLIENT_BRIEF.md` is present.

## 1. Objective

Transform the user's natural-language client brief into an approved, internally
consistent project configuration and product specification before writing product code.

The user is not required to know technical terminology. Extract what is explicit, mark
what is unknown, explain consequential choices plainly, and ask focused clarification
questions.

## 2. Preconditions and repository mode

Before acting:

1. Read `AGENTS.md`, this file, `AGENTS.client.template.md`, `ARCHITECTURE.md`,
   `QUALITY.md`, and `WORKFLOW.md` completely.
2. Confirm `CLIENT_BRIEF.md` exists.
3. Confirm this is a copied client directory, not the Systemize mother repository.
4. Inspect Git status and repository contents.
5. Do not access or modify any sibling Systemize repository.

Mode detection:

- `AGENTS.client.md` absent + `CLIENT_BRIEF.md` absent: mother-repository mode.
- `AGENTS.client.md` absent + `CLIENT_BRIEF.md` present: client-bootstrap mode.
- `AGENTS.client.md` present with `configuration_status: UNCONFIGURED`:
  client-bootstrap mode.
- `AGENTS.client.md` present with `configuration_status: APPROVED`:
  client-repository mode.

If the mode is ambiguous, stop and ask the user. Never convert the mother repository
into a client repository.

## 3. Non-negotiable behavior

During client-bootstrap mode:

- Do not write, delete, or restructure product code.
- Do not configure paid services or create external resources.
- Do not invent client requirements, legal rules, permissions, retention periods,
  provider choices, or business invariants.
- Do not mark `configuration_status: APPROVED` on the user's behalf.
- Do not discard or silently rewrite the original brief.
- Do not put credentials, tokens, real payment data, or unnecessary personal data in
  Markdown, source control, logs, or examples.
- Preserve every LOCKED rule in `AGENTS.md`.
- Clearly distinguish facts, proposed defaults, assumptions, conflicts, and open
  questions.

## 4. Intake workflow

### Phase A — Preserve and understand

1. Read `CLIENT_BRIEF.md` completely.
2. Copy its content unchanged to `docs/discovery/CLIENT_BRIEF.md`. Keep the root
   `CLIENT_BRIEF.md` until `AGENTS.client.md` exists so later AI sessions continue to
   detect bootstrap mode. Paraphrasing away the original is forbidden.
3. Produce a short understanding summary:
   - business and project objective
   - intended users
   - requested journeys and capabilities
   - explicit constraints
   - stated integrations
   - requested launch scope
4. Identify contradictions, sensitive-data concerns, and missing decision owners.

### Phase B — Ask clarification questions

Ask questions in small rounds. Prefer three to five high-impact questions per round.
Start with decisions that change architecture, scope, privacy, cost, or schedule.

Use plain language and include:

- why the answer matters
- the recommended default, when a safe default exists
- the alternatives and their practical effect

Do not ask the user to repeat information already present in the brief. Do not ask
low-impact styling questions while authentication, data ownership, or project scope is
still unresolved.

Clarification order:

1. Business goal, success criteria, MVP boundary, and out-of-scope items.
2. User groups, authentication, roles, authorization, and tenancy.
3. Data collected, system of record, PII, retention, deletion/export, and legal owner.
4. Critical journeys, domain invariants, destructive behavior, and audit requirements.
5. Integrations, provider responsibility, webhooks, notifications, timeouts, and costs.
6. Locales, default language, RTL/LTR, URL strategy, timezone, and currencies.
7. Public routes, SEO, analytics, consent, canonical domain, and indexing.
8. Environments, deployment, observability, support, recovery, and ownership.
9. Brand, content, responsive behavior, accessibility, browser matrix, and visual scope.
10. Delivery stages, dependencies, deadlines, and acceptance process.

For genuinely unknown decisions, record `OPEN — owner and decision date required`.

### Phase C — Draft project documents

After enough information is available, create or update:

```text
AGENTS.client.md
README.md
docs/
  PRODUCT.md
  discovery/
    CLIENT_BRIEF.md
  decisions/
```

Document responsibilities:

- `docs/discovery/CLIENT_BRIEF.md`: preserved raw input and dated clarification notes.
- `docs/PRODUCT.md`: approved product intent, scope, users, journeys, functional
  requirements, non-functional requirements, acceptance criteria, out-of-scope items,
  risks, dependencies, and open questions.
- `AGENTS.client.md`: concise implementation-governing decisions mapped from
  `AGENTS.client.template.md`.
- `README.md`: client project identity, boilerplate source version, setup, commands,
  environments, and documentation map.
- `docs/decisions/`: only durable architecture decisions that require ADRs under
  `WORKFLOW.md`.

Copy `AGENTS.client.template.md` to `AGENTS.client.md`; do not create an unrelated
format. Set:

```yaml
configuration_status: UNCONFIGURED
boilerplate_version: "v1.0.1"
```

Replace every resolved `TODO`. Leave unresolved items explicit and keep the status
`UNCONFIGURED`.

Also update the client package identity in `package.json`, but do not install new
product dependencies during intake.

### Phase D — Consistency review

Before requesting approval, verify:

- `CLIENT_BRIEF.md`, `PRODUCT.md`, and `AGENTS.client.md` do not contradict each other.
- Every requested feature is in scope, out of scope, deferred, or an open question.
- Systems of record and notification-only systems are distinguished.
- Roles and permissions have both allowed and denied behavior.
- PII fields, purpose, retention, deletion/export, and owner are recorded.
- Locale, direction, timezone, currency, routes, SEO, and indexing are explicit.
- Critical journeys have measurable acceptance criteria.
- Integrations have ownership, failure behavior, timeout, retry, and idempotency needs.
- No LOCKED boilerplate rule was weakened.
- No secret or real customer record entered the repository.

Present the user with:

1. concise project summary
2. proposed MVP
3. deferred/out-of-scope list
4. consequential decisions
5. remaining open questions
6. documents created or changed

Ask for explicit approval. Do not treat silence or a vague acknowledgement as approval.

### Phase E — Approval and baseline

Only after the user explicitly approves:

1. Resolve all remaining blocking `TODO` and `OPEN` entries.
2. Set `configuration_status: APPROVED`.
3. Record approver and approval date.
4. Remove `AGENTS.client.template.md` from the client repository.
5. Remove `CLIENT_BRIEF.template.md` if it still exists.
6. Confirm `docs/discovery/CLIENT_BRIEF.md` preserves the raw input, then remove the
   temporary root `CLIENT_BRIEF.md`.
7. Keep `CLIENT_INTAKE.md` until the intake handoff is complete; it may then be removed
   from the client repository because `AGENTS.client.md` and `PRODUCT.md` govern normal
   work.
8. Run `npm ci`, `npm run check`, and `npm run build`.
9. Present a chronological implementation plan. Do not begin implementation until that
   plan is approved separately.

Recommended initialization commit:

```text
chore: initialize client project from Systemize Boilerplate v1.0.1
```

## 5. Rules for interpreting natural language

- “We probably need” is a proposal, not an approved requirement.
- “Maybe later” belongs in deferred scope with a decision owner or milestone.
- “Like website X” is a reference, not permission to copy protected content or code.
- “Admin” is not a complete role definition; ask what it may view, change, export, and
  delete.
- “Save leads” is incomplete; ask where, which fields, retention, access, deduplication,
  and notification behavior.
- “Support Hebrew” is incomplete; ask default locale, URL strategy, RTL coverage,
  timezone, and content ownership.
- “Secure” is not an acceptance criterion; map it to authentication, authorization,
  RLS, secrets, audit, abuse prevention, and recovery.
- “Accessible” requires defined WCAG target, automated coverage, and manual keyboard
  review.
- A requested provider is not automatically the system of record.

## 6. Required first response from the AI

After reading the brief, the AI's first response must contain only:

1. its understanding of the project
2. facts extracted from the brief
3. assumptions it refuses to make
4. the first small round of clarification questions
5. confirmation that no product code was changed

The AI must continue the clarification loop until the project documents are ready for
explicit human approval.
