import { auth } from "@/lib/auth"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { cache } from "react"

export type CurrentUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: "user" | "admin"
  username: string | null
  bio: string | null
  xp: number
  streak: number
  walletAddress: string | null
  websiteUrl: string | null
  twitterHandle: string | null
  githubHandle: string | null
  isProfilePublic: boolean
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      username: true,
      bio: true,
      xp: true,
      streak: true,
      walletAddress: true,
      websiteUrl: true,
      twitterHandle: true,
      githubHandle: true,
      isProfilePublic: true,
    },
  })

  return user ?? null
})

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}
