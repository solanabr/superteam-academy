import { describe, it, expect } from 'vitest';
import {
  MOCK_COURSES,
  MOCK_LEADERBOARD,
  MOCK_CERTIFICATES,
  type Course,
  type CourseLevel,
  type CourseTrack,
} from '@/lib/mock-data';

describe('MOCK_COURSES', () => {
  it('has at least 8 courses', () => {
    expect(MOCK_COURSES.length).toBeGreaterThanOrEqual(8);
  });

  it('all courses have unique IDs', () => {
    const ids = MOCK_COURSES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all courses have unique slugs', () => {
    const slugs = MOCK_COURSES.map(c => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all courses have i18n titles (pt-BR, en, es)', () => {
    for (const c of MOCK_COURSES) {
      expect(c.title['pt-BR']).toBeTruthy();
      expect(c.title['en']).toBeTruthy();
      expect(c.title['es']).toBeTruthy();
    }
  });

  it('all courses have i18n descriptions', () => {
    for (const c of MOCK_COURSES) {
      expect(c.description['pt-BR']).toBeTruthy();
      expect(c.description['en']).toBeTruthy();
      expect(c.description['es']).toBeTruthy();
    }
  });

  it('all courses have valid levels', () => {
    const validLevels: CourseLevel[] = ['beginner', 'intermediate', 'advanced'];
    for (const c of MOCK_COURSES) {
      expect(validLevels).toContain(c.level);
    }
  });

  it('all courses have valid tracks', () => {
    const validTracks: CourseTrack[] = ['solana', 'defi', 'nft', 'web3', 'anchor'];
    for (const c of MOCK_COURSES) {
      expect(validTracks).toContain(c.track);
    }
  });

  it('all courses have positive XP rewards', () => {
    for (const c of MOCK_COURSES) {
      expect(c.xp_reward).toBeGreaterThan(0);
    }
  });

  it('all courses have at least 1 lesson', () => {
    for (const c of MOCK_COURSES) {
      expect(c.lesson_count).toBeGreaterThan(0);
    }
  });

  it('all courses have duration string', () => {
    for (const c of MOCK_COURSES) {
      expect(c.duration).toMatch(/\d+h/);
    }
  });

  it('all courses have tags', () => {
    for (const c of MOCK_COURSES) {
      expect(c.tags.length).toBeGreaterThan(0);
    }
  });

  it('all courses have non-negative enrollments', () => {
    for (const c of MOCK_COURSES) {
      expect(c.enrollments).toBeGreaterThanOrEqual(0);
    }
  });

  it('all courses have thumbnail color', () => {
    for (const c of MOCK_COURSES) {
      expect(c.thumbnail_color).toBeTruthy();
    }
  });

  it('all courses have thumbnail icon', () => {
    for (const c of MOCK_COURSES) {
      expect(c.thumbnail_icon).toBeTruthy();
    }
  });

  it('slugs contain only valid characters', () => {
    for (const c of MOCK_COURSES) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('MOCK_LEADERBOARD', () => {
  it('has at least 5 entries', () => {
    expect(MOCK_LEADERBOARD.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries have required fields', () => {
    for (const u of MOCK_LEADERBOARD) {
      expect(u.id).toBeTruthy();
      expect(u.username).toBeTruthy();
      expect(u.displayName).toBeTruthy();
      expect(u.walletAddress).toBeTruthy();
      expect(u.totalXP).toBeGreaterThanOrEqual(0);
      expect(u.level).toBeGreaterThanOrEqual(0);
    }
  });

  it('entries are sorted by XP descending', () => {
    for (let i = 1; i < MOCK_LEADERBOARD.length; i++) {
      expect(MOCK_LEADERBOARD[i - 1].totalXP).toBeGreaterThanOrEqual(
        MOCK_LEADERBOARD[i].totalXP
      );
    }
  });
});

describe('MOCK_CERTIFICATES', () => {
  it('has at least 3 certificates', () => {
    expect(MOCK_CERTIFICATES.length).toBeGreaterThanOrEqual(3);
  });

  it('all certificates have required fields', () => {
    for (const c of MOCK_CERTIFICATES) {
      expect(c.id).toBeTruthy();
      expect(c.courseId).toBeTruthy();
      expect(c.courseName['pt-BR']).toBeTruthy();
      expect(c.courseName['en']).toBeTruthy();
      expect(c.courseName['es']).toBeTruthy();
      expect(c.issuedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.credentialId).toBeTruthy();
      expect(c.txSignature).toBeTruthy();
      expect(c.skills.length).toBeGreaterThan(0);
    }
  });

  it('certificate courseIds reference valid courses', () => {
    const courseIds = new Set(MOCK_COURSES.map(c => c.id));
    for (const cert of MOCK_CERTIFICATES) {
      expect(courseIds.has(cert.courseId)).toBe(true);
    }
  });
});
