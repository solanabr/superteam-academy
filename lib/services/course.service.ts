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
    let courses: Course[] = [];
    
    // Try Sanity first
    const sanityCourses = await sanityService.getCourses();
    if (sanityCourses && sanityCourses.length > 0) {
      const fallbackByCategory: Record<string, string> = {
        'web3': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'solana-development': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'defi': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'nfts': 'https://images.unsplash.com/photo-1643036450161-d4c01cfd1d8a?q=80&w=1200&auto=format&fit=crop',
        'blockchain-basics': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'smart-contracts': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
      }
      
      courses = sanityCourses.map((c: any) => ({
        id: c._id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        learning_outcomes: c.learningOutcomes || [],
        prerequisites: c.prerequisites || [],
        thumbnail_url: c.thumbnail_url || fallbackByCategory[c.category || 'web3'],
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
    } else {
      // Fallback to Supabase if Sanity is empty or fails
      const supabase = await createClient();
      let query = supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        courses = data.map(course => ({
          ...course,
          published: course.is_published,
          duration_minutes: course.estimated_hours ? course.estimated_hours * 60 : 0
        })) as Course[];
      }
    }

    // Apply filters in memory
    if (filters) {
      if (filters.category) {
        courses = courses.filter(c => c.category === filters.category);
      }
      if (filters.difficulty) {
        courses = courses.filter(c => c.difficulty === filters.difficulty);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        courses = courses.filter(c => 
          c.title.toLowerCase().includes(searchLower) || 
          c.description.toLowerCase().includes(searchLower)
        );
      }
    }

    if (courses.length === 0 && !filters?.search && !filters?.category && !filters?.difficulty) {
      // Return mock data only if everything else failed and no filters are applied
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

    return courses;
  }

  /**
   * Sync course from Sanity to Supabase
   */
  async syncCourseToDb(sanityCourse: any): Promise<string> {
    const supabase = await createClient();
    
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', sanityCourse.slug)
      .single();

    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        sanity_id: sanityCourse._id,
        title: sanityCourse.title,
        slug: sanityCourse.slug,
        description: sanityCourse.description,
        difficulty: sanityCourse.difficulty,
        category: sanityCourse.category,
        thumbnail_url: sanityCourse.thumbnail_url,
        estimated_hours: Math.ceil(sanityCourse.duration_minutes / 60),
        is_published: sanityCourse.published ?? true
      })
      .select('id')
      .single();

    if (error) {
      console.error('[CourseService] Error syncing course to DB:', error.message);
      return sanityCourse._id;
    }

    return data.id;
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string): Promise<Course | null> {
    const supabase = await createClient();
    
    // Get the course from Supabase first
    const { data: dbCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    const sanityCourse = await sanityService.getCourseBySlug(slug);
    
    if (sanityCourse) {
      // Sync to DB if it exists in Sanity but not in DB
      let dbId = dbCourse?.id;
      if (!dbId) {
        dbId = await this.syncCourseToDb(sanityCourse);
      }

      const fallbackByCategory: Record<string, string> = {
        'web3': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'solana-development': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'defi': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'nfts': 'https://images.unsplash.com/photo-1643036450161-d4c01cfd1d8a?q=80&w=1200&auto=format&fit=crop',
        'blockchain-basics': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
        'smart-contracts': 'https://images.unsplash.com/photo-1640341719941-47700028189c?q=80&w=1200&auto=format&fit=crop',
      }
      return {
        id: dbId,
        sanity_id: sanityCourse._id,
        slug: sanityCourse.slug,
        title: sanityCourse.title,
        description: sanityCourse.description,
        long_description: sanityCourse.longDescription,
        learning_outcomes: sanityCourse.learningOutcomes || [],
        prerequisites: sanityCourse.prerequisites || [],
        thumbnail_url: sanityCourse.thumbnail_url || fallbackByCategory[sanityCourse.category || 'web3'],
        difficulty: sanityCourse.difficulty,
        duration_minutes: sanityCourse.duration_minutes ?? 0,
        xp_reward: sanityCourse.xp_reward ?? 500,
        category: sanityCourse.category ?? 'web3',
        instructor_id: 'sanity',
        published: sanityCourse.published ?? true,
        order: 0,
        created_at: dbCourse?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Course;
    }
    
    if (!dbCourse) {
      const courses = await this.getCourses();
      return courses.find(c => c.slug === slug) || null;
    }
    
    return {
      ...dbCourse,
      published: dbCourse.is_published,
      duration_minutes: dbCourse.estimated_hours ? dbCourse.estimated_hours * 60 : 0
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
    const mapped = sanityCourse.lessons.map((l: any, idx: number) => ({
      id: l._id,
      course_id: sanityCourse._id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      content: l.content,
      lesson_type: l.lesson_type,
      duration_minutes: l.duration_minutes ?? 0,
      order: l.order_index ?? idx,
      xp_reward: l.xp_reward ?? 50,
      video_url: l.video_url,
      starter_code: l.codeChallenge?.starter_code,
      solution_code: l.codeChallenge?.solution_code,
      language: l.codeChallenge?.language,
        test_cases: l.codeChallenge?.test_cases,
        quiz: l.quiz
    })) as Lesson[];
    return mapped.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /**
   * Merge Supabase and Sanity lessons, preferring Sanity when available
   */
  async getMergedCourseLessons(courseSlug: string, courseId: string): Promise<Lesson[]> {
    const sanityCourse = await sanityService.getCourseBySlug(courseSlug);
    const sanityLessons = await this.getCourseLessonsBySlug(courseSlug);
    const dbLessons = await this.getCourseLessons(courseId);

    if (sanityLessons.length === 0) return dbLessons;

    // Merge logic: use dbLessons as base for IDs and course_id, but enrich with Sanity data
    return sanityLessons.map(sl => {
      const dbL = dbLessons.find(dl => dl.slug === sl.slug);
      return {
        ...sl,
        id: dbL?.id || sl.id,
        course_id: courseId || sl.course_id
      };
    });
  }

  /**
   * Get lesson by slug
   */
  async getLessonBySlug(courseSlug: string, lessonSlug: string): Promise<Lesson | null> {
    const supabase = await createClient();
    
    // First get the course from Sanity to have the full context
    const sanityCourse = await sanityService.getCourseBySlug(courseSlug);
    const sanityLesson = sanityCourse?.lessons?.find((l: any) => l.slug === lessonSlug);

    // Get the course from Supabase
    const { data: dbCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', courseSlug)
      .single();

    if (!dbCourse) {
      // Fallback to Sanity lesson if Supabase course doesn't exist
      if (sanityLesson) {
        return {
          id: sanityLesson._id,
          course_id: sanityCourse._id,
          slug: sanityLesson.slug,
          title: sanityLesson.title,
          description: sanityLesson.description,
          content: sanityLesson.content,
          lesson_type: sanityLesson.lesson_type,
          duration_minutes: sanityLesson.duration_minutes ?? 0,
          order: sanityLesson.order_index ?? 0,
          xp_reward: sanityLesson.xp_reward ?? 50,
          video_url: sanityLesson.video_url,
          starter_code: sanityLesson.codeChallenge?.starter_code,
          solution_code: sanityLesson.codeChallenge?.solution_code,
          language: sanityLesson.codeChallenge?.language,
          test_cases: sanityLesson.codeChallenge?.test_cases,
          quiz: sanityLesson.quiz
        } as Lesson;
      }
      return null;
    }

    // Get the lesson from Supabase
    const { data: dbLesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', dbCourse.id)
      .eq('slug', lessonSlug)
      .eq('is_published', true)
      .single();

    if (lessonError || !dbLesson) {
      // Fallback to Sanity lesson if Supabase lesson doesn't exist
      if (sanityLesson) {
        return {
          id: sanityLesson._id,
          course_id: dbCourse.id, // Use DB UUID for consistency
          slug: sanityLesson.slug,
          title: sanityLesson.title,
          description: sanityLesson.description,
          content: sanityLesson.content,
          lesson_type: sanityLesson.lesson_type,
          duration_minutes: sanityLesson.duration_minutes ?? 0,
          order: sanityLesson.order_index ?? 0,
          xp_reward: sanityLesson.xp_reward ?? 50,
          video_url: sanityLesson.video_url,
          starter_code: sanityLesson.codeChallenge?.starter_code,
          solution_code: sanityLesson.codeChallenge?.solution_code,
          language: sanityLesson.codeChallenge?.language,
          test_cases: sanityLesson.codeChallenge?.test_cases,
          quiz: sanityLesson.quiz
        } as Lesson;
      }
      return null;
    }

    const lesson = {
      ...dbLesson,
      lesson_type: dbLesson.content_type === 'article' ? 'reading' : (dbLesson.content_type === 'interactive' ? 'coding' : dbLesson.content_type),
      order: dbLesson.order_index,
      duration_minutes: dbLesson.estimated_minutes || 0
    } as Lesson;

    // Merge in code challenge data from Sanity if missing in DB
    if (lesson.lesson_type === 'coding' && !lesson.starter_code && sanityLesson?.codeChallenge) {
      lesson.starter_code = sanityLesson.codeChallenge.starter_code;
      lesson.solution_code = sanityLesson.codeChallenge.solution_code;
      lesson.language = sanityLesson.codeChallenge.language;
      lesson.test_cases = sanityLesson.codeChallenge.test_cases;
    }

    return lesson;
  }

  /**
   * Enroll user in course
   */
  async enrollUser(userId: string, courseId: string): Promise<Enrollment | null> {
    console.log('[CourseService] Enrolling user:', { userId, courseId });
    const supabase = await createClient();
    
    // Ensure courseId is a UUID if it looks like a Sanity ID
    let finalCourseId = courseId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
    
    if (!isUuid) {
      console.log('[CourseService] courseId is not a UUID, searching by sanity_id');
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('sanity_id', courseId)
        .single();
      
      if (course) {
        finalCourseId = course.id;
      } else {
        console.error('[CourseService] Course not found in DB for enrollment:', courseId);
        return null;
      }
    }

    // Check if already enrolled
    const { data: existing, error: checkError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', finalCourseId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('[CourseService] Error checking enrollment:', checkError.message);
    }

    if (existing) {
      console.log('[CourseService] User already enrolled');
      return existing as Enrollment;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: finalCourseId,
        progress_percentage: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[CourseService] Error enrolling user:', error.message);
      return null;
    }

    console.log('[CourseService] Successfully enrolled user');
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
