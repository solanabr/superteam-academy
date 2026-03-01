import { z } from "zod/v4";

const base58 = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid base58 public key");

export const completeLessonSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  lessonIndex: z.number().int().min(0, "lessonIndex must be >= 0").max(255),
  learner: base58,
});

export const finalizeCourseSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  learner: base58,
});

export const issueCredentialSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  learner: base58,
  totalXp: z.number().int().min(0).optional(),
  coursesCompleted: z.number().int().min(1).optional(),
});
