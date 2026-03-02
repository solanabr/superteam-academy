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
      profiles: {
        Row: {
          id: string;
          wallet_address: string | null;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          github_username: string | null;
          twitter_handle: string | null;
          preferred_locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          wallet_address?: string | null;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          twitter_handle?: string | null;
          preferred_locale?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string;
          streak_start_date: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string;
          streak_start_date?: string;
        };
        Update: Partial<Database["public"]["Tables"]["streaks"]["Insert"]>;
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          action: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      };
      leaderboard_cache: {
        Row: {
          wallet_address: string;
          xp_balance: number;
          level: number;
          rank: number;
          updated_at: string;
        };
        Insert: {
          wallet_address: string;
          xp_balance: number;
          level: number;
          rank?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["leaderboard_cache"]["Insert"]
        >;
      };
      course_progress: {
        Row: {
          user_id: string;
          course_id: string;
          enrollment_pda: string;
          completed_lessons: number;
          total_lessons: number;
          is_finalized: boolean;
          credential_address: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          course_id: string;
          enrollment_pda: string;
          completed_lessons?: number;
          total_lessons: number;
          is_finalized?: boolean;
          credential_address?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["course_progress"]["Insert"]
        >;
      };
      forum_threads: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          title: string;
          body: string;
          is_solved: boolean;
          reply_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          course_id?: string | null;
          title: string;
          body: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["forum_threads"]["Insert"]
        >;
      };
      forum_replies: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          body: string;
          is_solution: boolean;
          created_at: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          body: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["forum_replies"]["Insert"]
        >;
      };
      user_settings: {
        Row: {
          user_id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          theme: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          theme?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_settings"]["Insert"]
        >;
      };
    };
  };
}
