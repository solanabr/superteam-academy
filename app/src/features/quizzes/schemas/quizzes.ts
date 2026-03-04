import { z } from "zod"

export const assignmentSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  maxScore: z.number().min(0).max(1000),
  xpReward: z.number().int().min(0, "Must be 0 or greater"),
  status: z.enum(["draft", "published", "closed"]),
  courseId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  allowLateSubmissions: z.boolean(),
  order: z.number(),
})

export const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  textContent: z.string().optional(),
  // File fields handled separately during upload
  storageKey: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
})

export const gradingSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.number().min(0),
  feedback: z.string().optional(),
  sendNotification: z.boolean(),
})
