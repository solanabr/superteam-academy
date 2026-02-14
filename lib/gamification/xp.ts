export const BASE_LESSON_XP = 25;
export const CHALLENGE_BONUS_XP = 50;

export function calculateLessonXP(difficulty: "beginner" | "intermediate" | "advanced"): number {
  if (difficulty === "advanced") {
    return BASE_LESSON_XP + 25;
  }

  if (difficulty === "intermediate") {
    return BASE_LESSON_XP + 10;
  }

  return BASE_LESSON_XP;
}

export function calculateChallengeXP(testCasesPassed: number, totalTestCases: number): number {
  if (totalTestCases <= 0) {
    return 0;
  }

  const ratio = Math.max(0, Math.min(1, testCasesPassed / totalTestCases));
  return Math.floor(CHALLENGE_BONUS_XP * ratio);
}
