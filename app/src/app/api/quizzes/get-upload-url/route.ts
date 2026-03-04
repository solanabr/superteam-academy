import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { getPresignedUploadUrl } from "@/lib/r2"

function generateSubmissionStorageKey(
  assignmentId: string,
  userId: string,
  fileName: string
): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `assignments/${assignmentId}/${userId}/${timestamp}-${sanitizedFileName}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const userId = user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileName, fileType, assignmentId, fileSize } = await request.json()

    // Validate file size (50MB max)
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (Max 50MB)" }, { status: 400 })
    }

    if (!assignmentId || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate the unique key for R2
    const key = generateSubmissionStorageKey(assignmentId, userId, fileName)

    // Generate the temporary PUT URL (valid for 60 seconds)
    const uploadUrl = await getPresignedUploadUrl(key, fileType)

    return NextResponse.json({
      uploadUrl,
      key,
      fileUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    })
  } catch (error) {
    console.error("Get upload URL error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
