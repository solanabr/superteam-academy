import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { CourseFileTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { deleteFromR2 } from "@/lib/r2"
import { revalidateTag } from "next/cache"
import { getCourseIdTag } from "@/features/courses/db/cache/courses"
import { canCreateCourses } from "@/features/courses/permissions/courses"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; fileId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canCreateCourses(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { courseId, fileId } = await params

    const file = await db.query.CourseFileTable.findFirst({
      where: and(
        eq(CourseFileTable.id, fileId),
        eq(CourseFileTable.courseId, courseId)
      ),
      columns: { id: true, storageKey: true },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await deleteFromR2(file.storageKey)

    await db
      .delete(CourseFileTable)
      .where(
        and(eq(CourseFileTable.id, fileId), eq(CourseFileTable.courseId, courseId))
      )

    revalidateTag(getCourseIdTag(courseId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
