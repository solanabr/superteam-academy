/**
 * Course Service - Manages course data from Sanity CMS and Supabase cache
 */

import { createClient } from '@/lib/supabase/server';
import type { Course, Lesson, Enrollment, LessonCompletion } from '@/lib/types';

export class CourseService {
  /**
   * Get all published courses
   */
  async getCourses(filters?: {
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    search?: string;
  }): Promise<Course[]> {
    const supabase = await createClient();
    
    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[v0] Error fetching courses:', error);
      return [];
    }

    return data as Course[];
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string): Promise<Course | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('[v0] Error fetching course:', error);
      return null;
    }

    return data as Course;
  }

  /**
   * Get lessons for a course
   */
  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[v0] Error fetching lessons:', error);
      return [];
    }

    return data as Lesson[];
  }

  /**
   * Get lesson by slug
   */
  async getLessonBySlug(courseSlug: string, lessonSlug: string): Promise<Lesson | null> {
    const supabase = await createClient();
    
    // First get the course
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', courseSlug)
      .single();

    if (!course) return null;

    // Then get the lesson
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .eq('slug', lessonSlug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('[v0] Error fetching lesson:', error);
      return null;
    }

    return data as Lesson;
  }

  /**
   * STUBBED: Enroll user in course
   */
  async enrollUser(userId: string, courseId: string): Promise<Enrollment | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        progress_percentage: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[v0] Error enrolling user:', error);
      return null;
    }

    return data as Enrollment;
  }

  /**
   * Get user's enrollment for a course
   */
  async getUserEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error) {
      return null;
    }

    return data as Enrollment;
  }

  /**
   * Get all user enrollments
   */
  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching enrollments:', error);
      return [];
    }

    return data as Enrollment[];
  }

  /**
   * STUBBED: Mark lesson as complete
   */
  async completeLesson(
    userId: string,
    lessonId: string,
    enrollmentId: string,
    xpEarned: number
  ): Promise<LessonCompletion | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('lesson_completions')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        xp_earned: xpEarned
      })
      .select()
      .single();

    if (error) {
      console.error('[v0] Error completing lesson:', error);
      return null;
    }

    // Update enrollment progress
    await this.updateEnrollmentProgress(enrollmentId);

    return data as LessonCompletion;
  }

  /**
   * Get user's completed lessons for a course
   */
  async getUserCompletedLessons(userId: string, courseId: string): Promise<string[]> {
    const supabase = await createClient();
    
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) return [];

    const { data, error } = await supabase
      .from('lesson_completions')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('enrollment_id', enrollment.id);

    if (error) {
      console.error('[v0] Error fetching completed lessons:', error);
      return [];
    }

    return data.map(c => c.lesson_id);
  }

  /**
   * Update enrollment progress percentage
   */
  private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get enrollment with course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, courses(id)')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) return;

    // Get total lessons
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', enrollment.courses.id);

    // Get completed lessons
    const { count: completedLessons } = await supabase
      .from('lesson_completions')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enrollmentId);

    if (totalLessons && completedLessons !== null) {
      const progress = Math.round((completedLessons / totalLessons) * 100);
      
      await supabase
        .from('enrollments')
        .update({ 
          progress_percentage: progress,
          completed_at: progress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId);
    }
  }
}

// Singleton instance
export const courseService = new CourseService();
