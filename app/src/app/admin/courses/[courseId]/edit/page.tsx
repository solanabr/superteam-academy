import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/drizzle/db"
import { CourseSectionTable, CourseTable, LessonTable, CourseFileTable, AssignmentTable as AssignmentDbTable, AssignmentSubmissionTable } from "@/drizzle/schema"
import { CourseForm } from "@/features/courses/components/CourseForm"
import { getCourseIdTag } from "@/features/courses/db/cache/courses"
import { SectionFormDialog } from "@/features/courseSections/components/SectionFormDialog"
import { SortableSectionList } from "@/features/courseSections/components/SortableSectionList"
import { getCourseSectionCourseTag } from "@/features/courseSections/db/cache"
import { LessonFormDialog } from "@/features/lessons/components/LessonFormDialog"
import { SortableLessonList } from "@/features/lessons/components/SortableLessonList"
import { getLessonCourseTag } from "@/features/lessons/db/cache/lessons"
import { R2FileUploadForm } from "@/features/courses/components/R2FileUploadForm"
import { CourseFilesList } from "@/features/courses/components/CourseFilesList"
import { QuizTable } from "@/features/quizzes/components/QuizTable"
import { getAssignmentCourseTag } from "@/features/quizzes/db/cache/quizzes"
import { cn } from "@/lib/utils"
import { asc, eq, sql } from "drizzle-orm"
import { EyeClosed, PlusIcon } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (course == null) return notFound()

  return (
    <div className="container my-6">
      <PageHeader title={course.name} />
        <Tabs defaultValue="lessons">
          <TabsList>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="assignments">Quiz</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

        <TabsContent value="lessons" className="flex flex-col gap-2">
          <Card>
            <CardHeader className="flex items-center flex-row justify-between">
              <CardTitle>Sections</CardTitle>
              <SectionFormDialog courseId={course.id}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PlusIcon /> New Section
                  </Button>
                </DialogTrigger>
              </SectionFormDialog>
            </CardHeader>
            <CardContent>
              <SortableSectionList
                courseId={course.id}
                sections={course.courseSections}
              />
            </CardContent>
          </Card>
          <hr className="my-2" />
          {course.courseSections.map(section => (
            <Card key={section.id}>
              <CardHeader className="flex items-center flex-row justify-between gap-4">
                <CardTitle
                  className={cn(
                    "flex items-center gap-2",
                    section.status === "private" && "text-muted-foreground"
                  )}
                >
                  {section.status === "private" && <EyeClosed />} {section.name}
                </CardTitle>
                <LessonFormDialog
                  defaultSectionId={section.id}
                  sections={course.courseSections}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <PlusIcon /> New Lesson
                    </Button>
                  </DialogTrigger>
                </LessonFormDialog>
              </CardHeader>
              <CardContent>
                <SortableLessonList
                  sections={course.courseSections}
                  lessons={section.lessons}
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader className="flex items-center flex-row justify-between">
              <CardTitle>Quiz</CardTitle>
              <Button asChild>
                <Link href={`/admin/courses/${course.id}/quizzes/new`}>
                  <PlusIcon className="mr-1" /> New Quiz
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <QuizTable
                quizzes={course.assignments || []}
                courseId={course.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Course Files</CardTitle>
            </CardHeader>
            <CardContent>
              <R2FileUploadForm 
                courseId={course.id}
                sections={course.courseSections}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseFilesList courseId={course.id} files={course.courseFiles || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CourseForm course={course} />
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function getCourse(id: string) {
  "use cache"
  cacheTag(
    getCourseIdTag(id),
    getCourseSectionCourseTag(id),
    getLessonCourseTag(id),
    getAssignmentCourseTag(id)
  )

  const course = await db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, id),
    with: {
      courseSections: {
        orderBy: asc(CourseSectionTable.order),
        with: {
          lessons: {
            orderBy: asc(LessonTable.order),
          },
        },
      },
      courseFiles: {
        orderBy: asc(CourseFileTable.order),
      },
      assignments: {
        orderBy: asc(AssignmentDbTable.order),
        with: {
          section: true,
        },
      },
    },
  })

  if (!course) return null

  // Get submission counts for each assignment
  const assignmentsWithCounts = await Promise.all(
    (course.assignments || []).map(async (assignment) => {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(AssignmentSubmissionTable)
        .where(eq(AssignmentSubmissionTable.assignmentId, assignment.id))
      return {
        ...assignment,
        submissionsCount: result?.count || 0,
      }
    })
  )

  return {
    ...course,
    assignments: assignmentsWithCounts,
  }
}
