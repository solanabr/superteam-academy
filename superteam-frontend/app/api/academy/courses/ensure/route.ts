import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/server/auth-adapter"
import { ensureCourseOnChain } from "@/lib/server/academy-program"
import { getCatalogCourseMeta } from "@/lib/server/academy-course-catalog"

type EnsureCourseBody = {
  slug?: string
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as EnsureCourseBody
  const slug = body.slug?.trim()
  if (!slug) {
    return NextResponse.json({ error: "Course slug is required." }, { status: 400 })
  }

  const meta = getCatalogCourseMeta(slug)
  if (!meta) {
    return NextResponse.json({ error: "Unknown course slug." }, { status: 404 })
  }

  const coursePda = await ensureCourseOnChain(meta.slug, meta.lessonsCount, meta.trackId)
  return NextResponse.json(
    {
      ok: true,
      coursePda: coursePda.toBase58(),
      lessonsCount: meta.lessonsCount,
      trackId: meta.trackId,
    },
    { status: 200 },
  )
}
