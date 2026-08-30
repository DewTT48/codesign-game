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
      lock_prd: {
        Args: {
          target_project_id: string
          target_markdown: string
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
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
