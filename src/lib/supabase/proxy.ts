import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env/client";
import type { Database } from "./types";

/**
 * Refreshes an existing Supabase session cookie. This is an availability helper only;
 * authorization remains inside every protected server page, action, and route.
 */
export async function refreshSupabaseSession(
  request: NextRequest,
  requestHeaders: Headers
): Promise<NextResponse> {
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  const env = getPublicEnv();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, responseHeaders) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(responseHeaders).forEach(([name, value]) =>
            response.headers.set(name, value)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}
