# 0007 — Invite-only Auth admission

- Status: Accepted
- Date: 2026-07-31
- Owner: Marlen Kimiagrov

## Context

Supabase OAuth normally inserts a Google identity into `auth.users` before the
application callback can decide whether the address belongs to an invitation. Signing
the rejected session out protects the portal, but leaves an unwanted Auth user behind.

## Decision

Use Supabase's Postgres `Before User Created` hook. The hook admits only:

1. the Gmail address of an existing SYSTEMIZE owner profile; or
2. a Gmail address on a pending, unexpired project invitation.

All other identities fail closed with a generic `403` response. The function is
`SECURITY DEFINER`, has an empty search path, and can be executed only by
`supabase_auth_admin`. It is not available to browser roles or the Data API.

Existing Auth users are intentionally not deleted by migrations. The owner performs any
legacy cleanup manually after reviewing the exact records in the Supabase dashboard.

## Operations

The function and permissions are deployed by migration. The hosted project must also
enable Authentication → Hooks → Before User Created and select
`public.before_user_created_invite_only`. Local development declares the same hook in
`supabase/config.toml`.

Changing the invitation lifecycle or owner model requires updating this hook and its
allow/deny database tests in the same change.
