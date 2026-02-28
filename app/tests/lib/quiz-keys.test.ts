import { describe, it, expect } from 'vitest';
import { QUIZ_ANSWER_KEYS, validateQuizAnswer } from '@/lib/quiz-keys';

describe('QUIZ_ANSWER_KEYS', () => {
  it('has keys for all 18 courses', () => {
    expect(Object.keys(QUIZ_ANSWER_KEYS).length).toBe(18);
  });

  it('each course has answers for all its lessons', () => {
    const expectedLessons: Record<string, number> = {
      'solana-101': 12,
      'anchor-framework': 20,
      'defi-solana': 28,
      'nft-solana': 16,
      'web3-wallet': 10,
      'token-program': 14,
      'solana-security': 22,
      'solana-mobile': 18,
    };

    for (const [courseId, count] of Object.entries(expectedLessons)) {
      expect(Object.keys(QUIZ_ANSWER_KEYS[courseId]).length).toBe(count);
    }
  });

  it('all answer values are 0-3', () => {
    for (const [courseId, answers] of Object.entries(QUIZ_ANSWER_KEYS)) {
      for (const [idx, answer] of Object.entries(answers)) {
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBeLessThanOrEqual(3);
      }
    }
  });

  it('includes all new courses', () => {
    const newCourses = [
      'token-extensions', 'dao-governance', 'solana-pay',
      'compressed-nfts', 'cross-program-invocations', 'blinks-actions',
      'zk-compression', 'metaplex-core', 'solana-gaming', 'account-abstraction',
    ];
    for (const id of newCourses) {
      expect(QUIZ_ANSWER_KEYS[id]).toBeDefined();
    }
  });
});

describe('validateQuizAnswer', () => {
  it('returns valid=true, correct=true for correct answers', () => {
    const result = validateQuizAnswer('solana-101', 0, 2);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(true);
  });

  it('returns valid=true, correct=false for wrong answers', () => {
    const result = validateQuizAnswer('solana-101', 0, 1);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(false);
  });

  it('returns valid=false for nonexistent course', () => {
    const result = validateQuizAnswer('nonexistent', 0, 0);
    expect(result.valid).toBe(false);
    expect(result.correct).toBe(false);
  });

  it('returns valid=false for out-of-range lesson', () => {
    const result = validateQuizAnswer('solana-101', 999, 0);
    expect(result.valid).toBe(false);
  });

  it('works for each original course', () => {
    const courses = ['solana-101', 'anchor-framework', 'defi-solana', 'nft-solana'];
    for (const courseId of courses) {
      const keys = QUIZ_ANSWER_KEYS[courseId];
      const firstIdx = Number(Object.keys(keys)[0]);
      const correctAnswer = keys[firstIdx];
      expect(validateQuizAnswer(courseId, firstIdx, correctAnswer).correct).toBe(true);
    }
  });

  it('works for each new course', () => {
    const newCourses = ['token-extensions', 'dao-governance', 'solana-pay', 'compressed-nfts'];
    for (const courseId of newCourses) {
      const keys = QUIZ_ANSWER_KEYS[courseId];
      const firstIdx = Number(Object.keys(keys)[0]);
      const correctAnswer = keys[firstIdx];
      expect(validateQuizAnswer(courseId, firstIdx, correctAnswer).correct).toBe(true);
    }
  });

  it('handles edge case: answer is 0', () => {
    // nft-solana lesson 0 has answer 0
    const result = validateQuizAnswer('nft-solana', 0, 0);
    expect(result.valid).toBe(true);
    expect(result.correct).toBe(true);
  });
});
