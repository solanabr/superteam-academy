import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityCourse, SanityLesson } from "@/types";

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const sanityClient = SANITY_PROJECT_ID
  ? createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
      apiVersion: "2024-01-01",
      useCdn: process.env.NODE_ENV === "production",
    })
  : null;

const builder = sanityClient ? imageUrlBuilder(sanityClient) : null;

export function urlFor(source: unknown) {
  if (!builder) return null;
  return builder.image(source as Parameters<typeof builder.image>[0]);
}

// ─── Course Queries ───────────────────────────────────────────────────────────

export async function getAllCourses(): Promise<SanityCourse[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(`
    *[_type == "course" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      description,
      longDescription,
      difficulty,
      durationHours,
      xpReward,
      trackId,
      "thumbnail": thumbnail.asset->url,
      instructor->{
        _id, name, bio,
        "avatarUrl": avatar.asset->url,
        twitterHandle
      },
      tags,
      prerequisiteSlug,
      onChainCourseId,
      publishedAt,
      "modules": modules[]-> | order(order asc) {
        _id, title, description, order,
        "lessons": lessons[]-> | order(order asc) {
          _id, title, type, order, xpReward, estimatedMinutes
        }
      }
    }
  `);
}

export async function getCourseBySlug(slug: string): Promise<SanityCourse | null> {
  if (!sanityClient) return null;
  const courses = await sanityClient.fetch(`
    *[_type == "course" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      longDescription,
      difficulty,
      durationHours,
      xpReward,
      trackId,
      "thumbnail": thumbnail.asset->url,
      instructor->{
        _id, name, bio,
        "avatarUrl": avatar.asset->url,
        twitterHandle
      },
      tags,
      prerequisiteSlug,
      onChainCourseId,
      publishedAt,
      "modules": modules[]-> | order(order asc) {
        _id, title, description, order,
        "lessons": lessons[]-> | order(order asc) {
          _id, title, type, order, xpReward, estimatedMinutes,
          content, starterCode, solutionCode,
          testCases[] { input, expectedOutput, description }
        }
      }
    }
  `, { slug });
  return courses ?? null;
}

export async function getLessonById(id: string): Promise<SanityLesson | null> {
  if (!sanityClient) return null;
  const lesson = await sanityClient.fetch(`
    *[_type == "lesson" && _id == $id][0] {
      _id, title, type, order, xpReward, estimatedMinutes,
      content, starterCode, solutionCode,
      testCases[] { input, expectedOutput, description }
    }
  `, { id });
  return lesson ?? null;
}

export async function getCoursesByTrack(trackId: number): Promise<SanityCourse[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(`
    *[_type == "course" && trackId == $trackId && !(_id in path("drafts.**"))] | order(publishedAt asc) {
      _id, title, "slug": slug.current, description, difficulty,
      durationHours, xpReward, trackId,
      "thumbnail": thumbnail.asset->url
    }
  `, { trackId });
}
