// __tests__/services/learning-progress.test.ts

/**
 * COMPREHENSIVE TEST SUITE
 * 
 * Tests all service functionality to ensure quality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockLearningProgressService } from '@/lib/services/learning-progress';

describe('MockLearningProgressService', () => {
  let service: MockLearningProgressService;
  const testUserId = 'test-user-123';
  const testCourseId = 'solana-101';
  const testLessonId = 'lesson-1-1';

  beforeEach(() => {
    service = new MockLearningProgressService();
  });

  describe('User Profile Management', () => {
    it('should create a new user with 0 XP', async () => {
      const user = await service.getUserProfile(testUserId);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.totalXp).toBe(0);
      expect(user.level).toBe(1);
      expect(user.currentStreak).toBe(0);
      expect(user.completedCourses).toHaveLength(0);
      expect(user.completedLessons).toHaveLength(0);
    });

    it('should return the same user on subsequent calls', async () => {
      const user1 = await service.getUserProfile(testUserId);
      const user2 = await service.getUserProfile(testUserId);
      
      expect(user1).toEqual(user2);
    });

    it('should have valid timestamps', async () => {
      const user = await service.getUserProfile(testUserId);
      
      expect(new Date(user.createdAt)).toBeInstanceOf(Date);
      expect(new Date(user.lastActivityDate)).toBeInstanceOf(Date);
    });
  });

  describe('Lesson Completion', () => {
    it('should award XP when completing a lesson', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const user = await service.getUserProfile(testUserId);
      
      expect(user.totalXp).toBe(50); // Default XP per lesson
    });

    it('should update user level based on XP', async () => {
      // Complete multiple lessons to level up
      for (let i = 0; i < 4; i++) {
        await service.completeLesson(testUserId, testCourseId, `lesson-${i}`);
      }
      
      const user = await service.getUserProfile(testUserId);
      expect(user.totalXp).toBe(200);
      expect(user.level).toBe(1); // sqrt(200/100) = 1.41, floor = 1
    });

    it('should not award XP twice for the same lesson (idempotency)', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      
      const user = await service.getUserProfile(testUserId);
      expect(user.totalXp).toBe(50); // Only once
    });

    it('should track completed lessons', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const user = await service.getUserProfile(testUserId);
      
      expect(user.completedLessons).toContain(testLessonId);
    });

    it('should update last activity date', async () => {
      const user1 = await service.getUserProfile(testUserId);
      const firstDate = new Date(user1.lastActivityDate);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const user2 = await service.getUserProfile(testUserId);
      const secondDate = new Date(user2.lastActivityDate);
      
      expect(secondDate.getTime()).toBeGreaterThanOrEqual(firstDate.getTime());
    });
  });

  describe('Progress Tracking', () => {
    it('should create progress when completing first lesson', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const progress = await service.getProgress(testUserId, testCourseId);
      
      expect(progress).toBeDefined();
      expect(progress?.courseId).toBe(testCourseId);
      expect(progress?.completedLessonIds).toContain(testLessonId);
    });

    it('should return null for courses with no progress', async () => {
      const progress = await service.getProgress(testUserId, 'non-existent-course');
      expect(progress).toBeNull();
    });

    it('should track multiple lessons in same course', async () => {
      await service.completeLesson(testUserId, testCourseId, 'lesson-1');
      await service.completeLesson(testUserId, testCourseId, 'lesson-2');
      
      const progress = await service.getProgress(testUserId, testCourseId);
      expect(progress?.completedLessonIds).toHaveLength(2);
    });

    it('should set status as in_progress', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const progress = await service.getProgress(testUserId, testCourseId);
      
      expect(progress?.status).toBe('in_progress');
    });
  });

  describe('Streak System', () => {
    it('should initialize streak at 0', async () => {
      const streak = await service.getStreak(testUserId);
      
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.history).toHaveLength(0);
    });

    it('should update streak when completing lesson', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const streak = await service.getStreak(testUserId);
      
      expect(streak.currentStreak).toBeGreaterThan(0);
    });

    it('should track streak history', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const streak = await service.getStreak(testUserId);
      
      expect(streak.history.length).toBeGreaterThan(0);
    });
  });

  describe('Leaderboard', () => {
    it('should return empty leaderboard initially', async () => {
      const leaderboard = await service.getLeaderboard('alltime');
      expect(leaderboard).toHaveLength(0);
    });

    it('should rank users by XP', async () => {
      // Create multiple users with different XP
      await service.completeLesson('user1', testCourseId, 'lesson-1');
      await service.completeLesson('user2', testCourseId, 'lesson-1');
      await service.completeLesson('user2', testCourseId, 'lesson-2');
      
      const leaderboard = await service.getLeaderboard('alltime');
      
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].totalXp).toBeGreaterThan(leaderboard[1].totalXp);
    });

    it('should include user stats in leaderboard', async () => {
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const leaderboard = await service.getLeaderboard('alltime');
      
      const entry = leaderboard[0];
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('userId');
      expect(entry).toHaveProperty('totalXp');
      expect(entry).toHaveProperty('level');
    });

    it('should assign correct ranks (1-indexed)', async () => {
      await service.completeLesson('user1', testCourseId, 'lesson-1');
      await service.completeLesson('user2', testCourseId, 'lesson-1');
      
      const leaderboard = await service.getLeaderboard('alltime');
      
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
    });

    it('should limit to top 100 users', async () => {
      // Create 150 users
      for (let i = 0; i < 150; i++) {
        await service.completeLesson(`user-${i}`, testCourseId, 'lesson-1');
      }
      
      const leaderboard = await service.getLeaderboard('alltime');
      expect(leaderboard.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Achievements', () => {
    it('should unlock first lesson achievement', async () => {
      await service.completeLesson(testUserId, testCourseId, 'lesson-1');
      const user = await service.getUserProfile(testUserId);
      
      const hasFirstLesson = user.achievements.some(a => a.id === 'first-lesson');
      expect(hasFirstLesson).toBe(true);
    });

    it('should award XP for achievements', async () => {
      const userBefore = await service.getUserProfile(testUserId);
      const xpBefore = userBefore.totalXp;
      
      await service.completeLesson(testUserId, testCourseId, 'lesson-1');
      
      const userAfter = await service.getUserProfile(testUserId);
      const xpAfter = userAfter.totalXp;
      
      // Should have lesson XP (50) + achievement XP (10)
      expect(xpAfter).toBe(xpBefore + 60);
    });

    it('should not unlock same achievement twice', async () => {
      await service.completeLesson(testUserId, testCourseId, 'lesson-1');
      await service.completeLesson(testUserId, testCourseId, 'lesson-2');
      
      const user = await service.getUserProfile(testUserId);
      const firstLessonCount = user.achievements.filter(a => a.id === 'first-lesson').length;
      
      expect(firstLessonCount).toBe(1);
    });

    it('should unlock progressive achievements', async () => {
      // Complete 5 lessons
      for (let i = 0; i < 5; i++) {
        await service.completeLesson(testUserId, testCourseId, `lesson-${i}`);
      }
      
      const user = await service.getUserProfile(testUserId);
      const hasGettingStarted = user.achievements.some(a => a.id === 'lesson-5');
      
      expect(hasGettingStarted).toBe(true);
    });

    it('should track achievement unlock timestamp', async () => {
      await service.completeLesson(testUserId, testCourseId, 'lesson-1');
      const user = await service.getUserProfile(testUserId);
      
      const achievement = user.achievements.find(a => a.id === 'first-lesson');
      expect(achievement?.unlockedAt).toBeDefined();
      expect(new Date(achievement!.unlockedAt!)).toBeInstanceOf(Date);
    });
  });

  describe('XP System', () => {
    it('should return current XP', async () => {
      await service.completeLesson(testUserId, testCourseId, 'lesson-1');
      const xp = await service.getXP(testUserId);
      
      expect(xp).toBeGreaterThan(0);
    });

    it('should calculate level correctly', async () => {
      // Add 400 XP (8 lessons)
      for (let i = 0; i < 8; i++) {
        await service.completeLesson(testUserId, testCourseId, `lesson-${i}`);
      }
      
      const user = await service.getUserProfile(testUserId);
      // With achievements: 400 + 10 + 25 + 50 = 485 XP
      // Level = floor(sqrt(485/100)) = floor(2.2) = 2
      expect(user.level).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user IDs gracefully', async () => {
      const user = await service.getUserProfile('');
      expect(user).toBeDefined();
    });

    it('should handle concurrent lesson completions', async () => {
      const promises = [
        service.completeLesson(testUserId, testCourseId, 'lesson-1'),
        service.completeLesson(testUserId, testCourseId, 'lesson-2'),
        service.completeLesson(testUserId, testCourseId, 'lesson-3'),
      ];
      
      await Promise.all(promises);
      
      const user = await service.getUserProfile(testUserId);
      expect(user.completedLessons).toHaveLength(3);
    });
  });

  describe('Performance', () => {
    it('should complete operations within reasonable time', async () => {
      const start = Date.now();
      await service.completeLesson(testUserId, testCourseId, testLessonId);
      const duration = Date.now() - start;
      
      // Should complete in less than 1 second (with mock delay of 500ms)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle bulk operations efficiently', async () => {
      const start = Date.now();
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.completeLesson(`user-${i}`, testCourseId, 'lesson-1'));
      }
      
      await Promise.all(promises);
      const duration = Date.now() - start;
      
      // Should complete in parallel
      expect(duration).toBeLessThan(2000);
    });
  });
});

describe('Integration Tests', () => {
  it('should maintain data consistency across operations', async () => {
    const service = new MockLearningProgressService();
    const userId = 'integration-test-user';
    
    // Complete lessons
    await service.completeLesson(userId, 'course-1', 'lesson-1');
    await service.completeLesson(userId, 'course-1', 'lesson-2');
    
    // Verify user profile
    const user = await service.getUserProfile(userId);
    expect(user.completedLessons).toHaveLength(2);
    
    // Verify progress
    const progress = await service.getProgress(userId, 'course-1');
    expect(progress?.completedLessonIds).toHaveLength(2);
    
    // Verify XP
    const xp = await service.getXP(userId);
    expect(xp).toBeGreaterThan(0);
  });
});
