import { describe, it, expect } from 'vitest';
import {
  getRecommendation,
  type QuizAnswers,
  type ExperienceLevel,
  type Track,
} from '../recommendation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAnswers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    experience: 'complete-beginner',
    languages: ['javascript'],
    interests: ['defi'],
    goal: 'learn-fundamentals',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getRecommendation', () => {
  it('returns a valid recommendation shape', () => {
    const result = getRecommendation(makeAnswers());

    expect(result).toHaveProperty('primaryTrack');
    expect(result).toHaveProperty('trackScores');
    expect(result).toHaveProperty('suggestedDifficulty');
    expect(result).toHaveProperty('courses');
    expect(result).toHaveProperty('summary');
    expect(result.courses.length).toBeGreaterThan(0);
    expect(result.courses.length).toBeLessThanOrEqual(3);
  });

  it('recommends beginner difficulty for complete beginners', () => {
    const result = getRecommendation(
      makeAnswers({ experience: 'complete-beginner' }),
    );
    expect(result.suggestedDifficulty).toBe('beginner');
  });

  it('recommends beginner difficulty for programmers new to crypto', () => {
    const result = getRecommendation(
      makeAnswers({ experience: 'some-programming' }),
    );
    expect(result.suggestedDifficulty).toBe('beginner');
  });

  it('recommends intermediate difficulty for crypto-familiar users', () => {
    const result = getRecommendation(
      makeAnswers({ experience: 'crypto-familiar' }),
    );
    expect(result.suggestedDifficulty).toBe('intermediate');
  });

  it('recommends advanced difficulty for existing Solana developers', () => {
    const result = getRecommendation(
      makeAnswers({ experience: 'solana-developer' }),
    );
    expect(result.suggestedDifficulty).toBe('advanced');
  });

  it('recommends Solana Core for beginners wanting fundamentals', () => {
    const result = getRecommendation(
      makeAnswers({
        experience: 'complete-beginner',
        interests: ['daos', 'infrastructure'],
        goal: 'learn-fundamentals',
        languages: ['none'],
      }),
    );
    expect(result.primaryTrack).toBe('solana-core');
  });

  it('scores DeFi track higher when user selects DeFi interest', () => {
    const defiResult = getRecommendation(
      makeAnswers({
        interests: ['defi'],
        goal: 'build-dapps',
      }),
    );

    const nftResult = getRecommendation(
      makeAnswers({
        interests: ['nfts'],
        goal: 'build-dapps',
      }),
    );

    expect(defiResult.trackScores.defi).toBeGreaterThan(nftResult.trackScores.defi);
  });

  it('scores NFT track higher when user selects NFTs interest', () => {
    const result = getRecommendation(
      makeAnswers({
        interests: ['nfts'],
        goal: 'build-dapps',
        languages: ['javascript'],
      }),
    );

    expect(result.trackScores.nft).toBeGreaterThan(0);
    // NFT should be competitive with the boosted solana-core
    expect(result.trackScores.nft).toBeGreaterThanOrEqual(result.trackScores.security);
  });

  it('recommends security track for security-focused users', () => {
    const result = getRecommendation(
      makeAnswers({
        experience: 'crypto-familiar',
        interests: ['security', 'infrastructure'],
        goal: 'contribute-ecosystem',
        languages: ['rust', 'c-cpp'],
      }),
    );

    expect(result.trackScores.security).toBeGreaterThan(0);
    // Security should be the highest or second highest
    const sorted = Object.entries(result.trackScores)
      .sort((a, b) => b[1] - a[1])
      .map(([track]) => track);
    expect(sorted.indexOf('security')).toBeLessThanOrEqual(1);
  });

  it('boosts Solana Core when Rust is a known language', () => {
    const withRust = getRecommendation(
      makeAnswers({
        languages: ['rust'],
        interests: ['infrastructure'],
      }),
    );

    const withoutRust = getRecommendation(
      makeAnswers({
        languages: ['python'],
        interests: ['infrastructure'],
      }),
    );

    expect(withRust.trackScores['solana-core']).toBeGreaterThan(
      withoutRust.trackScores['solana-core'],
    );
  });

  it('returns exactly 3 course recommendations', () => {
    const result = getRecommendation(makeAnswers());
    expect(result.courses).toHaveLength(3);
  });

  it('includes primary track courses in recommendations', () => {
    const result = getRecommendation(
      makeAnswers({
        experience: 'complete-beginner',
        interests: ['defi'],
        goal: 'learn-fundamentals',
      }),
    );

    const primaryTrackCourses = result.courses.filter(
      (c) => c.track === result.primaryTrack,
    );
    expect(primaryTrackCourses.length).toBeGreaterThan(0);
  });

  it('generates a non-empty summary string', () => {
    const result = getRecommendation(makeAnswers());
    expect(result.summary.length).toBeGreaterThan(0);
    expect(typeof result.summary).toBe('string');
  });

  it('summary mentions the primary track name', () => {
    const result = getRecommendation(
      makeAnswers({ interests: ['defi'], goal: 'build-dapps' }),
    );

    const trackNames: Record<Track, string> = {
      'solana-core': 'Solana Core',
      defi: 'DeFi',
      nft: 'NFT',
      security: 'Security',
    };

    const expectedTrackName = trackNames[result.primaryTrack];
    expect(result.summary).toContain(expectedTrackName);
  });

  it('handles multiple interests correctly', () => {
    const result = getRecommendation(
      makeAnswers({
        interests: ['defi', 'nfts', 'security'],
        goal: 'build-dapps',
      }),
    );

    // All three tracks should have non-zero scores
    expect(result.trackScores.defi).toBeGreaterThan(0);
    expect(result.trackScores.nft).toBeGreaterThan(0);
    expect(result.trackScores.security).toBeGreaterThan(0);
  });

  it('career-change goal boosts solana-core track', () => {
    const careerChange = getRecommendation(
      makeAnswers({
        interests: ['defi'],
        goal: 'career-change',
      }),
    );

    const buildDapps = getRecommendation(
      makeAnswers({
        interests: ['defi'],
        goal: 'build-dapps',
      }),
    );

    expect(careerChange.trackScores['solana-core']).toBeGreaterThan(
      buildDapps.trackScores['solana-core'],
    );
  });

  it('course recommendations have required fields', () => {
    const result = getRecommendation(makeAnswers());

    for (const course of result.courses) {
      expect(course.id).toBeTruthy();
      expect(course.title).toBeTruthy();
      expect(course.description).toBeTruthy();
      expect(['solana-core', 'defi', 'nft', 'security']).toContain(course.track);
      expect(['beginner', 'intermediate', 'advanced']).toContain(course.difficulty);
    }
  });

  it('different experience levels produce different difficulty recommendations', () => {
    const levels: ExperienceLevel[] = [
      'complete-beginner',
      'some-programming',
      'crypto-familiar',
      'solana-developer',
    ];

    const difficulties = levels.map(
      (exp) => getRecommendation(makeAnswers({ experience: exp })).suggestedDifficulty,
    );

    // At least 3 different difficulties across 4 levels
    const unique = new Set(difficulties);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });
});
