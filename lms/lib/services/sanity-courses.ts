import { createClient } from "next-sanity";
import type { Course } from "@/types/course";

const TRACK_MAP: Record<string, number> = {
  standalone: 0,
  anchor: 1,
  rust: 2,
  defi: 3,
  security: 4,
};

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01",
  useCdn: true,
});

const COURSE_FIELDS = `
  _id,
  title,
  slug,
  description,
  thumbnail,
  difficulty,
  duration,
  xpTotal,
  track,
  trackLevel,
  "prerequisiteId": prerequisite->slug.current,
  isActive,
  totalCompletions,
  totalEnrollments,
  creator->{name},
  modules[] | order(order asc) {
    _key,
    title,
    description,
    order,
    lessons[] | order(order asc) {
      _key,
      title,
      description,
      order,
      type,
      xpReward,
      duration,
      content,
      challenge {
        language,
        prompt,
        starterCode,
        solution,
        testCases[] {
          _key,
          name,
          input,
          expectedOutput
        },
        hints
      }
    }
  },
  _createdAt
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapSanityCourse(raw: any): Course {
  const trackId = TRACK_MAP[raw.track] ?? 0;

  const modules = (raw.modules ?? []).map((m: any) => ({
    id: m._key,
    title: m.title,
    description: m.description ?? "",
    order: m.order ?? 0,
    lessons: (m.lessons ?? []).map((l: any) => ({
      id: l._key,
      title: l.title,
      description: l.description ?? "",
      order: l.order ?? 0,
      type: l.type ?? "content",
      content: l.content,
      challenge: l.challenge
        ? {
            language: l.challenge.language ?? "typescript",
            prompt: l.challenge.prompt ?? "",
            starterCode: l.challenge.starterCode ?? "",
            solution: l.challenge.solution ?? "",
            testCases: (l.challenge.testCases ?? []).map((t: any) => ({
              id: t._key,
              name: t.name,
              input: t.input ?? "",
              expectedOutput: t.expectedOutput ?? "",
            })),
            hints: l.challenge.hints ?? [],
          }
        : undefined,
      xpReward: l.xpReward ?? 25,
      duration: l.duration ?? "15 min",
    })),
  }));

  let lessonCount = 0;
  let challengeCount = 0;
  for (const m of modules) {
    lessonCount += m.lessons.length;
    challengeCount += m.lessons.filter(
      (l: any) => l.type === "challenge",
    ).length;
  }

  return {
    id: raw._id,
    slug: raw.slug?.current ?? raw._id,
    title: raw.title,
    description: raw.description ?? "",
    thumbnail: raw.thumbnail?.asset?._ref,
    creator: raw.creator?.name ?? "Unknown",
    difficulty: raw.difficulty ?? "beginner",
    lessonCount,
    challengeCount,
    xpTotal: raw.xpTotal ?? 0,
    trackId,
    trackLevel: raw.trackLevel ?? 1,
    prerequisiteId: raw.prerequisiteId,
    duration: raw.duration ?? "3 hours",
    isActive: raw.isActive ?? true,
    totalCompletions: raw.totalCompletions ?? 0,
    totalEnrollments: raw.totalEnrollments ?? 0,
    modules,
    createdAt: raw._createdAt ?? new Date().toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchSanityCourses(): Promise<Course[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return [];

    const raw = await sanityClient.fetch(
      `*[_type == "course" && isActive == true] | order(_createdAt asc) { ${COURSE_FIELDS} }`,
    );

    if (!raw || raw.length === 0) return [];
    return raw.map(mapSanityCourse);
  } catch {
    return [];
  }
}

export async function fetchSanityCourse(
  slugOrId: string,
): Promise<Course | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return null;

    const raw = await sanityClient.fetch(
      `*[_type == "course" && (slug.current == $slugOrId || _id == $slugOrId)][0] { ${COURSE_FIELDS} }`,
      { slugOrId },
    );

    if (!raw) return null;
    return mapSanityCourse(raw);
  } catch {
    return null;
  }
}
