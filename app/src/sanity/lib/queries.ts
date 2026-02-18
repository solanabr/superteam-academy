import { client } from "./client";

const courseFields = `
  _id,
  title,
  "slug": slug.current,
  description,
  instructor,
  duration,
  difficulty,
  track,
  image,
  published,
  "modules": modules[]->{
    _id,
    title,
    sortOrder,
    "lessons": lessons[]->{
      _id,
      title,
      sortOrder,
      content,
      lessonType,
      "challenge": challenge->{ _id, title, starterCode, language, testCases }
    }
  }
`;

export const coursesQuery = `*[_type == "course" && published == true] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  instructor,
  duration,
  difficulty,
  track,
  image
}`;

export const courseBySlugQuery = `*[_type == "course" && slug.current == $slug && published == true][0] {
  ${courseFields}
}`;

export const courseByIdQuery = `*[_type == "course" && _id == $id][0] {
  ${courseFields}
}`;

export const lessonByIdQuery = `*[_type == "lesson" && _id == $id][0] {
  _id,
  title,
  sortOrder,
  content,
  lessonType,
  "challenge": challenge->{ _id, title, starterCode, language, testCases }
}`;

export type CourseListItem = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  instructor?: string;
  duration?: string;
  difficulty?: string;
  track?: string;
  image?: { asset?: { _ref: string } };
};

export type LessonRef = {
  _id: string;
  title: string;
  sortOrder: number;
  content?: unknown;
  lessonType?: string;
  challenge?: {
    _id: string;
    title?: string;
    starterCode?: string;
    language?: string;
    testCases?: Array<{ name?: string; input?: string; expected?: string }>;
  };
};

export type ModuleRef = {
  _id: string;
  title: string;
  sortOrder: number;
  lessons?: LessonRef[];
};

export type CourseDetail = CourseListItem & {
  modules?: ModuleRef[];
};

export async function getCourses(): Promise<CourseListItem[]> {
  try {
    const list = await client.fetch<CourseListItem[]>(coursesQuery);
    return list ?? [];
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  try {
    const course = await client.fetch<CourseDetail | null>(courseBySlugQuery, { slug });
    return course ?? null;
  } catch {
    return null;
  }
}

export async function getLessonById(id: string): Promise<LessonRef | null> {
  const lesson = await client.fetch<LessonRef | null>(lessonByIdQuery, { id });
  return lesson ?? null;
}
