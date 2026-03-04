import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { CourseTable, CourseSectionTable } from "@/drizzle/schema"
import { QuizForm } from "@/features/quizzes/components/QuizForm"
import { asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"

export default async function NewQuizPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (course == null) return notFound()

  return (
    <div className="container my-6">
      <PageHeader title={`New Quiz - ${course.name}`} />
      <Card>
        <CardHeader>
          <CardTitle>Create Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizForm
            courseId={courseId}
            sections={course.courseSections}
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
