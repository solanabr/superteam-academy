import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name too long")
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, _ and -",
    )
    .optional(),
  bio: z.string().max(280, "Bio too long").optional(),
  avatarUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  socialLinks: z
    .object({
      github: z.string().max(100).optional(),
      website: z.string().url("Invalid URL").or(z.literal("")).optional(),
    })
    .optional(),
});

export const updatePreferencesSchema = z.object({
  preferredLanguage: z.enum(["en", "pt-BR", "es"]).optional(),
  preferredTheme: z.enum(["dark", "light", "brasil"]).optional(),
  emailNotifications: z.boolean().optional(),
});

export const updatePrivacySchema = z.object({
  isPublic: z.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;

// Avatar upload constraints
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
export const AVATAR_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
