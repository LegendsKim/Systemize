# Systemize Boilerplate

Official mother boilerplate release: **v1.0.1**.

This repository is the reusable, production-grade Next.js foundation for future
Systemize client projects. It is not the Systemize website and contains no active
client configuration.

## Verify the mother repository

```bash
npm ci
npm run check
npm run build
npx supabase start
npm run test:db
npm run test:e2e
npm run test:a11y
npm run test:visual
npx supabase stop --no-backup
```

Browser commands require Playwright Chromium (`npx playwright install chromium`).
Database commands require Docker Desktop or another Docker-compatible runtime.

## Start a new client from the release ZIP

Keep `AGENTS.client.template.md` in this mother repository and in the release ZIP. It is
removed only from an initialized client repository after `AGENTS.client.md` is approved.

For each client:

1. Extract the clean `systemize-boilerplate-v1.0.1.zip`.
2. Rename the extracted directory to the client/project name.
3. Rename `CLIENT_BRIEF.template.md` to `CLIENT_BRIEF.md`.
4. Write or paste the client's requirements in `CLIENT_BRIEF.md` in your own words.
5. Open the directory in Claude Code, Codex, or another repository-aware coding agent.
6. Send:

```text
This is a new client project created from Systemize Boilerplate.
Read CLIENT_INTAKE.md and process CLIENT_BRIEF.md.
Do not write product code yet. Start the clarification and approval workflow.
```

The AI must preserve the raw brief, ask clarification questions in small rounds, draft
`AGENTS.client.md` and `docs/PRODUCT.md`, and wait for explicit approval. It may begin
product planning only after the client configuration is approved.

## Documents

| File | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Authoritative rules for all agents and contributors |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code project memory; imports `AGENTS.md` |
| [`AGENTS.client.template.md`](./AGENTS.client.template.md) | Approved configuration template for client repositories |
| [`CLIENT_BRIEF.template.md`](./CLIENT_BRIEF.template.md) | Free-form client input template |
| [`CLIENT_INTAKE.md`](./CLIENT_INTAKE.md) | AI clarification and client-bootstrap protocol |
| [`WORKFLOW.md`](./WORKFLOW.md) | Initial build, client creation, versioning, upgrades, backports, and releases |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Code structure, dependency boundaries, data flow, and ADR process |
| [`QUALITY.md`](./QUALITY.md) | Security, Supabase, resilience, testing, accessibility, CI, and release gates |

Keep this set small. `AGENTS.md` is normative; the other files explain how to satisfy
it. Do not duplicate the same rule across multiple files.

## Repository modes

### Boilerplate repository

- Contains `AGENTS.client.template.md`.
- Does not contain an active `AGENTS.client.md`.
- Contains no client branding, production credentials, or domain-specific behavior.
- Must be a working application with a removable generic vertical slice.
- Releases versioned Git tags only after all gates pass.

### Client repository

- Is created from an approved boilerplate tag/template.
- Starts intake by renaming `CLIENT_BRIEF.template.md` to `CLIENT_BRIEF.md`.
- Copies `AGENTS.client.template.md` to `AGENTS.client.md`.
- Cannot begin product implementation until the client file is complete and approved.
- Records the exact boilerplate version from which it was created.

## What “production-grade boilerplate” means

The boilerplate is not complete merely because these Markdown files exist. It must
include and prove:

- Next.js App Router, strict TypeScript, Tailwind CSS v4, and pinned patched versions.
- Server Components by default and small documented Client Components.
- locale-derived `lang`/`dir` and RTL/LTR visual fixtures.
- Supabase browser/server/admin boundaries, migrations, generated types, and RLS tests.
- environment validation, provider-neutral adapters, observability, timeouts,
  idempotency, and distributed rate limiting.
- error boundaries, metadata primitives, sitemap/robots/icon/OG support.
- accessible UI primitives targeting WCAG 2.2 AA.
- unit, integration, E2E, accessibility, visual, migration, and architecture checks.
- CI and a verified clean template-creation flow.

## Starting the initial build with Claude Code

1. Place the governance and intake files in the root of an empty Git repository or the
   directory in which the boilerplate should be created.
2. Start Claude Code from that exact directory.
3. Run `/memory` and confirm that `CLAUDE.md` and imported `AGENTS.md` are loaded.
4. Give Claude the kickoff prompt below.
5. Review the plan before allowing paid-provider setup or irreversible external actions.

Claude Code supports project memory through root `CLAUDE.md` files and imports
`AGENTS.md` through the `@AGENTS.md` directive at the top of `CLAUDE.md`.

### Recommended kickoff prompt

```text
Build the initial Systemize production boilerplate in this repository.

First read and obey CLAUDE.md and the imported AGENTS.md. Then read WORKFLOW.md,
ARCHITECTURE.md, and QUALITY.md completely.

Treat this as the boilerplate mother repository, not a client project. Do not create an
active AGENTS.client.md and do not add client-specific branding or business rules.
Preserve the existing governance documents. Do not run a force scaffold over this
non-empty directory; use a disposable scaffold directory and transplant reviewed files,
or create the minimal Next.js foundation directly.

Follow the chronological “Initial Boilerplate Build” stages in WORKFLOW.md. Begin by
inspecting the repository and presenting a reviewable implementation plan. Then execute
the plan stage by stage, keeping each stage small and running its acceptance gate before
continuing.

Use the current patched stable/Active LTS Next.js release and compatible React, Node,
TypeScript, Tailwind CSS v4, and Supabase packages. Verify version-sensitive decisions
against official primary documentation.

Implement the actual code, configuration, tests, migrations, validators, CI, and a
removable generic vertical slice. Do not leave empty architecture folders or placeholder
implementations. Builds and tests must not require real production credentials.

Continue until clean install, lint, typecheck, unit/integration tests, production build,
E2E, accessibility, visual, migration/RLS, architecture validation, and template
creation are green. Stop and ask only for decisions involving paid external services,
production credentials, irreversible external changes, or genuine product-scope choices.

At the end, report the implemented architecture, exact commands and results, remaining
manual checks, and whether the repository satisfies the current release gate.
```

## After Claude finishes

Do not create a release tag immediately. Review:

1. Git diff and dependency choices.
2. Supabase migrations and RLS policies.
3. Server/client import boundaries.
4. Idempotency and provider failure behavior.
5. RTL/LTR screenshots and keyboard behavior.
6. CI results from a clean clone.
7. The release gate in `QUALITY.md`.

Only then approve the first boilerplate release and use it as a GitHub Template.
