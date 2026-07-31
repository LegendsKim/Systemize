import { describe, expect, it } from "vitest";
import {
  buildSafePushPayload,
  classifyPushFailure,
} from "../push-delivery-policy";

describe("classifyPushFailure", () => {
  it.each([404, 410])("removes permanently rejected subscriptions (%s)", (statusCode) => {
    expect(classifyPushFailure({ statusCode })).toEqual({
      outcome: "dead",
      removeSubscription: true,
      errorCode: `http_${statusCode}`,
      retryAfterSeconds: null,
    });
  });

  it("retries a 429 and honors Retry-After", () => {
    expect(
      classifyPushFailure(
        { statusCode: 429, headers: { "retry-after": "120" } },
        new Date("2026-07-31T00:00:00.000Z")
      )
    ).toMatchObject({
      outcome: "retry",
      removeSubscription: false,
      retryAfterSeconds: 120,
    });
  });

  it.each([500, 502, 503])("retries transient provider status %s", (statusCode) => {
    expect(classifyPushFailure({ statusCode }).outcome).toBe("retry");
  });

  it("does not retry an ordinary provider 4xx", () => {
    expect(classifyPushFailure({ statusCode: 400 })).toMatchObject({
      outcome: "dead",
      removeSubscription: false,
    });
  });

  it("retries bounded network failures through the durable outbox", () => {
    expect(classifyPushFailure({ code: "ETIMEDOUT" })).toMatchObject({
      outcome: "retry",
      errorCode: "network_ETIMEDOUT",
    });
  });
});

describe("buildSafePushPayload", () => {
  it("contains only generic lock-screen copy and an internal path", () => {
    const payload = buildSafePushPayload({
      kind: "payment_requested",
      href: "/portal/projects/project-id",
      notificationId: "11111111-2222-4333-8444-555555555555",
    });

    expect(payload).toEqual({
      title: "נדרשת פעולה ב־SYSTEMIZE",
      body: "יש פעולה חדשה שממתינה לך באזור האישי.",
      href: "/portal/projects/project-id",
      tag: "11111111222243338444555555555555",
    });
    expect(JSON.stringify(payload)).not.toMatch(/₪|לקוח|חברה|מסמך:/);
  });

  it("rejects external or unrelated notification destinations", () => {
    expect(
      buildSafePushPayload({
        kind: "meeting_booked",
        href: "https://attacker.invalid/account",
        notificationId: "notification",
      }).href
    ).toBe("/app");
  });
});
