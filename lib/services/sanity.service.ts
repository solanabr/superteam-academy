import { getSanityClient } from '../sanity/client';
import type { Course, Lesson } from '../types';

export class SanityService {
  /**
   * Fetch all courses from Sanity
   */
  async getCourses(): Promise<any[]> {
    const sanityClient = getSanityClient();
    if (!sanityClient) {
      console.warn('[v0] Sanity not configured: NEXT_PUBLIC_SANITY_PROJECT_ID/NEXT_PUBLIC_SANITY_DATASET missing');
      return [];
    }
    const query = `*[_type == "course"]{
      _id,
      title,
      "slug": slug.current,
      description,
      "thumbnail_url": thumbnail.asset->url,
      difficulty,
      category,
      "duration_minutes": coalesce(estimatedHours,0)*60,
      "published": coalesce(isPublished,false)
    }`;
    return await sanityClient.fetch(query);
  }

  /**
   * Fetch a single course with its lessons
   */
  async getCourseBySlug(slug: string): Promise<any> {
    const sanityClient = getSanityClient();
    if (!sanityClient) {
      console.warn('[v0] Sanity not configured: NEXT_PUBLIC_SANITY_PROJECT_ID/NEXT_PUBLIC_SANITY_DATASET missing');
      return null;
    }
    const query = `*[_type == "course" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      description,
      longDescription,
      learningOutcomes,
      prerequisites,
      "thumbnail_url": thumbnail.asset->url,
      difficulty,
      category,
      "duration_minutes": coalesce(estimatedHours,0)*60,
      "published": coalesce(isPublished,false),
      lessons[]->{
        _id,
        title,
        description,
        content,
        "order_index": orderIndex,
        "lesson_type": select(contentType=="article"=>"reading", contentType=="interactive"=>"coding", contentType),
        "duration_minutes": coalesce(estimatedMinutes,0),
        "xp_reward": coalesce(xpReward,50),
        "video_url": videoUrl,
        "slug": slug.current,
        codeChallenge->{
          "starter_code": coalesce(starterCode.code, starterCode),
          "solution_code": coalesce(solution.code, solution),
          language,
          "test_cases": testCases
        },
        quiz->{
          title,
          passingScore,
          questions[]{
            question,
            options,
            "correctAnswerIndex": coalesce(correctAnswerIndex, 0),
            explanation
          }
        }
      }
    }`;
    return await sanityClient.fetch(query, { slug });
  }
}

export const sanityService = new SanityService();
