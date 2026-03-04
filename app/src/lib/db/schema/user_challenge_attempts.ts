import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { challenges } from "./challenges";

export const user_challenge_attempts = pgTable(
  "user_challenge_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challenge_id: uuid("challenge_id").references(() => challenges.id, { onDelete: "cascade" }),
    external_challenge_id: text("external_challenge_id"),
    solution_code: text("solution_code"),
    passed: boolean("passed").notNull().default(false),
    xp_awarded: integer("xp_awarded").notNull().default(0),
    attempted_at: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("user_challenge_attempts_user_id_idx").on(t.user_id),
    index("user_challenge_attempts_challenge_id_idx").on(t.challenge_id),
    index("user_challenge_attempts_external_challenge_id_idx").on(t.external_challenge_id),
    index("user_challenge_attempts_user_challenge_idx").on(t.user_id, t.challenge_id),
    index("user_challenge_attempts_user_external_challenge_idx").on(t.user_id, t.external_challenge_id),
  ],
);
