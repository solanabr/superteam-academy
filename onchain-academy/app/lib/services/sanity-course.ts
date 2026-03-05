// Sanity-powered course service
// Falls back to stubs if Sanity is not configured

import type { Course, Lesson, CourseService } from './types';
import { courseService } from './stubs';
import { sanityClient } from '@/lib/sanity/client';

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

function isSanityConfigured(): boolean {
  return !!SANITY_PROJECT_ID && SANITY_PROJECT_ID !== '';
}

export const sanityCourseService: CourseService = {
  async getCourses(): Promise<Course[]> {
    if (!isSanityConfigured()) {
      return courseService.getCourses();
    }

    try {
      const query = `*[_type == "course"] | order(order) {
        _id,
        title,
        "slug": slug.current,
        description,
        "lessonCount": count(lessons[]),
        totalXp,
        level,
        creator
      }`;
      
      const courses = await sanityClient.fetch(query);
      
      if (!courses || courses.length === 0) {
        return courseService.getCourses();
      }
      
      return courses;
    } catch (error) {
      console.error('Error fetching from Sanity:', error);
      return courseService.getCourses();
    }
  },

  async getCourse(slug: string): Promise<Course | null> {
    if (!isSanityConfigured()) {
      return courseService.getCourse(slug);
    }

    try {
      const query = `*[_type == "course" && slug.current == $slug][0] {
        _id,
        title,
        "slug": slug.current,
        description,
        "lessonCount": count(lessons[]),
        totalXp,
        level,
        creator,
        "lessons": lessons[]->{
          _id,
          title,
          order,
          xpReward,
          type,
          starterCode,
          testCases
        }
      }`;
      
      const course = await sanityClient.fetch(query, { slug });
      
      if (!course) {
        return courseService.getCourse(slug);
      }
      
      return {
        ...course,
        lessons: course.lessons || [],
      };
    } catch (error) {
      console.error('Error fetching course from Sanity:', error);
      return courseService.getCourse(slug);
    }
  },

  async getLessons(courseSlug: string): Promise<Lesson[]> {
    if (!isSanityConfigured()) {
      return courseService.getLessons(courseSlug);
    }

    const course = await this.getCourse(courseSlug);
    return course?.lessons ?? [];
  },

  async getLesson(courseSlug: string, lessonId: string): Promise<Lesson | null> {
    if (!isSanityConfigured()) {
      return courseService.getLesson(courseSlug, lessonId);
    }

    const lessons = await this.getLessons(courseSlug);
    return lessons.find((l) => l.id === lessonId) ?? null;
  },
};
