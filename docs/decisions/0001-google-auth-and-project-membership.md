# 0001 — Google authentication and project-scoped membership

- Status: Accepted
- Date: 2026-07-29
- Owner: Marlen Kimiagrov
- Version: SYSTEMIZE PORTAL discovery

## Context

SYSTEMIZE PORTAL serves one internal SYSTEMIZE owner and one or more client owners per
company. A company may later have multiple projects. The owner wants login limited to
Gmail and wants every participant to receive a separate single-use invitation.

## Decision drivers

- Simple customer login without local passwords.
- Exact control over who may see each project.
- Safe support for multiple owners in the same company.
- A future path to SYSTEMIZE staff and multiple projects.
- No project information disclosed by an invitation before identity verification.

## Options considered

1. Shared project token.
2. Email magic link without Google identity.
3. Google OAuth plus project-bound invitations.

## Decision

Use Supabase Auth with Google OAuth. Accept only a Google-verified email ending exactly
in `@gmail.com` during the MVP.

Each invitation:

- targets one normalized Gmail address;
- targets one company and one project;
- declares one intended role;
- uses a random single-use token;
- stores only a cryptographic token hash;
- expires after seven days;
- is consumed atomically with membership creation.

Authorization is project-membership based. Server boundaries derive the user from the
trusted session and re-check an active membership and capability. Client-supplied user,
company, project, or role identifiers never establish authority.

The SYSTEMIZE owner is an explicitly allowlisted Google identity with the
`systemize_owner` application role.

## Consequences

- Google Workspace accounts with custom domains cannot sign in during the MVP.
- Changing the allowed identity policy later requires an ADR and migration tests.
- Every protected query and mutation requires allow and deny coverage across projects
  and companies.
- Invitation reuse, mismatch, expiry, revocation, and concurrent activation require
  database-backed tests.

## Rollback

Disable portal authentication and invitations while leaving the public marketing site
operational. Existing membership and audit records remain intact.
