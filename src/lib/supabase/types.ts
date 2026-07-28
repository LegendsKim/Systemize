/**
 * Generated database types for Supabase.
 *
 * Regenerate after every migration with:
 * npx supabase gen types typescript --local > src/lib/supabase/types.ts
 *
 * `leads` is append-only from the application's side: the Update shape exists
 * because Supabase generates one, but no role is granted UPDATE or DELETE and no
 * application code mutates or removes a lead.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          created_at: string;
          full_name: string;
          business_name: string;
          phone: string;
          email: string;
          message: string;
          idempotency_key: string;
          request_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          full_name: string;
          business_name: string;
          phone: string;
          email: string;
          message: string;
          idempotency_key: string;
          request_id: string;
        };
        Update: {
          full_name?: string;
          business_name?: string;
          phone?: string;
          email?: string;
          message?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          retry_after_ms: number;
          remaining: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
