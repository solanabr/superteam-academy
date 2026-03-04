import { z } from "zod";

export const admin_role_body_schema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["user", "admin", "super_admin"]),
});

export const admin_users_query_schema = z.object({
  q: z.string().optional(),
  role: z.enum(["user", "admin", "super_admin"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const admin_logs_query_schema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  actor: z.string().optional(),
  action: z.string().optional(),
});

export const admin_challenges_query_schema = z.object({
  q: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard", "hell"]).optional(),
  track: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const admin_achievements_query_schema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const admin_achievement_create_body_schema = z.object({
  achievement_id: z.string().min(1),
  name: z.string().min(1),
  metadata_uri: z.string().min(1),
  xp_reward: z.coerce.number().int().min(0),
  supply_cap: z.coerce.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const admin_achievement_update_body_schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  metadata_uri: z.string().min(1).optional(),
  xp_reward: z.coerce.number().int().min(0).optional(),
  supply_cap: z.coerce.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const admin_certificates_query_schema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminRoleBody = z.infer<typeof admin_role_body_schema>;
export type AdminUsersQuery = z.infer<typeof admin_users_query_schema>;
export type AdminLogsQuery = z.infer<typeof admin_logs_query_schema>;
export type AdminChallengesQuery = z.infer<typeof admin_challenges_query_schema>;
export type AdminAchievementsQuery = z.infer<typeof admin_achievements_query_schema>;
export type AdminCertificatesQuery = z.infer<typeof admin_certificates_query_schema>;
export type AdminAchievementCreateBody = z.infer<typeof admin_achievement_create_body_schema>;
export type AdminAchievementUpdateBody = z.infer<typeof admin_achievement_update_body_schema>;
