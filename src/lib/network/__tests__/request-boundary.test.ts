import { describe, expect, it } from "vitest";
import {
  hasTrustedMutationOrigin,
  readBoundedJson,
} from "../request-boundary";

describe("hasTrustedMutationOrigin", () => {
  it("accepts the exact request origin", () => {
    const request = new Request("https://portal.example.test/api/push", {
      headers: { Origin: "https://portal.example.test" },
    });

    expect(hasTrustedMutationOrigin(request)).toBe(true);
  });

  it("rejects absent, cross-origin, and lookalike origins", () => {
    expect(
      hasTrustedMutationOrigin(
        new Request("https://portal.example.test/api/push")
      )
    ).toBe(false);
    expect(
      hasTrustedMutationOrigin(
        new Request("https://portal.example.test/api/push", {
          headers: { Origin: "https://attacker.example" },
        })
      )
    ).toBe(false);
    expect(
      hasTrustedMutationOrigin(
        new Request("https://portal.example.test/api/push", {
          headers: { Origin: "https://portal.example.test.attacker.example" },
        })
      )
    ).toBe(false);
  });
});

describe("readBoundedJson", () => {
  it("parses a JSON body within the configured limit", async () => {
    const request = new Request("https://portal.example.test/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ enabled: true }),
    });

    await expect(readBoundedJson(request, 100)).resolves.toEqual({
      enabled: true,
    });
  });

  it("rejects unsupported content types, malformed JSON, and oversized bodies", async () => {
    const textRequest = new Request("https://portal.example.test/api/push", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "{}",
    });
    const malformedRequest = new Request(
      "https://portal.example.test/api/push",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }
    );
    const oversizedRequest = new Request(
      "https://portal.example.test/api/push",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "x".repeat(100) }),
      }
    );

    await expect(readBoundedJson(textRequest)).resolves.toBeNull();
    await expect(readBoundedJson(malformedRequest)).resolves.toBeNull();
    await expect(readBoundedJson(oversizedRequest, 20)).resolves.toBeNull();
  });
});
