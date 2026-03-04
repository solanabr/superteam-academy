import { relations } from "drizzle-orm";
import { pgTable, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { UserCourseAccessTable } from "./userCourseAccess";
import { CourseSectionTable } from "./courseSection";
import { CourseFileTable } from "./courseFile";
import { AssignmentTable } from "./assignment";

export const difficultyLevels = ["beginner", "intermediate", "advanced"] as const
export type DifficultyLevel = (typeof difficultyLevels)[number]
export const difficultyEnum = pgEnum("difficulty_level", difficultyLevels)

export const courseTracks = ["fundamentals", "defi", "nft", "security", "frontend"] as const
export type CourseTrack = (typeof courseTracks)[number]
export const courseTrackEnum = pgEnum("course_track", courseTracks)

export const CourseTable = pgTable("courses", {
  id,
  name: text().notNull(),
  slug: text().unique(),
  onchainCourseId: text("onchain_course_id").unique(),
  description: text().notNull(),
  difficulty: difficultyEnum().notNull().default("beginner"),
  track: courseTrackEnum().notNull().default("fundamentals"),
  durationHours: integer().notNull().default(0),
  xpReward: integer().notNull().default(500),
  thumbnailUrl: text(),
  instructorName: text(),
  createdAt,
  updatedAt,
})

export const CourseRelationships = relations(CourseTable, ({ many }) => ({
  userCourseAccesses: many(UserCourseAccessTable),
  courseSections: many(CourseSectionTable),
  courseFiles: many(CourseFileTable),
  assignments: many(AssignmentTable),
}))
