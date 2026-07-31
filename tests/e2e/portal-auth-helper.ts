import { createServerClient } from "@supabase/ssr";
import type {
  Browser,
  BrowserContext,
  Cookie,
} from "@playwright/test";
import type { Database } from "../../src/lib/supabase/types";

const e2eCredential = ["systemize", "e2e", "password"].join("-");

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for authenticated portal E2E tests`);
  }
  return value;
}

function normalizeSameSite(
  value: string | boolean | undefined
): Cookie["sameSite"] {
  if (typeof value !== "string") {
    return "Lax";
  }

  const normalized = value.toLowerCase();
  if (normalized === "strict") {
    return "Strict";
  }
  if (normalized === "none") {
    return "None";
  }
  return "Lax";
}

export async function authenticatedPortalContext(
  browser: Browser,
  email: string,
  baseURL: string
): Promise<BrowserContext> {
  let responseCookies: Array<{
    name: string;
    value: string;
    options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: string | boolean;
      path?: string;
    };
  }> = [];

  const supabase = createServerClient<Database>(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => [],
        setAll: (cookies) => {
          responseCookies = cookies;
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: e2eCredential,
  });
  if (error) {
    throw new Error(`Unable to create E2E session for ${email}: ${error.message}`);
  }
  if (responseCookies.length === 0) {
    throw new Error(`Supabase emitted no session cookies for ${email}`);
  }

  const context = await browser.newContext();
  const origin = new URL(baseURL);
  await context.addCookies(
    responseCookies.map(({ name, value, options }) => ({
      name,
      value,
      domain: origin.hostname,
      path: options.path ?? "/",
      httpOnly: options.httpOnly ?? false,
      secure: origin.protocol === "https:" && (options.secure ?? true),
      sameSite: normalizeSameSite(options.sameSite),
    }))
  );
  return context;
}

export const portalE2EUsers = {
  owner: "e2e.owner@gmail.com",
  clientA: "e2e.client.a@gmail.com",
  clientB: "e2e.client.b@gmail.com",
} as const;

export const portalE2EProjects = {
  clientA: "e4000000-0000-4000-8000-000000000001",
  clientB: "e4000000-0000-4000-8000-000000000002",
} as const;
