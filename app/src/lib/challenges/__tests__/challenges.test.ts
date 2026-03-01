import { describe, it, expect } from 'vitest';
import { getAllChallenges, getChallengesByCategory, getChallengesByDifficulty, getChallengeById } from '../index';

describe('Challenges', () => {
  const all = getAllChallenges();

  it('should have exactly 100 challenges', () => {
    expect(all).toHaveLength(100);
  });

  it('should have unique IDs', () => {
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(100);
  });

  it('should have 20 per category', () => {
    expect(getChallengesByCategory('solana-fundamentals')).toHaveLength(20);
    expect(getChallengesByCategory('defi')).toHaveLength(20);
    expect(getChallengesByCategory('nft-metaplex')).toHaveLength(20);
    expect(getChallengesByCategory('security')).toHaveLength(20);
    expect(getChallengesByCategory('token-extensions')).toHaveLength(20);
  });

  it('should have valid difficulty distribution', () => {
    const beginner = getChallengesByDifficulty('beginner');
    const intermediate = getChallengesByDifficulty('intermediate');
    const advanced = getChallengesByDifficulty('advanced');
    expect(beginner.length).toBeGreaterThanOrEqual(25);
    expect(intermediate.length).toBeGreaterThanOrEqual(30);
    expect(advanced.length).toBeGreaterThanOrEqual(25);
  });

  it('every challenge has 3 test cases and 3 hints', () => {
    for (const c of all) {
      expect(c.testCases).toHaveLength(3);
      expect(c.hints).toHaveLength(3);
    }
  });

  it('every challenge has non-empty starterCode and solution', () => {
    for (const c of all) {
      expect(c.starterCode.length).toBeGreaterThan(0);
      expect(c.solution.length).toBeGreaterThan(0);
    }
  });

  it('every challenge has valid xpReward', () => {
    for (const c of all) {
      expect([50, 100, 200]).toContain(c.xpReward);
    }
  });

  it('getChallengeById returns correct challenge', () => {
    const first = all[0]!;
    expect(getChallengeById(first.id)).toBe(first);
    expect(getChallengeById('nonexistent')).toBeUndefined();
  });
});
