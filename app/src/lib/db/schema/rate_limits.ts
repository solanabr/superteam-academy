import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const rate_limits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    window_start: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [index("rate_limits_key_idx").on(t.key), index("rate_limits_window_start_idx").on(t.window_start)],
);

