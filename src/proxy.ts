import { NextResponse, type NextRequest } from "next/server";
import { a11yRestoreScript } from "@/features/accessibility/a11y-settings";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

/**
 * The accessibility restore script is allowed by hash rather than by the per-request
 * nonce.
 *
 * A nonce attribute rendered into the React tree cannot survive hydration: once the CSP
 * is applied the browser hides the value, so `getAttribute("nonce")` returns an empty
 * string and React reports an attribute mismatch on every load. The script is a build-time
 * constant, so a hash source is both stable and strictly narrower than a nonce.
 *
 * Computed once per runtime instance; the digest is the same for every request.
 */
let a11yRestoreScriptHash: string | undefined;

async function getA11yRestoreScriptHash(): Promise<string> {
  if (!a11yRestoreScriptHash) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(a11yRestoreScript)
    );
    a11yRestoreScriptHash = btoa(
      String.fromCharCode(...new Uint8Array(digest))
    );
  }

  return a11yRestoreScriptHash;
}

/**
 * Route prefixes whose responses are rendered for one signed-in person.
 *
 * Kept as a list rather than a regex so adding a surface is one line, and exported so the
 * rule can be asserted in a test instead of trusted.
 */
export const privateSurfacePrefixes = [
  "/admin",
  "/portal",
  "/login",
  "/invite",
  "/auth",
  "/app",
  "/api/documents",
  "/api/push",
] as const;

export function isPrivateSurface(pathname: string): boolean {
  return privateSurfacePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Proxy for security headers and request processing.
 *
 * Applied to all routes. Security headers are set here rather than
 * next.config.ts for dynamic CSP nonce support.
 */
export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const scriptHash = await getA11yRestoreScriptHash();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const isSecureRequest =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";

  // --- Security Headers ---

  // Content Security Policy, production-ready foundation
  // Client projects expand as needed for analytics, CDNs, and embeds.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'sha256-${scriptHash}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co http://127.0.0.1:54321",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(!isDevelopment && isSecureRequest
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-nonce", nonce);

  const incomingRequestId = request.headers.get("x-request-id");
  const requestId =
    incomingRequestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(incomingRequestId)
      ? incomingRequestId
      : crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  /*
   * The marketing site never reads identity. Refreshing a session there would add an
   * auth round trip and could attach a refreshed token to an otherwise public response.
   * Keep all auth-cookie work inside the surfaces that actually consume identity.
   */
  const response = isPrivateSurface(request.nextUrl.pathname)
    ? await refreshSupabaseSession(request, requestHeaders)
    : NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set("X-Frame-Options", "DENY");

  /*
   * Authenticated HTML must never be stored.
   *
   * These responses are rendered for one signed-in person and contain their name, their
   * project, and their documents. Without an explicit directive a browser, an installed
   * app shortcut's web view, or any intermediary is free to keep the page and hand it
   * back later — which is how a device that once signed in as a client can reopen the
   * portal still showing that client's screen after a different account signs in.
   *
   * `private` bars shared caches, `no-store` bars the local one, and `Vary: Cookie`
   * stops a stored copy from being matched to a different session. The sign-in surfaces
   * are included because they render account-specific state too.
   */
  if (isPrivateSurface(request.nextUrl.pathname)) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate, max-age=0"
    );

    /*
     * `Vary` is appended, never replaced. The App Router sets its own values here — RSC
     * and the router state tree — and overwriting them would let a navigation payload and
     * a full document be treated as the same cache entry, which breaks the router in a
     * way far worse than the leak this header is guarding against.
     */
    const vary = response.headers.get("Vary");
    const varyValues = vary
      ? vary.split(",").map((value) => value.trim())
      : [];
    if (!varyValues.some((value) => value.toLowerCase() === "cookie")) {
      response.headers.set("Vary", [...varyValues, "Cookie"].join(", "));
    }
  }

  // HSTS is typically set by the hosting platform for HTTPS
  // Uncomment for self-hosted production:
  // response.headers.set(
  //   "Strict-Transport-Security",
  //   "max-age=31536000; includeSubDomains; preload"
  // );

  // --- Request ID for correlation ---
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
