import { lessonStatusEnum } from "@/drizzle/schema"
import { z } from "zod"

export const lessonSchema = z.object({
  name: z.string().min(1, "Required"),
  sectionId: z.string().min(1, "Required"),
  status: z.enum(lessonStatusEnum.enumValues),
  xpReward: z.number().int().min(0, "Must be 0 or greater"),
  youtubeVideoId: z
    .string()
    .trim()
    .or(z.literal(""))
    .transform((v) => v.trim()),
  description: z
    .string()
    .transform(v => (v === "" ? null : v))
    .nullable(),
})
