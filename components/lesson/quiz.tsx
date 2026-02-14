'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuizProps {
  title?: string
  questions: Array<{
    question: string
    options: string[]
    correctAnswerIndex: number
    explanation?: string
  }>
  passingScore?: number
  onComplete?: (scorePercent: number) => void
}

export function Quiz({ title, questions, passingScore = 70, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [submitted, setSubmitted] = useState(false)
  const correctCount = answers.reduce((acc, ans, i) => acc + (ans === questions[i].correctAnswerIndex ? 1 : 0), 0)
  const scorePercent = Math.round((correctCount / questions.length) * 100)

  const submit = () => {
    setSubmitted(true)
    onComplete?.(scorePercent)
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="space-y-6 p-6">
        {title && <h3 className="text-xl font-bold">{title}</h3>}
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-3">
            <p className="font-medium">{qi + 1}. {q.question}</p>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  className={cn(
                    'text-left p-3 rounded-lg border',
                    answers[qi] === oi ? 'border-primary bg-primary/10' : 'border-border/50 hover:bg-muted/50'
                  )}
                  onClick={() => {
                    if (submitted) return
                    const next = [...answers]
                    next[qi] = oi
                    setAnswers(next)
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {submitted && q.explanation && (
              <p className="text-sm text-muted-foreground">Explanation: {q.explanation}</p>
            )}
          </div>
        ))}

        {!submitted ? (
          <Button onClick={submit} disabled={answers.some(a => a === -1)} className="rounded-xl">
            Submit Quiz
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="font-bold">Score: {scorePercent}%</p>
            <p className={cn('text-sm', scorePercent >= passingScore ? 'text-primary' : 'text-red-500')}>
              {scorePercent >= passingScore ? 'Passed' : 'Failed'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
