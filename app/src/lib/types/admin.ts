import type { UserRole } from "@/lib/types/auth";

export type AdminUserRow = {
  id: string;
  email: string;
  role: UserRole;
  wallet_public_key: string | null;
  total_xp: number;
  current_streak_days: number;
  joined_at: string;
};

export type AdminUsersResponse = {
  users: AdminUserRow[];
  total: number;
};

export type AdminLogRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type AdminLogsResponse = {
  logs: AdminLogRow[];
  total: number;
};

export type AdminChallengeRow = {
  id: string;
  title: string;
  difficulty: string;
  xp_reward: number;
  language: string;
  track_association: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type AdminChallengesResponse = {
  challenges: AdminChallengeRow[];
  total: number;
};

export type AdminAchievementRow = {
  id: string;
  achievement_id: string;
  name: string;
  xp_reward: number;
  is_active: boolean;
  supply_cap: number | null;
  current_supply: number;
  created_at: string;
};

export type AdminAchievementsResponse = {
  achievements: AdminAchievementRow[];
  total: number;
};

export type AdminLeaderboardStatusResponse = {
  last_refresh_at: string | null;
  total_indexed: number;
};

export type AdminCertificateRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  course_slug: string;
  completed_at: string;
  mint_address: string | null;
};

export type AdminCertificatesResponse = {
  certificates: AdminCertificateRow[];
  total: number;
};

