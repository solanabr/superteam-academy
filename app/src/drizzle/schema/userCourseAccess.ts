import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"
import { createdAt, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { UserTable } from "./user"
import { CourseTable } from "./course"

export const UserCourseAccessTable = pgTable(
  "user_course_access",
  {
    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => CourseTable.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
  },
  t => [primaryKey({ columns: [t.userId, t.courseId] })]
)

export const UserCourseAccessRelationships = relations(
  UserCourseAccessTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserCourseAccessTable.userId],
      references: [UserTable.id],
    }),
    course: one(CourseTable, {
      fields: [UserCourseAccessTable.courseId],
      references: [CourseTable.id],
    }),
  })
)