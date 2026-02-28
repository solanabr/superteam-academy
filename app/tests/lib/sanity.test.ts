import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SANITY_CONFIG, isSanityConfigured, sanityFetch, QUERIES } from '@/lib/sanity';

describe('SANITY_CONFIG', () => {
  it('has apiVersion set', () => {
    expect(SANITY_CONFIG.apiVersion).toBe('2025-02-01');
  });

  it('has dataset defaulting to production', () => {
    expect(SANITY_CONFIG.dataset).toBe('production');
  });

  it('projectId defaults to empty string without env var', () => {
    expect(typeof SANITY_CONFIG.projectId).toBe('string');
  });
});

describe('isSanityConfigured', () => {
  it('is false when projectId is empty', () => {
    // In test environment without env vars, should be false
    expect(isSanityConfigured).toBe(false);
  });
});

describe('sanityFetch', () => {
  it('returns null when Sanity is not configured', async () => {
    const result = await sanityFetch('*[_type == "course"]');
    expect(result).toBeNull();
  });

  it('returns null with params when not configured', async () => {
    const result = await sanityFetch('*[_type == "course" && slug == ]', { slug: 'test' });
    expect(result).toBeNull();
  });
});

describe('QUERIES', () => {
  it('has courses query', () => {
    expect(QUERIES.courses).toBeTruthy();
    expect(QUERIES.courses).toContain('course');
  });

  it('has courseBySlug query', () => {
    expect(QUERIES.courseBySlug).toBeTruthy();
    expect(QUERIES.courseBySlug).toContain('slug');
  });

  it('has leaderboard query', () => {
    expect(QUERIES.leaderboard).toBeTruthy();
    expect(QUERIES.leaderboard).toContain('userProfile');
  });

  it('courses query orders by order asc', () => {
    expect(QUERIES.courses).toContain('order asc');
  });

  it('leaderboard query orders by xp desc', () => {
    expect(QUERIES.leaderboard).toContain('xp desc');
  });

  it('courseBySlug query uses  parameter', () => {
    expect(QUERIES.courseBySlug).toContain('');
  });
});
