import type { Track, Difficulty, Course } from "./types";
import {
  quizQuestions,
  type QuizQuestion,
} from "@/lib/data/quiz-questions";
import { courses } from "./courses";

const STORAGE_KEY = "stacad:onboarding";

export interface OnboardingAssessment {
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  recommendedTrack: Track;
  recommendedDifficulty: Difficulty;
  completedAt: string;
}

function storageKey(walletAddress?: string): string {
  return `${STORAGE_KEY}:${walletAddress ?? "anon"}`;
}

function calculateScore(answers: Record<string, string>): number {
  let correct = 0;
  for (const q of quizQuestions) {
    if (answers[q.id] === q.correctOptionId) {
      correct++;
    }
  }
  return correct;
}

function categoryScores(
  answers: Record<string, string>,
): Record<QuizQuestion["category"], { correct: number; total: number }> {
  const result: Record<string, { correct: number; total: number }> = {
    "web3-basics": { correct: 0, total: 0 },
    solana: { correct: 0, total: 0 },
    development: { correct: 0, total: 0 },
    defi: { correct: 0, total: 0 },
  };

  for (const q of quizQuestions) {
    result[q.category].total++;
    if (answers[q.id] === q.correctOptionId) {
      result[q.category].correct++;
    }
  }

  return result;
}

function findWeakestCategory(
  answers: Record<string, string>,
): QuizQuestion["category"] {
  const scores = categoryScores(answers);
  let weakest: QuizQuestion["category"] = "web3-basics";
  let lowestPct = 1;

  for (const [cat, { correct, total }] of Object.entries(scores)) {
    if (total === 0) continue;
    const pct = correct / total;
    if (pct < lowestPct) {
      lowestPct = pct;
      weakest = cat as QuizQuestion["category"];
    }
  }

  return weakest;
}

const CATEGORY_TO_TRACK: Record<QuizQuestion["category"], Track> = {
  "web3-basics": "rust",
  solana: "rust",
  development: "anchor",
  defi: "defi",
};

export const onboardingService = {
  isOnboarded(walletAddress?: string): boolean {
    if (typeof window === "undefined") return false;
    const data = localStorage.getItem(storageKey(walletAddress));
    return data !== null;
  },

  getAssessment(walletAddress?: string): OnboardingAssessment | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(storageKey(walletAddress));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as OnboardingAssessment;
    } catch (error) {
      console.error("[onboarding] Failed to parse assessment data:", error);
      return null;
    }
  },

  saveAssessment(
    assessment: OnboardingAssessment,
    walletAddress?: string,
  ): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(walletAddress), JSON.stringify(assessment));
  },

  calculateResults(
    answers: Record<string, string>,
  ): {
    score: number;
    recommendedTrack: Track;
    recommendedDifficulty: Difficulty;
  } {
    const score = calculateScore(answers);

    let recommendedDifficulty: Difficulty;
    let recommendedTrack: Track;

    if (score <= 2) {
      recommendedDifficulty = "beginner";
      recommendedTrack = "rust";
    } else if (score <= 5) {
      recommendedDifficulty = "intermediate";
      recommendedTrack = "anchor";
    } else {
      recommendedDifficulty = "advanced";
      const weakest = findWeakestCategory(answers);
      recommendedTrack = CATEGORY_TO_TRACK[weakest];
    }

    return { score, recommendedTrack, recommendedDifficulty };
  },

  getRecommendedCourses(track: Track, difficulty: Difficulty): Course[] {
    // Primary: exact match on track
    const trackMatches = courses.filter((c) => c.isActive && c.track === track);
    if (trackMatches.length > 0) return trackMatches;

    // Fallback: match on difficulty
    const difficultyMatches = courses.filter(
      (c) => c.isActive && c.difficulty === difficulty,
    );
    if (difficultyMatches.length > 0) return difficultyMatches;

    // Final fallback: return beginner courses
    return courses.filter((c) => c.isActive && c.difficulty === "beginner");
  },
};
