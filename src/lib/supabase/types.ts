/**
 * Supabase database types.
 *
 * Regenerate after the portal migration is applied:
 * npx supabase gen types typescript --local > src/lib/supabase/types.ts
 *
 * These checked-in types mirror migrations 00001–00007 so application code remains
 * strict before the hosted SYSTEMIZE project is provisioned.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PortalAppRole = "systemize_owner" | "client";
export type ProjectMemberRole = "client_owner";
export type ProjectMembershipStatus = "active" | "revoked";
export type ProjectInvitationStatus = "pending" | "accepted" | "revoked";
export type IntakeStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "approved";
export type MeetingSlotStatus =
  | "available"
  | "booked"
  | "cancelled"
  | "completed";
export type MeetingIntegrationStatus =
  | "pending"
  | "provisioning"
  | "retry"
  | "ready"
  | "attention";
export type PaymentRequestKind =
  | "discovery"
  | "initial_deposit"
  | "balance";
export type PaymentRequestStatus = "pending" | "paid" | "cancelled";
export type ProjectDocumentKind =
  | "introductory_summary"
  | "contract"
  | "discovery_plan";
export type DocumentVersionStatus = "draft" | "published";
export type ProjectReadiness = "unknown" | "low" | "medium" | "high";
export type ProjectStage =
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
  | "cancelled";

type LeadRow = {
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

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  app_role: PortalAppRole;
  portal_onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

type CompanyRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type CompanyPersonRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  company_id: string;
  name: string;
  stage: ProjectStage;
  progress_percent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ProjectMembershipRow = {
  id: string;
  project_id: string;
  user_id: string;
  person_id: string;
  role: ProjectMemberRole;
  status: ProjectMembershipStatus;
  added_by: string;
  created_at: string;
  revoked_at: string | null;
};

type ProjectInvitationRow = {
  id: string;
  company_id: string;
  project_id: string;
  person_id: string;
  email: string;
  role: ProjectMemberRole;
  token_hash: string;
  idempotency_key: string;
  status: ProjectInvitationStatus;
  expires_at: string;
  created_by: string;
  created_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
};

type ProjectEventRow = {
  id: string;
  project_id: string;
  event_type: string;
  actor_user_id: string | null;
  idempotency_key: string;
  payload: Json;
  occurred_at: string;
};

type ProjectInternalNotesRow = {
  project_id: string;
  impression: string;
  budget_signal: string;
  readiness: ProjectReadiness;
  risks: string;
  flags: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type ClientIntakeRow = {
  id: string;
  project_id: string;
  submitted_by: string;
  status: IntakeStatus;
  answers: Json;
  current_step: number;
  review_note: string | null;
  client_reply: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

type MeetingSlotRow = {
  id: string;
  project_id: string;
  starts_at: string;
  ends_at: string;
  status: MeetingSlotStatus;
  booked_by: string | null;
  booked_at: string | null;
  created_by: string;
  created_at: string;
};

type MeetingIntegrationRow = {
  meeting_slot_id: string;
  project_id: string;
  status: MeetingIntegrationStatus;
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  google_event_id: string | null;
  google_event_url: string | null;
  calendar_invite_sent_at: string | null;
  last_error_code: string | null;
  created_at: string;
  updated_at: string;
};

type PaymentRequestRow = {
  id: string;
  project_id: string;
  kind: PaymentRequestKind;
  title: string;
  amount_agorot: number;
  currency: string;
  payment_url: string;
  status: PaymentRequestStatus;
  created_by: string;
  created_at: string;
  paid_at: string | null;
};

type NotificationRow = {
  id: string;
  recipient_user_id: string;
  project_id: string | null;
  kind: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  failure_count: number;
};

type NotificationPreferenceRow = {
  user_id: string;
  muted_categories: string[];
  updated_at: string;
};

type ProjectDocumentRow = {
  id: string;
  project_id: string;
  kind: ProjectDocumentKind;
  created_by: string;
  created_at: string;
};

type DocumentVersionRow = {
  id: string;
  document_id: string;
  version_number: number;
  status: DocumentVersionStatus;
  content: Json;
  content_hash: string;
  created_by: string;
  created_at: string;
  published_by: string | null;
  published_at: string | null;
};

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: Omit<LeadRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Pick<
            LeadRow,
            "full_name" | "business_name" | "phone" | "email" | "message"
          >
        >;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, "id" | "email" | "full_name"> & {
          app_role?: PortalAppRole;
          portal_onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            ProfileRow,
            | "email"
            | "full_name"
            | "app_role"
            | "portal_onboarded_at"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      companies: {
        Row: CompanyRow;
        Insert: Pick<CompanyRow, "name" | "created_by"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<CompanyRow, "name" | "updated_at">>;
        Relationships: [];
      };
      company_people: {
        Row: CompanyPersonRow;
        Insert: Pick<
          CompanyPersonRow,
          "company_id" | "full_name" | "email" | "phone" | "created_by"
        > & {
          id?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            CompanyPersonRow,
            "user_id" | "full_name" | "email" | "phone" | "updated_at"
          >
        >;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: Pick<ProjectRow, "company_id" | "name" | "created_by"> & {
          id?: string;
          stage?: ProjectStage;
          progress_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            ProjectRow,
            "name" | "stage" | "progress_percent" | "updated_at"
          >
        >;
        Relationships: [];
      };
      project_memberships: {
        Row: ProjectMembershipRow;
        Insert: Pick<
          ProjectMembershipRow,
          "project_id" | "user_id" | "person_id" | "added_by"
        > & {
          id?: string;
          role?: ProjectMemberRole;
          status?: ProjectMembershipStatus;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<
          Pick<
            ProjectMembershipRow,
            "person_id" | "role" | "status" | "revoked_at"
          >
        >;
        Relationships: [];
      };
      project_invitations: {
        Row: ProjectInvitationRow;
        Insert: Pick<
          ProjectInvitationRow,
          | "id"
          | "company_id"
          | "project_id"
          | "person_id"
          | "email"
          | "token_hash"
          | "idempotency_key"
          | "expires_at"
          | "created_by"
        > & {
          role?: ProjectMemberRole;
          status?: ProjectInvitationStatus;
          created_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Update: Partial<
          Pick<
            ProjectInvitationRow,
            "status" | "expires_at" | "accepted_by" | "accepted_at" | "revoked_at"
          >
        >;
        Relationships: [];
      };
      project_events: {
        Row: ProjectEventRow;
        Insert: Pick<
          ProjectEventRow,
          "project_id" | "event_type" | "idempotency_key"
        > & {
          id?: string;
          actor_user_id?: string | null;
          payload?: Json;
          occurred_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      client_intakes: {
        Row: ClientIntakeRow;
        Insert: Pick<
          ClientIntakeRow,
          "project_id" | "submitted_by"
        > & {
          id?: string;
          status?: IntakeStatus;
          answers?: Json;
          current_step?: number;
          review_note?: string | null;
          client_reply?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            ClientIntakeRow,
            | "status"
            | "answers"
            | "current_step"
            | "review_note"
            | "client_reply"
            | "submitted_at"
            | "reviewed_at"
            | "reviewed_by"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      meeting_slots: {
        Row: MeetingSlotRow;
        Insert: Pick<
          MeetingSlotRow,
          "project_id" | "starts_at" | "ends_at" | "created_by"
        > & {
          id?: string;
          status?: MeetingSlotStatus;
          booked_by?: string | null;
          booked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Pick<
            MeetingSlotRow,
            "status" | "booked_by" | "booked_at"
          >
        >;
        Relationships: [];
      };
      meeting_integrations: {
        Row: MeetingIntegrationRow;
        Insert: Pick<MeetingIntegrationRow, "meeting_slot_id" | "project_id"> & {
          status?: MeetingIntegrationStatus;
          zoom_meeting_id?: string | null;
          zoom_join_url?: string | null;
          google_event_id?: string | null;
          google_event_url?: string | null;
          calendar_invite_sent_at?: string | null;
          last_error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            MeetingIntegrationRow,
            | "status"
            | "zoom_meeting_id"
            | "zoom_join_url"
            | "google_event_id"
            | "google_event_url"
            | "calendar_invite_sent_at"
            | "last_error_code"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      payment_requests: {
        Row: PaymentRequestRow;
        Insert: Pick<
          PaymentRequestRow,
          | "project_id"
          | "kind"
          | "title"
          | "amount_agorot"
          | "payment_url"
          | "created_by"
        > & {
          id?: string;
          currency?: string;
          status?: PaymentRequestStatus;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<
          Pick<PaymentRequestRow, "status" | "paid_at">
        >;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Pick<
          NotificationRow,
          "recipient_user_id" | "kind" | "title" | "body" | "href"
        > & {
          id?: string;
          project_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Pick<NotificationRow, "read_at">>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Pick<
          PushSubscriptionRow,
          "user_id" | "endpoint" | "p256dh" | "auth"
        > & {
          id?: string;
          user_agent?: string | null;
          created_at?: string;
          last_seen_at?: string;
          failure_count?: number;
        };
        Update: Partial<
          Pick<
            PushSubscriptionRow,
            | "endpoint"
            | "p256dh"
            | "auth"
            | "user_agent"
            | "last_seen_at"
            | "failure_count"
          >
        >;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferenceRow;
        Insert: Pick<NotificationPreferenceRow, "user_id"> & {
          muted_categories?: string[];
          updated_at?: string;
        };
        Update: Partial<
          Pick<NotificationPreferenceRow, "muted_categories" | "updated_at">
        >;
        Relationships: [];
      };
      project_documents: {
        Row: ProjectDocumentRow;
        Insert: Pick<
          ProjectDocumentRow,
          "id" | "project_id" | "kind" | "created_by"
        > & {
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      document_versions: {
        Row: DocumentVersionRow;
        Insert: Pick<
          DocumentVersionRow,
          | "id"
          | "document_id"
          | "version_number"
          | "content"
          | "content_hash"
          | "created_by"
        > & {
          status?: DocumentVersionStatus;
          created_at?: string;
          published_by?: string | null;
          published_at?: string | null;
        };
        Update: Partial<
          Pick<
            DocumentVersionRow,
            "status" | "published_by" | "published_at"
          >
        >;
        Relationships: [];
      };
      project_internal_notes: {
        Row: ProjectInternalNotesRow;
        Insert: Pick<ProjectInternalNotesRow, "project_id" | "updated_by"> & {
          impression?: string;
          budget_signal?: string;
          readiness?: ProjectReadiness;
          risks?: string;
          flags?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            ProjectInternalNotesRow,
            | "impression"
            | "budget_signal"
            | "readiness"
            | "risks"
            | "flags"
            | "updated_by"
            | "updated_at"
          >
        >;
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
      create_project_invitation: {
        Args: {
          p_invitation_id: string;
          p_project_id: string;
          p_full_name: string;
          p_email: string;
          p_phone: string;
          p_token_hash: string;
          p_idempotency_key: string;
          p_expires_at: string;
        };
        Returns: Json;
      };
      create_company_project: {
        Args: {
          p_company_id: string;
          p_project_id: string;
          p_company_name: string;
          p_project_name: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      accept_project_invitation: {
        Args: {
          p_token_hash: string;
          p_user_id: string;
          p_verified_email: string;
        };
        Returns: Json;
      };
      revoke_project_invitation: {
        Args: {
          p_invitation_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      reissue_project_invitation: {
        Args: {
          p_source_invitation_id: string;
          p_invitation_id: string;
          p_token_hash: string;
          p_idempotency_key: string;
          p_expires_at: string;
        };
        Returns: Json;
      };
      update_project_details: {
        Args: {
          p_project_id: string;
          p_company_name: string;
          p_project_name: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      update_company_person: {
        Args: {
          p_project_id: string;
          p_person_id: string;
          p_full_name: string;
          p_email: string;
          p_phone: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      save_client_intake: {
        Args: {
          p_project_id: string;
          p_answers: Json;
          p_current_step: number;
          p_submit: boolean;
          p_idempotency_key: string;
          p_client_reply: string | null;
        };
        Returns: Json;
      };
      autosave_client_intake: {
        Args: {
          p_project_id: string;
          p_answers: Json;
          p_current_step: number;
          p_client_reply: string | null;
        };
        Returns: string;
      };
      complete_portal_onboarding: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      project_push_readiness: {
        Args: { p_project_id: string };
        Returns: { members: number; members_with_push: number }[];
      };
      review_client_intake: {
        Args: {
          p_project_id: string;
          p_decision: string;
          p_review_note: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      create_meeting_slot: {
        Args: {
          p_project_id: string;
          p_starts_at: string;
          p_ends_at: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      book_meeting_slot: {
        Args: {
          p_project_id: string;
          p_slot_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      complete_project_meeting: {
        Args: {
          p_project_id: string;
          p_slot_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      create_payment_request: {
        Args: {
          p_project_id: string;
          p_kind: PaymentRequestKind;
          p_title: string;
          p_amount_agorot: number;
          p_payment_url: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      mark_payment_received: {
        Args: {
          p_project_id: string;
          p_payment_request_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      claim_push_batch: {
        Args: {
          p_limit: number;
        };
        Returns: {
          outbox_id: string;
          notification_id: string;
          recipient_user_id: string;
          kind: string;
          href: string;
          attempts: number;
        }[];
      };
      settle_push_delivery: {
        Args: {
          p_id: string;
          p_outcome: string;
          p_error_code: string | null;
        };
        Returns: undefined;
      };
      claim_meeting_integration_batch: {
        Args: { p_limit: number };
        Returns: {
          meeting_slot_id: string;
          project_id: string;
          starts_at: string;
          ends_at: string;
          client_email: string;
          attempts: number;
          zoom_meeting_id: string | null;
          zoom_join_url: string | null;
          google_event_id: string | null;
        }[];
      };
      record_meeting_zoom: {
        Args: {
          p_meeting_slot_id: string;
          p_zoom_meeting_id: string;
          p_zoom_join_url: string;
        };
        Returns: undefined;
      };
      settle_meeting_integration: {
        Args: {
          p_meeting_slot_id: string;
          p_outcome: string;
          p_google_event_id: string | null;
          p_google_event_url: string | null;
          p_error_code: string | null;
          p_retry_after_seconds?: number | null;
        };
        Returns: undefined;
      };
      store_google_calendar_connection: {
        Args: {
          p_refresh_token: string;
          p_connected_by: string;
          p_connected_email: string;
          p_granted_scopes: string[];
        };
        Returns: undefined;
      };
      get_google_calendar_connection: {
        Args: Record<string, never>;
        Returns: {
          refresh_token: string;
          connected_email: string;
          granted_scopes: string[];
        }[];
      };
      requeue_meeting_integrations: {
        Args: Record<string, never>;
        Returns: number;
      };
      create_document_draft: {
        Args: {
          p_document_id: string;
          p_version_id: string;
          p_project_id: string;
          p_kind: ProjectDocumentKind;
          p_content: Json;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      publish_document_version: {
        Args: {
          p_project_id: string;
          p_version_id: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      portal_app_role: PortalAppRole;
      project_member_role: ProjectMemberRole;
      project_membership_status: ProjectMembershipStatus;
      project_invitation_status: ProjectInvitationStatus;
      project_stage: ProjectStage;
      intake_status: IntakeStatus;
      meeting_slot_status: MeetingSlotStatus;
      meeting_integration_status: MeetingIntegrationStatus;
      payment_request_kind: PaymentRequestKind;
      payment_request_status: PaymentRequestStatus;
      project_document_kind: ProjectDocumentKind;
      document_version_status: DocumentVersionStatus;
      project_readiness: ProjectReadiness;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
