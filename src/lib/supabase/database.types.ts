export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type RowWithTimestamps = {
  created_at: string
  updated_at: string
}

export type ProfileRow = RowWithTimestamps & {
  id: string
  display_name: string | null
  email: string | null
  theme_preference: 'classic' | 'forest' | 'sunset'
}

export type ProjectRow = RowWithTimestamps & {
  id: string
  owner_id: string
  mode: 'guided' | 'own'
  title: string
  topic: string
  content_readiness: 'ready' | 'some' | 'idea'
  status: 'in_progress' | 'completed' | 'archived'
  current_phase: 'C' | 'O' | 'D' | 'E' | 'S' | 'PRD' | 'I' | 'G' | 'N' | 'COMPLETE'
  solidification_stage:
    | 'IDEA'
    | 'UNDERSTOOD'
    | 'EXPLORED'
    | 'DECIDED'
    | 'SOLID'
    | 'BUILD_READY'
  completed_at: string | null
}

export type PrdSnapshotRow = {
  id: string
  project_id: string
  version: number
  markdown_content: string
  content_pack: string | null
  experience_direction: string | null
  status: 'draft' | 'locked'
  created_at: string
}

export type AppBuildRow = {
  id: string
  project_id: string
  version_label: string
  app_url: string
  repository_url: string | null
  created_at: string
}

export type FeedbackEntryRow = {
  id: string
  project_id: string
  feedback_type: 'creator_test' | 'user_test' | 'observation' | 'next_iteration'
  content: Json
  created_at: string
}

export type ProjectPassRow = {
  id: string
  owner_id: string
  source: 'course' | 'stripe' | 'admin'
  status: 'available' | 'consumed' | 'revoked'
  grant_key: string
  granted_by: string | null
  project_id: string | null
  consume_key: string | null
  note: string | null
  granted_at: string
  consumed_at: string | null
  revoked_at: string | null
  updated_at: string
}

export type ProjectPassEventRow = {
  id: string
  pass_id: string
  owner_id: string
  event_type: 'granted' | 'consumed' | 'revoked' | 'restored'
  project_id: string | null
  actor_id: string | null
  reason: string | null
  metadata: Json
  created_at: string
}

export type AiProjectBudgetRow = RowWithTimestamps & {
  project_id: string
  owner_id: string
  status: 'disabled' | 'enabled' | 'exhausted'
  max_requests: number | null
  max_input_tokens: number | null
  max_output_tokens: number | null
  max_total_tokens: number | null
  max_cost_micros: number | null
  reserved_requests: number
  used_requests: number
  reserved_input_tokens: number
  used_input_tokens: number
  reserved_output_tokens: number
  used_output_tokens: number
  reserved_cost_micros: number
  used_cost_micros: number
  limit_version: number
  configured_by: string | null
  configured_at: string | null
}

export type AiRequestRow = RowWithTimestamps & {
  id: string
  project_id: string
  owner_id: string
  action:
    | 'frame_context'
    | 'generate_options'
    | 'challenge_assumptions'
    | 'check_alignment'
    | 'draft_prd'
  model: 'gpt-5.6-sol'
  reasoning_effort: 'low' | 'medium' | 'high' | 'xhigh'
  status: 'reserved' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  idempotency_key: string
  prompt_template_version: string
  output_schema_version: string
  estimated_input_tokens: number
  reserved_output_tokens: number
  reserved_cost_micros: number
  input_tokens: number
  cached_input_tokens: number
  output_tokens: number
  reasoning_tokens: number
  total_tokens: number
  actual_cost_micros: number
  openai_response_id: string | null
  error_code: string | null
  reservation_expires_at: string | null
  started_at: string | null
  completed_at: string | null
}

export type AdminPhaseCount = {
  phase: ProjectRow['current_phase']
  count: number
}

export type AdminOverview = {
  total_users: number
  total_missions: number
  active_missions: number
  completed_missions: number
  archived_missions: number
  users_7d: number
  users_30d: number
  missions_7d: number
  missions_30d: number
  phase_counts: AdminPhaseCount[]
  generated_at: string
}

export type AdminUserRow = {
  user_id: string
  email: string | null
  display_name: string | null
  joined_at: string
  total_missions: number
  active_missions: number
  completed_missions: number
  archived_missions: number
  last_activity_at: string
}

export type DecisionRow = {
  id: string
  project_id: string
  phase: string
  decision_type: string
  content: Json
  version: number
  is_current: boolean
  supersedes_decision_id: string | null
  reason_for_change: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id: string
          display_name?: string | null
          email?: string | null
          theme_preference?: ProfileRow['theme_preference']
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>
        Relationships: []
      }
      projects: {
        Row: ProjectRow
        Insert: {
          id?: string
          owner_id: string
          mode?: ProjectRow['mode']
          title: string
          topic: string
          content_readiness: ProjectRow['content_readiness']
          status?: ProjectRow['status']
          current_phase?: ProjectRow['current_phase']
          solidification_stage?: ProjectRow['solidification_stage']
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: Partial<Omit<ProjectRow, 'id' | 'owner_id' | 'created_at'>>
        Relationships: []
      }
      phase_entries: {
        Row: {
          id: string
          project_id: string
          phase: string
          section: string
          field_key: string
          content: Json
          status: 'captured' | 'locked' | 'superseded'
          version: number
          is_current: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          phase: string
          section: string
          field_key: string
          content?: Json
          status?: 'captured' | 'locked' | 'superseded'
          version?: number
          is_current?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      decisions: {
        Row: DecisionRow
        Insert: Omit<DecisionRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<DecisionRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      prd_snapshots: {
        Row: PrdSnapshotRow
        Insert: {
          id?: string
          project_id: string
          version: number
          markdown_content: string
          content_pack?: string | null
          experience_direction?: string | null
          status?: PrdSnapshotRow['status']
          created_at?: string
        }
        Update: Partial<Omit<PrdSnapshotRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      app_builds: {
        Row: AppBuildRow
        Insert: Omit<AppBuildRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<AppBuildRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      feedback_entries: {
        Row: FeedbackEntryRow
        Insert: Omit<FeedbackEntryRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<FeedbackEntryRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      project_passes: {
        Row: ProjectPassRow
        Insert: {
          id?: string
          owner_id: string
          source: ProjectPassRow['source']
          status?: ProjectPassRow['status']
          grant_key: string
          granted_by?: string | null
          project_id?: string | null
          consume_key?: string | null
          note?: string | null
          granted_at?: string
          consumed_at?: string | null
          revoked_at?: string | null
          updated_at?: string
        }
        Update: Partial<
          Omit<ProjectPassRow, 'id' | 'owner_id' | 'grant_key' | 'granted_at'>
        >
        Relationships: []
      }
      project_pass_events: {
        Row: ProjectPassEventRow
        Insert: {
          id?: string
          pass_id: string
          owner_id: string
          event_type: ProjectPassEventRow['event_type']
          project_id?: string | null
          actor_id?: string | null
          reason?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      ai_project_budgets: {
        Row: AiProjectBudgetRow
        Insert: {
          project_id: string
          owner_id: string
          status?: AiProjectBudgetRow['status']
          max_requests?: number | null
          max_input_tokens?: number | null
          max_output_tokens?: number | null
          max_total_tokens?: number | null
          max_cost_micros?: number | null
          reserved_requests?: number
          used_requests?: number
          reserved_input_tokens?: number
          used_input_tokens?: number
          reserved_output_tokens?: number
          used_output_tokens?: number
          reserved_cost_micros?: number
          used_cost_micros?: number
          limit_version?: number
          configured_by?: string | null
          configured_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AiProjectBudgetRow, 'project_id' | 'owner_id' | 'created_at'>>
        Relationships: []
      }
      ai_requests: {
        Row: AiRequestRow
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          action: AiRequestRow['action']
          model?: AiRequestRow['model']
          reasoning_effort: AiRequestRow['reasoning_effort']
          status?: AiRequestRow['status']
          idempotency_key: string
          prompt_template_version: string
          output_schema_version: string
          estimated_input_tokens: number
          reserved_output_tokens: number
          reserved_cost_micros: number
          input_tokens?: number
          cached_input_tokens?: number
          output_tokens?: number
          reasoning_tokens?: number
          actual_cost_micros?: number
          openai_response_id?: string | null
          error_code?: string | null
          reservation_expires_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AiRequestRow, 'id' | 'project_id' | 'owner_id' | 'created_at' | 'total_tokens'>>
        Relationships: []
      }
      journal_snapshots: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      complete_phase: {
        Args: {
          target_project_id: string
          target_phase: string
        }
        Returns: ProjectRow
      }
      revise_decision: {
        Args: {
          target_project_id: string
          target_phase: string
          target_decision_type: string
          next_content: Json
          change_reason?: string | null
        }
        Returns: Record<string, unknown>
      }
      start_phase_revision: {
        Args: {
          target_project_id: string
          target_phase: string
          change_reason: string
        }
        Returns: ProjectRow
      }
      lock_prd: {
        Args: {
          target_project_id: string
          target_markdown: string
        }
        Returns: ProjectRow
      }
      lock_prd_package: {
        Args: {
          target_project_id: string
          target_markdown: string
          target_content_pack: string
          target_experience_direction: string
        }
        Returns: ProjectRow
      }
      complete_implementation: {
        Args: {
          target_project_id: string
          target_app_url: string
          target_repository_url?: string | null
        }
        Returns: ProjectRow
      }
      complete_feedback: {
        Args: {
          target_project_id: string
          target_creator_test: Json
          target_user_test: Json
        }
        Returns: ProjectRow
      }
      complete_next_iteration: {
        Args: {
          target_project_id: string
          target_decision: Json
        }
        Returns: ProjectRow
      }
      current_user_is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_admin_overview: {
        Args: Record<string, never>
        Returns: AdminOverview
      }
      get_admin_users: {
        Args: {
          search_text?: string | null
          page_limit?: number
          page_offset?: number
        }
        Returns: AdminUserRow[]
      }
      get_my_project_passes: {
        Args: Record<string, never>
        Returns: ProjectPassRow[]
      }
      admin_grant_project_pass: {
        Args: {
          target_user_id: string
          target_source: 'course' | 'admin'
          target_grant_key: string
          target_note?: string | null
        }
        Returns: ProjectPassRow
      }
      admin_revoke_project_pass: {
        Args: {
          target_pass_id: string
          target_reason: string
        }
        Returns: ProjectPassRow
      }
      admin_restore_project_pass: {
        Args: {
          target_pass_id: string
          target_reason: string
        }
        Returns: ProjectPassRow
      }
      create_own_project_with_pass: {
        Args: {
          target_title: string
          target_topic: string
          target_creation_key: string
        }
        Returns: ProjectRow
      }
      get_ai_usage_summary: {
        Args: { target_project_id: string }
        Returns: Json | null
      }
      reserve_ai_request: {
        Args: {
          target_project_id: string
          target_owner_id: string
          target_action: AiRequestRow['action']
          target_idempotency_key: string
          target_estimated_input_tokens: number
          target_reserved_output_tokens: number
          target_reserved_cost_micros: number
          target_prompt_template_version: string
          target_output_schema_version: string
        }
        Returns: AiRequestRow
      }
      mark_ai_request_started: {
        Args: { target_request_id: string }
        Returns: AiRequestRow
      }
      finalize_ai_request: {
        Args: {
          target_request_id: string
          target_status: 'completed' | 'failed' | 'cancelled'
          target_openai_response_id: string | null
          target_input_tokens: number
          target_cached_input_tokens: number
          target_output_tokens: number
          target_reasoning_tokens: number
          target_actual_cost_micros: number
          target_error_code?: string | null
        }
        Returns: AiRequestRow
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
