import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    achievement_id: text("achievement_id").notNull().unique(),
    name: text("name").notNull(),
    metadata_uri: text("metadata_uri").notNull(),
    xp_reward: integer("xp_reward").notNull().default(0),
    supply_cap: integer("supply_cap"),
    current_supply: integer("current_supply").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
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

