import type {
  CourseT,
  LessonT,
  QuizBlockT,
  AchievementT,
  QuestT,
  LearningPathT,
  SlotsLockT,
} from "@superteam-lms/content-schema";

export interface LessonEntry {
  id: string;
  /** Repo-relative lesson directory. */
  dir: string;
  /** Repo-relative lesson.yaml path. */
  file: string;
  lesson: LessonT;
  /** Every repo-relative file under `dir` (for gate 5 orphan detection). */
  files: string[];
}

export interface CourseEntry {
  id: string;
  dir: string;
  file: string;
  course: CourseT;
  /** Repo-relative slots.lock.json path, if present. */
  slotsPath: string | null;
  slotsLock: SlotsLockT | null;
}

export interface RepoModel {
  root: string;
  courses: CourseEntry[];
  lessons: LessonEntry[];
  lessonsById: Map<string, LessonEntry>;
  standaloneQuizzes: { file: string; quiz: QuizBlockT }[];
  achievements: { file: string; achievement: AchievementT }[];
  quests: { file: string; quest: QuestT }[];
  paths: { file: string; path: LearningPathT }[];
}

/** The typed collections start empty; Gate 1 (checks/gate1-schema.ts) fills them. */
export function emptyModel(root: string): RepoModel {
  return {
    root,
    courses: [],
    lessons: [],
    lessonsById: new Map(),
    standaloneQuizzes: [],
    achievements: [],
    quests: [],
    paths: [],
  };
}
