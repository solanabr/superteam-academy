import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { AssignmentTable, CourseTable, CourseSectionTable } from "@/drizzle/schema"
import { QuizForm } from "@/features/quizzes/components/QuizForm"
import { getAssignmentIdTag } from "@/features/quizzes/db/cache/quizzes"
import { asc, eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>
}) {
  const { courseId, quizId } = await params
  const [course, assignment] = await Promise.all([
    getCourse(courseId),
    getAssignment(quizId),
  ])

  if (course == null || assignment == null) return notFound()

  return (
    <div className="container my-6">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/courses/${courseId}/edit`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
        </Button>
      </div>
      <PageHeader title={`Edit Quiz: ${assignment.name}`} />
      <Card>
        <CardHeader>
          <CardTitle>Edit Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizForm
            courseId={courseId}
            sections={course.courseSections}
            assignment={assignment}
          />
        </CardContent>
      </Card>
    </div>
  )
}

async function getCourse(id: string) {
  return db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, id),
    columns: {
      id: true,
      name: true,
    },
    with: {
      courseSections: {
        orderBy: asc(CourseSectionTable.order),
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })
}

async function getAssignment(id: string) {
  "use cache"
  cacheTag(getAssignmentIdTag(id))

  return db.query.AssignmentTable.findFirst({
    where: eq(AssignmentTable.id, id),
  })
}
