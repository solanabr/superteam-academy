export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          granted_at: string;
          granted_by: string;
        };
        Insert: {
          user_id: string;
          granted_at?: string;
          granted_by: string;
        };
        Update: {
          user_id?: string;
          granted_at?: string;
          granted_by?: string;
        };
        Relationships: [];
      };
      league_tiers: {
        Row: { tier: number; min_prior_week_xp: number };
        Insert: { tier: number; min_prior_week_xp: number };
        Update: { tier?: number; min_prior_week_xp?: number };
        Relationships: [];
      };
      league_cohorts: {
        Row: {
          id: string;
          week_start: string;
          tier: number;
          member_count: number;
          scores_refreshed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_start: string;
          tier: number;
          member_count?: number;
          scores_refreshed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_start?: string;
          tier?: number;
          member_count?: number;
          scores_refreshed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      league_members: {
        Row: {
          id: string;
          cohort_id: string;
          user_id: string;
          week_start: string;
          score: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          cohort_id: string;
          user_id: string;
          week_start: string;
          score?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          cohort_id?: string;
          user_id?: string;
          week_start?: string;
          score?: number;
          joined_at?: string;
        };
        Relationships: [];
      };
      onchain_deployments: {
        Row: {
          content_id: string;
          kind: "course" | "achievement";
          status: string | null;
          course_pda: string | null;
          tx_signature: string | null;
          collection_address: string | null;
          track_collection_address: string | null;
          achievement_pda: string | null;
          is_active: boolean | null;
          last_synced: string | null;
          updated_at: string | null;
          // Per-course maintenance gate (WS-2 #453 rail 3): true while a
          // close+recreate is in flight. NOT NULL DEFAULT false on the table
          // (20260714150000_course_maintenance_gate.sql). Server-only — never
          // exposed through the public_onchain_deployments view.
          in_maintenance: boolean;
        };
        Insert: {
          content_id: string;
          kind: "course" | "achievement";
          status?: string | null;
          course_pda?: string | null;
          tx_signature?: string | null;
          collection_address?: string | null;
          track_collection_address?: string | null;
          achievement_pda?: string | null;
          is_active?: boolean | null;
          last_synced?: string | null;
          updated_at?: string | null;
          in_maintenance?: boolean;
        };
        Update: {
          content_id?: string;
          kind?: "course" | "achievement";
          status?: string | null;
          course_pda?: string | null;
          tx_signature?: string | null;
          collection_address?: string | null;
          track_collection_address?: string | null;
          achievement_pda?: string | null;
          is_active?: boolean | null;
          last_synced?: string | null;
          updated_at?: string | null;
          in_maintenance?: boolean;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_accepted: boolean;
          thread_id: string;
          updated_at: string;
          vote_score: number;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_accepted?: boolean;
          thread_id: string;
          updated_at?: string;
          vote_score?: number;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_accepted?: boolean;
          thread_id?: string;
          updated_at?: string;
          vote_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "answers_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      certificates: {
        Row: {
          course_id: string;
          course_title: string;
          credential_type: string | null;
          id: string;
          metadata_uri: string | null;
          mint_address: string | null;
          minted_at: string | null;
          tx_signature: string | null;
          user_id: string | null;
        };
        Insert: {
          course_id: string;
          course_title: string;
          credential_type?: string | null;
          id?: string;
          metadata_uri?: string | null;
          mint_address?: string | null;
          minted_at?: string | null;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Update: {
          course_id?: string;
          course_title?: string;
          credential_type?: string | null;
          id?: string;
          metadata_uri?: string | null;
          mint_address?: string | null;
          minted_at?: string | null;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "certificates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deployed_programs: {
        Row: {
          course_id: string;
          deployed_at: string | null;
          id: string;
          lesson_id: string;
          network: string;
          program_id: string;
          user_id: string | null;
        };
        Insert: {
          course_id: string;
          deployed_at?: string | null;
          id?: string;
          lesson_id: string;
          network?: string;
          program_id: string;
          user_id?: string | null;
        };
        Update: {
          course_id?: string;
          deployed_at?: string | null;
          id?: string;
          lesson_id?: string;
          network?: string;
          program_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deployed_programs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "deployed_programs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          completed_at: string | null;
          course_id: string;
          enrolled_at: string | null;
          id: string;
          tx_signature: string | null;
          user_id: string | null;
          wallet_address: string | null;
        };
        Insert: {
          completed_at?: string | null;
          course_id: string;
          enrolled_at?: string | null;
          id?: string;
          tx_signature?: string | null;
          user_id?: string | null;
          wallet_address?: string | null;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string;
          enrolled_at?: string | null;
          id?: string;
          tx_signature?: string | null;
          user_id?: string | null;
          wallet_address?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_actions: {
        Row: {
          id: string;
          action: string;
          thread_id: string | null;
          answer_id: string | null;
          flag_id: string | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          thread_id?: string | null;
          answer_id?: string | null;
          flag_id?: string | null;
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          thread_id?: string | null;
          answer_id?: string | null;
          flag_id?: string | null;
          actor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      flags: {
        Row: {
          answer_id: string | null;
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
          thread_id: string | null;
        };
        Insert: {
          answer_id?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          thread_id?: string | null;
        };
        Update: {
          answer_id?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          thread_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "flags_answer_id_fkey";
            columns: ["answer_id"];
            isOneToOne: false;
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flags_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "flags_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flags_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "flags_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flags_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      nft_metadata: {
        Row: {
          created_at: string;
          data: Json;
          id: string;
        };
        Insert: {
          created_at?: string;
          data: Json;
          id?: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          id?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          key: string;
          window_start: string;
        };
        Insert: {
          count?: number;
          key: string;
          window_start: string;
        };
        Update: {
          count?: number;
          key?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      pending_onchain_actions: {
        Row: {
          action_type: string;
          failed_at: string | null;
          id: string;
          last_error: string | null;
          payload: Json;
          reference_id: string;
          resolved_at: string | null;
          retry_count: number | null;
          user_id: string | null;
        };
        Insert: {
          action_type: string;
          failed_at?: string | null;
          id?: string;
          last_error?: string | null;
          payload: Json;
          reference_id: string;
          resolved_at?: string | null;
          retry_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          action_type?: string;
          failed_at?: string | null;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          reference_id?: string;
          resolved_at?: string | null;
          retry_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          daily_goal: number | null;
          deleted_at: string | null;
          deletion_requested_at: string | null;
          display_name: string | null;
          github_id: string | null;
          goal: string | null;
          google_id: string | null;
          id: string;
          is_public: boolean | null;
          name_rerolls_used: number | null;
          prefs: Json | null;
          referral_code: string | null;
          referred_by: string | null;
          segment: number | null;
          social_links: Json | null;
          username: string;
          verified: boolean;
          wallet_address: string | null;
          wallet_xp_synced_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          daily_goal?: number | null;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
          display_name?: string | null;
          github_id?: string | null;
          goal?: string | null;
          google_id?: string | null;
          id: string;
          is_public?: boolean | null;
          name_rerolls_used?: number | null;
          prefs?: Json | null;
          referral_code?: string | null;
          referred_by?: string | null;
          segment?: number | null;
          social_links?: Json | null;
          username: string;
          verified?: boolean;
          wallet_address?: string | null;
          wallet_xp_synced_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          daily_goal?: number | null;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
          display_name?: string | null;
          github_id?: string | null;
          goal?: string | null;
          google_id?: string | null;
          id?: string;
          is_public?: boolean | null;
          name_rerolls_used?: number | null;
          prefs?: Json | null;
          referral_code?: string | null;
          referred_by?: string | null;
          segment?: number | null;
          social_links?: Json | null;
          username?: string;
          verified?: boolean;
          wallet_address?: string | null;
          wallet_xp_synced_at?: string | null;
        };
        Relationships: [];
      };
      referral_events: {
        Row: {
          course_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          referred_id: string;
          referrer_id: string;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          referred_id: string;
          referrer_id: string;
        };
        Update: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          referred_id?: string;
          referrer_id?: string;
        };
        Relationships: [];
      };
      referral_seasons: {
        Row: {
          created_at: string;
          ends_at: string;
          number: number;
          starts_at: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          number: number;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          number?: number;
          starts_at?: string;
        };
        Relationships: [];
      };
      siws_nonces: {
        Row: {
          consumed_at: string | null;
          created_at: string;
          ip_address: string | null;
          nonce: string;
          status: string;
          wallet_address: string | null;
        };
        Insert: {
          consumed_at?: string | null;
          created_at?: string;
          ip_address?: string | null;
          nonce: string;
          status?: string;
          wallet_address?: string | null;
        };
        Update: {
          consumed_at?: string | null;
          created_at?: string;
          ip_address?: string | null;
          nonce?: string;
          status?: string;
          wallet_address?: string | null;
        };
        Relationships: [];
      };
      threads: {
        Row: {
          accepted_answer_id: string | null;
          answer_count: number;
          author_id: string;
          body: string;
          category_id: string | null;
          course_id: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_locked: boolean;
          is_pinned: boolean;
          is_solved: boolean;
          last_activity_at: string;
          lesson_id: string | null;
          search_vector: unknown;
          short_id: string | null;
          slug: string;
          title: string;
          type: string;
          updated_at: string;
          view_count: number;
          vote_score: number;
        };
        Insert: {
          accepted_answer_id?: string | null;
          answer_count?: number;
          author_id: string;
          body: string;
          category_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_locked?: boolean;
          is_pinned?: boolean;
          is_solved?: boolean;
          last_activity_at?: string;
          lesson_id?: string | null;
          search_vector?: unknown;
          short_id?: string | null;
          slug: string;
          title: string;
          type: string;
          updated_at?: string;
          view_count?: number;
          vote_score?: number;
        };
        Update: {
          accepted_answer_id?: string | null;
          answer_count?: number;
          author_id?: string;
          body?: string;
          category_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_locked?: boolean;
          is_pinned?: boolean;
          is_solved?: boolean;
          last_activity_at?: string;
          lesson_id?: string | null;
          search_vector?: unknown;
          short_id?: string | null;
          slug?: string;
          title?: string;
          type?: string;
          updated_at?: string;
          view_count?: number;
          vote_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_threads_accepted_answer";
            columns: ["accepted_answer_id"];
            isOneToOne: false;
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "threads_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "threads_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "threads_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "forum_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          asset_address: string | null;
          id: string;
          tx_signature: string | null;
          unlocked_at: string | null;
          user_id: string | null;
        };
        Insert: {
          achievement_id: string;
          asset_address?: string | null;
          id?: string;
          tx_signature?: string | null;
          unlocked_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          achievement_id?: string;
          asset_address?: string | null;
          id?: string;
          tx_signature?: string | null;
          unlocked_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_daily_quests: {
        Row: {
          completed: boolean | null;
          completed_at: string | null;
          current_value: number | null;
          id: string;
          period_start: string;
          quest_id: string;
          user_id: string | null;
          xp_granted: boolean | null;
        };
        Insert: {
          completed?: boolean | null;
          completed_at?: string | null;
          current_value?: number | null;
          id?: string;
          period_start: string;
          quest_id: string;
          user_id?: string | null;
          xp_granted?: boolean | null;
        };
        Update: {
          completed?: boolean | null;
          completed_at?: string | null;
          current_value?: number | null;
          id?: string;
          period_start?: string;
          quest_id?: string;
          user_id?: string | null;
          xp_granted?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_daily_quests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "user_daily_quests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_progress: {
        Row: {
          completed: boolean | null;
          completed_at: string | null;
          course_id: string;
          id: string;
          lesson_id: string;
          lesson_index: number | null;
          tx_signature: string | null;
          user_id: string | null;
        };
        Insert: {
          completed?: boolean | null;
          completed_at?: string | null;
          course_id: string;
          id?: string;
          lesson_id: string;
          lesson_index?: number | null;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed?: boolean | null;
          completed_at?: string | null;
          course_id?: string;
          id?: string;
          lesson_id?: string;
          lesson_index?: number | null;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "user_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      streak_freezes_used: {
        Row: {
          created_at: string;
          frozen_date: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          frozen_date: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          frozen_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "streak_freezes_used_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_xp: {
        Row: {
          current_streak: number | null;
          id: string;
          last_activity_date: string | null;
          level: number | null;
          longest_streak: number | null;
          streak_freezes: number;
          total_xp: number | null;
          user_id: string | null;
        };
        Insert: {
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          level?: number | null;
          longest_streak?: number | null;
          streak_freezes?: number;
          total_xp?: number | null;
          user_id?: string | null;
        };
        Update: {
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          level?: number | null;
          longest_streak?: number | null;
          streak_freezes?: number;
          total_xp?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_xp_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "user_xp_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          answer_id: string | null;
          created_at: string;
          id: string;
          thread_id: string | null;
          user_id: string;
          value: number;
        };
        Insert: {
          answer_id?: string | null;
          created_at?: string;
          id?: string;
          thread_id?: string | null;
          user_id: string;
          value: number;
        };
        Update: {
          answer_id?: string | null;
          created_at?: string;
          id?: string;
          thread_id?: string | null;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "votes_answer_id_fkey";
            columns: ["answer_id"];
            isOneToOne: false;
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      xp_transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          id: string;
          idempotency_key: string | null;
          reason: string;
          source: string;
          tx_signature: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          reason: string;
          source: string;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          reason?: string;
          source?: string;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "community_stats";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "xp_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      review_schedule: {
        Row: {
          box: number;
          interval_days: number;
        };
        Insert: {
          box: number;
          interval_days: number;
        };
        Update: {
          box?: number;
          interval_days?: number;
        };
        Relationships: [];
      };
      review_items: {
        Row: {
          user_id: string;
          item_key: string;
          box: number;
          due_at: string;
          last_result: boolean | null;
          last_reviewed_at: string | null;
          lapses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_key: string;
          box?: number;
          due_at?: string;
          last_result?: boolean | null;
          last_reviewed_at?: string | null;
          lapses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          item_key?: string;
          box?: number;
          due_at?: string;
          last_result?: boolean | null;
          last_reviewed_at?: string | null;
          lapses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_items_box_fkey";
            columns: ["box"];
            isOneToOne: false;
            referencedRelation: "review_schedule";
            referencedColumns: ["box"];
          },
        ];
      };
      course_changelog: {
        // #654: post-deployment course evolution log. Written service_role-only
        // at mutation time by the admin sync route; public SELECT (RLS policy).
        // `detail` is a kind-specific, title-snapshotted payload — decoded to a
        // discriminated union at the read seam (lib/courses/changelog.ts).
        Row: {
          id: number;
          course_id: string;
          kind:
            | "deployed"
            | "lessons_added"
            | "lessons_removed"
            | "xp_changed"
            | "content_updated"
            | "deactivated"
            | "reactivated"
            | "recreated";
          version: number;
          detail: Json;
          tx_signature: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          course_id: string;
          kind:
            | "deployed"
            | "lessons_added"
            | "lessons_removed"
            | "xp_changed"
            | "content_updated"
            | "deactivated"
            | "reactivated"
            | "recreated";
          version: number;
          detail?: Json;
          tx_signature: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          course_id?: string;
          kind?:
            | "deployed"
            | "lessons_added"
            | "lessons_removed"
            | "xp_changed"
            | "content_updated"
            | "deactivated"
            | "reactivated"
            | "recreated";
          version?: number;
          detail?: Json;
          tx_signature?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      email_subscriptions: {
        // #769: marketing-email consent. Opt-out by default; own-row SELECT;
        // writes only via SECURITY DEFINER RPCs (set_marketing_opt_in /
        // unsubscribe_by_token). The unsubscribe route reads a matched row's
        // user via unsubscribe_by_token; the settings UI reads opt_in own-row.
        Row: {
          user_id: string;
          opt_in: boolean;
          consent_at: string | null;
          unsubscribed_at: string | null;
          unsubscribe_token: string;
          updated_at: string;
          // #869 — reminder consent, independent of `opt_in` above.
          reminder_opt_in: boolean;
          reminder_consent_at: string | null;
          reminder_unsubscribed_at: string | null;
          reminder_locale: string | null;
          // #896 — reminder-scoped unsubscribe secret. NEVER equal to
          // `unsubscribe_token` (DB CHECK): each consent kind has its own.
          reminder_unsubscribe_token: string;
        };
        Insert: {
          user_id: string;
          opt_in?: boolean;
          consent_at?: string | null;
          unsubscribed_at?: string | null;
          unsubscribe_token?: string;
          updated_at?: string;
          reminder_opt_in?: boolean;
          reminder_consent_at?: string | null;
          reminder_unsubscribed_at?: string | null;
          reminder_locale?: string | null;
          reminder_unsubscribe_token?: string;
        };
        Update: {
          user_id?: string;
          opt_in?: boolean;
          consent_at?: string | null;
          unsubscribed_at?: string | null;
          unsubscribe_token?: string;
          updated_at?: string;
          reminder_opt_in?: boolean;
          reminder_consent_at?: string | null;
          reminder_unsubscribed_at?: string | null;
          reminder_locale?: string | null;
          reminder_unsubscribe_token?: string;
        };
        Relationships: [];
      };
      email_reminder_log: {
        // #869: service-role-only send ledger. RLS on with NO policies — the
        // client never reads or writes it; the claim/release RPCs do.
        Row: {
          user_id: string;
          kind: string;
          sent_on: string;
          sent_at: string;
        };
        Insert: {
          user_id: string;
          kind: string;
          sent_on: string;
          sent_at?: string;
        };
        Update: {
          user_id?: string;
          kind?: string;
          sent_on?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_onchain_deployments: {
        Row: {
          content_id: string;
          kind: "course" | "achievement";
          status: string | null;
          is_active: boolean | null;
          achievement_pda: string | null;
        };
        Relationships: [];
      };
      community_stats: {
        Row: {
          accepted_answers: number | null;
          total_answers: number | null;
          total_community_xp: number | null;
          total_threads: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          display_name: string | null;
          id: string | null;
          social_links: Json | null;
          username: string | null;
          verified: boolean | null;
          wallet_address: string | null;
        };
        Relationships: [];
      };
      public_user_xp: {
        Row: {
          level: number | null;
          total_xp: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      course_lesson_completion_counts: {
        Args: { p_course_id: string };
        Returns: { lesson_id: string; completed_by: number }[];
      };
      /**
       * Account-fork auto-merge (AUTH-FLOWS.md §7): folds a wallet-shaped
       * shell account into the socially-signed-in account whose Dynamic JWT
       * proved ownership of the shell's wallet. service_role only; one
       * transaction; re-validates shell-ness in SQL and RAISEs rather than
       * merge on any doubt.
       */
      merge_wallet_shell_account: {
        Args: { p_target: string; p_shell: string; p_wallet: string };
        Returns: Record<string, unknown>;
      };
      /**
       * Subject rung of /api/auth/dynamic (#1055): auth.identities lookup by
       * (provider, provider_id). service_role only; NULL when no identity or
       * blank args.
       */
      find_user_by_oauth_identity: {
        Args: { p_provider: string; p_subject: string };
        Returns: string | null;
      };
      // #769 marketing-email consent RPCs.
      set_marketing_opt_in: {
        Args: { p_opt_in: boolean };
        Returns: undefined;
      };
      list_marketing_recipients: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          email: string;
          unsubscribe_token: string;
        }[];
      };
      /**
       * Marketing unsubscribe. #896: matches ONLY
       * `email_subscriptions.unsubscribe_token` — a reminder token returns
       * false and writes nothing.
       */
      unsubscribe_by_token: {
        Args: { p_token: string };
        Returns: boolean;
      };
      // #869 session-plan reminder consent + send RPCs. Reminder consent is a
      // SEPARATE consent type from marketing consent above.
      set_reminder_opt_in: {
        Args: { p_opt_in: boolean; p_locale?: string | null };
        Returns: undefined;
      };
      claim_due_session_reminders: {
        Args: { p_weekday?: string };
        Returns: {
          user_id: string;
          email: string;
          /**
           * #896: reminder-scoped secret
           * (`email_subscriptions.reminder_unsubscribe_token`). The OUT column
           * name is unchanged for signature stability; only its source column
           * moved. Valid ONLY for `unsubscribe_reminders_by_token`.
           */
          unsubscribe_token: string;
          locale: string | null;
          plan_time: string;
        }[];
      };
      release_session_reminder_claims: {
        Args: { p_user_ids: string[] };
        Returns: number;
      };
      // #899 re-engagement send pipeline. Same ledger, same REMINDER consent;
      // what differs is the FREQUENCY CAP (`p_cap_days`), which the RPC enforces
      // in SQL across BOTH re-engagement kinds so a permanently lapsed learner
      // cannot be nudged daily. `session_plan` is outside that cap.
      claim_due_reengagement: {
        Args: {
          /** 'reengagement_7d' | 'course_nudge'; anything else RAISEs. */
          p_kind: string;
          p_inactive_days?: number;
          p_cap_days?: number;
          p_max_remaining?: number;
          /** `{ [courseId]: totalLessons }` from the content bundle. */
          p_course_totals?: Record<string, number>;
        };
        Returns: {
          user_id: string;
          email: string;
          /** #896 reminder-scoped secret — never the marketing token. */
          unsubscribe_token: string;
          locale: string | null;
          streak_days: number;
          days_inactive: number;
          /** Nearly-done course; null for `reengagement_7d`. */
          course_id: string | null;
          /** Completed lessons in that course; empty for `reengagement_7d`. */
          completed_lesson_ids: string[];
        }[];
      };
      release_reengagement_claims: {
        Args: { p_kind: string; p_user_ids: string[] };
        Returns: number;
      };
      /**
       * Reminder unsubscribe. #896: matches ONLY
       * `email_subscriptions.reminder_unsubscribe_token` — a marketing token
       * (including every reminder link minted before #896) returns false.
       */
      unsubscribe_reminders_by_token: {
        Args: { p_token: string };
        Returns: boolean;
      };
      award_community_xp: {
        Args: {
          p_amount: number;
          p_idempotency_key?: string;
          p_reason: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      check_rate_limit: {
        Args: {
          p_key: string;
          p_max_tokens: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      spend_challenge_assist: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
          p_max_paid: number;
        };
        Returns: {
          allowed: boolean;
          used: number;
        }[];
      };
      get_challenge_assists: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
        };
        Returns: number;
      };
      // #864 guarded self-serve reset: once-flag + 7-day cooldown enforced
      // INSIDE the RPC (R-6); returns the verdict instead of void.
      reset_challenge_assists: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
        };
        Returns: {
          allowed: boolean;
          reason: string;
          available_at: string | null;
        }[];
      };
      // #864 assist ladder: atomic tier-resolving spend + tier-aware refund.
      spend_assist_ladder_turn: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
          p_free_max: number;
          p_metered_max: number;
          p_socratic_max: number;
        };
        Returns: {
          allowed: boolean;
          tier: string;
          free_turns: number;
          metered_turns: number;
          socratic_turns: number;
        }[];
      };
      refund_assist_ladder_turn: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
          p_tier: string;
        };
        Returns: undefined;
      };
      refund_challenge_assist: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
        };
        Returns: undefined;
      };
      record_billed_assist: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
        };
        Returns: undefined;
      };
      append_challenge_assist_log: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
          p_entries: Json;
        };
        Returns: undefined;
      };
      get_challenge_assist_state: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
        };
        Returns: {
          free_turns: number;
          metered_turns: number;
          socratic_turns: number;
          reset_state: string;
          reset_available_at: string | null;
          chat_log: Json;
        }[];
      };
      schedule_review_item: {
        Args: {
          p_user_id: string;
          p_item_key: string;
        };
        Returns: {
          box: number;
          due_at: string;
        }[];
      };
      record_review_result: {
        Args: {
          p_user_id: string;
          p_item_key: string;
          p_passed: boolean;
        };
        Returns: {
          box: number;
          due_at: string;
        }[];
      };
      check_ai_spend: {
        Args: {
          p_user_id: string;
          p_ip: string;
        };
        Returns: {
          account_micro_usd: number;
          ip_micro_usd: number;
          global_micro_usd: number;
        }[];
      };
      record_ai_spend: {
        Args: {
          p_user_id: string;
          p_ip: string;
          p_micro_usd: number;
        };
        Returns: undefined;
      };
      get_ai_spend_today: {
        Args: Record<string, never>;
        Returns: {
          micro_usd: number;
          request_count: number;
        }[];
      };
      award_xp: {
        Args: {
          p_amount: number;
          p_idempotency_key?: string;
          p_reason: string;
          p_source?: string;
          p_tx_signature?: string;
          p_user_id: string;
        };
        Returns: number;
      };
      claim_referral: {
        Args: {
          p_code: string;
          p_referred_id: string;
        };
        Returns: string;
      };
      create_thread: {
        Args: {
          p_author_id: string;
          p_body: string;
          p_category_id: string;
          p_course_id: string;
          p_lesson_id: string;
          p_slug_base: string;
          p_title: string;
          p_type: string;
        };
        Returns: {
          id: string;
          short_id: string;
          slug: string;
        }[];
      };
      get_daily_quest_state: {
        Args: {
          p_challenge_ids: string[];
          p_module_lesson_map: Json;
          p_quest_definitions: Json;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_leaderboard: {
        Args: { p_limit?: number; p_timeframe?: string };
        Returns: {
          avatar_url: string;
          level: number;
          rank: number;
          total_xp: number;
          user_id: string;
          username: string;
        }[];
      };
      get_or_create_referral_code: {
        Args: {
          p_user_id: string;
        };
        Returns: string;
      };
      get_platform_stats: {
        Args: Record<string, never>;
        Returns: {
          total_xp: number;
          builders: number;
          credentials: number;
        }[];
      };
      get_referral_leaderboard: {
        Args: {
          p_season?: number;
          p_limit?: number;
        };
        Returns: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          points: number;
          rank: number;
          season_number: number;
          season_starts_at: string;
          season_ends_at: string;
        }[];
      };
      record_referral_course_completion: {
        Args: {
          p_course_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      get_cohort_leaderboard: {
        Args: { p_user_id: string };
        Returns: {
          user_id: string | null;
          username: string | null;
          avatar_url: string | null;
          score: number;
          rank: number;
          is_you: boolean;
          tier: number;
          week_start: string;
        }[];
      };
      ensure_league_membership: {
        Args: { p_user_id: string };
        Returns: string;
      };
      refresh_cohort_scores: {
        Args: { p_cohort_id: string };
        Returns: undefined;
      };
      increment_view_count: {
        Args: { p_thread_id: string; p_user_id?: string };
        Returns: undefined;
      };
      moderate_soft_delete_thread: {
        Args: { p_thread_id: string };
        Returns: undefined;
      };
      moderate_soft_delete_answer: {
        Args: { p_answer_id: string };
        Returns: undefined;
      };
      soft_delete_thread: {
        Args: { p_thread_id: string; p_user_id: string };
        Returns: undefined;
      };
      soft_delete_answer: {
        Args: { p_answer_id: string; p_user_id: string };
        Returns: undefined;
      };
      revoke_community_xp: {
        Args: { p_idempotency_key: string; p_user_id: string };
        Returns: undefined;
      };
      unlock_achievement: {
        Args: {
          p_achievement_id: string;
          p_asset_address?: string;
          p_tx_signature?: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
