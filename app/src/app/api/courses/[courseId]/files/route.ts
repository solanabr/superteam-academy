import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { CourseFileTable, UserCourseAccessTable } from "@/drizzle/schema"
import { and, eq, or } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { getCourseIdTag } from "@/features/courses/db/cache/courses"
import { canCreateCourses } from "@/features/courses/permissions/courses"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canCreateCourses(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { courseId } = await params
    const body = await request.json()

    const {
      name,
      description,
      storageKey,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      mimeType,
      order,
      status,
      sectionId,
      downloadable,
    } = body

    const [file] = await db
      .insert(CourseFileTable)
      .values({
        courseId,
        sectionId: sectionId || null,
        name,
        description,
        storageKey,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        mimeType,
        order: order ?? 0,
        status: status ?? "private",
        downloadable: downloadable ?? false,
      })
      .returning()

    revalidateTag(getCourseIdTag(courseId))

    return NextResponse.json({ success: true, file })
  } catch (error) {
    console.error("Create file error:", error)
    return NextResponse.json(
      { error: "Failed to create file record" },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { courseId } = await params

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = canCreateCourses(user)
    if (!isAdmin) {
      const access = await db.query.UserCourseAccessTable.findFirst({
        where: and(
          eq(UserCourseAccessTable.userId, user.id),
          eq(UserCourseAccessTable.courseId, courseId)
        ),
        columns: { userId: true },
      })
      if (!access) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const files = await db.query.CourseFileTable.findMany({
      where: isAdmin
        ? eq(CourseFileTable.courseId, courseId)
        : and(
            eq(CourseFileTable.courseId, courseId),
            or(
              eq(CourseFileTable.status, "public"),
              eq(CourseFileTable.status, "preview")
            )
          ),
      columns: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        order: true,
        status: true,
        downloadable: true,
        sectionId: true,
      },
      orderBy: (files, { asc }) => [asc(files.order)],
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Get files error:", error)
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    )
  }
}
