/**
 * Course Service - Manages course data from Sanity CMS and Supabase cache
 */

import { createClient } from '@/lib/supabase/server';
import type { Course, Lesson, Enrollment, LessonCompletion } from '@/lib/types';
import { sanityService } from './sanity.service';

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
      const sanityCourses = await sanityService.getCourses();
      if (sanityCourses && sanityCourses.length > 0) {
        return sanityCourses.map((c: any) => ({
          id: c._id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          thumbnail_url: c.thumbnail_url,
          difficulty: c.difficulty,
          duration_minutes: c.duration_minutes ?? 0,
          xp_reward: c.xp_reward ?? 500,
          category: c.category ?? 'web3',
          instructor_id: 'sanity',
          published: c.published ?? true,
          order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) as Course[];
      }
      // Database & Sanity not available - return mock
      return [
        {
          id: '1',
          slug: 'solana-fundamentals',
          title: 'Solana Fundamentals',
          description: 'Start from scratch and understand the Solana blockchain inside out.',
          category: 'web3',
          difficulty: 'beginner',
          duration_minutes: 120,
          xp_reward: 500,
          published: true,
          instructor_id: 'mock-instructor',
          order: 0,
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
      const sanityCourse = await sanityService.getCourseBySlug(slug);
      if (sanityCourse) {
        return {
          id: sanityCourse._id,
          slug: sanityCourse.slug,
          title: sanityCourse.title,
          description: sanityCourse.description,
          thumbnail_url: sanityCourse.thumbnail_url,
          difficulty: sanityCourse.difficulty,
          duration_minutes: sanityCourse.duration_minutes ?? 0,
          xp_reward: sanityCourse.xp_reward ?? 500,
          category: sanityCourse.category ?? 'web3',
          instructor_id: 'sanity',
          published: sanityCourse.published ?? true,
          order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Course;
      }
      // Fallback to mock
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
   * Get lessons by course slug via Sanity (fallback)
   */
  async getCourseLessonsBySlug(courseSlug: string): Promise<Lesson[]> {
    const sanityCourse = await sanityService.getCourseBySlug(courseSlug);
    if (!sanityCourse?.lessons) return [];
    return sanityCourse.lessons.map((l: any) => ({
      id: l._id,
      course_id: sanityCourse._id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      content: '',
      lesson_type: l.lesson_type,
      duration_minutes: l.duration_minutes ?? 0,
      order: 0,
      xp_reward: l.xp_reward ?? 50,
      video_url: l.video_url,
      starter_code: l.codeChallenge?.starter_code,
      solution_code: l.codeChallenge?.solution_code,
      language: l.codeChallenge?.language,
      test_cases: l.codeChallenge?.testCases,
      quiz: l.quiz
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
      const sanityCourse = await sanityService.getCourseBySlug(courseSlug);
      if (sanityCourse?.lessons) {
        const mappedLessons = sanityCourse.lessons.map((l: any) => ({
          id: l._id,
          course_id: sanityCourse._id,
          slug: l.slug,
          title: l.title,
          description: l.description,
          content: '',
          lesson_type: l.lesson_type,
          duration_minutes: l.duration_minutes ?? 0,
          order: 0,
          xp_reward: l.xp_reward ?? 50,
          video_url: l.video_url
        })) as Lesson[];
        return mappedLessons.find(l => l.slug === lessonSlug) || null;
      }
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
