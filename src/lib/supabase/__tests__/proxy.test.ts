import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authCookie = {
  name: "sb-project-auth-token",
  value: "refreshed-session",
  options: {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
  },
};

const requiredResponseHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

const createServerClient = vi.fn(
  (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          cookies: typeof authCookie[],
          headers: Record<string, string>
        ) => void;
      };
    }
  ) => ({
    auth: {
      getUser: async () => {
        options.cookies.setAll([authCookie], requiredResponseHeaders);
        return { data: { user: null }, error: null };
      },
    },
  })
);

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("@/lib/env/client", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  }),
}));

describe("refreshSupabaseSession", () => {
  beforeEach(() => {
    createServerClient.mockClear();
  });

  it("copies Supabase's anti-cache headers whenever refreshed auth cookies are set", async () => {
    const { refreshSupabaseSession } = await import("../proxy");
    const request = new NextRequest("https://www.systemize.co.il/");
    const response = await refreshSupabaseSession(
      request,
      new Headers(request.headers)
    );

    expect(response.cookies.get(authCookie.name)?.value).toBe(authCookie.value);
    for (const [name, value] of Object.entries(requiredResponseHeaders)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });
});
