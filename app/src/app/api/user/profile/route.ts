import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { and, eq, ne } from "drizzle-orm"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).nullable().optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/)
    .nullable()
    .optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  twitterHandle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{1,15}$/)
    .nullable()
    .optional(),
  githubHandle: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{1,39}$/)
    .nullable()
    .optional(),
  websiteUrl: z
    .string()
    .trim()
    .url()
    .max(300)
    .nullable()
    .optional(),
  isProfilePublic: z.boolean().optional(),
})

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, session.user.id),
    columns: {
      name: true,
      username: true,
      bio: true,
      twitterHandle: true,
      githubHandle: true,
      websiteUrl: true,
      isProfilePublic: true,
      walletAddress: true,
    },
  })

  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const input = json as Record<string, unknown>
  const normalized: Record<string, string | boolean | null | undefined> = {
    name: input.name === undefined ? undefined : emptyToNull(input.name as string | null | undefined),
    username:
      input.username === undefined
        ? undefined
        : emptyToNull(input.username as string | null | undefined)?.replace(/^@+/, ""),
    bio: input.bio === undefined ? undefined : emptyToNull(input.bio as string | null | undefined),
    twitterHandle:
      input.twitterHandle === undefined
        ? undefined
        : emptyToNull(input.twitterHandle as string | null | undefined)?.replace(/^@+/, ""),
    githubHandle:
      input.githubHandle === undefined ? undefined : emptyToNull(input.githubHandle as string | null | undefined),
    websiteUrl:
      input.websiteUrl === undefined ? undefined : emptyToNull(input.websiteUrl as string | null | undefined),
    isProfilePublic:
      input.isProfilePublic === undefined
        ? undefined
        : typeof input.isProfilePublic === "boolean"
          ? input.isProfilePublic
          : undefined,
  }

  const parsed = updateSchema.safeParse(normalized)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid profile fields",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  if (parsed.data.username) {
    const existing = await db.query.UserTable.findFirst({
      where: and(
        eq(UserTable.username, parsed.data.username),
        ne(UserTable.id, session.user.id)
      ),
      columns: { id: true },
    })

    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 })
    }
  }

  const setData: {
    name?: string | null
    username?: string | null
    bio?: string | null
    twitterHandle?: string | null
    githubHandle?: string | null
    websiteUrl?: string | null
    isProfilePublic?: boolean
  } = {}

  if (parsed.data.name !== undefined) setData.name = parsed.data.name
  if (parsed.data.username !== undefined) setData.username = parsed.data.username
  if (parsed.data.bio !== undefined) setData.bio = parsed.data.bio
  if (parsed.data.twitterHandle !== undefined) setData.twitterHandle = parsed.data.twitterHandle
  if (parsed.data.githubHandle !== undefined) setData.githubHandle = parsed.data.githubHandle
  if (parsed.data.websiteUrl !== undefined) setData.websiteUrl = parsed.data.websiteUrl
  if (parsed.data.isProfilePublic !== undefined) setData.isProfilePublic = parsed.data.isProfilePublic

  if (Object.keys(setData).length === 0) {
    return NextResponse.json({ error: "No profile fields to update" }, { status: 400 })
  }

  await db
    .update(UserTable)
    .set(setData)
    .where(eq(UserTable.id, session.user.id))

  return NextResponse.json({ success: true })
}
