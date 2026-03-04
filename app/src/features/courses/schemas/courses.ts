import z from "zod"
import { courseTracks, difficultyLevels } from "@/drizzle/schema"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export const courseSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  description: z.string().trim().min(1, "Required"),
  onchainCourseId: z
    .string()
    .trim()
    .or(z.literal(""))
    .transform((v) => toSlug(v))
    .refine((v) => v.length <= 80, "On-chain course ID is too long")
    .refine(
      (v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
      "Use lowercase letters, numbers, and hyphens only"
    ),
  difficulty: z.enum(difficultyLevels),
  track: z.enum(courseTracks),
  durationHours: z.number().int().min(0, "Must be 0 or greater"),
  xpReward: z.number().int().min(0, "Must be 0 or greater"),
  instructorName: z
    .string()
    .trim()
    .max(120, "Too long")
    .or(z.literal("")),
  thumbnailUrl: z
    .string()
    .trim()
    .max(500, "Too long")
    .or(z.literal("")),
})
