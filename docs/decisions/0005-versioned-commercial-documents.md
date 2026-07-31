# 0005 — Versioned commercial documents

- Status: Accepted
- Date: 2026-07-31
- Owner: Marlen Kimiagrov
- Version: SYSTEMIZE PORTAL Slice 2

## Context

The client must receive a precise summary and discovery offer after the introductory
meeting. A mutable page or a separately maintained PDF would create two possible
versions of the commercial commitment and would not provide durable publication
evidence.

## Decision

Store commercial documents as a stable project document with append-only versions.
Drafts are visible only to the SYSTEMIZE owner. Publication changes one draft to an
immutable published version, records the actor and time, advances the project, and
notifies eligible project members.

Each version contains validated structured JSON and a SHA-256 hash of its canonical
content. The authenticated Web view and private PDF are rendered from that same stored
version. PDFs are generated on demand and returned with private, no-store caching.

The database rejects creation of a discovery payment request until the project has a
published introductory-summary version. RLS allows active project members to read only
published versions and prevents cross-project access.

## Consequences

- Editing published content always creates a new version.
- A draft can never become visible through a client query or PDF route.
- Web and PDF layouts may differ, but their facts and commercial terms cannot drift.
- Publication and payment prerequisites are enforced below the UI.
- Future approval and signature evidence can reference the immutable version ID and
  content hash.

## Rollback

Disable document creation and publication routes while retaining existing versions and
events. Do not delete published evidence. A forward migration may relax the payment
prerequisite only after an explicit product and security review.
