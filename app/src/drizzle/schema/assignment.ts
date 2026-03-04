import { pgTable, text, uuid, integer, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { CourseTable } from "./course"
import { CourseSectionTable } from "./courseSection"

export const assignmentStatuses = ["draft", "published", "closed"] as const
export type AssignmentStatus = (typeof assignmentStatuses)[number]
export const assignmentStatusEnum = pgEnum("assignment_status", assignmentStatuses)

export const AssignmentTable = pgTable("assignments", {
  id,
  name: text().notNull(),
  description: text(),
  instructions: text(),
  dueDate: timestamp({ withTimezone: true }),
  maxScore: integer("max_score").notNull().default(100),
  xpReward: integer("xp_reward").notNull().default(200),
  status: assignmentStatusEnum().notNull().default("draft"),
  courseId: uuid("course_id")
    .notNull()
    .references(() => CourseTable.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id")
    .references(() => CourseSectionTable.id, { onDelete: "set null" }),
  allowLateSubmissions: boolean("allow_late_submissions").notNull().default(false),
  order: integer().notNull().default(0),
  createdAt,
  updatedAt,
})

export const AssignmentRelationships = relations(AssignmentTable, ({ one }) => ({
  course: one(CourseTable, {
    fields: [AssignmentTable.courseId],
    references: [CourseTable.id],
  }),
  section: one(CourseSectionTable, {
    fields: [AssignmentTable.sectionId],
    references: [CourseSectionTable.id],
  }),
}))
