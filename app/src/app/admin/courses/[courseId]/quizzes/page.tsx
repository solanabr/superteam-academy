import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { AssignmentTable as AssignmentDbTable, AssignmentSubmissionTable, CourseTable } from "@/drizzle/schema"
import { QuizTable } from "@/features/quizzes/components/QuizTable"
import { getAssignmentCourseTag } from "@/features/quizzes/db/cache/quizzes"
import { asc, eq, sql } from "drizzle-orm"
import { PlusIcon } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (course == null) return notFound()

  const assignments = await getAssignments(courseId)

  return (
    <div className="container my-6">
      <PageHeader title={`${course.name} - Quiz`} />
      <Card>
        <CardHeader className="flex items-center flex-row justify-between">
          <CardTitle>Quiz</CardTitle>
          <Button asChild>
            <Link href={`/admin/courses/${courseId}/quizzes/new`}>
              <PlusIcon className="mr-1" /> New Quiz
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <QuizTable quizzes={assignments} courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  )
}

async function getCourse(id: string) {
  "use cache"
  cacheTag(getAssignmentCourseTag(id))

  return db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, id),
    columns: {
      id: true,
      name: true,
    },
  })
}

async function getAssignments(courseId: string) {
  "use cache"
  cacheTag(getAssignmentCourseTag(courseId))

  const assignments = await db
    .select({
      id: AssignmentDbTable.id,
      name: AssignmentDbTable.name,
      status: AssignmentDbTable.status,
      dueDate: AssignmentDbTable.dueDate,
      maxScore: AssignmentDbTable.maxScore,
      order: AssignmentDbTable.order,
      submissionsCount: sql<number>`count(${AssignmentSubmissionTable.id})::int`,
    })
    .from(AssignmentDbTable)
    .leftJoin(
      AssignmentSubmissionTable,
      eq(AssignmentDbTable.id, AssignmentSubmissionTable.assignmentId)
    )
    .where(eq(AssignmentDbTable.courseId, courseId))
    .groupBy(AssignmentDbTable.id)
    .orderBy(asc(AssignmentDbTable.order), asc(AssignmentDbTable.createdAt))

  // Get section info for each assignment
  const assignmentsWithSections = await Promise.all(
    assignments.map(async (assignment) => {
      const fullAssignment = await db.query.AssignmentTable.findFirst({
        where: eq(AssignmentDbTable.id, assignment.id),
        with: { section: true },
      })
      return {
        ...assignment,
        section: fullAssignment?.section ?? null,
      }
    })
  )

  return assignmentsWithSections
}
