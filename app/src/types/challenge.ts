export interface RunResult {
  success: boolean;
  output: string;
  testResults: TestResult[];
  executionTime: number;
  error?: string;
}

export interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface DailyChallenge {
  id: string;
  challengeDate: string;
  title: string;
  description: string;
  challengeType: "quiz" | "code" | "reading";
  challengeData: QuizChallenge | CodeChallenge | ReadingChallenge;
  xpReward: number;
  completed?: boolean;
}

export interface QuizChallenge {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodeChallenge {
  prompt: string;
  language: "rust" | "typescript";
  starterCode: string;
  solution: string;
  testCases: { input: string; expectedOutput: string; label: string }[];
}

export interface ReadingChallenge {
  content: string;
  questions: { question: string; answer: string }[];
}
