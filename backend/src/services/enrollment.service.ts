import { getDatabase } from '../db'
import { randomUUID } from 'crypto'
import { GamificationService } from './gamification.service'

export class EnrollmentService {
  /**
   * Enroll user in course
   */
  async enrollCourse(userId: string, courseId: string) {
    const db = getDatabase()

    // Check if already enrolled
    const { data: existing } = await db
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      return existing
    }

    const enrollmentId = randomUUID()
    await db.from('enrollments').insert({
      id: enrollmentId,
      user_id: userId,
      course_id: courseId,
      lessons_completed: 0,
      total_xp_earned: 0,
    })

    return { id: enrollmentId, userId, courseId }
  }

  /**
   * Complete lesson and award XP
   */
  async completeLesson(userId: string, courseId: string, lessonId: string, xpAmount: number) {
    const db = getDatabase()

    // Check if already completed
    const { data: existing } = await db
      .from('lesson_progress')
      .select('id, completed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .single()

    if (existing && existing.completed) {
      return { alreadyCompleted: true }
    }

    const progressId = randomUUID()

    // Insert or update lesson progress
    if (existing) {
      await db
        .from('lesson_progress')
        .update({
          completed: 1,
          xp_earned: xpAmount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await db.from('lesson_progress').insert({
        id: progressId,
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        completed: 1,
        xp_earned: xpAmount,
        completed_at: new Date().toISOString(),
      })
    }

    // Update enrollment progress
    const { data: enrollment } = await db
      .from('enrollments')
      .select('lessons_completed, total_xp_earned')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (enrollment) {
      await db
        .from('enrollments')
        .update({
          lessons_completed: enrollment.lessons_completed + 1,
          total_xp_earned: enrollment.total_xp_earned + xpAmount,
        })
        .eq('user_id', userId)
        .eq('course_id', courseId)
    }

    // Update user XP and level
    await GamificationService.awardXP(userId, xpAmount, `lesson_completion_${lessonId}`)
    await GamificationService.updateLevel(userId)
    await GamificationService.updateStreak(userId)
    const newAchievements = await GamificationService.checkAchievements(userId)

    return { success: true, xpAwarded: xpAmount, achievements: newAchievements }
  }

  /**
   * Get course progress
   */
  async getCourseProgress(userId: string, courseId: string) {
    const db = getDatabase()

    const { data: enrollment } = await db
      .from('enrollments')
      .select('lessons_completed, total_xp_earned, enrolled_at, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (!enrollment) {
      return null
    }

    const { data: lessonsCompleted } = await db
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', 1)

    return {
      ...enrollment,
      completedLessons: (lessonsCompleted || []).map((l: { lesson_id: string }) => l.lesson_id),
    }
  }

  /**
   * Get all user progress
   */
  async getUserProgress(userId: string) {
    const db = getDatabase()

    const { data: user } = await db
      .from('users')
      .select('total_xp, level, current_streak')
      .eq('id', userId)
      .single()

    const { data: enrollments } = await db
      .from('enrollments')
      .select('course_id, lessons_completed, total_xp_earned, enrolled_at, completed_at')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    return {
      totalXP: user?.total_xp || 0,
      level: user?.level || 1,
      currentStreak: user?.current_streak || 0,
      enrollments: (enrollments || []).map((e: { course_id: string; lessons_completed: number; total_xp_earned: number; enrolled_at: string; completed_at: string | null }) => ({
        courseId: e.course_id,
        lessonsCompleted: e.lessons_completed,
        totalXPEarned: e.total_xp_earned,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
      })),
    }
  }
}

export const enrollmentService = new EnrollmentService()
