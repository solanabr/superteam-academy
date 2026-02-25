import type { CourseService } from "../course-service";
import type { Course, SearchParams } from "@/types";
import { sanityClient } from "@/lib/sanity/client";

// Lean fields for catalog listing — no modules/lessons/challenges/quizzes
const COURSE_LIST_FIELDS = `
  _id,
  "id": _id,
  courseId,
  title,
  description,
  "slug": slug.current,
  creator,
  difficulty,
  lessonCount,
  xpPerLesson,
  trackId,
  trackLevel,
  prerequisite,
  isActive,
  totalCompletions,
  creatorRewardXp,
  "thumbnailUrl": thumbnail.asset->url,
  duration,
  whatYouLearn,
  "instructor": instructor{
    name,
    "avatar": avatar.asset->url,
    bio
  }
`;

const COURSE_FIELDS = `
  _id,
  "id": _id,
  courseId,
  title,
  description,
  "slug": slug.current,
  creator,
  difficulty,
  lessonCount,
  xpPerLesson,
  trackId,
  trackLevel,
  prerequisite,
  isActive,
  totalCompletions,
  creatorRewardXp,
  "thumbnailUrl": thumbnail.asset->url,
  duration,
  whatYouLearn,
  "instructor": instructor{
    name,
    "avatar": avatar.asset->url,
    bio
  },
  "modules": modules[]{
    _key,
    "id": _key,
    title,
    description,
    order,
    "lessons": lessons[]{
      _key,
      "id": _key,
      title,
      description,
      order,
      type,
      "content": coalesce(htmlContent, null),
      videoUrl,
      xp,
      duration,
      "challenge": challenge{
        prompt,
        objectives,
        starterCode,
        language,
        "testCases": testCases[]{
          _key,
          "id": _key,
          name,
          input,
          expectedOutput,
          hidden
        },
        solution,
        hints
      },
      "quiz": quiz{
        passingScore,
        "questions": questions[]{
          _key,
          "id": _key,
          question,
          options,
          correctIndex,
          explanation
        }
      }
    }
  }
`;

function buildFilters(params?: SearchParams): string {
  const filters: string[] = [
    '_type == "course"',
    "isActive == true",
    '(status == "approved" || !defined(status))',
  ];

  if (params?.difficulty) {
    filters.push(`difficulty == ${Number(params.difficulty)}`);
  }
  if (params?.track) {
    filters.push(`trackId == ${Number(params.track)}`);
  }
  if (params?.search) {
    filters.push(`title match "*${params.search}*"`);
  }

  return filters.join(" && ");
}

export const sanityCourseService: CourseService = {
  async getCourses(params) {
    const filter = buildFilters(params);
    // When no page specified, fetch all courses for client-side filtering
    if (!params?.page) {
      const query = `*[${filter}] | order(trackId asc, trackLevel asc) { ${COURSE_LIST_FIELDS} }`;
      return sanityClient.fetch<Course[]>(query);
    }
    const offset = (Number(params.page) - 1) * 12;
    const query = `*[${filter}] | order(trackId asc, trackLevel asc) [${offset}...${offset + 12}] { ${COURSE_LIST_FIELDS} }`;
    return sanityClient.fetch<Course[]>(query);
  },

  async getCourseBySlug(slug) {
    const query = `*[_type == "course" && slug.current == $slug][0] { ${COURSE_FIELDS} }`;
    return sanityClient.fetch<Course | null>(query, { slug });
  },

  async getCourseById(courseId) {
    const query = `*[_type == "course" && courseId == $courseId][0] { ${COURSE_FIELDS} }`;
    return sanityClient.fetch<Course | null>(query, { courseId });
  },

  async getFeaturedCourses() {
    const query = `*[_type == "course" && isActive == true && (status == "approved" || !defined(status))] | order(totalCompletions desc) [0...6] { ${COURSE_LIST_FIELDS} }`;
    return sanityClient.fetch<Course[]>(query);
  },

  async getCoursesByTrack(trackId) {
    const query = `*[_type == "course" && isActive == true && (status == "approved" || !defined(status)) && trackId == $trackId] | order(trackLevel asc) { ${COURSE_LIST_FIELDS} }`;
    return sanityClient.fetch<Course[]>(query, { trackId });
  },

  async searchCourses(searchQuery) {
    const query = `*[_type == "course" && isActive == true && (status == "approved" || !defined(status)) && (title match "*${searchQuery}*" || description match "*${searchQuery}*")] | order(totalCompletions desc) [0...20] { ${COURSE_LIST_FIELDS} }`;
    return sanityClient.fetch<Course[]>(query);
  },

  async getTotalCourseCount() {
    const query = `count(*[_type == "course" && isActive == true && (status == "approved" || !defined(status))])`;
    return sanityClient.fetch<number>(query);
  },
};
