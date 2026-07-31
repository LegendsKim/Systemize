# 0002 — Immutable contract signature and payment-gated approval

- Status: Accepted
- Date: 2026-07-29
- Owner: Marlen Kimiagrov
- Version: SYSTEMIZE PORTAL discovery

## Context

The client must review and sign a contract inside SYSTEMIZE PORTAL. The desired behavior
matches the evidence model already proven in CoachSync, but approval of the commercial
engagement becomes effective only after payment. Automatic payment processing is
deferred.

## Decision drivers

- Prove exactly what was signed and by whom.
- Prevent later document edits from changing signed evidence.
- Keep signature and payment as distinct business events.
- Allow manual payment now and a provider later without changing the lifecycle rule.
- Produce a human-readable signed PDF and machine-verifiable evidence.

## Options considered

1. A checkbox on a mutable document.
2. A drawn signature stored without a document snapshot.
3. Immutable version, declarations, drawn signature, evidence record, and payment gate.

## Decision

Choose option 3.

A published contract version is immutable and content-addressed. Contract approval
requires:

- an eligible active client owner;
- authority, read, and agreement declarations;
- a bounded PNG drawn signature;
- server validation and SHA-256 hashing;
- an idempotent transaction that stores immutable evidence.

The evidence event snapshots signer identity, Gmail address, document title, version,
full content, document hash, declarations, signature image, signature hash, UTC time,
bounded user agent, and privacy-preserving request evidence.

The lifecycle is:

```text
contract_published
→ signed
→ payment_pending
→ paid
→ approved
```

Only the SYSTEMIZE owner records the manual `paid` event in the MVP. A future payment
provider writes the same authoritative event through an idempotent server-only adapter.

## Consequences

- Signing alone never starts paid delivery work.
- Reissuing a changed contract creates a new version and signature request.
- Evidence tables are append-only and inaccessible for browser-role mutation.
- Signed PDFs live in private storage and require authorization.
- Contract wording and evidence retention require competent legal review before
  production use.

## Rollback

Stop issuing new signature requests. Existing signed evidence and PDFs remain immutable
and available to authorized parties.
