import { pgTable, text, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core"
import { id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { UserTable } from "./user"

export const achievementTypes = [
  // Progress
  "first_steps",
  "course_completer",
  "speed_runner",
  "perfect_score",
  // Streaks
  "week_warrior",
  "monthly_master",
  "consistency_king",
  // Skills
  "rust_rookie",
  "anchor_expert",
  "full_stack_solana",
  "defi_developer",
  "nft_creator",
  // Community
  "helper",
  "first_comment",
  "top_contributor",
  // Special
  "early_adopter",
  "bug_hunter",
  "first_enrollment",
  "xp_1000",
  "xp_5000",
  "xp_10000",
] as const

export type AchievementType = (typeof achievementTypes)[number]
export const achievementTypeEnum = pgEnum("achievement_type", achievementTypes)

export const AchievementTable = pgTable("achievements", {
  id,
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  type: achievementTypeEnum().notNull(),
  awardedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  nftMintAddress: text(), // Populated when on-chain minting is connected
  xpAwarded: text().notNull().default("0"),
})

export const AchievementRelationships = relations(AchievementTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AchievementTable.userId],
    references: [UserTable.id],
  }),
}))
