import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { a11yRestoreScript } from "@/features/accessibility/a11y-settings";

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
 * Proxy for security headers and request processing.
 *
 * Applied to all routes. Security headers are set here rather than
 * next.config.ts for dynamic CSP nonce support.
 */
export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const scriptHash = await getA11yRestoreScriptHash();
  const isDevelopment = process.env.NODE_ENV !== "production";

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
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
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

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set("X-Frame-Options", "DENY");

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
