import 'server-only';

/**
 * Server-side quiz answer keys.
 * NEVER expose these to the client — only used in API route validation.
 */
export const QUIZ_ANSWER_KEYS: Record<string, Record<number, number>> = {
  'solana-101': { 0: 2, 1: 0, 2: 3, 3: 1, 4: 2, 5: 0, 6: 3, 7: 1, 8: 2, 9: 0, 10: 1, 11: 3 },
  'anchor-framework': { 0: 1, 1: 3, 2: 0, 3: 2, 4: 1, 5: 3, 6: 0, 7: 2, 8: 1, 9: 3, 10: 0, 11: 2, 12: 1, 13: 3, 14: 0, 15: 2, 16: 1, 17: 3, 18: 0, 19: 2 },
  'defi-solana': { 0: 3, 1: 1, 2: 2, 3: 0, 4: 3, 5: 1, 6: 2, 7: 0, 8: 3, 9: 1, 10: 2, 11: 0, 12: 3, 13: 1, 14: 2, 15: 0, 16: 3, 17: 1, 18: 2, 19: 0, 20: 3, 21: 1, 22: 2, 23: 0, 24: 3, 25: 1, 26: 2, 27: 0 },
  'nft-solana': { 0: 0, 1: 2, 2: 1, 3: 3, 4: 0, 5: 2, 6: 1, 7: 3, 8: 0, 9: 2, 10: 1, 11: 3, 12: 0, 13: 2, 14: 1, 15: 3 },
  'web3-wallet': { 0: 1, 1: 3, 2: 0, 3: 2, 4: 1, 5: 3, 6: 0, 7: 2, 8: 1, 9: 3 },
  'token-program': { 0: 2, 1: 0, 2: 3, 3: 1, 4: 2, 5: 0, 6: 3, 7: 1, 8: 2, 9: 0, 10: 3, 11: 1, 12: 2, 13: 0 },
  'solana-security': { 0: 3, 1: 1, 2: 0, 3: 2, 4: 3, 5: 1, 6: 0, 7: 2, 8: 3, 9: 1, 10: 0, 11: 2, 12: 3, 13: 1, 14: 0, 15: 2, 16: 3, 17: 1, 18: 0, 19: 2, 20: 3, 21: 1 },
  'solana-mobile': { 0: 1, 1: 2, 2: 3, 3: 0, 4: 1, 5: 2, 6: 3, 7: 0, 8: 1, 9: 2, 10: 3, 11: 0, 12: 1, 13: 2, 14: 3, 15: 0, 16: 1, 17: 2 },
  'token-extensions': { 0: 2, 1: 1, 2: 3, 3: 0, 4: 2, 5: 1, 6: 3, 7: 0, 8: 2, 9: 1, 10: 3, 11: 0, 12: 2, 13: 1, 14: 3, 15: 0 },
  'dao-governance': { 0: 0, 1: 3, 2: 1, 3: 2, 4: 0, 5: 3, 6: 1, 7: 2, 8: 0, 9: 3, 10: 1, 11: 2, 12: 0, 13: 3 },
  'solana-pay': { 0: 1, 1: 0, 2: 2, 3: 3, 4: 1, 5: 0, 6: 2, 7: 3, 8: 1, 9: 0, 10: 2, 11: 3 },
  'compressed-nfts': { 0: 3, 1: 2, 2: 0, 3: 1, 4: 3, 5: 2, 6: 0, 7: 1, 8: 3, 9: 2, 10: 0, 11: 1, 12: 3, 13: 2 },
  'cross-program-invocations': { 0: 2, 1: 1, 2: 3, 3: 0, 4: 2, 5: 1, 6: 3, 7: 0, 8: 2, 9: 1, 10: 3, 11: 0, 12: 2, 13: 1, 14: 3, 15: 0 },
  'blinks-actions': { 0: 0, 1: 2, 2: 1, 3: 3, 4: 0, 5: 2, 6: 1, 7: 3, 8: 0, 9: 2 },
  'zk-compression': { 0: 1, 1: 3, 2: 0, 3: 2, 4: 1, 5: 3, 6: 0, 7: 2, 8: 1, 9: 3, 10: 0, 11: 2, 12: 1, 13: 3, 14: 0, 15: 2, 16: 1, 17: 3 },
  'metaplex-core': { 0: 2, 1: 0, 2: 3, 3: 1, 4: 2, 5: 0, 6: 3, 7: 1, 8: 2, 9: 0, 10: 3, 11: 1, 12: 2, 13: 0, 14: 3, 15: 1 },
  'solana-gaming': { 0: 3, 1: 1, 2: 2, 3: 0, 4: 3, 5: 1, 6: 2, 7: 0, 8: 3, 9: 1, 10: 2, 11: 0, 12: 3, 13: 1 },
  'account-abstraction': { 0: 0, 1: 2, 2: 1, 3: 3, 4: 0, 5: 2, 6: 1, 7: 3, 8: 0, 9: 2, 10: 1, 11: 3, 12: 0, 13: 2, 14: 1, 15: 3 },
};

export function validateQuizAnswer(courseId: string, lessonIndex: number, answer: number): { valid: boolean; correct: boolean } {
  const courseKeys = QUIZ_ANSWER_KEYS[courseId];
  if (!courseKeys) return { valid: false, correct: false };
  const correctAnswer = courseKeys[lessonIndex];
  if (correctAnswer === undefined) return { valid: false, correct: false };
  return { valid: true, correct: answer === correctAnswer };
}
