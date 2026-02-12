import { createClient } from "@sanity/client";
import { fallbackCourses } from "@/lib/cms/fallback-content";
import type { CmsCourse } from "@/lib/cms/types";

const hasSanityConfig = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET
);

const sanityClient = hasSanityConfig
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: "2024-10-01",
      useCdn: true,
      token: process.env.SANITY_API_TOKEN
    })
  : null;

const writableSanityClient =
  hasSanityConfig && process.env.SANITY_API_TOKEN
    ? createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: "2024-10-01",
        useCdn: false,
        token: process.env.SANITY_API_TOKEN
      })
    : null;

function normalizeCourse(course: CmsCourse): CmsCourse {
  return {
    ...course,
    modules: [...course.modules]
      .sort((a, b) => a.order - b.order)
      .map((module) => ({
        ...module,
        lessons: [...module.lessons].sort((a, b) => a.order - b.order)
      }))
  };
}

export async function getCoursesFromCms(): Promise<CmsCourse[]> {
  if (!sanityClient) {
    return fallbackCourses.map(normalizeCourse);
  }

  const query = `*[_type == "course"] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    topic,
    difficulty,
    durationHours,
    xpReward,
    modules[]->{
      _id,
      title,
      order,
      lessons[]->{
        _id,
        title,
        order,
        content,
        challengePrompt
      }
    }
  }`;

  const courses = (await sanityClient.fetch(query)) as CmsCourse[];
  if (!courses || courses.length === 0) {
    return fallbackCourses.map(normalizeCourse);
  }

  return courses.map(normalizeCourse);
}

export async function getCourseBySlugFromCms(slug: string): Promise<CmsCourse | null> {
  const courses = await getCoursesFromCms();
  return courses.find((course) => course.slug === slug) ?? null;
}

export function getWritableSanityClient() {
  return writableSanityClient;
}
