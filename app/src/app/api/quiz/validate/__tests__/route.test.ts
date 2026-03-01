// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/solana/server/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/quiz-keys', () => ({
  validateQuizAnswers: vi.fn(
    (courseId: string, lessonIndex: number, answers: number[]) => {
      if (courseId === 'solana-101' && lessonIndex === 0) {
        const expected = [1, 2, 0, 3];
        let score = 0;
        for (let i = 0; i < expected.length; i++) {
          if (answers[i] === expected[i]) score++;
        }
        return {
          correct: score === expected.length,
          score,
          total: expected.length,
        };
      }
      return { correct: false, score: 0, total: 0 };
    },
  ),
}));

import { POST } from '../route';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/quiz/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/quiz/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct result for valid answers', async () => {
    const response = await POST(
      makeRequest({
        courseId: 'solana-101',
        lessonIndex: 0,
        answers: [1, 2, 0, 3],
        wallet: 'TestWallet123',
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.correct).toBe(true);
    expect(data.score).toBe(4);
    expect(data.total).toBe(4);
    expect(data.xpAwarded).toBe(25);
  });

  it('returns incorrect for wrong answers', async () => {
    const response = await POST(
      makeRequest({
        courseId: 'solana-101',
        lessonIndex: 0,
        answers: [0, 0, 0, 0],
        wallet: 'TestWallet123',
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.correct).toBe(false);
    expect(data.xpAwarded).toBe(0);
  });

  it('returns 400 for missing fields', async () => {
    const response = await POST(makeRequest({ courseId: 'solana-101' }));
    expect(response.status).toBe(400);
  });

  it('returns 0 for unknown course', async () => {
    const response = await POST(
      makeRequest({
        courseId: 'unknown',
        lessonIndex: 0,
        answers: [1, 2, 3],
        wallet: 'TestWallet123',
      }),
    );
    const data = await response.json();
    expect(data.correct).toBe(false);
    expect(data.total).toBe(0);
  });

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import(
      '@/lib/solana/server/rate-limit'
    );
    (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      allowed: false,
      retryAfter: 30,
    });
    const response = await POST(
      makeRequest({
        courseId: 'solana-101',
        lessonIndex: 0,
        answers: [1, 2, 0, 3],
        wallet: 'TestWallet123',
      }),
    );
    expect(response.status).toBe(429);
  });
});
