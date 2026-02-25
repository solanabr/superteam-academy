import { Inngest, EventSchemas } from "inngest";

type SolanaTxEvent = {
  data: {
    signature: string;
    wallet: string;
    trackId: string;
    trackName: string;
    xpEarned: number;
  };
};

type SolanaEnrollmentEvent = {
  data: {
    signature: string;
    wallet: string;
    courseId: string;
  };
};

type SolanaLessonCompleteEvent = {
  data: {
    signature: string;
    wallet: string;
    courseId: string;
    lessonIndex: number;
    xpReward: number;
  };
};

type SolanaCoursePublishedEvent = {
  data: {
    courseId: string;
    wallet: string;
    lessonCount: number;
    difficulty?: number;
    xpPerLesson?: number;
    trackId?: number;
    trackLevel?: number;
  };
};

type SolanaGraduationEvent = {
  data: {
    wallet: string;
    courseId: string;
    lessonCount: number;
  };
};

export type Events = {
  "solana/transaction.sent": SolanaTxEvent;
  "solana/enrollment.sent": SolanaEnrollmentEvent;
  "solana/lesson.completed": SolanaLessonCompleteEvent;
  "solana/course.published": SolanaCoursePublishedEvent;
  "solana/graduation.started": SolanaGraduationEvent;
  "solana/unenrollment.sent": SolanaEnrollmentEvent;
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "superteam-academy",
  schemas: new EventSchemas().fromRecord<Events>()
});
