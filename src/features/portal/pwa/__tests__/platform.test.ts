import { describe, expect, it } from "vitest";
import { detectPwaPlatform } from "../platform";

describe("detectPwaPlatform", () => {
  it("identifies an iPhone that has not been installed", () => {
    expect(
      detectPwaPlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        false,
        false,
        true,
        true
      )
    ).toEqual({ supported: true, ios: true, standalone: false });
  });

  it("recognizes iOS standalone mode", () => {
    expect(
      detectPwaPlatform("Mozilla/5.0 (iPhone)", false, true, true, true)
    ).toMatchObject({ ios: true, standalone: true });
  });

  it("requires both service workers and PushManager", () => {
    expect(
      detectPwaPlatform("Mozilla/5.0 (Android)", false, false, true, false)
        .supported
    ).toBe(false);
  });
});
