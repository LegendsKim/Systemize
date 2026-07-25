---
configuration_status: UNCONFIGURED
boilerplate_version: "TODO"
client_name: "TODO"
decision_owner: "TODO"
last_reviewed: "TODO-YYYY-MM-DD"
project_phase: "TODO: discovery | MVP | production | maintenance"
deployment_target: "TODO"
data_classification: "TODO: public | internal | confidential | regulated"
---

# Client Configuration

Copy this file to `AGENTS.client.md` in a newly created client repository. Complete
every `TODO`, change `configuration_status` to `APPROVED`, and obtain owner approval
before product implementation begins.

This file configures **TUNABLE** decisions and records client-specific rules. It does
not grant exemptions from **LOCKED** rules in `AGENTS.md`.

## 1. Product and stack

- **System type:** TODO
- **Business objective:** TODO
- **Primary user groups:** TODO
- **Required integrations:** TODO
- **Database:** Supabase / TODO approved deviation
- **Authentication model:** TODO: none | consumer | organization | internal workforce
- **Environments:** TODO: local, preview, staging, production

## 2. Locale and regional behavior

- **Supported locales:** TODO, for example `["he", "en"]`
- **Default locale:** TODO
- **URL locale strategy:** TODO: unprefixed default | always prefixed
- **Default timezone:** TODO IANA timezone, for example `Asia/Jerusalem`
- **Supported currencies:** TODO ISO 4217 codes, for example `["ILS", "USD"]`
- **RTL locales:** TODO

## 3. Public routes and SEO

- **Public/indexable routes:** TODO
- **Authenticated/non-indexable routes:** TODO
- **Canonical host:** TODO
- **Required structured-data types:** TODO or `none`
- **Sitemap policy:** TODO
- **Analytics/consent requirements:** TODO

Explicit SEO exceptions, with reason:

- TODO or `none`

## 4. Testing depth

The locked floor for money, authorization, data integrity, persistence, and destructive
operations always applies.

- **Critical end-to-end journeys:** TODO
- **Required browser/device matrix:** TODO
- **Visual regression scope:** TODO
- **Accessibility verification scope:** TODO
- **Deferred non-critical coverage:** TODO with owner and target milestone, or `none`

## 5. Domain invariants

List business rules that must never be inferred by an agent.

- TODO

Examples:

- Inventory adjustments append an immutable stock movement; they never directly replace
  an on-hand quantity without an audit event.
- A lead is persisted before notification delivery is attempted.
- Customer records are archived, never hard-deleted.

## 6. Data and integration boundaries

- **Systems of record:** TODO
- **Notification-only systems:** TODO
- **Inbound webhook contracts:** TODO
- **Outbound provider contracts:** TODO
- **PII fields and retention:** TODO
- **Idempotency requirements:** TODO
- **Rate-limit policy:** TODO

## 7. Approved tunings and exceptions

Only rules explicitly marked **TUNABLE** in `AGENTS.md` may be configured here.

| Rule | Decision | Reason | Owner | Review date |
|---|---|---|---|---|
| TODO or `none` | TODO | TODO | TODO | TODO |

## 8. Known deviations

This section documents existing non-compliance. It does not authorize new violations
of a **LOCKED** rule.

| Deviation | Risk | Remediation | Owner | Target date |
|---|---|---|---|---|
| TODO or `none` | TODO | TODO | TODO | TODO |

## 9. Approval

- **Configuration status:** TODO: `APPROVED`
- **Approved by:** TODO
- **Approval date:** TODO-YYYY-MM-DD
- **Notes:** TODO or `none`
