import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/types";
import {
  authenticatedPortalContext,
  portalE2EUsers,
} from "./portal-auth-helper";

test("manifest and install assets expose the server-routed app entry", async ({
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    id: string;
    start_url: string;
    display: string;
    icons: Array<{ src: string; purpose?: string }>;
  };
  expect(manifest).toMatchObject({
    id: "/app",
    start_url: "/app",
    display: "standalone",
  });
  expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

  for (const path of [
    "/pwa/icon-192.png",
    "/pwa/icon-512.png",
    "/pwa/icon-maskable-512.png",
    "/sw.js",
    "/offline.html",
  ]) {
    expect((await request.get(path)).ok(), path).toBe(true);
  }
});

test("/app resolves the current server session instead of a cached role", async ({
  browser,
  baseURL,
}) => {
  const root = baseURL ?? "http://127.0.0.1:3000";
  const ownerContext = await authenticatedPortalContext(
    browser,
    portalE2EUsers.owner,
    root
  );
  const clientContext = await authenticatedPortalContext(
    browser,
    portalE2EUsers.clientA,
    root
  );
  try {
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/app");
    await expect(ownerPage).toHaveURL(/\/admin$/);

    const clientPage = await clientContext.newPage();
    await clientPage.goto("/app");
    await expect(clientPage).toHaveURL(/\/portal$/);
  } finally {
    await ownerContext.close();
    await clientContext.close();
  }
});

test("an owner opening a client portal URL is redirected to the admin console", async ({
  browser,
  baseURL,
}) => {
  const context = await authenticatedPortalContext(
    browser,
    portalE2EUsers.owner,
    baseURL ?? "http://127.0.0.1:3000"
  );
  try {
    const page = await context.newPage();
    await page.goto("/portal/actions");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator(".admin-app")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("a client cannot open the admin console or its nested routes", async ({
  browser,
  baseURL,
}) => {
  const context = await authenticatedPortalContext(
    browser,
    portalE2EUsers.clientB,
    baseURL ?? "http://127.0.0.1:3000"
  );
  try {
    const page = await context.newPage();
    await page.goto("/admin/templates");
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator(".admin-app")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("the worker never stores authenticated HTML, RSC or API responses", async ({
  browser,
  baseURL,
}) => {
  const context = await authenticatedPortalContext(
    browser,
    portalE2EUsers.clientA,
    baseURL ?? "http://127.0.0.1:3000"
  );
  try {
    const page = await context.newPage();
    await page.goto("/portal");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.goto("/portal/actions");

    const cachedUrls = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const cacheName of await caches.keys()) {
        for (const request of await (await caches.open(cacheName)).keys()) {
          urls.push(request.url);
        }
      }
      return urls;
    });

    expect(
      cachedUrls.filter((value) => {
        const path = new URL(value).pathname;
        return (
          path === "/portal" ||
          path.startsWith("/portal/") ||
          path === "/admin" ||
          path.startsWith("/admin/") ||
          path.startsWith("/api/")
        );
      })
    ).toEqual([]);
  } finally {
    await context.close();
  }
});

test("logout purges PWA caches and private intake drafts", async ({
  browser,
  baseURL,
}) => {
  const context = await authenticatedPortalContext(
    browser,
    portalE2EUsers.clientB,
    baseURL ?? "http://127.0.0.1:3000"
  );
  try {
    const page = await context.newPage();
    await page.goto("/portal");
    const requestOrigin = new URL(
      baseURL ?? "http://127.0.0.1:3000"
    ).origin;
    const subscriptionResponse = await context.request.post(
      "/api/push/subscriptions",
      {
        headers: { Origin: requestOrigin },
        data: {
          endpoint: "https://push.example.test/e2e-logout-device",
          keys: {
            p256dh: "p".repeat(64),
            auth: "a".repeat(24),
          },
          userAgent: "E2E browser",
        },
      }
    );
    expect(subscriptionResponse.ok()).toBe(true);
    const subscription = (await subscriptionResponse.json()) as { id: string };

    await page.evaluate(async () => {
      const cache = await caches.open("systemize-pwa-test-private");
      await cache.put("/portal/private-fixture", new Response("private"));
      localStorage.setItem(
        "systemize:intake-draft:e2e-private-project",
        JSON.stringify({ answers: { companyOverview: "private" } })
      );
      localStorage.setItem("unrelated-e2e-setting", "keep");
    });

    await page.getByRole("button", { name: "יציאה" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const privateUrls: string[] = [];
          for (const cacheName of await caches.keys()) {
            for (const request of await (await caches.open(cacheName)).keys()) {
              const path = new URL(request.url).pathname;
              if (
                path === "/portal" ||
                path.startsWith("/portal/") ||
                path === "/admin" ||
                path.startsWith("/admin/") ||
                path.startsWith("/api/")
              ) {
                privateUrls.push(request.url);
              }
            }
          }
          return privateUrls;
        })
      )
      .toEqual([]);
    expect(
      await page.evaluate(() => ({
        draft: localStorage.getItem(
          "systemize:intake-draft:e2e-private-project"
        ),
        unrelated: localStorage.getItem("unrelated-e2e-setting"),
      }))
    ).toEqual({ draft: null, unrelated: "keep" });

    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    await expect
      .poll(async () => {
        const { data, error } = await admin
          .from("push_subscriptions")
          .select("id")
          .eq("id", subscription.id)
          .maybeSingle();
        if (error) throw error;
        return data;
      })
      .toBeNull();
  } finally {
    await context.close();
  }
});

test("in-app notifications remain available when Push permission is denied", async ({
  browser,
  baseURL,
}) => {
  const context = await authenticatedPortalContext(
    browser,
    portalE2EUsers.clientA,
    baseURL ?? "http://127.0.0.1:3000"
  );
  await context.addInitScript(() => {
    if ("Notification" in window) {
      Object.defineProperty(Notification, "permission", {
        configurable: true,
        get: () => "denied",
      });
    }
  });
  try {
    const page = await context.newPage();
    await page.goto("/portal/notifications");
    await expect(
      page.getByRole("heading", { name: "מה השתנה בפרויקט" })
    ).toBeVisible();
    await expect(
      page.locator(".workflow-notification-list, .portal-empty-state")
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("PWA settings remain accessible without provider configuration", async ({
  browser,
  baseURL,
}) => {
  const context = await authenticatedPortalContext(
    browser,
    portalE2EUsers.clientA,
    baseURL ?? "http://127.0.0.1:3000"
  );
  try {
    const page = await context.newPage();
    await page.goto("/portal/settings");
    await expect(
      page.getByRole("heading", { name: "התראות במכשירים שלך" })
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    const firstPreference = page.locator(".pwa-preferences input").first();
    await firstPreference.focus();
    await expect(firstPreference).toBeFocused();
  } finally {
    await context.close();
  }
});
