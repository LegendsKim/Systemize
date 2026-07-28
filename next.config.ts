import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Keep tracing and Turbopack scoped to this template even when a parent
  // directory contains an unrelated lockfile.
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),

  // Restrict remote image patterns — add approved domains as needed
  images: {
    remotePatterns: [],
    // AVIF first: the hero plates are smooth 3D renders, where AVIF is dramatically
    // smaller than WebP at the same perceived quality.
    formats: ["image/avif", "image/webp"],
    // Next.js only generates the qualities listed here. 90 is for the hero plates, whose
    // soft gradients band visibly at the default 75.
    qualities: [75, 90],
  },

  // Security headers are applied via middleware for flexibility
  // CSP and other headers are managed in src/middleware.ts

  // Disable x-powered-by for security
  poweredByHeader: false,

  /*
   * The dev indicator defaults to the bottom-left corner, which is where the accessibility
   * trigger sits (and the WhatsApp launcher sits in the opposite corner). Its portal
   * swallowed pointer events aimed at the trigger, so it was unclickable in development
   * and in any Playwright run that reused a dev server. It also leaked into visual
   * snapshots, making them differ between a dev and a production server.
   *
   * Compile and runtime error overlays are unaffected by this and still appear.
   * `devIndicators: false` is the Next.js 16 form; the granular sub-options were removed
   * in v16.0.0.
   */
  devIndicators: false,

};

export default nextConfig;
