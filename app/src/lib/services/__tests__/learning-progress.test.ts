// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockLearningProgressService,
  createLearningProgressService,
} from '../learning-progress';

describe('MockLearningProgressService', () => {
  let service: MockLearningProgressService;

  beforeEach(() => {
    service = new MockLearningProgressService();
  });

  describe('getProgressForUserCourse', () => {
    it('returns known course data for intro-to-solana', async () => {
      const progress = await service.getProgressForUserCourse('user-1', 'intro-to-solana');

      expect(progress.courseId).toBe('intro-to-solana');
      expect(progress.completedLessons).toBe(5);
      expect(progress.totalLessons).toBe(8);
      expect(progress.progressPercent).toBe(62.5);
      expect(progress.isFinalized).toBe(false);
    });

    it('returns empty progress for unknown course', async () => {
      const progress = await service.getProgressForUserCourse('user-1', 'nonexistent-course');

      expect(progress.courseId).toBe('nonexistent-course');
      expect(progress.completedLessons).toBe(0);
      expect(progress.totalLessons).toBe(0);
      expect(progress.progressPercent).toBe(0);
      expect(progress.isFinalized).toBe(false);
    });
  });

  describe('completeLesson', () => {
    it('increments completed count in returned courseProgress', async () => {
      const result = await service.completeLesson('user-1', 'intro-to-solana', 'lesson-6');

      expect(result.success).toBe(true);
      expect(result.xpAwarded).toBe(25);
      expect(result.courseProgress.completedLessons).toBe(6);
      expect(result.courseProgress.totalLessons).toBe(8);
      expect(result.courseProgress.progressPercent).toBe(75);
      expect(result.courseProgress.isFinalized).toBe(false);
    });

    it('marks finalized when all lessons are completed', async () => {
      // anchor-fundamentals has 12/12 completed, so completing another gives 13/12
      // But token-extensions has 0/6, so completing pushes to 1/6
      // To trigger isFinalized, we need a course where completed + 1 >= total
      // anchor-fundamentals: 12 completed, 12 total → 13 >= 12 → finalized
      const result = await service.completeLesson('user-1', 'anchor-fundamentals', 'lesson-extra');

      expect(result.courseProgress.completedLessons).toBe(13);
      expect(result.courseProgress.isFinalized).toBe(true);
    });
  });

  describe('getXPBalance', () => {
    it('returns mock XP value of 1250', async () => {
      const balance = await service.getXPBalance('7xKJ...mock1');

      expect(balance).toBe(1250);
    });
  });

  describe('getStreakData', () => {
    it('returns valid streak data with correct structure and types', async () => {
      const streak = await service.getStreakData('user-1');

      expect(streak.currentStreak).toBe(12);
      expect(streak.longestStreak).toBe(34);
      expect(typeof streak.lastActiveDate).toBe('string');
      expect(streak.lastActiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(streak.freezesAvailable).toBe(2);
      expect(streak.isFreezeActiveToday).toBe(false);
    });
  });

  describe('getLeaderboardEntries', () => {
    it('returns sorted entries with 5 entries in descending XP order', async () => {
      const entries = await service.getLeaderboardEntries('weekly');

      expect(entries).toHaveLength(5);
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i - 1]!.xpBalance).toBeGreaterThan(entries[i]!.xpBalance);
      }
    });

    it('assigns correct ranks 1 through 5', async () => {
      const entries = await service.getLeaderboardEntries('all_time');

      entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });
  });

  describe('getCredentialsForWallet', () => {
    it('returns 2 mock credentials with expected fields', async () => {
      const walletAddr = '7xKJ...mock1';
      const credentials = await service.getCredentialsForWallet(walletAddr);

      expect(credentials).toHaveLength(2);
      expect(credentials[0]!.name).toBe('Solana Foundations Certificate');
      expect(credentials[0]!.owner).toBe(walletAddr);
      expect(credentials[1]!.name).toBe('Anchor Developer Certificate');
      expect(credentials[1]!.owner).toBe(walletAddr);
      expect(credentials[0]!.assetId).toBe('mock-credential-001');
      expect(credentials[1]!.assetId).toBe('mock-credential-002');
    });
  });
});

describe('createLearningProgressService', () => {
  it('returns a MockLearningProgressService instance', () => {
    const service = createLearningProgressService();

    expect(service).toBeInstanceOf(MockLearningProgressService);
  });
});
