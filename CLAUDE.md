@AGENTS.md

# Claude Code project memory

`AGENTS.md` is the single authoritative engineering constitution. Do not duplicate or
reinterpret it here.

Determine repository mode before acting:

- If both `AGENTS.client.md` and `CLIENT_BRIEF.md` are absent, this is the reusable Systemize boilerplate mother
  repository. It must not contain client branding, client secrets, or client domain
  behavior.
- If `AGENTS.client.md` is absent and `CLIENT_BRIEF.md` is present, this is a new
  client repository in bootstrap mode. Read `CLIENT_INTAKE.md` and follow its
  clarification and approval workflow. Do not write product code.
- If `AGENTS.client.md` is present with `configuration_status: UNCONFIGURED`, remain in
  client-bootstrap mode and continue `CLIENT_INTAKE.md`; do not write product code.
- If `AGENTS.client.md` is present with `configuration_status: APPROVED`, this is an
  initialized client repository. Read it completely and treat its decisions as the
  TUNABLE project configuration.

When asked to build the initial boilerplate in mother-repository mode:

1. Read `README.md`.
2. Read the initial-build and release sections in `WORKFLOW.md`.
3. Read `ARCHITECTURE.md` and `QUALITY.md`.
4. Inspect the repository before changing files.
5. Create a chronological, reviewable implementation plan.
6. Implement every bootstrap stage through a green quality gate.
7. Preserve the governance files. Do not run a force scaffold over this non-empty root;
   scaffold in a disposable directory and transplant reviewed files, or create the
   minimal Next.js foundation directly.
8. Prefer current patched stable/LTS dependencies; verify version-sensitive behavior
   against official primary documentation.
9. Build a removable generic vertical slice that proves Supabase persistence, RLS,
   idempotency, provider adapters, failure states, accessibility, and tests.
10. Do not require real production credentials for build or tests.
11. Do not declare the boilerplate ready until clean install, checks, build, E2E,
    accessibility, visual, migration, and template-creation verification pass.

Ask for user input only when a missing choice changes product scope, paid providers,
external infrastructure, or irreversible behavior. Otherwise use the documented
defaults and continue.
