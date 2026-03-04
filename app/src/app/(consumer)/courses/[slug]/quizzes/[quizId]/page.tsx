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
import { SubmissionUploadForm } from "@/features/quizzes/components/SubmissionUploadForm"
import { QuizTakeForm } from "@/features/quizzes/components/QuizTakeForm"
import { parseQuizConfig } from "@/features/quizzes/lib/quiz"
import {
  getAssignmentIdTag,
  getSubmissionUserTag,
} from "@/features/quizzes/db/cache/quizzes"
import { and, eq, or } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ClockIcon,
  CheckCircleIcon,
  FileIcon,
  ArrowLeftIcon,
  CalendarIcon,
  AwardIcon,
} from "lucide-react"

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ slug: string; quizId: string }>
}) {
  const { slug, quizId } = await params
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

  const assignment = await getAssignment(quizId, course.id)
  if (!assignment || assignment.status !== "published") {
    return notFound()
  }

  const submission = await getSubmission(quizId, user.id)
  const quizConfig = parseQuizConfig(assignment.instructions ?? null)

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isOverdue =
    assignment.dueDate && new Date(assignment.dueDate) < new Date()
  const canSubmit =
    !isOverdue || assignment.allowLateSubmissions || submission !== null

  return (
    <div className="container my-6">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${slug}`}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
      </div>

      <PageHeader title={assignment.name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizConfig ? (
                quizConfig.intro ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {quizConfig.intro}
                  </p>
                ) : assignment.description ? (
                  <p className="text-muted-foreground">{assignment.description}</p>
                ) : (
                  <p className="text-muted-foreground">No description provided.</p>
                )
              ) : assignment.instructions ? (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-muted-foreground">
                  {assignment.instructions}
                </div>
              ) : assignment.description ? (
                <p className="text-muted-foreground">{assignment.description}</p>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
              {quizConfig?.timeLimitMinutes && (
                <div className="text-sm text-muted-foreground">
                  Time limit: {quizConfig.timeLimitMinutes} minutes
                </div>
              )}
              {quizConfig?.passingScore !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Passing score: {quizConfig.passingScore}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Quiz XP: {assignment.xpReward ?? 0}
              </div>
            </CardContent>
          </Card>

          {canSubmit ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {submission ? "Your Submission" : "Take Quiz"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quizConfig ? (
                    <QuizTakeForm
                    assignmentId={quizId}
                    quizConfig={quizConfig}
                    existingSubmission={submission}
                    canSubmit={canSubmit}
                  />
                ) : (
                  <SubmissionUploadForm
                    assignmentId={quizId}
                    existingSubmission={submission}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-red-500 font-semibold">
                  This quiz is past due and does not accept late submissions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiz Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={`font-medium ${isOverdue ? "text-red-500" : ""}`}>
                    {formatDate(assignment.dueDate)}
                    {isOverdue && " (Overdue)"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AwardIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Max Score</p>
                  <p className="font-medium">{assignment.maxScore} points</p>
                </div>
              </div>

              {assignment.allowLateSubmissions && (
                <Badge variant="outline" className="mt-2">
                  Late submissions allowed
                </Badge>
              )}
            </CardContent>
          </Card>

          {submission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {submission.status === "graded" ? (
                    <Badge className="bg-green-500">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Graded
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                </div>

                {submission.submittedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                  </div>
                )}

                {submission.fileName && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm truncate">{submission.fileName}</span>
                  </div>
                )}

                {submission.status === "graded" && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {submission.score} / {assignment.maxScore}
                      </p>
                    </div>

                    {submission.feedback && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Feedback</p>
                        <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                          {submission.feedback}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
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

async function getAssignment(id: string, courseId: string) {
  "use cache"
  cacheTag(getAssignmentIdTag(id))

  return db.query.AssignmentTable.findFirst({
    where: and(eq(AssignmentTable.id, id), eq(AssignmentTable.courseId, courseId)),
    with: {
      course: { columns: { id: true, name: true } },
    },
  })
}

async function getSubmission(assignmentId: string, userId: string) {
  "use cache"
  cacheTag(getSubmissionUserTag(userId))

  return db.query.AssignmentSubmissionTable.findFirst({
    where: and(
      eq(AssignmentSubmissionTable.assignmentId, assignmentId),
      eq(AssignmentSubmissionTable.userId, userId)
    ),
  })
}
