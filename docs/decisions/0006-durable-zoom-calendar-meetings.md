# 0006 — Durable Zoom and Google Calendar meeting provisioning

- Status: Accepted
- Date: 2026-07-31
- Owner: Marlen Kimiagrov
- Version: SYSTEMIZE PORTAL Slice 4

## Context

After a client books a discovery slot, both parties need one shared date, a Zoom join
link, a Gmail calendar invitation, and reminders. Zoom and Google are external mutable
providers: either can time out after accepting a request, and neither may determine
whether the authoritative booking remains saved.

## Decision

The existing `meeting_slots` booking remains the system of record. The database trigger
atomically creates a client-visible `meeting_integrations` row and a private durable
outbox row when a slot becomes booked.

A server-only dispatcher runs after the booking response and from the existing recovery
Cron. It:

1. obtains a short-lived Zoom Server-to-Server OAuth token;
2. reconciles by a deterministic slot marker before creating a scheduled meeting;
3. stores only the participant `join_url`, never the host `start_url`;
4. creates a Google Calendar event with a deterministic event ID;
5. sends the event update to the booked Gmail attendee;
6. records the safe provider IDs and marks the integration ready.

Google Calendar uses a separate, incremental OAuth grant with the narrow
`calendar.events.owned` scope. The owner connects it explicitly. The callback validates
an HttpOnly `state` cookie, verifies the authorized Gmail is the configured SYSTEMIZE
owner, and stores the offline refresh token in a private table accessible only through
service-role RPCs.

The event requests an email reminder one day before and a popup reminder one hour
before. Attendees also retain their own Google Calendar notification preferences.

## Reliability and privacy

- Zoom creation is not immediately retried after an ambiguous response. The next outbox
  attempt first reconciles scheduled meetings using the non-PII slot marker.
- Google uses a deterministic event ID, so a timed-out insert is safely reconciled by a
  subsequent `409` and event read.
- Only network failures, timeouts, `429`, and transient `5xx` are retried, with bounded
  backoff and `Retry-After` support.
- Ordinary `4xx`, invalid scopes, and revoked OAuth grants move the integration to an
  owner-attention state.
- Provider tokens, host URLs, attendee payloads, and response bodies are excluded from
  logs and browser-readable tables.

## Consequences

The client sees the booked date immediately and a preparing state until both providers
are ready. A provider outage cannot undo or duplicate the booking. The owner must
reconnect Google Calendar when Google revokes or expires the refresh token. External
Google OAuth apps left in Testing issue refresh tokens that expire after seven days, so
the consent configuration must be moved to Production for durable operation.

## Rollback

Disable the meeting dispatcher and leave the durable booking and outbox rows intact.
Clients continue to see the booked date without a join link. No booked slot is deleted
or reverted.
