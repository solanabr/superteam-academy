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

    if (error || !data || data.length === 0) {
      // Database not configured or empty - serving mock data
      return [
        {
          id: '1',
          slug: 'solana-fundamentals',
          title: 'Solana Fundamentals',
          description: 'Start from scratch and understand the Solana blockchain inside out.',
          category: 'development',
          difficulty: 'beginner',
          duration_minutes: 120,
          xp_reward: 500,
          published: true,
          instructor_id: 'mock-instructor',
          order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          slug: 'defi-developer',
          title: 'DeFi Developer',
          description: 'Master DeFi protocols and build your own decentralized finance applications.',
          category: 'defi',
          difficulty: 'intermediate',
          duration_minutes: 1800,
          xp_reward: 1200,
          published: true,
          instructor_id: 'mock-instructor',
          order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          slug: 'security-auditor',
          title: 'Security Auditor',
          description: 'Become a Solana security expert. Find bugs, write audits, protect protocols.',
          category: 'security',
          difficulty: 'advanced',
          duration_minutes: 1620,
          xp_reward: 2000,
          published: true,
          instructor_id: 'mock-instructor',
          order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] as Course[];
    }

    // Map DB columns to Course type
    return data.map(course => ({
      ...course,
      published: course.is_published,
      duration_minutes: course.estimated_hours ? course.estimated_hours * 60 : 0
    })) as Course[];
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

    if (error || !data) {
      console.warn('[v0] Error fetching course:', (error as any)?.message ?? error);
      // Fallback to mock data if not found or error
      const courses = await this.getCourses();
      return courses.find(c => c.slug === slug) || null;
    }

    return {
      ...data,
      published: data.is_published,
      duration_minutes: data.estimated_hours ? data.estimated_hours * 60 : 0
    } as Course;
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

    if (error || !data || data.length === 0) {
      console.warn('[v0] Error fetching lessons:', (error as any)?.message ?? error);
      // Fallback to mock lessons if DB error
      return [
        {
          id: 'l1',
          course_id: courseId,
          slug: 'intro-to-solana',
          title: 'Introduction to Solana',
          description: 'Learn the basics of Solana blockchain.',
          content: 'Solana is a high-performance blockchain...',
          lesson_type: 'video',
          duration_minutes: 15,
          order: 0,
          xp_reward: 100
        },
        {
          id: 'l2',
          course_id: courseId,
          slug: 'account-model',
          title: 'The Account Model',
          description: 'Understand how Solana stores data.',
          content: 'Everything in Solana is an account...',
          lesson_type: 'reading',
          duration_minutes: 20,
          order: 1,
          xp_reward: 150
        }
      ] as Lesson[];
    }

    return data.map(lesson => ({
      ...lesson,
      lesson_type: lesson.content_type === 'article' ? 'reading' : (lesson.content_type === 'interactive' ? 'coding' : lesson.content_type),
      order: lesson.order_index,
      duration_minutes: lesson.estimated_minutes || 0
    })) as Lesson[];
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

    if (!course) {
      // Fallback to mock course/lessons
      const lessons = await this.getCourseLessons('mock-id');
      return lessons.find(l => l.slug === lessonSlug || l.id === lessonSlug) || null;
    }

    // Then get the lesson
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .eq('slug', lessonSlug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      console.warn('[v0] Error fetching lesson:', (error as any)?.message ?? error);
      const lessons = await this.getCourseLessons(course.id);
      return lessons.find(l => l.slug === lessonSlug || l.id === lessonSlug) || null;
    }

    return {
      ...data,
      lesson_type: data.content_type === 'article' ? 'reading' : (data.content_type === 'interactive' ? 'coding' : data.content_type),
      order: data.order_index,
      duration_minutes: data.estimated_minutes || 0
    } as Lesson;
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
      console.warn('[v0] Error enrolling user:', (error as any)?.message ?? error);
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
      console.warn('[v0] Error fetching enrollments:', (error as any)?.message ?? error);
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
      console.warn('[v0] Error completing lesson:', (error as any)?.message ?? error);
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
      console.warn('[v0] Error fetching completed lessons:', (error as any)?.message ?? error);
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
