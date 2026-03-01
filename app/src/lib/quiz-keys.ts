import 'server-only';

const QUIZ_KEYS: Record<string, Record<number, number[]>> = {
  'solana-101': {
    0: [1, 2, 0, 3],
    1: [0, 1, 2, 1],
    2: [2, 0, 3, 1],
    3: [1, 3, 0, 2],
  },
  'defi-201': {
    0: [0, 2, 1, 3],
    1: [3, 1, 0, 2],
    2: [1, 0, 3, 2],
  },
  'nft-201': {
    0: [2, 1, 0, 3],
    1: [0, 3, 2, 1],
    2: [1, 2, 3, 0],
  },
  'sec-301': {
    0: [3, 0, 1, 2],
    1: [1, 2, 3, 0],
    2: [0, 1, 2, 3],
  },
  'token-201': {
    0: [2, 3, 0, 1],
    1: [0, 1, 3, 2],
    2: [3, 2, 1, 0],
  },
};

export function validateQuizAnswers(
  courseId: string,
  lessonIndex: number,
  answers: number[],
): { correct: boolean; score: number; total: number } {
  const courseKeys = QUIZ_KEYS[courseId];
  if (!courseKeys) return { correct: false, score: 0, total: 0 };
  const expectedAnswers = courseKeys[lessonIndex];
  if (!expectedAnswers) return { correct: false, score: 0, total: 0 };

  let score = 0;
  const total = expectedAnswers.length;
  for (let i = 0; i < total; i++) {
    if (answers[i] === expectedAnswers[i]) score++;
  }
  return { correct: score === total, score, total };
}
