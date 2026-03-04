import { pgEnum, pgTable, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { UserCourseAccessTable } from "./userCourseAccess"
import { AssignmentSubmissionTable } from "./assignmentSubmission"

export const userRoles = ["user", "admin"] as const
export type UserRole = (typeof userRoles)[number]
export const userRoleEnum = pgEnum("user_role", userRoles)

export const UserTable = pgTable("users", {
  id,
  // NextAuth compatible fields
  name: text(),
  email: text().unique(),
  emailVerified: timestamp({ withTimezone: true }),
  image: text(),
  password: text(), // bcrypt hash — null for OAuth-only users
  // App-specific fields
  username: text().unique(),
  bio: text(),
  role: userRoleEnum().notNull().default("user"),
  // Gamification
  xp: integer().notNull().default(0),
  streak: integer().notNull().default(0),
  lastActiveDate: date(),
  streakFreezeCount: integer().notNull().default(0),
  // Profile extras
  websiteUrl: text(),
  twitterHandle: text(),
  githubHandle: text(),
  walletAddress: text().unique(),
  isProfilePublic: boolean().notNull().default(true),
  deletedAt: timestamp({ withTimezone: true }),
  createdAt,
  updatedAt,
})

export const UserRelationships = relations(UserTable, ({ many }) => ({
  userCourseAccesses: many(UserCourseAccessTable),
  assignmentSubmissions: many(AssignmentSubmissionTable),
}))
