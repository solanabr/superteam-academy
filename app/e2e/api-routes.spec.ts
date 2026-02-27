import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('API Routes', () => {
  test.describe('GET /api/health', () => {
    test('returns healthy status', async ({ request }) => {
      const res = await request.get(`${BASE}/api/health`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBeTruthy();
      expect(data.timestamp).toBeTruthy();
    });

    test('includes service status', async ({ request }) => {
      const res = await request.get(`${BASE}/api/health`);
      const data = await res.json();
      expect(data.services).toBeDefined();
      expect(typeof data.services.sanity).toBe('boolean');
    });
  });

  test.describe('GET /api/courses', () => {
    test('returns list of courses', async ({ request }) => {
      const res = await request.get(`${BASE}/api/courses`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.courses).toBeDefined();
      expect(data.courses.length).toBeGreaterThan(0);
      expect(data.pagination).toBeDefined();
    });

    test('supports track filter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/courses?track=solana`);
      const data = await res.json();
      for (const c of data.courses) {
        expect(c.track).toBe('solana');
      }
    });

    test('supports level filter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/courses?level=beginner`);
      const data = await res.json();
      for (const c of data.courses) {
        expect(c.level).toBe('beginner');
      }
    });

    test('supports pagination', async ({ request }) => {
      const res = await request.get(`${BASE}/api/courses?page=1&limit=3`);
      const data = await res.json();
      expect(data.courses.length).toBeLessThanOrEqual(3);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(3);
    });
  });

  test.describe('GET /api/courses/[slug]', () => {
    test('returns course by slug', async ({ request }) => {
      const res = await request.get(`${BASE}/api/courses/solana-101`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.course.slug).toBe('solana-101');
    });

    test('returns 404 for unknown slug', async ({ request }) => {
      const res = await request.get(`${BASE}/api/courses/nonexistent`);
      expect(res.status()).toBe(404);
    });
  });

  test.describe('GET /api/leaderboard', () => {
    test('returns leaderboard', async ({ request }) => {
      const res = await request.get(`${BASE}/api/leaderboard`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.leaderboard).toBeDefined();
      expect(data.leaderboard.length).toBeGreaterThan(0);
    });

    test('supports limit', async ({ request }) => {
      const res = await request.get(`${BASE}/api/leaderboard?limit=2`);
      const data = await res.json();
      expect(data.leaderboard.length).toBeLessThanOrEqual(2);
    });

    test('supports country filter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/leaderboard?country=BR`);
      const data = await res.json();
      for (const u of data.leaderboard) {
        expect(u.country).toBe('BR');
      }
    });
  });

  test.describe('GET /api/achievements', () => {
    test('returns all achievements', async ({ request }) => {
      const res = await request.get(`${BASE}/api/achievements`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.achievements.length).toBe(10);
      expect(data.total).toBe(10);
    });
  });

  test.describe('GET /api/certificates', () => {
    test('returns certificates', async ({ request }) => {
      const res = await request.get(`${BASE}/api/certificates`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.certificates).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/certificates/[id]', () => {
    test('returns certificate by ID', async ({ request }) => {
      const res = await request.get(`${BASE}/api/certificates/cert-001`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.certificate.courseId).toBe('solana-101');
    });

    test('returns 404 for unknown ID', async ({ request }) => {
      const res = await request.get(`${BASE}/api/certificates/fake-id`);
      expect(res.status()).toBe(404);
    });
  });

  test.describe('GET /api/challenges', () => {
    test('returns challenges', async ({ request }) => {
      const res = await request.get(`${BASE}/api/challenges`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.challenges.length).toBeGreaterThan(0);
    });

    test('supports track filter', async ({ request }) => {
      const res = await request.get(`${BASE}/api/challenges?track=solana`);
      const data = await res.json();
      expect(data.challenges.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/community/threads', () => {
    test('returns threads', async ({ request }) => {
      const res = await request.get(`${BASE}/api/community/threads`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.threads.length).toBeGreaterThan(0);
    });
  });

  test.describe('POST /api/quiz/validate', () => {
    test('validates correct answer', async ({ request }) => {
      const res = await request.post(`${BASE}/api/quiz/validate`, {
        data: { courseId: 'solana-101', lessonIndex: 0, answer: 2 },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.correct).toBe(true);
    });

    test('rejects wrong answer', async ({ request }) => {
      const res = await request.post(`${BASE}/api/quiz/validate`, {
        data: { courseId: 'solana-101', lessonIndex: 0, answer: 0 },
      });
      const data = await res.json();
      expect(data.correct).toBe(false);
    });

    test('returns 400 for missing fields', async ({ request }) => {
      const res = await request.post(`${BASE}/api/quiz/validate`, {
        data: { courseId: 'solana-101' },
      });
      expect(res.status()).toBe(400);
    });

    test('returns 404 for unknown course', async ({ request }) => {
      const res = await request.post(`${BASE}/api/quiz/validate`, {
        data: { courseId: 'fake', lessonIndex: 0, answer: 0 },
      });
      expect(res.status()).toBe(404);
    });
  });

  test.describe('POST /api/analytics/events', () => {
    test('accepts valid event', async ({ request }) => {
      const res = await request.post(`${BASE}/api/analytics/events`, {
        data: { event: 'page_view', data: { page: '/courses' } },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.received).toBe(true);
    });

    test('rejects invalid event', async ({ request }) => {
      const res = await request.post(`${BASE}/api/analytics/events`, {
        data: { event: 'invalid_event', data: {} },
      });
      expect(res.status()).toBe(400);
    });
  });
});
