export interface LocaleString {
  pt: string;
  en: string;
  es: string;
}

export interface LocaleText {
  pt: string;
  en: string;
  es: string;
}

export interface TestCaseForm {
  input: string;
  expected: string;
}

export interface ExerciseForm {
  question: LocaleString;
  options: LocaleString[];
  correctIndex: number;
}

export interface ChallengeBlockForm {
  prompt: LocaleText;
  starterCode: string;
  language: "rust" | "typescript" | "json";
  testCases: TestCaseForm[];
}

export interface LessonForm {
  lessonId: string;
  title: LocaleString;
  slug: string;
  lessonType: "content" | "challenge";
  durationMinutes: number;
  xpReward: number;
  content?: LocaleText;
  exercise?: ExerciseForm;
  challenge?: ChallengeBlockForm;
}

export interface ModuleForm {
  moduleId: string;
  title: LocaleString;
  lessons: LessonForm[];
}

export interface CourseForm {
  courseId: string;
  slug: string;
  title: LocaleString;
  description: LocaleText;
  longDescription: LocaleText;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: "short" | "medium" | "long";
  totalDurationMinutes: number;
  xpTotal: number;
  thumbnailAssetId: string | null;
  thumbnailUrl: string | null;
  instructorRef: string | null;
  track: string;
  modules: ModuleForm[];
  published: boolean;
}

export interface AdminCourseListItem {
  _id: string;
  courseId: string;
  slug: string;
  title: LocaleString;
  difficulty: string;
  published: boolean;
  thumbnailUrl: string | null;
  instructorName: string | null;
  modulesCount: number;
  lessonsCount: number;
}
