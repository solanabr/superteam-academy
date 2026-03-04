"use server"

import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { revalidateUserCache } from "../db/cache"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"
import { canAccessAdminPages } from "@/permissions/general"

export async function deleteUserAction(userId: string) {
  const currentUser = await getCurrentUser()
  if (!canAccessAdminPages(currentUser)) {
    return {
      error: true,
      message: "Unauthorized",
    }
  }

  try {
    const [deletedUser] = await db
      .update(UserTable)
      .set({
        deletedAt: new Date(),
        email: `deleted+${userId}@deleted.local`,
        name: "Deleted User",
        image: null,
        walletAddress: null,
      })
      .where(eq(UserTable.id, userId))
      .returning()

    if (deletedUser == null) {
      return {
        error: true,
        message: "Failed to delete user"
      }
    }

    revalidateUserCache(userId)
    
    return {
      error: false,
      message: "User deleted successfully"
    }
  } catch {
    return {
      error: true,
      message: "An error occurred while deleting the user"
    }
  }
}

export async function deleteUserAndRedirect(userId: string) {
  const result = await deleteUserAction(userId)
  
  if (!result.error) {
    redirect("/admin/users")
  }
  
  return result
}
