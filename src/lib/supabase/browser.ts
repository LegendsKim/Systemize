import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { getPublicEnv } from '@/lib/env/client';

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
