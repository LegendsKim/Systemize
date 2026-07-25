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
  },

  // Security headers are applied via middleware for flexibility
  // CSP and other headers are managed in src/middleware.ts

  // Disable x-powered-by for security
  poweredByHeader: false,

};

export default nextConfig;
