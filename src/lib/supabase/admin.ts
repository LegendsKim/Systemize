import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getPublicEnv } from '@/lib/env/client';
import { getServerEnv } from '@/lib/env/server';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * WARNING: This client uses the service_role key and bypasses Row Level Security (RLS).
 * It must ONLY be used in server-side code and for administrative tasks where
 * bypassing RLS is absolutely necessary. Never expose this to the client.
 */
export function getAdminSupabaseClient() {
  if (!adminClient) {
    const publicEnv = getPublicEnv();
    const serverEnv = getServerEnv();
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations.");
    }
    adminClient = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}
