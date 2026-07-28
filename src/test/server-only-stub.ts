/**
 * Test-only stand-in for the `server-only` marker package.
 *
 * `server-only`'s default export throws on import outside a React Server environment,
 * which would make every server module untestable under Vitest. Aliasing it to this
 * empty module in `vitest.config.ts` lets the server code be tested directly.
 *
 * This does not weaken the boundary it marks: `npm run check:architecture` fails the
 * build if any `"use client"` module imports `server-only`, `@/lib/env/server`,
 * `@/lib/supabase/admin`, `@/lib/supabase/server`, or anything under `@/server/`.
 */
export {};
