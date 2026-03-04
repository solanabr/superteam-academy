import { pgTable, text, uuid, integer, pgEnum } from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { CourseSectionTable } from "./courseSection"
import { UserLessonCompleteTable } from "./userLessonComplete"

export const lessonStatuses = ["public", "private", "preview"] as const
export type LessonStatus = (typeof lessonStatuses)[number]
export const lessonStatusEnum = pgEnum("lesson_status", lessonStatuses)

export const LessonTable = pgTable("lessons", {
  id,
  name: text().notNull(),
  description: text(),
  youtubeVideoId: text(),
  xpReward: integer("xp_reward").notNull().default(25),
  order: integer().notNull(),
  status: lessonStatusEnum().notNull().default("private"),
  sectionId: uuid()
    .notNull()
    .references(() => CourseSectionTable.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
})

export const LessonRelationships = relations(LessonTable, ({ one, many }) => ({
  section: one(CourseSectionTable, {
    fields: [LessonTable.sectionId],
    references: [CourseSectionTable.id],
  }),
  userLessonsComplete: many(UserLessonCompleteTable),
}))
