import { sanityClient } from "./client";

export const COURSE_FIELDS = `
  _id,
  "slug": slug.current,
  title,
  shortDescription,
  description,
  difficulty,
  duration,
  lessonCount,
  xpReward,
  xpPerLesson,
  tags,
  language,
  isActive,
  enrolledCount,
  rating,
  reviewCount,
  "thumbnail": thumbnail.asset->url,
  "instructor": instructor->{
    name,
    bio,
    "avatar": avatar.asset->url,
    twitter,
    github
  },
  "track": track->{
    _id,
    name,
    "slug": slug.current,
    description,
    color,
    icon
  }
`;

export const MODULE_FIELDS = `
  _id,
  title,
  description,
  order,
  "lessons": lessons[]->{
    _id,
    title,
    type,
    duration,
    order,
    lessonIndex,
    xpReward,
    content,
    "challenge": challenge->{
      prompt,
      starterCode,
      solution,
      language,
      testCases,
      hints
    }
  }
`;

export async function getCourses(filters?: {
  difficulty?: string;
  trackId?: string;
  search?: string;
}) {
  let query = `*[_type == "course" && isActive == true`;

  if (filters?.difficulty && filters.difficulty !== "all") {
    query += ` && difficulty == "${filters.difficulty}"`;
  }
  if (filters?.search) {
    query += ` && (title match "${filters.search}*" || description match "${filters.search}*")`;
  }

  query += `] | order(enrolledCount desc) {${COURSE_FIELDS}}`;

  return sanityClient.fetch(query).catch(() => []);
}

export async function getCourseBySlug(slug: string) {
  return sanityClient
    .fetch(
      `*[_type == "course" && slug.current == $slug][0] {
        ${COURSE_FIELDS},
        "modules": modules[]->{${MODULE_FIELDS}}
      }`,
      { slug }
    )
    .catch(() => null);
}

export async function getLessonById(id: string) {
  return sanityClient
    .fetch(
      `*[_type == "lesson" && _id == $id][0] {
        _id,
        title,
        type,
        duration,
        xpReward,
        content,
        "challenge": challenge->{
          prompt,
          starterCode,
          solution,
          language,
          testCases,
          hints
        }
      }`,
      { id }
    )
    .catch(() => null);
}
