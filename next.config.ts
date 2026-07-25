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

};

export default nextConfig;
