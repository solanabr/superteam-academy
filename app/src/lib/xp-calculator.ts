/**
 * XP Calculation Utilities
 * Helper functions for calculating XP rewards based on content type and difficulty
 */

import { XP_REWARDS, DifficultyLevel } from '@/types/gamification';

/**
 * Calculate XP reward for a lesson based on difficulty
 *
 * Difficulty ranges:
 * - Beginner: 10-20 XP
 * - Intermediate: 25-35 XP
 * - Advanced: 40-50 XP
 *
 * @param difficulty - The difficulty level of the lesson
 * @returns Calculated XP amount
 */
export function calculateLessonXP(difficulty: DifficultyLevel = 'intermediate'): number {
  switch (difficulty) {
    case 'beginner':
      return 15; // Middle of 10-20 range
    case 'intermediate':
      return 30; // Middle of 25-35 range
    case 'advanced':
      return 45; // Middle of 40-50 range
    default:
      return XP_REWARDS.LESSON_COMPLETE_MIN;
  }
}

/**
 * Calculate XP reward for a challenge based on difficulty
 *
 * Difficulty ranges:
 * - Beginner: 25-40 XP
 * - Intermediate: 50-70 XP
 * - Advanced: 80-100 XP
 *
 * @param difficulty - The difficulty level of the challenge
 * @returns Calculated XP amount
 */
export function calculateChallengeXP(difficulty: DifficultyLevel = 'intermediate'): number {
  switch (difficulty) {
    case 'beginner':
      return 30; // Middle of 25-40 range
    case 'intermediate':
      return 60; // Middle of 50-70 range
    case 'advanced':
      return 90; // Middle of 80-100 range
    default:
      return XP_REWARDS.CHALLENGE_COMPLETE_MIN;
  }
}

/**
 * Calculate XP reward for course completion
 *
 * Base calculation uses logarithmic scaling based on lesson count
 * to reward larger courses without making XP gains exponential.
 *
 * Difficulty multipliers:
 * - Beginner: 50x
 * - Intermediate: 100x
 * - Advanced: 150x
 *
 * Formula: baseMultiplier * log2(lessonCount + 1)
 *
 * Result is clamped between 500-2000 XP
 *
 * @param difficulty - The difficulty level of the course
 * @param lessonCount - Number of lessons in the course
 * @returns Calculated XP amount (500-2000)
 */
export function calculateCourseXP(
  difficulty: DifficultyLevel = 'intermediate',
  lessonCount: number = 10
): number {
  const baseMultiplier = difficulty === 'beginner' ? 50 : difficulty === 'advanced' ? 150 : 100;
  const calculatedXP = baseMultiplier * Math.log2(lessonCount + 1);

  // Ensure within min-max range
  return Math.max(
    XP_REWARDS.COURSE_COMPLETE_MIN,
    Math.min(Math.round(calculatedXP), XP_REWARDS.COURSE_COMPLETE_MAX)
  );
}

/**
 * Get XP reward for any content type
 *
 * Convenience function that routes to appropriate calculator
 *
 * @param type - Type of content (lesson, challenge, course)
 * @param difficulty - Difficulty level
 * @param lessonCount - Number of lessons (for course type only)
 * @returns Calculated XP amount
 */
export function getXPReward(
  type: 'lesson' | 'challenge' | 'course',
  difficulty: DifficultyLevel = 'intermediate',
  lessonCount?: number
): number {
  switch (type) {
    case 'lesson':
      return calculateLessonXP(difficulty);
    case 'challenge':
      return calculateChallengeXP(difficulty);
    case 'course':
      return calculateCourseXP(difficulty, lessonCount);
    default:
      return 0;
  }
}

/**
 * Validate XP amount is within acceptable range
 *
 * @param amount - XP amount to validate
 * @param type - Type of content (determines valid range)
 * @returns Whether the amount is valid
 */
export function isValidXPAmount(amount: number, type: 'lesson' | 'challenge' | 'course'): boolean {
  switch (type) {
    case 'lesson':
      return amount >= XP_REWARDS.LESSON_COMPLETE_MIN && amount <= XP_REWARDS.LESSON_COMPLETE_MAX;
    case 'challenge':
      return (
        amount >= XP_REWARDS.CHALLENGE_COMPLETE_MIN && amount <= XP_REWARDS.CHALLENGE_COMPLETE_MAX
      );
    case 'course':
      return amount >= XP_REWARDS.COURSE_COMPLETE_MIN && amount <= XP_REWARDS.COURSE_COMPLETE_MAX;
    default:
      return false;
  }
}

/**
 * Clamp XP amount to valid range for content type
 *
 * @param amount - XP amount to clamp
 * @param type - Type of content
 * @returns Clamped XP amount
 */
export function clampXPAmount(amount: number, type: 'lesson' | 'challenge' | 'course'): number {
  switch (type) {
    case 'lesson':
      return Math.max(
        XP_REWARDS.LESSON_COMPLETE_MIN,
        Math.min(amount, XP_REWARDS.LESSON_COMPLETE_MAX)
      );
    case 'challenge':
      return Math.max(
        XP_REWARDS.CHALLENGE_COMPLETE_MIN,
        Math.min(amount, XP_REWARDS.CHALLENGE_COMPLETE_MAX)
      );
    case 'course':
      return Math.max(
        XP_REWARDS.COURSE_COMPLETE_MIN,
        Math.min(amount, XP_REWARDS.COURSE_COMPLETE_MAX)
      );
    default:
      return amount;
  }
}
