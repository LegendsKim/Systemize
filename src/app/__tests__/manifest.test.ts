import { describe, expect, it } from "vitest";
import manifest from "../manifest";

describe("PWA manifest", () => {
  it("uses the server-routed app entry and complete icon set", () => {
    const value = manifest();
    expect(value).toMatchObject({
      id: "/app",
      start_url: "/app",
      scope: "/",
      display: "standalone",
      dir: "rtl",
      lang: "he",
    });
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192" }),
        expect.objectContaining({ sizes: "512x512" }),
        expect.objectContaining({ purpose: "maskable" }),
      ])
    );
  });
});
