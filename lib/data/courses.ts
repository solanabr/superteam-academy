import { getSanityClient, isSanityConfigured } from '@/lib/cms/sanity-client';
import { CourseDetail, CourseModule, CourseSummary, Lesson } from '@/lib/types';

interface SanityCourseCatalogRow {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  durationMinutes?: number;
  topic?: string;
  thumbnail?: string;
  xpTotal?: number;
  instructor?: string;
  path?: string;
}

interface SanityLessonRow {
  id?: string;
  title?: string;
  type?: string;
  xpReward?: number;
  markdown?: string;
  starterCode?: string;
  language?: string;
  testCases?: Array<{
    id?: string;
    label?: string;
    expected?: string;
  }>;
}

interface SanityModuleRow {
  id?: string;
  title?: string;
  lessons?: SanityLessonRow[];
}

interface SanityCourseDetailRow extends SanityCourseCatalogRow {
  learningOutcomes?: string[];
  modules?: SanityModuleRow[];
}

function normalizeDifficulty(value: string | undefined): CourseSummary['difficulty'] {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
    return value;
  }

  return 'beginner';
}

function normalizeLesson(moduleId: string, moduleTitle: string, input: SanityLessonRow, index: number): Lesson {
  const lessonType = input.type === 'challenge' ? 'challenge' : 'content';
  const language =
    input.language === 'rust' || input.language === 'typescript' || input.language === 'json'
      ? input.language
      : undefined;

  return {
    id: input.id ?? `${moduleId}-lesson-${index + 1}`,
    title: input.title ?? `Lesson ${index + 1}`,
    moduleId,
    moduleTitle,
    type: lessonType,
    markdown: input.markdown ?? '',
    xpReward: input.xpReward ?? 0,
    starterCode: input.starterCode,
    language,
    testCases: (input.testCases ?? []).map((testCase, caseIndex) => ({
      id: testCase.id ?? `${moduleId}-${index + 1}-case-${caseIndex + 1}`,
      label: testCase.label ?? `Case ${caseIndex + 1}`,
      expected: testCase.expected ?? '',
      passed: false
    }))
  };
}

function normalizeModules(input: SanityModuleRow[] | undefined): CourseModule[] {
  return (input ?? []).map((moduleItem, moduleIndex) => {
    const moduleId = moduleItem.id ?? `module-${moduleIndex + 1}`;
    const moduleTitle = moduleItem.title ?? `Module ${moduleIndex + 1}`;

    return {
      id: moduleId,
      title: moduleTitle,
      lessons: (moduleItem.lessons ?? []).map((lesson, lessonIndex) =>
        normalizeLesson(moduleId, moduleTitle, lesson, lessonIndex)
      )
    };
  });
}

function normalizeCatalogRow(row: SanityCourseCatalogRow): CourseSummary | null {
  if (!row.slug || !row.title) {
    return null;
  }

  return {
    id: row.id ?? row.slug,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    difficulty: normalizeDifficulty(row.difficulty),
    durationMinutes: row.durationMinutes ?? 0,
    topic: row.topic ?? 'general',
    thumbnail: row.thumbnail ?? '',
    xpTotal: row.xpTotal ?? 0,
    instructor: row.instructor ?? 'Superteam Brasil',
    path: row.path ?? 'General'
  };
}

function normalizeDetailRow(row: SanityCourseDetailRow): CourseDetail | null {
  const summary = normalizeCatalogRow(row);
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    learningOutcomes: row.learningOutcomes ?? [],
    modules: normalizeModules(row.modules)
  };
}

const CATALOG_QUERY = `*[_type == "course" && status == "published"] | order(title asc) {
  "id": _id,
  "slug": slug.current,
  title,
  description,
  difficulty,
  durationMinutes,
  "topic": coalesce(track, "general"),
  "thumbnail": thumbnail.asset->url,
  xpTotal,
  "instructor": coalesce(instructor->name, "Superteam Brasil"),
  "path": coalesce(track, "General")
}`;

const DETAIL_QUERY = `*[_type == "course" && slug.current == $slug && status == "published"][0] {
  "id": _id,
  "slug": slug.current,
  title,
  description,
  difficulty,
  durationMinutes,
  "topic": coalesce(track, "general"),
  "thumbnail": thumbnail.asset->url,
  xpTotal,
  "instructor": coalesce(instructor->name, "Superteam Brasil"),
  "path": coalesce(track, "General"),
  learningOutcomes,
  modules[]-> {
    "id": _id,
    title,
    order,
    lessons[]-> {
      "id": _id,
      title,
      type,
      xpReward,
      markdown,
      starterCode,
      language,
      testCases[] {
        "id": _key,
        label,
        expected
      },
      order
    }
  }
}`;

export async function getPublishedCourses(): Promise<CourseSummary[]> {
  if (!isSanityConfigured()) {
    return [];
  }

  try {
    const sanityClient = getSanityClient();
    if (!sanityClient) {
      return [];
    }
    const rows = await sanityClient.fetch<SanityCourseCatalogRow[]>(CATALOG_QUERY);
    return rows.map(normalizeCatalogRow).filter((item): item is CourseSummary => item !== null);
  } catch {
    return [];
  }
}

export async function getPublishedCourseBySlug(slug: string): Promise<CourseDetail | null> {
  if (!isSanityConfigured()) {
    return null;
  }

  try {
    const sanityClient = getSanityClient();
    if (!sanityClient) {
      return null;
    }
    const row = await sanityClient.fetch<SanityCourseDetailRow | null>(DETAIL_QUERY, { slug });
    if (!row) {
      return null;
    }

    return normalizeDetailRow(row);
  } catch {
    return null;
  }
}

export async function getCourseLessonTotal(courseId: string): Promise<number> {
  const courses = await getPublishedCourses();
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    return 0;
  }

  const detail = await getPublishedCourseBySlug(course.slug);
  if (!detail) {
    return 0;
  }

  return detail.modules.reduce((acc, moduleItem) => acc + moduleItem.lessons.length, 0);
}
