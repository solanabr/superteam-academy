import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sanity module before importing content
vi.mock('@/lib/sanity', () => ({
  isSanityConfigured: false,
  sanityFetch: vi.fn().mockResolvedValue(null),
  QUERIES: { courses: '', courseBySlug: '', leaderboard: '' },
}));

import {
  getCourses,
  getCourseBySlug,
  getCoursesByTrack,
  getCoursesByLevel,
  getLeaderboard,
  getCertificates,
  getCertificateById,
  contentSource,
} from '@/lib/content';
import { MOCK_COURSES, MOCK_LEADERBOARD, MOCK_CERTIFICATES } from '@/lib/mock-data';

describe('getCourses', () => {
  it('returns mock courses when Sanity is not configured', async () => {
    const courses = await getCourses();
    expect(courses).toEqual(MOCK_COURSES);
    expect(courses.length).toBeGreaterThan(0);
  });

  it('returns courses with required fields', async () => {
    const courses = await getCourses();
    for (const c of courses) {
      expect(c.id).toBeTruthy();
      expect(c.slug).toBeTruthy();
      expect(c.title['pt-BR']).toBeTruthy();
      expect(c.title['en']).toBeTruthy();
      expect(c.title['es']).toBeTruthy();
    }
  });
});

describe('getCourseBySlug', () => {
  it('returns course for valid slug', async () => {
    const course = await getCourseBySlug('solana-101');
    expect(course).not.toBeNull();
    expect(course?.slug).toBe('solana-101');
  });

  it('returns null for invalid slug', async () => {
    const course = await getCourseBySlug('nonexistent-course');
    expect(course).toBeNull();
  });

  it('returns correct course data', async () => {
    const course = await getCourseBySlug('anchor-framework');
    expect(course?.title.en).toBe('Development with Anchor');
    expect(course?.level).toBe('intermediate');
    expect(course?.track).toBe('anchor');
  });
});

describe('getCoursesByTrack', () => {
  it('filters by solana track', async () => {
    const courses = await getCoursesByTrack('solana');
    expect(courses.length).toBeGreaterThan(0);
    for (const c of courses) {
      expect(c.track).toBe('solana');
    }
  });

  it('filters by defi track', async () => {
    const courses = await getCoursesByTrack('defi');
    expect(courses.length).toBeGreaterThan(0);
    for (const c of courses) {
      expect(c.track).toBe('defi');
    }
  });

  it('returns empty for unknown track', async () => {
    const courses = await getCoursesByTrack('unknown');
    expect(courses).toEqual([]);
  });
});

describe('getCoursesByLevel', () => {
  it('filters by beginner level', async () => {
    const courses = await getCoursesByLevel('beginner');
    expect(courses.length).toBeGreaterThan(0);
    for (const c of courses) {
      expect(c.level).toBe('beginner');
    }
  });

  it('filters by intermediate level', async () => {
    const courses = await getCoursesByLevel('intermediate');
    expect(courses.length).toBeGreaterThan(0);
  });

  it('filters by advanced level', async () => {
    const courses = await getCoursesByLevel('advanced');
    expect(courses.length).toBeGreaterThan(0);
  });
});

describe('getLeaderboard', () => {
  it('returns mock leaderboard', async () => {
    const users = await getLeaderboard();
    expect(users).toEqual(MOCK_LEADERBOARD);
  });

  it('respects limit parameter', async () => {
    const users = await getLeaderboard(2);
    expect(users).toHaveLength(2);
  });
});

describe('getCertificates', () => {
  it('returns all mock certificates', async () => {
    const certs = await getCertificates();
    expect(certs).toEqual(MOCK_CERTIFICATES);
  });
});

describe('getCertificateById', () => {
  it('returns certificate for valid id', async () => {
    const cert = await getCertificateById('cert-001');
    expect(cert).not.toBeNull();
    expect(cert?.courseId).toBe('solana-101');
  });

  it('returns null for invalid id', async () => {
    const cert = await getCertificateById('nonexistent');
    expect(cert).toBeNull();
  });
});

describe('contentSource', () => {
  it('returns mock when Sanity is not configured', () => {
    expect(contentSource).toBe('mock');
  });
});
