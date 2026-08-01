# 0004 — Versioned structured update import

- Status: Accepted
- Date: 2026-07-29
- Owner: Marlen Kimiagrov
- Version: SYSTEMIZE PORTAL discovery

## Context

The SYSTEMIZE owner works with an external AI tool and wants one button to copy an exact
prompt. The returned output is pasted into SYSTEMIZE PORTAL and converted into a
designed project update and progress proposal.

The portal does not need an AI-provider integration for the MVP.

## Decision drivers

- Deterministic parsing across different external AI tools.
- Human control over customer-visible claims.
- Clear schema migration when the format evolves.
- Duplicate protection.
- Separation of client copy from internal technical notes.
- No arbitrary AI text directly changing authoritative project progress.

## Options considered

1. Parse headings and punctuation from free-form prose.
2. Ask for JSON but accept arbitrary fields.
3. Validate versioned JSON strictly, preview it, and publish only after owner approval.

## Decision

Choose option 3.

The copied prompt includes:

- schema version;
- selected project reference;
- exact JSON contract;
- field limits and allowed categories;
- explicit instruction to return JSON only;
- separation between client-facing and internal fields.

The prompt is generated dynamically from a bounded project-context snapshot. The
snapshot contains the approved plan, accepted decisions, current task states, open
blockers, newly discovered work, and the last accepted session handoff.

The import pipeline:

1. Extracts one JSON object from the pasted value.
2. Rejects oversized input before parsing.
3. Validates a strict versioned schema.
4. Verifies the selected project reference.
5. Computes a deterministic fingerprint.
6. Rejects a duplicate import or publication.
7. Produces a designed preview.
8. Allows owner edits to client-facing fields.
9. Publishes through an idempotent mutation.
10. Creates project events and notifications after persistence.

AI-proposed progress or lifecycle changes are advisory. Applying one is a separate,
explicitly reviewed owner action subject to lifecycle prerequisites.

The application calculates progress from owner-approved milestone weights and accepted
task states. The AI never writes the authoritative percentage. Each accepted import
produces the bounded handoff used to generate the next session prompt, while the complete
session history remains durable.

## Consequences

- Prompt and parser versions are released together.
- Unknown schema versions fail closed with an actionable message.
- The raw pasted payload is retained only when necessary for audit and under a bounded
  retention policy; logs never contain it.
- Parser and formatter logic receive pure deterministic unit tests.

## Rollback

Disable structured import while retaining manual update creation. Previously published
updates remain ordinary immutable project history.
