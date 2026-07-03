export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Instructor {
  name: string;
  avatar: string;
  bio: string;
  socialLinks?: { twitter?: string; github?: string };
}

/**
 * Client-facing test case. Never includes the `hidden` flag: hidden tests are
 * stripped server-side by the GROQ projection and must never reach the browser
 * (they are part of the challenge answer key). See {@link AdminTestCase} for the
 * full CMS shape used by server-side validation.
 */
export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
}

/**
 * Full test case as authored in Sanity, including hidden tests.
 * SERVER-ONLY — must never be projected into a client payload.
 */
export interface AdminTestCase extends TestCase {
  hidden?: boolean;
}

interface LessonBase {
  _id: string;
  title: string;
  slug: string;
  order: number;
  difficulty?: Difficulty;
  videoUrl?: string;
}

export interface ContentLesson extends LessonBase {
  type: "content";
  content: string;
  language?: "typescript" | "rust";
  widgets?: string[];
  programIdl?: string;
}

export type BuildType = "standard" | "buildable";

/**
 * Challenge lesson as delivered to the client. Excludes `solution` and hidden
 * tests — those are the answer key and are held server-side only (see
 * {@link AdminChallengeLesson}). `tests` here contains only visible test cases.
 */
export interface ChallengeLesson extends LessonBase {
  type: "challenge";
  content: string;
  language?: "typescript" | "rust";
  buildType?: BuildType;
  deployable?: boolean;
  code: string;
  tests: TestCase[];
  hints: string[];
}

/**
 * Challenge lesson with the full answer key (solution + hidden tests).
 * SERVER-ONLY — used by server-side challenge validation. Never serialize this
 * into a response sent to the browser.
 */
export interface AdminChallengeLesson extends Omit<ChallengeLesson, "tests"> {
  tests: AdminTestCase[];
  solution: string;
}

export interface BuildResult {
  success: boolean;
  stderr: string;
  uuid: string | null;
  /** Base64-encoded .so binary from build server (avoids Cloud Run routing issues). */
  binary_b64?: string;
}

export interface BuildFile {
  path: string;
  content: string;
}

export type Lesson = ContentLesson | ChallengeLesson;

export interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export type AuthoringStatus = "draft" | "pending_review" | "approved";

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  thumbnail: string;
  instructor: Instructor;
  tags: string[];
  xpReward: number;
  modules: Module[];
  trackCollectionAddress?: string | null;
  trackId?: number;
  trackLevel?: number;
  /** Supabase user id of the owning teacher (issue #263). Managed by the app. */
  author?: string;
  /** Authoring workflow state (issue #263). Legacy docs may omit this. */
  authoringStatus?: AuthoringStatus;
}

export interface LearningPath {
  _id: string;
  title: string;
  description: string;
  slug: string;
  tag?: string;
  order?: number;
  courses: Course[];
  difficulty: Difficulty;
}
