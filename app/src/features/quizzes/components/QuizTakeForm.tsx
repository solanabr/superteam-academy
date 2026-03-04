"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { submitAssignment } from "@/features/quizzes/actions/submissions"
import { QuizConfig, QuizSubmission, getQuizTotalPoints, parseQuizSubmission } from "@/features/quizzes/lib/quiz"

type QuizTakeFormProps = {
  assignmentId: string
  quizConfig: QuizConfig
  existingSubmission?: {
    id: string
    textContent: string | null
    status: string
  } | null
  canSubmit: boolean
}

export function QuizTakeForm({
  assignmentId,
  quizConfig,
  existingSubmission,
  canSubmit,
}: QuizTakeFormProps) {
  const totalPoints = useMemo(() => getQuizTotalPoints(quizConfig), [quizConfig])
  const parsedSubmission = useMemo(
    () => parseQuizSubmission(existingSubmission?.textContent ?? null),
    [existingSubmission?.textContent]
  )

  const [answers, setAnswers] = useState<Record<string, string>>(
    parsedSubmission?.answers ?? {}
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localResult, setLocalResult] = useState<QuizSubmission | null>(parsedSubmission)

  const handleSubmit = async () => {
    if (!canSubmit) return
    const unanswered = quizConfig.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      toast.error("Please answer all questions before submitting.")
      return
    }

    let score = 0
    quizConfig.questions.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        score += q.points
      }
    })

    const payload: QuizSubmission = {
      type: "quiz_submission",
      version: 1,
      answers,
      score,
      maxScore: totalPoints,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
      submittedAt: new Date().toISOString(),
    }

    setIsSubmitting(true)
    try {
      const result = await submitAssignment({
        assignmentId,
        textContent: JSON.stringify(payload),
      })
      if (result.error) {
        toast.error(result.message || "Failed to submit quiz")
        return
      }
      const xp = (result as { xpAwarded?: number }).xpAwarded ?? 0
      toast.success(xp > 0 ? `Quiz submitted! +${xp} XP earned ⚡` : "Quiz submitted!")
      setLocalResult(payload)
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit quiz")
    } finally {
      setIsSubmitting(false)
    }
  }

  const result = localResult ?? parsedSubmission

  return (
    <div className="space-y-6">
      {result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500">
                Score: {result.score}/{result.maxScore}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {result.percentage}% correct
              </span>
            </div>
            {quizConfig.passingScore !== undefined && (
              <p className="text-sm">
                {result.score >= quizConfig.passingScore ? (
                  <span className="text-green-600 font-medium">Passed</span>
                ) : (
                  <span className="text-red-500 font-medium">Not passed</span>
                )}{" "}
                (Passing score: {quizConfig.passingScore})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {quizConfig.questions.map((question, index) => {
          const selected = answers[question.id]
          const isCorrect =
            result && selected === question.correctOptionId
          return (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {index + 1}. {question.prompt}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{question.points} points</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const label = String.fromCharCode(65 + optionIndex)
                    const isSelected = selected === option.id
                    const isOptionCorrect =
                      result && option.id === question.correctOptionId

                    return (
                      <div
                        key={option.id}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
                          isOptionCorrect ? "border-green-500/50 bg-green-50/50" : ""
                        } ${isSelected && !isOptionCorrect && result ? "border-red-500/50 bg-red-50/40" : ""}`}
                      >
                        <input
                          type="radio"
                          id={`${question.id}-${option.id}`}
                          name={question.id}
                          value={option.id}
                          checked={isSelected}
                          disabled={!!result}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                          }
                        />
                        <Label htmlFor={`${question.id}-${option.id}`} className="text-sm">
                          <span className="mr-2 text-xs text-muted-foreground">{label}.</span>
                          {option.text}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                {result && question.explanation && (
                  <p className="text-xs text-muted-foreground">{question.explanation}</p>
                )}
                {result && isCorrect && (
                  <p className="text-xs text-green-600 font-medium">Correct</p>
                )}
                {result && !isCorrect && (
                  <p className="text-xs text-red-500 font-medium">Incorrect</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!result && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      )}
    </div>
  )
}
