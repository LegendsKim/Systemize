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

The introductory-summary editor may ingest
`systemize.introductory-summary.autofill.v1` JSON produced after a guided external
ChatGPT interview. The browser validates the exact bounded schema and fills the editor;
the owner must still review, save a draft, and publish it through the existing
authorized versioning flow.

Web and PDF use the same presentation rules without rewriting stored snapshots. The
renderer consolidates related schema-v1 fields into a shorter business document,
recognizes labeled facts, assumptions, scope, duration, and dependencies when present,
and falls back safely for older unstructured or partially populated versions.

A field the editor stops collecting becomes optional in the content schema rather than
being removed from it. A published version is immutable and is re-parsed on every read,
and the repository drops a version whose content fails validation — so deleting a field
would make a document already saved under the longer format disappear from the portal
instead of simply rendering without it.

Exactly one figure in the system-plan document is a commitment: the price of the
recommended development option. Delivery phases carry no price. Pricing both produced two
totals on one page with nothing stating which one the client owed.

Both PDF renderers declare the bidi base direction on every text node. `direction` is not
inheritable in @react-pdf, so a text node that omits it is laid out left-to-right: Hebrew
renders with its closing punctuation on the wrong edge and embedded Latin runs in the
wrong place. Injecting U+200F into the strings cannot substitute for this — the base level
is an argument to the algorithm, not something a mark inside the text can override — and
leaves stray glyphs in the output. `pdf-direction.test.ts` holds both rules.

## Consequences

- Editing published content always creates a new version.
- A draft can never become visible through a client query or PDF route.
- Web and PDF layouts may differ, but their facts and commercial terms cannot drift.
- Publication and payment prerequisites are enforced below the UI.
- Future approval and signature evidence can reference the immutable version ID and
  content hash.
- AI-assisted text cannot bypass owner review, server validation, or publication.

## Rollback

Disable document creation and publication routes while retaining existing versions and
events. Do not delete published evidence. A forward migration may relax the payment
prerequisite only after an explicit product and security review.
