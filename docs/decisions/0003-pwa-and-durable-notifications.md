# 0003 — PWA shell and durable notification fan-out

- Status: Accepted
- Date: 2026-07-29
- Owner: Marlen Kimiagrov
- Version: SYSTEMIZE PORTAL discovery

## Context

The owner wants SYSTEMIZE PORTAL to be installable and to notify SYSTEMIZE and client
owners about every important action by the other party. WhatsApp automation is not part
of the initial portal.

## Decision drivers

- Mobile-first access without requiring an app-store application.
- A reliable record even when push is denied, unavailable, or fails.
- No business mutation lost because a provider failed.
- Server-authorized recipient calculation.
- Safe behavior across multiple devices per user.

## Options considered

1. Push notifications as the sole notification record.
2. In-app notifications only.
3. Durable in-app notifications followed by best-effort Web Push.

## Decision

Choose option 3.

Every important domain event is committed first. In the same durable workflow, the
system creates recipient-specific notification rows. Only after persistence does a
server-only provider attempt Web Push.

Recipient calculation uses active project memberships and the event category. The actor
does not receive a redundant notification for their own action.

Push subscriptions:

- belong to one user and one device endpoint;
- are never treated as identity or authority;
- may be revoked by the user;
- are removed after permanent provider rejection;
- use bounded retry only for retryable failures.

The service worker may cache the application shell and safe public assets. It does not
publicly cache authenticated project responses and does not silently queue sensitive
mutations such as signatures, payments, or publication.

## Consequences

- The notification center remains useful without PWA installation or push permission.
- Browser and operating-system limitations become delivery-state information, not data
  loss.
- Push payloads carry the minimum safe copy and an authorized navigation path, not full
  document or project content.
- Device revocation, logout, and invalid-subscription cleanup require tests.

## Rollback

Disable Web Push delivery while retaining in-app notification records and preferences.
No domain event or notification history is removed.
