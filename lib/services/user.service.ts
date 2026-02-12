/**
 * User Service - Manages user profiles, progress, and achievements
 */

import { createClient } from '@/lib/supabase/server';
import type { Profile, UserProgress, Achievement, UserAchievement } from '@/lib/types';

export class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[v0] Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Error updating profile:', error);
      return null;
    }

    return data as Profile;
  }

  /**
   * Get user progress (XP, level, streaks)
   */
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[v0] Error fetching user progress:', error);
      return null;
    }

    return data as UserProgress;
  }

  /**
   * Add XP to user (stubbed for MVP)
   */
  async addXP(userId: string, xpAmount: number): Promise<UserProgress | null> {
    const supabase = await createClient();
    
    // Get current progress
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentProgress) return null;

    const newTotalXP = currentProgress.total_xp + xpAmount;
    const newLevel = this.calculateLevel(newTotalXP);

    // Update progress
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Error adding XP:', error);
      return null;
    }

    // Check for XP-based achievements
    await this.checkXPAchievements(userId, newTotalXP);

    return data as UserProgress;
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string): Promise<UserProgress | null> {
    const supabase = await createClient();
    
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentProgress) return null;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = currentProgress.last_activity_date;

    let newStreak = currentProgress.current_streak;
    let newLongestStreak = currentProgress.longest_streak;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
        newLongestStreak = Math.max(newStreak, newLongestStreak);
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If diffDays === 0, same day, no change
    } else {
      // First activity
      newStreak = 1;
      newLongestStreak = 1;
    }

    const { data, error } = await supabase
      .from('user_progress')
      .update({
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Error updating streak:', error);
      return null;
    }

    // Check for streak-based achievements
    await this.checkStreakAchievements(userId, newStreak);

    return data as UserProgress;
  }

  /**
   * Get leaderboard (top users by XP)
   */
  async getLeaderboard(limit: number = 100): Promise<Array<Profile & UserProgress>> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        profiles (*)
      `)
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[v0] Error fetching leaderboard:', error);
      return [];
    }

    return data as any;
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<Array<Achievement & { earned_at: string }>> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        earned_at,
        achievements (*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching user achievements:', error);
      return [];
    }

    return data.map(item => ({
      ...item.achievements,
      earned_at: item.earned_at
    })) as any;
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId: string, achievementCode: string): Promise<boolean> {
    const supabase = await createClient();
    
    // Get achievement
    const { data: achievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('code', achievementCode)
      .single();

    if (!achievement) return false;

    // Check if already earned
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single();

    if (existing) return false; // Already earned

    // Award achievement
    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievement.id
      });

    return !error;
  }

  /**
   * Calculate level from XP (simple formula)
   */
  private calculateLevel(xp: number): number {
    // Level = floor(sqrt(XP / 100))
    // Level 1: 0 XP
    // Level 2: 100 XP
    // Level 3: 400 XP
    // Level 4: 900 XP, etc.
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Check and award XP-based achievements
   */
  private async checkXPAchievements(userId: string, totalXP: number): Promise<void> {
    const xpMilestones = [
      { threshold: 100, code: 'xp_100' },
      { threshold: 500, code: 'xp_500' },
      { threshold: 1000, code: 'xp_1000' }
    ];

    for (const milestone of xpMilestones) {
      if (totalXP >= milestone.threshold) {
        await this.awardAchievement(userId, milestone.code);
      }
    }
  }

  /**
   * Check and award streak-based achievements
   */
  private async checkStreakAchievements(userId: string, streak: number): Promise<void> {
    if (streak >= 7) {
      await this.awardAchievement(userId, 'streak_7');
    }
    if (streak >= 30) {
      await this.awardAchievement(userId, 'streak_30');
    }
  }
}

// Singleton instance
export const userService = new UserService();
