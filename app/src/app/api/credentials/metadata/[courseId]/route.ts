/**
 * GET /api/credentials/metadata/[courseId]
 *
 * Per-credential Metaplex Core NFT metadata.
 * Referenced as the `uri` field when issue_credential is called.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { CourseTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

const TRACK_ICONS: Record<string, string> = {
  fundamentals: "⚡",
  defi: "💱",
  nft: "🖼️",
  security: "🔒",
  frontend: "🎨",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, courseId),
    columns: { name: true, description: true, track: true, difficulty: true, xpReward: true, thumbnailUrl: true },
  })

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ?? "https://superteam-academy-brazil.vercel.app"

  const icon = TRACK_ICONS[course.track] ?? "🎓"

  return NextResponse.json({
    name: `${icon} ${course.name} — Superteam Brazil`,
    description: `Soulbound credential awarded for completing "${course.name}" on Superteam Brazil Academy. Track: ${course.track} | Difficulty: ${course.difficulty} | XP: ${course.xpReward}`,
    image: course.thumbnailUrl ?? `${baseUrl}/logo.png`,
    external_url: `${baseUrl}/courses`,
    attributes: [
      { trait_type: "Track", value: course.track },
      { trait_type: "Difficulty", value: course.difficulty },
      { trait_type: "XP Reward", value: course.xpReward },
      { trait_type: "Issuer", value: "Superteam Brazil" },
    ],
    properties: {
      category: "credential",
      soulbound: true,
    },
  })
}
