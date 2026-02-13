import { sanityClient } from '../sanity/client';
import type { Course, Lesson } from '../types';

export class SanityService {
  /**
   * Fetch all courses from Sanity
   */
  async getCourses(): Promise<any[]> {
    const query = `*[_type == "course"] {
      _id,
      title,
      "slug": slug.current,
      description,
      "thumbnail_url": thumbnail.asset->url,
      difficulty,
      category,
      xp_reward,
      "duration_minutes": duration,
      published
    }`;
    return await sanityClient.fetch(query);
  }

  /**
   * Fetch a single course with its lessons
   */
  async getCourseBySlug(slug: string): Promise<any> {
    const query = `*[_type == "course" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      longDescription,
      "thumbnail_url": thumbnail.asset->url,
      difficulty,
      category,
      xp_reward,
      "duration_minutes": duration,
      lessons[]-> {
        _id,
        title,
        description,
        content,
        lesson_type,
        duration_minutes,
        xp_reward,
        "video_url": video.url
      }
    }`;
    return await sanityClient.fetch(query, { slug });
  }
}

export const sanityService = new SanityService();
