import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { count, eq } from "drizzle-orm"
import { ArrowLeft, BookOpen, CheckCircle, FileText, GraduationCap } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const student = await getStudent(userId)

  if (!student) return notFound()

  const courseProgress = await getStudentCourseProgress(userId)
  const submissions = await getStudentSubmissions(userId)

  const totalLessonsCompleted = courseProgress.reduce(
    (sum, c) => sum + c.lessonsCompleted,
    0
  )
  const totalSubmissions = submissions.length
  const gradedSubmissions = submissions.filter((s) => s.status === "graded")
  const avgScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce(
          (sum, s) => sum + ((s.score ?? 0) / s.maxScore) * 100,
          0
        ) / gradedSubmissions.length
      : null

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

      <PageHeader title={`Student: ${student.name}`} />
      <p className="text-muted-foreground mb-6">{student.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{courseProgress.length}</div>
                <p className="text-sm text-muted-foreground">Courses Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalLessonsCompleted}</div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {avgScore !== null ? `${avgScore.toFixed(0)}%` : "-"}
                </div>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Lessons Completed</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Quizzes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseProgress.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Not enrolled in any courses
                    </TableCell>
                  </TableRow>
                ) : (
                  courseProgress.map((course) => {
                    const progress = course.totalLessons > 0
                      ? (course.lessonsCompleted / course.totalLessons) * 100
                      : 0
                    return (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>
                          {course.lessonsCompleted} / {course.totalLessons}
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
                          {course.submittedAssignments} / {course.totalAssignments}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No submissions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.assignmentName}
                      </TableCell>
                      <TableCell>{submission.courseName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === "graded"
                              ? "default"
                              : submission.status === "submitted"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.status === "graded" ? (
                          <span>
                            {submission.score} / {submission.maxScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function getStudent(id: string) {
  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
    },
  })
}

async function getStudentCourseProgress(userId: string) {
  const enrollments = await db
    .select({
      courseId: UserCourseAccessTable.courseId,
      courseName: CourseTable.name,
    })
    .from(UserCourseAccessTable)
    .innerJoin(CourseTable, eq(UserCourseAccessTable.courseId, CourseTable.id))
    .where(eq(UserCourseAccessTable.userId, userId))

  const courseProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Get total lessons for this course
      const [lessonsData] = await db
        .select({ count: count(LessonTable.id) })
        .from(LessonTable)
        .innerJoin(
          CourseSectionTable,
          eq(LessonTable.sectionId, CourseSectionTable.id)
        )
        .where(eq(CourseSectionTable.courseId, enrollment.courseId))

      const totalLessons = lessonsData?.count ?? 0

      // Get lesson IDs for this course
      const courseLessons = await db
        .select({ id: LessonTable.id })
        .from(LessonTable)
        .innerJoin(
          CourseSectionTable,
          eq(LessonTable.sectionId, CourseSectionTable.id)
        )
        .where(eq(CourseSectionTable.courseId, enrollment.courseId))

      const lessonIds = courseLessons.map((l) => l.id)

      // Count completed lessons for this course by this user
      let lessonsCompleted = 0
      if (lessonIds.length > 0) {
        const userCompletedLessons = await db
          .select({ lessonId: UserLessonCompleteTable.lessonId })
          .from(UserLessonCompleteTable)
          .where(eq(UserLessonCompleteTable.userId, userId))

        lessonsCompleted = userCompletedLessons.filter((c) =>
          lessonIds.includes(c.lessonId)
        ).length
      }

      // Get assignments for this course
      const [assignmentsData] = await db
        .select({ count: count(AssignmentTable.id) })
        .from(AssignmentTable)
        .where(eq(AssignmentTable.courseId, enrollment.courseId))

      const totalAssignments = assignmentsData?.count ?? 0

      // Get submissions for this course's assignments
      const [submissionsData] = await db
        .select({ count: count(AssignmentSubmissionTable.id) })
        .from(AssignmentSubmissionTable)
        .innerJoin(
          AssignmentTable,
          eq(AssignmentSubmissionTable.assignmentId, AssignmentTable.id)
        )
        .where(eq(AssignmentSubmissionTable.userId, userId))

      return {
        id: enrollment.courseId,
        name: enrollment.courseName,
        totalLessons,
        lessonsCompleted,
        totalAssignments,
        submittedAssignments: submissionsData?.count ?? 0,
      }
    })
  )

  return courseProgress
}

async function getStudentSubmissions(userId: string) {
  const submissions = await db
    .select({
      id: AssignmentSubmissionTable.id,
      status: AssignmentSubmissionTable.status,
      score: AssignmentSubmissionTable.score,
      submittedAt: AssignmentSubmissionTable.submittedAt,
      assignmentName: AssignmentTable.name,
      maxScore: AssignmentTable.maxScore,
      courseId: AssignmentTable.courseId,
    })
    .from(AssignmentSubmissionTable)
    .innerJoin(
      AssignmentTable,
      eq(AssignmentSubmissionTable.assignmentId, AssignmentTable.id)
    )
    .where(eq(AssignmentSubmissionTable.userId, userId))

  // Get course names
  const courseIds = [...new Set(submissions.map((s) => s.courseId))]
  const courses = await db
    .select({ id: CourseTable.id, name: CourseTable.name })
    .from(CourseTable)

  const courseMap = new Map(courses.map((c) => [c.id, c.name]))

  return submissions.map((s) => ({
    ...s,
    courseName: courseMap.get(s.courseId) ?? "Unknown",
  }))
}
