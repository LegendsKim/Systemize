/* SYSTEMIZE PWA worker: public shell only, never authenticated responses. */
const VERSION = "systemize-pwa-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL_ASSETS = [
  "/offline.html",
  "/icon.svg",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/icon-maskable-512.png",
];
const PRIVATE_PREFIXES = [
  "/app",
  "/portal",
  "/admin",
  "/auth",
  "/login",
  "/invite",
  "/api",
];

function isPrivatePath(pathname) {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/*
 * Asset caching is a production-only behaviour.
 *
 * Production filenames under `/_next/static/` carry a content hash, so an entry can be
 * kept forever safely. The development server does not hash them — the stylesheet chunk
 * keeps one stable URL across every edit — so the cache-first lookup below would hand
 * back the build from the last visit and a source change would silently never reach the
 * page, with the markup updating (navigations always go to the network) while the CSS
 * did not.
 */
const isDevelopmentHost =
  self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";

function isSafeStaticAsset(request, url) {
  if (isDevelopmentHost) return false;
  if (request.method !== "GET" || url.origin !== self.location.origin) return false;
  if (isPrivatePath(url.pathname)) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  return (
    ["font", "image", "script", "style"].includes(request.destination) &&
    (
      url.pathname.startsWith("/pwa/") ||
      url.pathname.startsWith("/hero/") ||
      url.pathname.startsWith("/projects/") ||
      url.pathname.startsWith("/cookies/") ||
      url.pathname === "/icon.svg" ||
      url.pathname === "/systemize-share-card.png" ||
      url.pathname === "/portal-share-card-v2.png"
    )
  );
}

function mayStore(response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  if (response.headers.has("set-cookie")) return false;
  const cacheControl = (response.headers.get("cache-control") || "").toLowerCase();
  return !cacheControl.includes("no-store") && !cacheControl.includes("private");
}

async function precacheShellAssets() {
  const cache = await caches.open(SHELL_CACHE);
  const results = await Promise.allSettled(
    SHELL_ASSETS.map(async (asset) => {
      const response = await fetch(asset, { cache: "no-store" });
      if (!mayStore(response)) throw new Error("shell_asset_unavailable");
      await cache.put(asset, response);
    })
  );
  if (results.some((result) => result.status === "rejected")) {
    console.warn("systemize_pwa_shell_partially_cached");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShellAssets());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("systemize-pwa-") && !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }
  if (!isSafeStaticAsset(event.request, url)) return;

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(event.request);
      if (mayStore(response)) {
        const cache = await caches.open(ASSET_CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});

function safeHref(value) {
  if (typeof value !== "string" || value.length > 500) return "/app";
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin) return "/app";
    return isPrivatePath(url.pathname) &&
      (url.pathname.startsWith("/portal") || url.pathname.startsWith("/admin"))
      ? `${url.pathname}${url.search}${url.hash}`
      : "/app";
  } catch {
    return "/app";
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title =
    typeof data.title === "string" && data.title.length <= 80
      ? data.title
      : "עדכון ב־SYSTEMIZE";
  const body =
    typeof data.body === "string" && data.body.length <= 160
      ? data.body
      : "יש עדכון חדש שממתין לך באזור האישי.";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa/icon-192.png",
      badge: "/pwa/icon-192.png",
      dir: "rtl",
      lang: "he",
      tag:
        typeof data.tag === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(data.tag)
          ? data.tag
          : undefined,
      data: { href: safeHref(data.href) },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = safeHref(event.notification.data?.href);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin
      );
      if (existing) {
        return existing
          .navigate(href)
          .then((client) => (client || existing).focus())
          .catch(() => self.clients.openWindow(href));
      }
      return self.clients.openWindow(href);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "PURGE_PWA_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("systemize-pwa-"))
              .map((key) => caches.delete(key))
          )
        )
    );
  }
});
