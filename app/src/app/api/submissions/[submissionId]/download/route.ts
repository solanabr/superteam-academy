import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import { AssignmentSubmissionTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getSignedDownloadUrl } from "@/lib/r2"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params
  const user = await getCurrentUser()
  const userId = user?.id

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the submission
  const submission = await db.query.AssignmentSubmissionTable.findFirst({
    where: eq(AssignmentSubmissionTable.id, submissionId),
    columns: {
      id: true,
      userId: true,
      storageKey: true,
      fileName: true,
    },
  })

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  // Check if user is admin or the submission owner
  const isAdmin = user?.role === "admin"
  const isOwner = submission.userId === userId

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!submission.storageKey) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 })
  }

  try {
    // Generate a signed URL valid for 1 hour
    const signedUrl = await getSignedDownloadUrl(submission.storageKey, 3600)

    return NextResponse.json({ url: signedUrl, fileName: submission.fileName })
  } catch (error) {
    console.error("Failed to generate download URL:", error)
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    )
  }
}
