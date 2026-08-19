import type { ReactNode, Ref } from "react";
import type { TestCase, BuildType } from "@superteam-lms/types";
import type { editor } from "monaco-editor";
import type { FormatStatus } from "@/lib/editor/format-code";

export type EditorLanguage = "typescript" | "rust" | "json";

export interface EditorState {
  code: string;
  language: EditorLanguage;
  lessonId: string;
  isDirty: boolean;
}

export interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualOutput: string;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  testResults?: TestResult[];
  buildUuid?: string | null;
  /** Pre-generated program keypair secret for deploy (declare_id injection). */
  programKeypairSecret?: number[];
}

export interface ChallengeState {
  status: "idle" | "running" | "success" | "error";
  executionResult: ExecutionResult | null;
}

export interface CodeEditorProps {
  lessonId: string;
  initialCode: string;
  language: EditorLanguage;
  value?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  className?: string;
}

export interface OutputPanelProps {
  executionResult: ExecutionResult | null;
  isRunning: boolean;
  onClear: () => void;
  /** Authored test-case spec, shown in the "Examples" tab before any run (#770).
   * Distinct from `executionResult.testResults`, which is per-run outcomes. */
  tests?: TestCase[];
  className?: string;
}

export interface ChallengeRunnerProps {
  code: string;
  tests: TestCase[];
  language: EditorLanguage;
  buildType?: BuildType;
  isDeployable?: boolean;
  onResult: (result: ExecutionResult) => void;
  onSubmit: () => void;
  isComplete: boolean;
  /** A submission is in flight — hides Submit without claiming completion. */
  isJudging?: boolean;
  xpReward: number;
  /** Ref to the Run/Build button, so the AI Partner's attempt-gate nudge
   * (#865) can shift focus to it. */
  runButtonRef?: Ref<HTMLButtonElement>;
  className?: string;
}

export interface ChallengeInterfaceProps {
  lessonId: string;
  /** Content id of the parent course — analytics only (challenge lifecycle events). */
  courseId?: string;
  /** Sanity slug of the parent course — threaded to the AI Partner route. */
  courseSlug: string;
  /** Sanity slug of this lesson — threaded to the AI Partner route. */
  lessonSlug: string;
  /** Task-brief content rendered in the right rail's top panel (lg+) / first in reading order (below lg). */
  taskSlot?: ReactNode;
  /** Rendered under the AI pane in the reading column (#942). */
  sectionsSlot?: ReactNode;
  initialCode: string;
  language: EditorLanguage;
  buildType?: BuildType;
  isDeployable?: boolean;
  tests: TestCase[];
  hints: string[];
  /**
   * Reference solution source, already in the client payload. Empty/undefined
   * when the challenge ships none. Gated behind the LX-C6 soft-gate — never
   * auto-shown, revealed only on a deliberate, confirmed click.
   */
  solution?: string;
  xpReward: number;
  earnedXp?: number | null;
  isAlreadyCompleted?: boolean;
  isEnrolled?: boolean;
  onEnroll?: () => void;
  onComplete?: () => void;
  /**
   * Keep the AI Partner pane hidden regardless of scroll reveal (LX-C1/F18):
   * true while a quiz block in this lesson is unanswered, so the retrieval
   * close cannot be delegated to the tutor.
   */
  aiSuppressed?: boolean;
  /**
   * THE graded capstone (#867). Derived from `lib/credentials/capstone-identity`
   * — the same constant that gates the credential — never a lesson id compared
   * inline. The AI Partner is not merely hidden here: the pane's slot renders a
   * short AI-free explanation, because this state is permanent and deliberate
   * and the learner deserves the reason. Enforcement is server-side
   * (`/api/ai/partner` refuses with `capstone_ai_off`); this is the honest UI.
   */
  capstoneAiOff?: boolean;
  className?: string;
}

export interface CodeEditorHandle {
  getEditor: () => editor.IStandaloneCodeEditor | null;
  /**
   * Reformats the buffer with Prettier (see `lib/editor/format-code` for why
   * not Monaco's built-in formatter). The status is deliberately reported
   * rather than swallowed, so the caller can tell the learner WHY nothing
   * changed instead of leaving the button looking broken.
   */
  format: () => Promise<FormatStatus>;
}
