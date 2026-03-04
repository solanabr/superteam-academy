import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core"
import { id } from "../schemaHelpers"
import { relations } from "drizzle-orm"
import { UserTable } from "./user"

export const WalletAddressTable = pgTable("wallet_addresses", {
  id,
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  address: text().notNull().unique(),
  isPrimary: boolean().notNull().default(false),
  verifiedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const WalletAddressRelationships = relations(WalletAddressTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [WalletAddressTable.userId],
    references: [UserTable.id],
  }),
}))
