import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/drizzle/db"
import { AssignmentSubmissionTable } from "@/drizzle/schema"
import { GradingForm } from "@/features/quizzes/components/GradingForm"
import { SubmissionFileViewer } from "@/features/quizzes/components/SubmissionFileViewer"
import { parseQuizConfig, parseQuizSubmission } from "@/features/quizzes/lib/quiz"
import { getSubmissionIdTag } from "@/features/quizzes/db/cache/quizzes"
import { eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound } from "next/navigation"

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string; submissionId: string }>
}) {
  const { submissionId } = await params
  const submission = await getSubmission(submissionId)

  if (submission == null) return notFound()

  const quizConfig = parseQuizConfig(submission.assignment.instructions ?? null)
  const quizSubmission = parseQuizSubmission(submission.textContent ?? null)

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container my-6">
      <PageHeader title={`Submission from ${submission.user.name}`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Details */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Quiz</p>
              <p className="font-semibold">{submission.assignment.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="font-semibold">{submission.assignment.course.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-semibold">{submission.user.name}</p>
              <p className="text-sm text-muted-foreground">{submission.user.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Submitted At</p>
              <p className="font-semibold">{formatDate(submission.submittedAt)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  submission.status === "graded"
                    ? "bg-green-500"
                    : submission.status === "submitted"
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }
              >
                {submission.status}
              </Badge>
            </div>

            {submission.fileName && submission.storageKey && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Submitted File</p>
                <SubmissionFileViewer
                  submissionId={submission.id}
                  fileName={submission.fileName}
                />
              </div>
            )}

            {quizConfig && quizSubmission ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Quiz Results</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">
                    Score: {quizSubmission.score}/{quizSubmission.maxScore}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {quizSubmission.percentage}% correct
                  </span>
                </div>
                <div className="space-y-4">
                  {quizConfig.questions.map((question, index) => {
                    const answerId = quizSubmission.answers[question.id]
                    const selected = question.options.find((o) => o.id === answerId)
                    const correct = question.options.find(
                      (o) => o.id === question.correctOptionId
                    )
                    const isCorrect = answerId === question.correctOptionId

                    return (
                      <div key={question.id} className="border rounded-lg p-3">
                        <p className="text-sm font-medium">
                          {index + 1}. {question.prompt}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Points: {question.points}
                        </div>
                        <div className="mt-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Selected: </span>
                            {selected?.text ?? "No answer"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Correct: </span>
                            {correct?.text ?? "Unknown"}
                          </p>
                          <p className={isCorrect ? "text-green-600" : "text-red-500"}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : submission.textContent ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Text Submission</p>
                <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {submission.textContent}
                </div>
              </div>
            ) : null}

            {submission.status === "graded" && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="font-semibold text-lg">
                    {submission.score} / {submission.assignment.maxScore}
                  </p>
                </div>

                {submission.feedback && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Feedback</p>
                    <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap">
                      {submission.feedback}
                    </div>
                  </div>
                )}

                {submission.grader && (
                  <div>
                    <p className="text-sm text-muted-foreground">Graded By</p>
                    <p className="font-semibold">{submission.grader.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(submission.gradedAt)}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Grading Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {submission.status === "graded" ? "Update Grade" : "Grade Submission"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GradingForm
              submissionId={submission.id}
              maxScore={submission.assignment.maxScore}
              currentScore={submission.score}
              currentFeedback={submission.feedback}
              studentName={submission.user.name ?? "Student"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function getSubmission(id: string) {
  "use cache"
  cacheTag(getSubmissionIdTag(id))

  return db.query.AssignmentSubmissionTable.findFirst({
    where: eq(AssignmentSubmissionTable.id, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignment: {
        with: {
          course: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        columns: {
          name: true,
          instructions: true,
          maxScore: true,
        },
      },
      grader: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })
}
