import { describe, expect, it } from "vitest";
import { isPrivateSurface } from "@/proxy";

describe("isPrivateSurface", () => {
  it("covers every surface that renders one person's data", () => {
    const privatePaths = [
      "/admin",
      "/admin/leads",
      "/admin/projects/2f9c1f28-0000-4000-8000-000000000000",
      "/portal",
      "/portal/actions",
      "/portal/projects/2f9c1f28-0000-4000-8000-000000000000/discovery",
      "/api/documents/2f9c1f28-0000-4000-8000-000000000000/pdf",
      "/login",
      "/invite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "/auth/callback",
    ];

    for (const path of privatePaths) {
      expect(isPrivateSurface(path), path).toBe(true);
    }
  });

  it("leaves the public marketing site cacheable", () => {
    const publicPaths = [
      "/",
      "/projects",
      "/projects/guesto",
      "/privacy",
      "/terms",
      "/accessibility",
      "/sitemap.xml",
      "/robots.txt",
    ];

    for (const path of publicPaths) {
      expect(isPrivateSurface(path), path).toBe(false);
    }
  });

  it("does not match a public route that merely shares a prefix", () => {
    // `/portalsomething` is not the portal, and marking it private would be a quiet
    // way to make a future public page uncacheable for no reason.
    expect(isPrivateSurface("/portalsomething")).toBe(false);
    expect(isPrivateSurface("/logination")).toBe(false);
  });
});
