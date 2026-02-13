import {
  appendTxRecord,
  recordEnrollment,
  recordLessonCompletion
} from '@/lib/learning/server-progress-store';

export interface RelayReceipt {
  signature: string;
  submittedAt: string;
  mode: 'stub';
}

export interface EnrollMutationResult {
  enrolled: boolean;
  receipt: RelayReceipt;
}

export interface CompleteLessonMutationResult {
  alreadyCompleted: boolean;
  xpAwarded: number;
  totalXP: number;
  streakCurrent: number;
  receipt: RelayReceipt;
}

export interface LearningTransactionRelay {
  enrollCourse(input: { userId: string; courseId: string }): Promise<EnrollMutationResult>;
  completeLesson(input: {
    userId: string;
    courseId: string;
    lessonIndex: number;
    xpAward: number;
  }): Promise<CompleteLessonMutationResult>;
}

class StubLearningTransactionRelay implements LearningTransactionRelay {
  async enrollCourse(input: { userId: string; courseId: string }): Promise<EnrollMutationResult> {
    const enrolled = await recordEnrollment(input.userId, input.courseId);
    const tx = await appendTxRecord({
      userId: input.userId,
      action: 'enroll_course',
      courseId: input.courseId
    });

    return {
      enrolled,
      receipt: {
        signature: tx.signature,
        submittedAt: tx.createdAt,
        mode: 'stub'
      }
    };
  }

  async completeLesson(input: {
    userId: string;
    courseId: string;
    lessonIndex: number;
    xpAward: number;
  }): Promise<CompleteLessonMutationResult> {
    const completion = await recordLessonCompletion(input);

    const tx = await appendTxRecord({
      userId: input.userId,
      action: 'complete_lesson',
      courseId: input.courseId,
      lessonIndex: input.lessonIndex
    });

    return {
      alreadyCompleted: completion.alreadyCompleted,
      xpAwarded: completion.xpAwarded,
      totalXP: completion.totalXP,
      streakCurrent: completion.streak.current,
      receipt: {
        signature: tx.signature,
        submittedAt: tx.createdAt,
        mode: 'stub'
      }
    };
  }
}

export const learningTransactionRelay: LearningTransactionRelay =
  new StubLearningTransactionRelay();
