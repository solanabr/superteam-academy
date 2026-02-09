export interface SocialLinks {
  twitter?: string;
  github?: string;
  discord?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string | null;
          google_id: string | null;
          github_id: string | null;
          username: string;
          bio: string | null;
          avatar_url: string | null;
          social_links: SocialLinks;
          is_public: boolean;
          name_rerolls_used: number;
          wallet_xp_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          wallet_address?: string | null;
          google_id?: string | null;
          github_id?: string | null;
          username: string;
          bio?: string | null;
          avatar_url?: string | null;
          social_links?: SocialLinks;
          is_public?: boolean;
          name_rerolls_used?: number;
          wallet_xp_synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string | null;
          google_id?: string | null;
          github_id?: string | null;
          username?: string;
          bio?: string | null;
          avatar_url?: string | null;
          social_links?: SocialLinks;
          is_public?: boolean;
          name_rerolls_used?: number;
          wallet_xp_synced_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          enrolled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          lesson_id?: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [
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
          id: string;
          user_id: string;
          total_xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_xp_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          course_title: string;
          mint_address: string | null;
          metadata_uri: string | null;
          minted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          course_title: string;
          mint_address?: string | null;
          metadata_uri?: string | null;
          minted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          course_title?: string;
          mint_address?: string | null;
          metadata_uri?: string | null;
          minted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      siws_nonces: {
        Row: {
          nonce: string;
          status: string;
          wallet_address: string | null;
          ip_address: string | null;
          created_at: string;
          consumed_at: string | null;
        };
        Insert: {
          nonce: string;
          status?: string;
          wallet_address?: string | null;
          ip_address?: string | null;
          created_at?: string;
          consumed_at?: string | null;
        };
        Update: {
          nonce?: string;
          status?: string;
          wallet_address?: string | null;
          ip_address?: string | null;
          created_at?: string;
          consumed_at?: string | null;
        };
        Relationships: [];
      };
      nft_metadata: {
        Row: {
          id: string;
          data: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          data: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          data?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      award_xp: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: string;
        };
        Returns: undefined;
      };
      unlock_achievement: {
        Args: {
          p_user_id: string;
          p_achievement_id: string;
        };
        Returns: undefined;
      };
      get_leaderboard: {
        Args: {
          p_timeframe?: string;
          p_limit?: number;
        };
        Returns: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          total_xp: number;
          level: number;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
