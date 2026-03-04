import { pgTable, text, uuid, integer, pgEnum, timestamp } from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { AssignmentTable } from "./assignment"
import { UserTable } from "./user"

export const submissionStatuses = ["draft", "submitted", "graded", "returned"] as const
export type SubmissionStatus = (typeof submissionStatuses)[number]
export const submissionStatusEnum = pgEnum("submission_status", submissionStatuses)

export const AssignmentSubmissionTable = pgTable("assignment_submissions", {
  id,
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => AssignmentTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  status: submissionStatusEnum().notNull().default("submitted"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),

  // File storage (follows courseFile pattern)
  storageKey: text("storage_key"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),

  // Text submission option
  textContent: text("text_content"),

  // Grading fields
  score: integer(),
  feedback: text(),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  gradedBy: uuid("graded_by")
    .references(() => UserTable.id, { onDelete: "set null" }),

  createdAt,
  updatedAt,
})

export const AssignmentSubmissionRelationships = relations(AssignmentSubmissionTable, ({ one }) => ({
  assignment: one(AssignmentTable, {
    fields: [AssignmentSubmissionTable.assignmentId],
    references: [AssignmentTable.id],
  }),
  user: one(UserTable, {
    fields: [AssignmentSubmissionTable.userId],
    references: [UserTable.id],
  }),
  grader: one(UserTable, {
    fields: [AssignmentSubmissionTable.gradedBy],
    references: [UserTable.id],
  }),
}))
