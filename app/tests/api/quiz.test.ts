import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define quiz answer keys (same as used in the API route)
const QUIZ_ANSWER_KEYS: Record<string, Record<number, number>> = {
  'solana-101': { 0: 2, 1: 0, 2: 3, 3: 1, 4: 2, 5: 0, 6: 3, 7: 1, 8: 2, 9: 0, 10: 1, 11: 3 },
  'anchor-framework': { 0: 1, 1: 3, 2: 0, 3: 2, 4: 1, 5: 3, 6: 0, 7: 2, 8: 1, 9: 3, 10: 0, 11: 2, 12: 1, 13: 3, 14: 0, 15: 2, 16: 1, 17: 3, 18: 0, 19: 2 },
  'defi-solana': { 0: 3, 1: 1, 2: 2, 3: 0, 4: 3, 5: 1, 6: 2, 7: 0, 8: 3, 9: 1 },
};

function validateQuizAnswer(courseId: string, lessonIndex: number, answer: number): { valid: boolean; correct: boolean } {
  const courseKeys = QUIZ_ANSWER_KEYS[courseId];
  if (!courseKeys) return { valid: false, correct: false };
  const correctAnswer = courseKeys[lessonIndex];
  if (correctAnswer === undefined) return { valid: false, correct: false };
  return { valid: true, correct: answer === correctAnswer };
}

describe('Quiz validation logic', () => {
  it('validates correct answer for solana-101 lesson 0', () => {
    const result = validateQuizAnswer('solana-101', 0, 2);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(true);
  });

  it('rejects incorrect answer', () => {
    const result = validateQuizAnswer('solana-101', 0, 1);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(false);
  });

  it('returns invalid for unknown course', () => {
    const result = validateQuizAnswer('unknown-course', 0, 0);
    expect(result.valid).toBe(false);
  });

  it('returns invalid for unknown lesson index', () => {
    const result = validateQuizAnswer('solana-101', 999, 0);
    expect(result.valid).toBe(false);
  });

  it('validates anchor-framework answers', () => {
    expect(validateQuizAnswer('anchor-framework', 0, 1).correct).toBe(true);
    expect(validateQuizAnswer('anchor-framework', 1, 3).correct).toBe(true);
  });

  it('validates defi-solana answers', () => {
    expect(validateQuizAnswer('defi-solana', 0, 3).correct).toBe(true);
    expect(validateQuizAnswer('defi-solana', 1, 1).correct).toBe(true);
  });

  it('handles all lessons for solana-101', () => {
    const keys = QUIZ_ANSWER_KEYS['solana-101'];
    for (const [idx, correct] of Object.entries(keys)) {
      const result = validateQuizAnswer('solana-101', Number(idx), correct);
      expect(result.correct).toBe(true);
    }
  });

  it('validates answer 0 is not always correct', () => {
    // In solana-101, lesson 0 answer is 2, not 0
    expect(validateQuizAnswer('solana-101', 0, 0).correct).toBe(false);
  });

  it('boundary: answer at max valid index', () => {
    const result = validateQuizAnswer('solana-101', 11, 3);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(true);
  });

  it('boundary: answer at min valid index', () => {
    const result = validateQuizAnswer('solana-101', 0, 2);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(true);
  });
});
