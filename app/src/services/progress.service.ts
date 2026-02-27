import { connectToDatabase } from '@/lib/mongodb';
import { UserProgress, UserStreak, CourseEnrollment, User } from '@/models';
import mongoose from 'mongoose';

export interface CompleteLessonInput {
  userId: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  xpEarned: number;
  timeSpentSeconds?: number;
  challengeData?: {
    codeSubmitted?: string;
    testsPassed?: number;
    testsTotal?: number;
    executionTimeMs?: number;
  };
}

export interface CourseProgressSummary {
  courseId: string;
  courseSlug: string;
  progressPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  challengesSolved: number;
  totalChallenges: number;
  xpEarned: number;
  enrolledAt: Date;
  lastAccessedAt: Date;
  completed: boolean;
  completedAt?: Date;
}

export class ProgressService {
  /**
   * Enroll user in a course
   */
  static async enrollInCourse(
    userId: string,
    courseId: string,
    courseSlug: string,
    totalLessons: number,
    totalChallenges: number = 0
  ) {
    await connectToDatabase();

    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { user_id: new mongoose.Types.ObjectId(userId), course_id: courseId },
      {
        $setOnInsert: {
          user_id: new mongoose.Types.ObjectId(userId),
          course_id: courseId,
          course_slug: courseSlug,
          total_lessons: totalLessons,
          total_challenges: totalChallenges,
          enrolled_at: new Date(),
        },
        $set: {
          last_accessed_at: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return enrollment;
  }

  /**
   * Complete a lesson
   */
  static async completeLesson(input: CompleteLessonInput) {
    await connectToDatabase();

    const { userId, courseId, courseSlug, lessonId, xpEarned, timeSpentSeconds, challengeData } =
      input;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Update or create lesson progress
    const lessonProgress = await UserProgress.findOneAndUpdate(
      { user_id: userObjectId, course_id: courseId, lesson_id: lessonId },
      {
        $set: {
          completed: true,
          completed_at: new Date(),
          xp_earned: xpEarned,
          ...(challengeData && { challenge_data: challengeData }),
        },
        $inc: {
          attempts: 1,
          time_spent_seconds: timeSpentSeconds || 0,
        },
        $setOnInsert: {
          user_id: userObjectId,
          course_id: courseId,
          lesson_id: lessonId,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Update course enrollment progress
    const completedLessons = await UserProgress.countDocuments({
      user_id: userObjectId,
      course_id: courseId,
      completed: true,
    });

    const enrollment = await CourseEnrollment.findOne({
      user_id: userObjectId,
      course_id: courseId,
    });

    if (enrollment) {
      enrollment.lessons_completed = completedLessons;
      enrollment.xp_earned = await UserProgress.aggregate([
        { $match: { user_id: userObjectId, course_id: courseId } },
        { $group: { _id: null, total: { $sum: '$xp_earned' } } },
      ]).then((result) => result[0]?.total || 0);

      if (challengeData?.testsPassed === challengeData?.testsTotal) {
        enrollment.challenges_solved = await UserProgress.countDocuments({
          user_id: userObjectId,
          course_id: courseId,
          'challenge_data.tests_passed': { $exists: true },
          $expr: { $eq: ['$challenge_data.tests_passed', '$challenge_data.tests_total'] },
        });
      }

      enrollment.progress_percentage = Math.round(
        (completedLessons / enrollment.total_lessons) * 100
      );
      enrollment.last_accessed_at = new Date();

      // Check if course is completed
      if (completedLessons >= enrollment.total_lessons && !enrollment.completed_at) {
        enrollment.completed_at = new Date();
      }

      await enrollment.save();
    }

    // Add XP to user
    await User.findByIdAndUpdate(userId, {
      $inc: { total_xp: xpEarned },
    });

    // Update streak
    await this.updateStreak(userId, xpEarned, 1, challengeData ? 1 : 0);

    return { lessonProgress, enrollment };
  }

  /**
   * Get progress for a specific course
   */
  static async getCourseProgress(
    userId: string,
    courseId: string
  ): Promise<CourseProgressSummary | null> {
    await connectToDatabase();

    const enrollment = await CourseEnrollment.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      course_id: courseId,
    });

    if (!enrollment) return null;

    return {
      courseId: enrollment.course_id,
      courseSlug: enrollment.course_slug,
      progressPercentage: enrollment.progress_percentage,
      lessonsCompleted: enrollment.lessons_completed,
      totalLessons: enrollment.total_lessons,
      challengesSolved: enrollment.challenges_solved,
      totalChallenges: enrollment.total_challenges,
      xpEarned: enrollment.xp_earned,
      enrolledAt: enrollment.enrolled_at,
      lastAccessedAt: enrollment.last_accessed_at,
      completed: !!enrollment.completed_at,
      completedAt: enrollment.completed_at,
    };
  }

  /**
   * Get all courses progress for a user
   */
  static async getAllCoursesProgress(userId: string): Promise<CourseProgressSummary[]> {
    await connectToDatabase();

    const enrollments = await CourseEnrollment.find({
      user_id: new mongoose.Types.ObjectId(userId),
    }).sort({ last_accessed_at: -1 });

    return enrollments.map((enrollment) => ({
      courseId: enrollment.course_id,
      courseSlug: enrollment.course_slug,
      progressPercentage: enrollment.progress_percentage,
      lessonsCompleted: enrollment.lessons_completed,
      totalLessons: enrollment.total_lessons,
      challengesSolved: enrollment.challenges_solved,
      totalChallenges: enrollment.total_challenges,
      xpEarned: enrollment.xp_earned,
      enrolledAt: enrollment.enrolled_at,
      lastAccessedAt: enrollment.last_accessed_at,
      completed: !!enrollment.completed_at,
      completedAt: enrollment.completed_at,
    }));
  }

  /**
   * Get lesson progress
   */
  static async getLessonProgress(userId: string, courseId: string, lessonId: string) {
    await connectToDatabase();

    return UserProgress.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      course_id: courseId,
      lesson_id: lessonId,
    });
  }

  /**
   * Get completed lessons for a course
   */
  static async getCompletedLessons(userId: string, courseId: string): Promise<string[]> {
    await connectToDatabase();

    const progress = await UserProgress.find({
      user_id: new mongoose.Types.ObjectId(userId),
      course_id: courseId,
      completed: true,
    }).select('lesson_id');

    return progress.map((p) => p.lesson_id);
  }

  /**
   * Update user streak
   */
  static async updateStreak(
    userId: string,
    xp: number = 0,
    lessonsCompleted: number = 0,
    challengesSolved: number = 0
  ) {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    let streak = await UserStreak.findOne({ user_id: userObjectId });

    if (!streak) {
      streak = new UserStreak({
        user_id: userObjectId,
        current_streak: 0,
        longest_streak: 0,
        streak_history: [],
      });
    }

    // Record activity using the model method
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
    const lastActivityNormalized = lastActivity
      ? new Date(lastActivity.setHours(0, 0, 0, 0))
      : null;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if already recorded activity today
    const todayEntryIndex = streak.streak_history.findIndex((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (todayEntryIndex >= 0) {
      // Update today's entry
      streak.streak_history[todayEntryIndex].xp += xp;
      streak.streak_history[todayEntryIndex].lessons_completed += lessonsCompleted;
      streak.streak_history[todayEntryIndex].challenges_solved += challengesSolved;
    } else {
      // Add new entry for today
      streak.streak_history.push({
        date: today,
        xp,
        lessons_completed: lessonsCompleted,
        challenges_solved: challengesSolved,
      });

      // Keep only last 365 days
      if (streak.streak_history.length > 365) {
        streak.streak_history = streak.streak_history.slice(-365);
      }

      // Update streak
      if (!lastActivityNormalized) {
        streak.current_streak = 1;
      } else if (lastActivityNormalized.getTime() === yesterday.getTime()) {
        streak.current_streak += 1;
      } else if (lastActivityNormalized.getTime() !== today.getTime()) {
        streak.current_streak = 1;
      }

      if (streak.current_streak > streak.longest_streak) {
        streak.longest_streak = streak.current_streak;
      }

      streak.last_activity_date = today;
    }

    await streak.save();
    return streak;
  }

  /**
   * Get user streak data
   */
  static async getStreakData(userId: string) {
    await connectToDatabase();

    const streak = await UserStreak.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        weeklyActivity: [],
      };
    }

    // Get last 7 days of activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const entry = streak.streak_history.find((h) => {
        const entryDate = new Date(h.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      weeklyActivity.push({
        date,
        xp: entry?.xp || 0,
        lessonsCompleted: entry?.lessons_completed || 0,
        challengesSolved: entry?.challenges_solved || 0,
      });
    }

    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      lastActivityDate: streak.last_activity_date,
      freezeAvailable: streak.freeze_available,
      weeklyActivity,
    };
  }
}
