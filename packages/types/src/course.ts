export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Instructor {
  name: string;
  avatar: string;
  bio: string;
  socialLinks?: { twitter?: string; github?: string };
}

/**
 * A single graded test case, as delivered to the client and read by the server
 * grader. Post-D4 (open book, spec §4.5/§10.2) every test is public — there is no
 * `hidden` flag on the client shape.
 */
export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
}

/**
 * Test case shape the challenge executors accept. Retains the optional `hidden`
 * flag for backward compatibility with the executor signatures; post-D4 no test
 * is hidden, so a public {@link TestCase} is assignable here.
 */
export interface AdminTestCase extends TestCase {
  hidden?: boolean;
}

export type BuildType = "standard" | "buildable";

/** Capability produced/consumed by a block (spec §4.9). Closed set. */
export type CapabilityKey = "funded-wallet" | "deployed-program";

interface LessonBlockBase {
  /** The Sanity array item `_key` (spec §4.4). Stable within the lesson. */
  key: string;
  produces?: CapabilityKey | null;
  consumes?: CapabilityKey[] | null;
}

export interface ProseBlockData extends LessonBlockBase {
  _type: "prose";
  /** Resolved markdown body (CS-9 resolves ProseBlock.src). */
  src: string;
}

export interface VideoBlockData extends LessonBlockBase {
  _type: "video";
  url: string;
}

export interface CodeBlockData extends LessonBlockBase {
  _type: "code";
  language: "typescript" | "rust";
  buildType?: BuildType | null;
  deployable?: boolean | null;
  starter: string;
  /** PUBLIC post-D4 — the grader reads it from this same projection. */
  solution: string;
  tests: TestCase[];
  hints?: string[] | null;
}

export interface QuizOptionData {
  id: string;
  label: string;
  correct: boolean;
  feedback?: string | null;
}

export interface QuizQuestionData {
  id: string;
  prompt: string;
  multiSelect?: boolean | null;
  options: QuizOptionData[];
  explanation?: string | null;
}

export interface QuizBlockData extends LessonBlockBase {
  _type: "quiz";
  questions: QuizQuestionData[];
}

export interface OpenEndedBlockData extends LessonBlockBase {
  _type: "openEnded";
  prompt: string;
  maxWords?: number | null;
}

export interface WalletFundingBlockData extends LessonBlockBase {
  _type: "wallet-funding";
  amount?: number | null;
  network?: "devnet" | null;
}

export interface ProgramExplorerBlockData extends LessonBlockBase {
  _type: "program-explorer";
  /** Resolved IDL JSON string (CS-9 resolves ProgramExplorerBlock.idl). */
  idl: string;
}

export interface DeployedProgramCardBlockData extends LessonBlockBase {
  _type: "deployed-program-card";
}

/**
 * A projected lesson block (spec §4.4, §10.2). Discriminated on `_type` — the
 * renderer registry, grader map, and BLOCK_REGISTRY all key on the same string.
 */
export type LessonBlock =
  | ProseBlockData
  | VideoBlockData
  | CodeBlockData
  | QuizBlockData
  | OpenEndedBlockData
  | WalletFundingBlockData
  | ProgramExplorerBlockData
  | DeployedProgramCardBlockData;

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

/**
 * A lesson is the atomic completable unit. Its content is an ordered `blocks[]`
 * page-builder array (spec §4.4, §10). `_id` is the lesson id.
 */
export interface Lesson {
  _id: string;
  title: string;
  slug: string;
  blocks: LessonBlock[];
}

/**
 * Inline module object on the course (spec §10.1). `key` replaces the former
 * `module` document `_id`; display order is array position (no `order`).
 */
export interface Module {
  key: string;
  title: string;
  description?: string | null;
  lessons: Lesson[];
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
  /**
   * Supabase user id of the owning teacher (issue #263). Managed by the app.
   * Retained for the `/teach` authoring surface (retired in spec §15.4 Phase 8).
   */
  author?: string;
  /** Authoring workflow state (issue #263). Legacy/repo-synced docs may omit this. */
  authoringStatus?: AuthoringStatus;
  /**
   * Admin feedback shown to the teacher when a course is rejected (issue #268).
   * Admin-managed; cleared on approval.
   */
  reviewFeedback?: string;
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
