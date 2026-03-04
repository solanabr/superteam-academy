import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core"
import { id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { UserTable } from "./user"

export const XpEventTable = pgTable("xp_events", {
  id,
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  amount: integer().notNull(),
  reason: text().notNull(),
  courseId: uuid(),
  lessonId: uuid(),
  assignmentId: uuid("assignment_id"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const XpEventRelationships = relations(XpEventTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [XpEventTable.userId],
    references: [UserTable.id],
  }),
}))
