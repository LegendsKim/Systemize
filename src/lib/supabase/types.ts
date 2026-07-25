/**
 * Generated database types for Supabase.
 *
 * Regenerate after every migration with:
 * npx supabase gen types typescript --local > src/lib/supabase/types.ts
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
      contact_requests: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string;
          message: string;
          idempotency_key: string;
          status: "pending" | "notified" | "failed";
          notification_error: string | null;
          ip_address: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          email: string;
          message: string;
          idempotency_key: string;
          status?: "pending" | "notified" | "failed";
          notification_error?: string | null;
          ip_address?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          email?: string;
          message?: string;
          idempotency_key?: string;
          status?: "pending" | "notified" | "failed";
          notification_error?: string | null;
          ip_address?: string | null;
          user_id?: string | null;
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
