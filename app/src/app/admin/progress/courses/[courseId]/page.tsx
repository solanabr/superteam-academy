import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { db } from "@/drizzle/db"
import {
  AssignmentSubmissionTable,
  AssignmentTable,
  CourseSectionTable,
  CourseTable,
  LessonTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  UserTable,
} from "@/drizzle/schema"
import { getCourseIdTag } from "@/features/courses/db/cache/courses"
import { count, eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CourseProgressPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (!course) return notFound()

  const students = await getCourseStudentProgress(courseId)
  const totalLessons = await getCourseLessonCount(courseId)

  return (
    <div className="container my-6">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/progress">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Progress
          </Link>
        </Button>
      </div>

      <PageHeader title={`Progress: ${course.name}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-muted-foreground">Enrolled Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalLessons}</div>
            <p className="text-muted-foreground">Total Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{course.assignments.length}</div>
            <p className="text-muted-foreground">Quizzes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Lessons Completed</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No students enrolled in this course
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const progress = totalLessons > 0
                    ? (student.lessonsCompleted / totalLessons) * 100
                    : 0
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {student.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.lessonsCompleted} / {totalLessons}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{progress.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.submittedAssignments} submitted
                          {student.gradedAssignments > 0 && (
                            <span className="text-muted-foreground">
                              {" "}({student.gradedAssignments} graded)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.avgScore !== null ? (
                          <Badge
                            className={
                              student.avgScore >= 70
                                ? "bg-green-500"
                                : student.avgScore >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }
                          >
                            {student.avgScore.toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/progress/students/${student.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

async function getCourse(id: string) {
  "use cache"
  cacheTag(getCourseIdTag(id))

  return db.query.CourseTable.findFirst({
    where: eq(CourseTable.id, id),
    columns: {
      id: true,
      name: true,
    },
    with: {
      assignments: {
        columns: { id: true },
      },
    },
  })
}

async function getCourseLessonCount(courseId: string) {
  const [data] = await db
    .select({ count: count(LessonTable.id) })
    .from(LessonTable)
    .innerJoin(
      CourseSectionTable,
      eq(LessonTable.sectionId, CourseSectionTable.id)
    )
    .where(eq(CourseSectionTable.courseId, courseId))

  return data?.count ?? 0
}

async function getCourseStudentProgress(courseId: string) {
  const enrollments = await db
    .select({
      userId: UserCourseAccessTable.userId,
      userName: UserTable.name,
      userEmail: UserTable.email,
    })
    .from(UserCourseAccessTable)
    .innerJoin(UserTable, eq(UserCourseAccessTable.userId, UserTable.id))
    .where(eq(UserCourseAccessTable.courseId, courseId))

  // Get lesson IDs for this course
  const courseLessons = await db
    .select({ id: LessonTable.id })
    .from(LessonTable)
    .innerJoin(
      CourseSectionTable,
      eq(LessonTable.sectionId, CourseSectionTable.id)
    )
    .where(eq(CourseSectionTable.courseId, courseId))

  const lessonIds = courseLessons.map((l) => l.id)

  // Get assignment IDs for this course
  const courseAssignments = await db
    .select({ id: AssignmentTable.id, maxScore: AssignmentTable.maxScore })
    .from(AssignmentTable)
    .where(eq(AssignmentTable.courseId, courseId))

  const assignmentIds = courseAssignments.map((a) => a.id)

  const studentProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Count completed lessons for this course
      let lessonsCompleted = 0
      if (lessonIds.length > 0) {
        const completedData = await db
          .select({ count: count(UserLessonCompleteTable.lessonId) })
          .from(UserLessonCompleteTable)
          .where(eq(UserLessonCompleteTable.userId, enrollment.userId))

        // Filter to only count lessons in this course
        const userCompletedLessons = await db
          .select({ lessonId: UserLessonCompleteTable.lessonId })
          .from(UserLessonCompleteTable)
          .where(eq(UserLessonCompleteTable.userId, enrollment.userId))

        lessonsCompleted = userCompletedLessons.filter((c) =>
          lessonIds.includes(c.lessonId)
        ).length
      }

      // Get submissions for this course's assignments
      let submissions: { status: string; score: number | null; maxScore: number }[] = []
      if (assignmentIds.length > 0) {
        submissions = await db
          .select({
            status: AssignmentSubmissionTable.status,
            score: AssignmentSubmissionTable.score,
            maxScore: AssignmentTable.maxScore,
          })
          .from(AssignmentSubmissionTable)
          .innerJoin(
            AssignmentTable,
            eq(AssignmentSubmissionTable.assignmentId, AssignmentTable.id)
          )
          .where(eq(AssignmentSubmissionTable.userId, enrollment.userId))
      }

      const gradedSubmissions = submissions.filter((s) => s.status === "graded")
      const avgScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce(
              (sum, s) => sum + ((s.score ?? 0) / s.maxScore) * 100,
              0
            ) / gradedSubmissions.length
          : null

      return {
        id: enrollment.userId,
        name: enrollment.userName,
        email: enrollment.userEmail,
        lessonsCompleted,
        submittedAssignments: submissions.length,
        gradedAssignments: gradedSubmissions.length,
        avgScore,
      }
    })
  )

  return studentProgress
}
