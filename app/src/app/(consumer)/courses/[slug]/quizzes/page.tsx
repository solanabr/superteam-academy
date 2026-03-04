import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/drizzle/db"
import {
  AssignmentTable,
  AssignmentSubmissionTable,
  CourseTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
import { getCurrentUser } from "@/lib/current-user"
import { isUuid } from "@/lib/is-uuid"
import { getAssignmentCourseTag } from "@/features/quizzes/db/cache/quizzes"
import { and, asc, eq, or } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ClockIcon, CheckCircleIcon, FileTextIcon } from "lucide-react"

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await getCurrentUser()
  const whereCourse = isUuid(slug)
    ? or(eq(CourseTable.slug, slug), eq(CourseTable.id, slug))
    : eq(CourseTable.slug, slug)

  if (!user?.id) {
    redirect("/sign-in")
  }

  const course = await db.query.CourseTable.findFirst({
    where: whereCourse,
    columns: { id: true, name: true },
  })
  if (!course) return notFound()

  const hasAccess = await checkCourseAccess(user.id, course.id)
  if (!hasAccess) return notFound()

  const assignments = await getAssignmentsWithSubmissions(course.id, user.id)

  const formatDueDate = (date: Date | null) => {
    if (!date) return "No due date"
    const now = new Date()
    const dueDate = new Date(date)
    const isOverdue = dueDate < now

    return (
      <span className={isOverdue ? "text-red-500" : ""}>
        {dueDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {isOverdue && " (Overdue)"}
      </span>
    )
  }

  const getStatusBadge = (submission: any) => {
    if (!submission) {
      return <Badge variant="outline">Not Submitted</Badge>
    }
    if (submission.status === "graded") {
      return (
        <Badge className="bg-green-500">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Graded: {submission.score}/{submission.maxScore}
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-500">
        <ClockIcon className="h-3 w-3 mr-1" />
        Submitted
      </Badge>
    )
  }

  return (
    <div className="container my-6">
      <PageHeader title={`${course.name} - Quiz`} />

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quizzes available for this course yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{assignment.name}</CardTitle>
                {getStatusBadge(assignment.submission)}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    {assignment.description && (
                      <p className="text-muted-foreground text-sm">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Due: {formatDueDate(assignment.dueDate)}
                      </span>
                      <span className="text-muted-foreground">
                        Max Score: {assignment.maxScore}
                      </span>
                      <span className="text-muted-foreground">
                        Quiz XP: {assignment.xpReward ?? 0}
                      </span>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/courses/${slug}/quizzes/${assignment.id}`}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {assignment.submission ? "View Submission" : "Take Quiz"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

async function checkCourseAccess(userId: string, courseId: string) {
  const access = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, userId),
      eq(UserCourseAccessTable.courseId, courseId)
    ),
  })
  return !!access
}

async function getAssignmentsWithSubmissions(courseId: string, userId: string) {
  "use cache"
  cacheTag(getAssignmentCourseTag(courseId))

  const assignments = await db.query.AssignmentTable.findMany({
    where: and(
      eq(AssignmentTable.courseId, courseId),
      eq(AssignmentTable.status, "published")
    ),
    orderBy: [asc(AssignmentTable.order), asc(AssignmentTable.createdAt)],
  })

  const assignmentsWithSubmissions = await Promise.all(
    assignments.map(async (assignment) => {
      const submission = await db.query.AssignmentSubmissionTable.findFirst({
        where: and(
          eq(AssignmentSubmissionTable.assignmentId, assignment.id),
          eq(AssignmentSubmissionTable.userId, userId)
        ),
      })
      return {
        ...assignment,
        submission: submission
          ? { ...submission, maxScore: assignment.maxScore }
          : null,
      }
    })
  )

  return assignmentsWithSubmissions
}
