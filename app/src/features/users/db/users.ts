import { db } from '@/drizzle/db'
import { UserTable } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { revalidateUserCache } from './cache'

export async function insertUser(data: typeof UserTable.$inferInsert) {
  const [newUser] = await db
    .insert(UserTable)
    .values(data)
    .returning()
    .onConflictDoUpdate({
      target: [UserTable.email],
      set: { name: data.name, image: data.image, updatedAt: new Date() },
    })

  if (newUser == null) throw new Error("Failed to create user")
  revalidateUserCache(newUser.id)

  return newUser
}

export async function updateUser(
  { id }: { id: string },
  data: Partial<typeof UserTable.$inferInsert>
) {
  const [updatedUser] = await db
    .update(UserTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(UserTable.id, id))
    .returning()

  if (updatedUser == null) throw new Error("Failed to update user")
  revalidateUserCache(updatedUser.id)

  return updatedUser
}

export async function deleteUser({ id }: { id: string }) {
  const [deletedUser] = await db
    .update(UserTable)
    .set({
      deletedAt: new Date(),
      email: `deleted+${id}@deleted.local`,
      name: "Deleted User",
      image: null,
      walletAddress: null,
    })
    .where(eq(UserTable.id, id))
    .returning()

  if (deletedUser == null) throw new Error("Failed to delete user")
  revalidateUserCache(deletedUser.id)

  return deletedUser
}
