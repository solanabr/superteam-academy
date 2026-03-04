import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { CourseFileTable, UserCourseAccessTable } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { r2Client } from "@/lib/r2"
import { GetObjectCommand } from "@aws-sdk/client-s3"
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
      return new NextResponse("Unauthorized", { status: 401 })
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
        return new NextResponse("Forbidden", { status: 403 })
      }
    }

    const file = await db.query.CourseFileTable.findFirst({
      where: and(
        eq(CourseFileTable.id, fileId),
        eq(CourseFileTable.courseId, courseId)
      ),
    })

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    if (!isAdmin && file.status === "private") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: file.storageKey,
    })

    const response = await r2Client.send(command)

    if (!response.Body) {
      return new NextResponse("File empty", { status: 404 })
    }


    return new NextResponse(response.Body as ReadableStream, {
      headers: {
        "Content-Type": response.ContentType || "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
        "Content-Length": response.ContentLength?.toString() || "",
      },
    })

  } catch (error) {
    console.error("View error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
