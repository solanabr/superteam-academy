import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/** Criteria type for auto-awarding when user meets the target value. */
export const ACHIEVEMENT_CRITERIA_TYPES = [
  "xp_reached",
  "lessons_completed",
  "challenges_completed",
  "streak_days",
] as const;
export type AchievementCriteriaType = (typeof ACHIEVEMENT_CRITERIA_TYPES)[number];

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    achievement_id: text("achievement_id").notNull().unique(),
    name: text("name").notNull(),
    metadata_uri: text("metadata_uri").notNull(),
    /** Display image URL; null falls back to /award.webp in the app. */
    image_url: text("image_url"),
    xp_reward: integer("xp_reward").notNull().default(0),
    supply_cap: integer("supply_cap"),
    current_supply: integer("current_supply").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
    /** When set, achievement can be auto-awarded when user meets this criteria. */
    criteria_type: text("criteria_type").$type<AchievementCriteriaType>(),
    /** Target value to meet (e.g. 1000 for xp_reached, 7 for streak_days). */
    criteria_value: integer("criteria_value"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("achievements_achievement_id_idx").on(t.achievement_id)],
);

export const achievement_awards = pgTable(
  "achievement_awards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievement_id: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    tx_signature: text("tx_signature"),
    awarded_at: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("achievement_awards_user_id_idx").on(t.user_id),
    index("achievement_awards_achievement_id_idx").on(t.achievement_id),
  ],
);

