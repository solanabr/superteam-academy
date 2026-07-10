// `Course` re-exported here carries the optional
// `authoringStatus?: "draft" | "pending_review" | "approved"` field (issue
// #263); `AuthoringStatus` is the status union.
export type {
  Course,
  AuthoringStatus,
  Module,
  Lesson,
  Instructor,
  LearningPath,
  TestCase,
  CapabilityKey,
  LessonBlock,
  ProseBlockData,
  VideoBlockData,
  CodeBlockData,
  QuizOptionData,
  QuizQuestionData,
  QuizBlockData,
  OpenEndedBlockData,
  WalletFundingBlockData,
  ProgramExplorerBlockData,
  DeployedProgramCardBlockData,
} from "@superteam-lms/types";
