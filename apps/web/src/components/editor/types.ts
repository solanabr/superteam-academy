import type { TestCase, BuildType } from "@superteam-lms/types";

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
  hintsRevealed: number;
  solutionRevealed: boolean;
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
  xpReward: number;
  solutionRevealed: boolean;
  className?: string;
}

export interface ChallengeInterfaceProps {
  lessonId: string;
  description: string;
  initialCode: string;
  language: EditorLanguage;
  buildType?: BuildType;
  isDeployable?: boolean;
  tests: TestCase[];
  hints: string[];
  solution: string;
  xpReward: number;
  earnedXp?: number | null;
  isAlreadyCompleted?: boolean;
  isEnrolled?: boolean;
  onEnroll?: () => void;
  onComplete?: () => void;
  hideDescription?: boolean;
  className?: string;
}
