import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { CourseFileTable, UserCourseAccessTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { getSignedDownloadUrl } from "@/lib/r2"
import { canCreateCourses } from "@/features/courses/permissions/courses"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; fileId: string }> }
) {
  try {
    const { courseId, fileId } = await params
    const user = await getCurrentUser()
    const userId = user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = canCreateCourses(user)
    if (!isAdmin) {
      const hasAccess = await db.query.UserCourseAccessTable.findFirst({
        where: and(
          eq(UserCourseAccessTable.userId, userId),
          eq(UserCourseAccessTable.courseId, courseId)
        ),
        columns: { userId: true },
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const file = await db.query.CourseFileTable.findFirst({
      where: and(
        eq(CourseFileTable.id, fileId),
        eq(CourseFileTable.courseId, courseId)
      ),
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (!isAdmin && file.downloadable !== true) {
      return NextResponse.json(
        { error: "File is not downloadable" },
        { status: 403 }
      )
    }

    if (!isAdmin && file.status === "private") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = await getSignedDownloadUrl(file.storageKey, 3600)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      { error: "Failed to get download URL" },
      { status: 500 }
    )
  }
}
