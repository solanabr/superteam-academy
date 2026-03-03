import { LocalLearningProgressService } from './learning-progress.service'
import { LocalCourseService } from './course.service'

export type { LearningProgressService } from './learning-progress.service'
export type { CourseService } from './course.service'
export { LocalLearningProgressService } from './learning-progress.service'
export { LocalCourseService } from './course.service'

// Code execution services
export { CodeExecutionService } from './code-execution.service'
export { RustExecutionService } from './rust-execution.service'
export { TestRunnerService } from './test-runner.service'
export type { ExecutionOutput } from './code-execution.service'
export type { RustExecutionOutput, RustExecutionRequest } from './rust-execution.service'
export type { TestCase, TestResult, TestRunnerResult } from './test-runner.service'

// Transaction service
export { transactionService } from './transaction.service'
export type { SignedTxResponse, CompleteLessonRequest } from './transaction.service'

// Service interfaces
export type {
  IXpService,
  IAchievementService,
  ICredentialService,
  ICodeExecutionService,
  ITestRunnerService,
  AchievementCheckStats,
} from '@/lib/types/service-interfaces'

// Service instances (singleton pattern)
let learningProgressService: LocalLearningProgressService | null = null
let courseService: LocalCourseService | null = null

export function getLearningProgressService(): LocalLearningProgressService {
  if (!learningProgressService) {
    learningProgressService = new LocalLearningProgressService()
  }
  return learningProgressService
}

export function getCourseService(): LocalCourseService {
  if (!courseService) {
    courseService = new LocalCourseService()
  }
  return courseService
}
