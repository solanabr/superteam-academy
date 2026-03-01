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
      answers: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
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
          github_id: string | null;
          google_id: string | null;
          id: string;
          is_public: boolean | null;
          name_rerolls_used: number | null;
          social_links: Json | null;
          username: string;
          wallet_address: string | null;
          wallet_xp_synced_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          github_id?: string | null;
          google_id?: string | null;
          id: string;
          is_public?: boolean | null;
          name_rerolls_used?: number | null;
          social_links?: Json | null;
          username: string;
          wallet_address?: string | null;
          wallet_xp_synced_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          github_id?: string | null;
          google_id?: string | null;
          id?: string;
          is_public?: boolean | null;
          name_rerolls_used?: number | null;
          social_links?: Json | null;
          username?: string;
          wallet_address?: string | null;
          wallet_xp_synced_at?: string | null;
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
      user_xp: {
        Row: {
          current_streak: number | null;
          id: string;
          last_activity_date: string | null;
          level: number | null;
          longest_streak: number | null;
          total_xp: number | null;
          user_id: string | null;
        };
        Insert: {
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          level?: number | null;
          longest_streak?: number | null;
          total_xp?: number | null;
          user_id?: string | null;
        };
        Update: {
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          level?: number | null;
          longest_streak?: number | null;
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
          tx_signature: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          reason: string;
          tx_signature?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          reason?: string;
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
    };
    Views: {
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
    };
    Functions: {
      award_community_xp: {
        Args: {
          p_amount: number;
          p_idempotency_key?: string;
          p_reason: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      award_xp: {
        Args: {
          p_amount: number;
          p_idempotency_key?: string;
          p_reason: string;
          p_tx_signature?: string;
          p_user_id: string;
        };
        Returns: undefined;
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
      increment_view_count: {
        Args: { p_thread_id: string };
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
