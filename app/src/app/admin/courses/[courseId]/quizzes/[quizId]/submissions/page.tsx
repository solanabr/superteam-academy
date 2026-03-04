import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { AssignmentTable, AssignmentSubmissionTable } from "@/drizzle/schema"
import { SubmissionsList } from "@/features/quizzes/components/SubmissionsList"
import {
  getAssignmentIdTag,
  getSubmissionAssignmentTag,
} from "@/features/quizzes/db/cache/quizzes"
import { desc, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound } from "next/navigation"

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>
}) {
  const { courseId, quizId } = await params
  const assignment = await getAssignment(quizId)

  if (assignment == null) return notFound()

  const submissions = await getSubmissions(quizId)

  return (
    <div className="container my-6">
      <PageHeader title={`Quiz Submissions: ${assignment.name}`} />
      <Card>
        <CardHeader>
          <CardTitle>Quiz Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionsList
            submissions={submissions}
            courseId={courseId}
            assignmentId={quizId}
            maxScore={assignment.maxScore}
          />
        </CardContent>
      </Card>
    </div>
  )
}

async function getAssignment(id: string) {
  "use cache"
  cacheTag(getAssignmentIdTag(id))

  return db.query.AssignmentTable.findFirst({
    where: eq(AssignmentTable.id, id),
    columns: {
      id: true,
      name: true,
      maxScore: true,
    },
  })
}

async function getSubmissions(assignmentId: string) {
  "use cache"
  cacheTag(getSubmissionAssignmentTag(assignmentId))

  return db.query.AssignmentSubmissionTable.findMany({
    where: eq(AssignmentSubmissionTable.assignmentId, assignmentId),
    orderBy: desc(AssignmentSubmissionTable.submittedAt),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}
