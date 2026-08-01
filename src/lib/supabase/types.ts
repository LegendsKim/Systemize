export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client_intakes: {
        Row: {
          answers: Json
          client_reply: string | null
          created_at: string
          current_step: number
          id: string
          project_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["intake_status"]
          submitted_at: string | null
          submitted_by: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          client_reply?: string | null
          created_at?: string
          current_step?: number
          id?: string
          project_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["intake_status"]
          submitted_at?: string | null
          submitted_by: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          client_reply?: string | null
          created_at?: string
          current_step?: number
          id?: string
          project_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["intake_status"]
          submitted_at?: string | null
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_intakes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_people: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          email: string
          full_name: string
          id?: string
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content: Json
          content_hash: string
          created_at: string
          created_by: string
          document_id: string
          id: string
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["document_version_status"]
          version_number: number
        }
        Insert: {
          content: Json
          content_hash: string
          created_at?: string
          created_by: string
          document_id: string
          id: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["document_version_status"]
          version_number: number
        }
        Update: {
          content?: Json
          content_hash?: string
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["document_version_status"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          idempotency_key: string
          message: string
          phone: string
          request_id: string
        }
        Insert: {
          business_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          idempotency_key: string
          message: string
          phone: string
          request_id: string
        }
        Update: {
          business_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          idempotency_key?: string
          message?: string
          phone?: string
          request_id?: string
        }
        Relationships: []
      }
      meeting_integrations: {
        Row: {
          calendar_invite_sent_at: string | null
          created_at: string
          google_event_id: string | null
          google_event_url: string | null
          last_error_code: string | null
          meeting_slot_id: string
          project_id: string
          status: Database["public"]["Enums"]["meeting_integration_status"]
          updated_at: string
          zoom_join_url: string | null
          zoom_meeting_id: string | null
        }
        Insert: {
          calendar_invite_sent_at?: string | null
          created_at?: string
          google_event_id?: string | null
          google_event_url?: string | null
          last_error_code?: string | null
          meeting_slot_id: string
          project_id: string
          status?: Database["public"]["Enums"]["meeting_integration_status"]
          updated_at?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Update: {
          calendar_invite_sent_at?: string | null
          created_at?: string
          google_event_id?: string | null
          google_event_url?: string | null
          last_error_code?: string | null
          meeting_slot_id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["meeting_integration_status"]
          updated_at?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_integrations_meeting_slot_id_fkey"
            columns: ["meeting_slot_id"]
            isOneToOne: true
            referencedRelation: "meeting_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_slots: {
        Row: {
          booked_at: string | null
          booked_by: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          project_id: string
          starts_at: string
          status: Database["public"]["Enums"]["meeting_slot_status"]
        }
        Insert: {
          booked_at?: string | null
          booked_by?: string | null
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          project_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["meeting_slot_status"]
        }
        Update: {
          booked_at?: string | null
          booked_by?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          project_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["meeting_slot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "meeting_slots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          muted_categories: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          muted_categories?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          muted_categories?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          href: string
          id: string
          kind: string
          project_id: string | null
          read_at: string | null
          recipient_user_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          href: string
          id?: string
          kind: string
          project_id?: string | null
          read_at?: string | null
          recipient_user_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string
          id?: string
          kind?: string
          project_id?: string | null
          read_at?: string | null
          recipient_user_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount_agorot: number
          created_at: string
          created_by: string
          currency: string
          id: string
          kind: Database["public"]["Enums"]["payment_request_kind"]
          paid_at: string | null
          payment_url: string
          project_id: string
          status: Database["public"]["Enums"]["payment_request_status"]
          title: string
        }
        Insert: {
          amount_agorot: number
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          kind: Database["public"]["Enums"]["payment_request_kind"]
          paid_at?: string | null
          payment_url: string
          project_id: string
          status?: Database["public"]["Enums"]["payment_request_status"]
          title: string
        }
        Update: {
          amount_agorot?: number
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_request_kind"]
          paid_at?: string | null
          payment_url?: string
          project_id?: string
          status?: Database["public"]["Enums"]["payment_request_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_role: Database["public"]["Enums"]["portal_app_role"]
          created_at: string
          email: string
          full_name: string
          id: string
          portal_onboarded_at: string | null
          updated_at: string
        }
        Insert: {
          app_role?: Database["public"]["Enums"]["portal_app_role"]
          created_at?: string
          email: string
          full_name: string
          id: string
          portal_onboarded_at?: string | null
          updated_at?: string
        }
        Update: {
          app_role?: Database["public"]["Enums"]["portal_app_role"]
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          portal_onboarded_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["project_document_kind"]
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["project_document_kind"]
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["project_document_kind"]
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          actor_user_id: string | null
          event_type: string
          id: string
          idempotency_key: string
          occurred_at: string
          payload: Json
          project_id: string
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          payload?: Json
          project_id: string
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payload?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_internal_notes: {
        Row: {
          budget_signal: string
          created_at: string
          flags: string
          impression: string
          project_id: string
          readiness: Database["public"]["Enums"]["project_readiness"]
          risks: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          budget_signal?: string
          created_at?: string
          flags?: string
          impression?: string
          project_id: string
          readiness?: Database["public"]["Enums"]["project_readiness"]
          risks?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          budget_signal?: string
          created_at?: string
          flags?: string
          impression?: string
          project_id?: string
          readiness?: Database["public"]["Enums"]["project_readiness"]
          risks?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_internal_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          idempotency_key: string
          person_id: string
          project_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["project_member_role"]
          status: Database["public"]["Enums"]["project_invitation_status"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id: string
          idempotency_key: string
          person_id: string
          project_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["project_member_role"]
          status?: Database["public"]["Enums"]["project_invitation_status"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          person_id?: string
          project_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["project_member_role"]
          status?: Database["public"]["Enums"]["project_invitation_status"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "company_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memberships: {
        Row: {
          added_by: string
          created_at: string
          id: string
          person_id: string
          project_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["project_member_role"]
          status: Database["public"]["Enums"]["project_membership_status"]
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          person_id: string
          project_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["project_member_role"]
          status?: Database["public"]["Enums"]["project_membership_status"]
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          person_id?: string
          project_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["project_member_role"]
          status?: Database["public"]["Enums"]["project_membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "company_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          progress_percent: number
          stage: Database["public"]["Enums"]["project_stage"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          progress_percent?: number
          stage?: Database["public"]["Enums"]["project_stage"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          progress_percent?: number
          stage?: Database["public"]["Enums"]["project_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          failure_count: number
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          failure_count?: number
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          failure_count?: number
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          request_count: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          bucket_key: string
          request_count: number
          updated_at?: string
          window_started_at: string
        }
        Update: {
          bucket_key?: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          checked_at: string
          component: string
          error_code: string | null
          status: string
          status_changed_at: string
        }
        Insert: {
          checked_at?: string
          component: string
          error_code?: string | null
          status: string
          status_changed_at?: string
        }
        Update: {
          checked_at?: string
          component?: string
          error_code?: string | null
          status?: string
          status_changed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_project_invitation: {
        Args: {
          p_token_hash: string
          p_user_id: string
          p_verified_email: string
        }
        Returns: Json
      }
      autosave_client_intake: {
        Args: {
          p_answers: Json
          p_client_reply: string | null
          p_current_step: number
          p_project_id: string
        }
        Returns: string
      }
      before_user_created_invite_only: { Args: { event: Json }; Returns: Json }
      book_meeting_slot: {
        Args: {
          p_idempotency_key: string
          p_project_id: string
          p_slot_id: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after_ms: number
        }[]
      }
      claim_meeting_integration_batch: {
        Args: { p_limit: number }
        Returns: {
          attempts: number
          client_email: string
          ends_at: string
          google_event_id: string | null
          meeting_slot_id: string
          project_id: string
          starts_at: string
          zoom_join_url: string | null
          zoom_meeting_id: string | null
        }[]
      }
      claim_push_batch: {
        Args: { p_limit: number }
        Returns: {
          attempts: number
          href: string
          kind: string
          notification_id: string
          outbox_id: string
          recipient_user_id: string
        }[]
      }
      complete_portal_onboarding: { Args: never; Returns: string }
      complete_project_meeting: {
        Args: {
          p_idempotency_key: string
          p_project_id: string
          p_slot_id: string
        }
        Returns: Json
      }
      create_company_project: {
        Args: {
          p_company_id: string
          p_company_name: string
          p_idempotency_key: string
          p_project_id: string
          p_project_name: string
        }
        Returns: Json
      }
      create_document_draft: {
        Args: {
          p_content: Json
          p_document_id: string
          p_idempotency_key: string
          p_kind: Database["public"]["Enums"]["project_document_kind"]
          p_project_id: string
          p_version_id: string
        }
        Returns: Json
      }
      create_meeting_slot: {
        Args: {
          p_ends_at: string
          p_idempotency_key: string
          p_project_id: string
          p_starts_at: string
        }
        Returns: Json
      }
      create_payment_request: {
        Args: {
          p_amount_agorot: number
          p_idempotency_key: string
          p_kind: Database["public"]["Enums"]["payment_request_kind"]
          p_payment_url: string
          p_project_id: string
          p_title: string
        }
        Returns: Json
      }
      create_project_invitation: {
        Args: {
          p_email: string
          p_expires_at: string
          p_full_name: string
          p_idempotency_key: string
          p_invitation_id: string
          p_phone: string
          p_project_id: string
          p_token_hash: string
        }
        Returns: Json
      }
      get_google_calendar_connection: {
        Args: never
        Returns: {
          connected_email: string
          granted_scopes: string[]
          refresh_token: string
        }[]
      }
      mark_payment_received: {
        Args: {
          p_idempotency_key: string
          p_payment_request_id: string
          p_project_id: string
        }
        Returns: Json
      }
      project_push_readiness: {
        Args: { p_project_id: string }
        Returns: {
          members: number
          members_with_push: number
        }[]
      }
      publish_document_version: {
        Args: {
          p_idempotency_key: string
          p_project_id: string
          p_version_id: string
        }
        Returns: Json
      }
      record_meeting_zoom: {
        Args: {
          p_meeting_slot_id: string
          p_zoom_join_url: string
          p_zoom_meeting_id: string
        }
        Returns: undefined
      }
      record_system_health_snapshot: { Args: { p_checks: Json }; Returns: Json }
      reissue_project_invitation: {
        Args: {
          p_expires_at: string
          p_idempotency_key: string
          p_invitation_id: string
          p_source_invitation_id: string
          p_token_hash: string
        }
        Returns: Json
      }
      requeue_meeting_integrations: { Args: never; Returns: number }
      review_client_intake: {
        Args: {
          p_decision: string
          p_idempotency_key: string
          p_project_id: string
          p_review_note: string | null
        }
        Returns: Json
      }
      revoke_project_invitation: {
        Args: { p_idempotency_key: string; p_invitation_id: string }
        Returns: Json
      }
      save_client_intake: {
        Args: {
          p_answers: Json
          p_client_reply: string | null
          p_current_step: number
          p_idempotency_key: string
          p_project_id: string
          p_submit: boolean
        }
        Returns: Json
      }
      settle_meeting_integration: {
        Args: {
          p_error_code: string | null
          p_google_event_id: string | null
          p_google_event_url: string | null
          p_meeting_slot_id: string
          p_outcome: string
          p_retry_after_seconds?: number | null
        }
        Returns: undefined
      }
      settle_push_delivery: {
        Args: { p_error_code: string | null; p_id: string; p_outcome: string }
        Returns: undefined
      }
      store_google_calendar_connection: {
        Args: {
          p_connected_by: string
          p_connected_email: string
          p_granted_scopes: string[]
          p_refresh_token: string
        }
        Returns: undefined
      }
      update_company_person: {
        Args: {
          p_email: string
          p_full_name: string
          p_idempotency_key: string
          p_person_id: string
          p_phone: string
          p_project_id: string
        }
        Returns: Json
      }
      update_project_details: {
        Args: {
          p_company_name: string
          p_idempotency_key: string
          p_project_id: string
          p_project_name: string
        }
        Returns: Json
      }
    }
    Enums: {
      document_version_status: "draft" | "published"
      intake_status: "draft" | "submitted" | "changes_requested" | "approved"
      meeting_integration_status:
        | "pending"
        | "provisioning"
        | "retry"
        | "ready"
        | "attention"
      meeting_slot_status: "available" | "booked" | "cancelled" | "completed"
      payment_request_kind: "discovery" | "initial_deposit" | "balance"
      payment_request_status: "pending" | "paid" | "cancelled"
      portal_app_role: "systemize_owner" | "client"
      project_document_kind:
        | "introductory_summary"
        | "contract"
        | "discovery_plan"
      project_invitation_status: "pending" | "accepted" | "revoked"
      project_member_role: "client_owner"
      project_membership_status: "active" | "revoked"
      project_readiness: "unknown" | "low" | "medium" | "high"
      project_stage:
        | "lead"
        | "intro_call_scheduled"
        | "initial_summary_preparation"
        | "discovery_offer_awaiting_client"
        | "discovery_payment_pending"
        | "full_discovery_and_planning"
        | "solution_options_preparation"
        | "proposal_and_contract_awaiting_client"
        | "initial_payment_pending"
        | "delivery"
        | "client_review"
        | "rollout"
        | "support"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      document_version_status: ["draft", "published"],
      intake_status: ["draft", "submitted", "changes_requested", "approved"],
      meeting_integration_status: [
        "pending",
        "provisioning",
        "retry",
        "ready",
        "attention",
      ],
      meeting_slot_status: ["available", "booked", "cancelled", "completed"],
      payment_request_kind: ["discovery", "initial_deposit", "balance"],
      payment_request_status: ["pending", "paid", "cancelled"],
      portal_app_role: ["systemize_owner", "client"],
      project_document_kind: [
        "introductory_summary",
        "contract",
        "discovery_plan",
      ],
      project_invitation_status: ["pending", "accepted", "revoked"],
      project_member_role: ["client_owner"],
      project_membership_status: ["active", "revoked"],
      project_readiness: ["unknown", "low", "medium", "high"],
      project_stage: [
        "lead",
        "intro_call_scheduled",
        "initial_summary_preparation",
        "discovery_offer_awaiting_client",
        "discovery_payment_pending",
        "full_discovery_and_planning",
        "solution_options_preparation",
        "proposal_and_contract_awaiting_client",
        "initial_payment_pending",
        "delivery",
        "client_review",
        "rollout",
        "support",
        "completed",
        "cancelled",
      ],
    },
  },
} as const

export type DocumentVersionStatus =
  Database["public"]["Enums"]["document_version_status"]
export type IntakeStatus = Database["public"]["Enums"]["intake_status"]
export type MeetingIntegrationStatus =
  Database["public"]["Enums"]["meeting_integration_status"]
export type MeetingSlotStatus =
  Database["public"]["Enums"]["meeting_slot_status"]
export type PaymentRequestKind =
  Database["public"]["Enums"]["payment_request_kind"]
export type PaymentRequestStatus =
  Database["public"]["Enums"]["payment_request_status"]
export type PortalAppRole = Database["public"]["Enums"]["portal_app_role"]
export type ProjectDocumentKind =
  Database["public"]["Enums"]["project_document_kind"]
export type ProjectInvitationStatus =
  Database["public"]["Enums"]["project_invitation_status"]
export type ProjectMemberRole =
  Database["public"]["Enums"]["project_member_role"]
export type ProjectMembershipStatus =
  Database["public"]["Enums"]["project_membership_status"]
export type ProjectReadiness =
  Database["public"]["Enums"]["project_readiness"]
export type ProjectStage = Database["public"]["Enums"]["project_stage"]
