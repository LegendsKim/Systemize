import { describe, expect, it } from "vitest";
import {
  buildSystemHealthSnapshot,
  describeSystemHealthFailure,
  systemHealthComponents,
} from "../system-health-model";

const row = (component: string, status: "healthy" | "unhealthy") => ({
  component,
  status,
  error_code: status === "healthy" ? null : "provider_failed",
  checked_at: "2026-07-31T20:00:00.000Z",
  status_changed_at: "2026-07-31T20:00:00.000Z",
});

const now = new Date("2026-07-31T21:00:00.000Z");

describe("system health snapshot", () => {
  it("is healthy only when every expected component is healthy", () => {
    const snapshot = buildSystemHealthSnapshot(
      systemHealthComponents.map((component) => row(component, "healthy")),
      now
    );
    expect(snapshot.overall).toBe("healthy");
    expect(snapshot.checks).toHaveLength(5);
  });

  it("prefers an explicit failure over missing checks", () => {
    const snapshot = buildSystemHealthSnapshot([
      row("database", "healthy"),
      row("zoom", "unhealthy"),
    ], now);
    expect(snapshot.overall).toBe("unhealthy");
    expect(snapshot.checks.find((check) => check.component === "google_calendar"))
      .toMatchObject({ status: "unknown" });
  });

  it("describes actionable known failures without exposing provider payloads", () => {
    expect(
      describeSystemHealthFailure("google_calendar", "google_reconnect_required")
    ).toContain("חיבור מחדש");
    expect(
      describeSystemHealthFailure("meeting_automation", "meeting_attention_required")
    ).toContain("פגישה");
  });

  it("does not present a stale snapshot as healthy", () => {
    const snapshot = buildSystemHealthSnapshot(
      systemHealthComponents.map((component) => row(component, "healthy")),
      new Date("2026-08-02T00:00:00.000Z")
    );
    expect(snapshot.overall).toBe("unknown");
    expect(snapshot.checks.every((check) => check.status === "unknown")).toBe(true);
  });
});
