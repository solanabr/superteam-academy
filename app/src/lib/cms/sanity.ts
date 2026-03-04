import { createClient, type QueryParams } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { Course, Lesson, Track } from "@/lib/cms/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any;

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "efj5r9bz",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
});

const builder = createImageUrlBuilder(sanityClient);

interface LessonWithCourse extends Lesson {
  courseId?: string;
  onChainCourseId?: string;
  course?: {
    _id: string;
    onChainCourseId?: string;
    title: string;
    slug: { current: string };
    modules?: Array<{
      _id: string;
      title: string;
      order: number;
      lessons?: Array<{
        _id: string;
        title: string;
        slug: { current: string };
        order: number;
      }>;
    }>;
  };
}

interface LandingContent {
  heroTitle?: string;
  heroSubtitle?: string;
  features?: unknown[];
  testimonials?: unknown[];
  partnerLogos?: unknown[];
  stats?: unknown[];
}

async function safeFetch<T>(
  query: string,
  fallback: T,
  params?: QueryParams
): Promise<T> {
  try {
    if (params) {
      return await sanityClient.fetch<T>(query, params);
    }
    return await sanityClient.fetch<T>(query);
  } catch (error) {
    console.warn("Sanity fetch failed; using fallback data.", error);
    return fallback;
  }
}

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ------------------------------------------------------------------
// Query helpers
// ------------------------------------------------------------------

export async function getCourses(): Promise<Course[]> {
  return safeFetch(
    `*[_type == "course"] | order(order asc) {
      _id,
      onChainCourseId,
      title,
      slug,
      description,
      difficulty,
      duration,
      xpReward,
      thumbnail,
      "track": track->{ _id, title, slug },
      "moduleCount": count(modules),
      "lessonCount": count(modules[]->lessons[]),
      tags
    }`,
    []
  );
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return safeFetch(
    `*[_type == "course" && slug.current == $slug][0] {
      _id,
      onChainCourseId,
      title,
      slug,
      description,
      difficulty,
      duration,
      xpReward,
      thumbnail,
      prerequisites,
      "track": track->{ _id, title, slug },
      "modules": modules[]-> {
        _id,
        title,
        order,
        "lessons": lessons[]-> {
          _id,
          title,
          slug,
          type,
          estimatedMinutes,
          xpReward,
          order
        }
      } | order(order asc)
    }`,
    null,
    { slug }
  );
}

export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonWithCourse | null> {
  return safeFetch(
    `*[_type == "lesson" && slug.current == $lessonSlug][0] {
      _id,
      title,
      slug,
      type,
      body,
      estimatedMinutes,
      xpReward,
      order,
      starterCode,
      solutionCode,
      expectedOutput,
      hints,
      "courseId": *[_type == "course" && slug.current == $courseSlug][0]._id,
      "onChainCourseId": *[_type == "course" && slug.current == $courseSlug][0].onChainCourseId,
      "course": *[_type == "course" && slug.current == $courseSlug][0] {
        _id,
        onChainCourseId,
        title,
        slug,
        "modules": modules[]-> {
          _id,
          title,
          order,
          "lessons": lessons[]-> {
            _id,
            title,
            slug,
            order
          }
        } | order(order asc)
      }
    }`,
    null,
    { courseSlug, lessonSlug }
  );
}

export async function getTracks(): Promise<Track[]> {
  return safeFetch(
    `*[_type == "track"] | order(order asc) {
      _id,
      title,
      slug,
      description,
      icon,
      order,
      "courseCount": count(*[_type == "course" && references(^._id)])
    }`,
    []
  );
}

export async function getLandingContent(): Promise<LandingContent | null> {
  return safeFetch(
    `*[_type == "landingPage"][0] {
      heroTitle,
      heroSubtitle,
      features,
      testimonials,
      partnerLogos,
      stats
    }`,
    null
  );
}
