import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

describe("service worker privacy contract", () => {
  it.each(["/portal", "/admin", "/auth", "/login", "/invite", "/api"])(
    "explicitly excludes %s from cacheable paths",
    (prefix) => {
      expect(worker).toContain(`"${prefix}"`);
    }
  );

  it("refuses responses carrying session or private cache directives", () => {
    expect(worker).toContain('response.headers.has("set-cookie")');
    expect(worker).toContain('cacheControl.includes("no-store")');
    expect(worker).toContain('cacheControl.includes("private")');
  });

  it("never answers an asset from cache on a development host", () => {
    // Development chunk URLs are not content-hashed, so a cache-first entry would pin the
    // page to the previous edit and make a source change look like it never applied.
    expect(worker).toContain('self.location.hostname === "localhost"');
    expect(worker).toContain('self.location.hostname === "127.0.0.1"');
    expect(worker).toMatch(
      /function isSafeStaticAsset\([^)]*\) \{\s*if \(isDevelopmentHost\) return false;/
    );
  });

  it("does not implement background sync or queue mutations", () => {
    expect(worker).not.toContain('addEventListener("sync"');
    expect(worker).not.toContain("BackgroundSync");
  });

  it("purges versioned caches on activation and logout messages", () => {
    expect(worker).toContain('addEventListener("activate"');
    expect(worker).toContain("PURGE_PWA_CACHES");
  });

  it("does not abort installation when one shell asset is unavailable", () => {
    expect(worker).not.toContain("cache.addAll(SHELL_ASSETS)");
    expect(worker).toContain("Promise.allSettled(");
    expect(worker).toContain("systemize_pwa_shell_partially_cached");
  });

  it("opens a new window when navigating an existing client fails", () => {
    expect(worker).toMatch(
      /\.navigate\(href\)[\s\S]*?\.catch\(\(\) => self\.clients\.openWindow\(href\)\)/
    );
  });
});
