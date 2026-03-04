export type QuizOption = {
  id: string
  text: string
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: QuizOption[]
  correctOptionId: string
  points: number
  explanation?: string
}

export type QuizConfig = {
  type: "quiz"
  version: 1
  intro?: string
  timeLimitMinutes?: number
  passingScore?: number
  questions: QuizQuestion[]
}

export type QuizSubmission = {
  type: "quiz_submission"
  version: 1
  answers: Record<string, string>
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
}

export function serializeQuizConfig(config: QuizConfig): string {
  return JSON.stringify(config)
}

export function parseQuizConfig(value?: string | null): QuizConfig | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as QuizConfig
    if (parsed?.type !== "quiz" || parsed?.version !== 1) return null
    if (!Array.isArray(parsed.questions)) return null
    return parsed
  } catch {
    return null
  }
}

export function parseQuizSubmission(value?: string | null): QuizSubmission | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as QuizSubmission
    if (parsed?.type !== "quiz_submission" || parsed?.version !== 1) return null
    if (!parsed.answers || typeof parsed.answers !== "object") return null
    return parsed
  } catch {
    return null
  }
}

export function getQuizTotalPoints(config: QuizConfig): number {
  return config.questions.reduce((total, q) => total + (q.points || 0), 0)
}
