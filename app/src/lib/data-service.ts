import { prisma } from "@/lib/db";
import type { Course, Achievement, LearningPath } from "@/types";
import type { Payload } from "payload";
import { MOCK_COURSES } from "@/lib/mock-courses";
import { getPayload } from "@/lib/payload";
import { payloadCourseToCourse } from "@/lib/payload-to-course";

export { getAllTracks } from "@/lib/tracks-service";
export { getAllDifficulties } from "@/lib/difficulties-service";

// ── Payload module/lesson fetcher ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/**
 * Fetches all modules (with their lessons nested) for the given course IDs.
 * Returns a Map keyed by course ID → array of module records with `.lessons`.
 * Uses 2 queries total: one for modules, one for lessons.
 */
async function fetchModulesWithLessons(
  payload: Payload,
  courseIds: (string | number)[],
): Promise<Map<string, AnyRecord[]>> {
  if (courseIds.length === 0) return new Map();

  const modulesResult = await payload.find({
    collection: "modules",
    where: { course: { in: courseIds } },
    sort: "order",
    limit: 10000,
  });

  const moduleIds = modulesResult.docs.map((m) => m.id);
  if (moduleIds.length === 0) return new Map();

  const lessonsResult = await payload.find({
    collection: "lessons",
    where: { module: { in: moduleIds } },
    sort: "order",
    limit: 100000,
  });

  // Group lessons by module ID
  const lessonsByModule = new Map<string, AnyRecord[]>();
  for (const lesson of lessonsResult.docs) {
    const modId = String(
      typeof (lesson as AnyRecord).module === "object"
        ? ((lesson as AnyRecord).module as AnyRecord).id
        : (lesson as AnyRecord).module,
    );
    if (!lessonsByModule.has(modId)) lessonsByModule.set(modId, []);
    lessonsByModule.get(modId)!.push(lesson as AnyRecord);
  }

  // Group modules by course ID, attaching lessons
  const result = new Map<string, AnyRecord[]>();
  for (const mod of modulesResult.docs) {
    const courseId = String(
      typeof (mod as AnyRecord).course === "object"
        ? ((mod as AnyRecord).course as AnyRecord).id
        : (mod as AnyRecord).course,
    );
    if (!result.has(courseId)) result.set(courseId, []);
    const moduleWithLessons = {
      ...(mod as AnyRecord),
      lessons: lessonsByModule.get(String(mod.id)) ?? [],
    };
    result.get(courseId)!.push(moduleWithLessons);
  }

  return result;
}

// ── Courses ─────────────────────────────────────────────────────────────────

function formatCourse(
  c: Awaited<ReturnType<typeof fetchCourseRaw>>,
  completions = 0,
): Course {
  if (!c) throw new Error("Course not found");

  const lessonCount = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const challengeCount = c.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.type === "challenge").length,
    0,
  );

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    thumbnail: c.thumbnail ?? "",
    difficulty: c.difficulty,
    duration: c.duration,
    lessonCount,
    challengeCount,
    xpTotal: c.xpTotal,
    trackId: c.trackId,
    trackLevel: c.trackLevel,
    trackName: c.trackName,
    creator: c.creator,
    creatorAvatar: c.creatorAvatar ?? undefined,
    isActive: c.isActive,
    totalEnrollments: c._count?.enrollments ?? 0,
    totalCompletions: completions,
    modules: c.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        type: l.type as "content" | "challenge",
        order: l.order,
        xpReward: l.xpReward,
        content: l.content ?? undefined,
        duration: l.duration,
        challenge: l.challenge
          ? {
              id: l.challenge.id,
              prompt: l.challenge.prompt,
              starterCode: l.challenge.starterCode,
              language: l.challenge.language as "rust" | "typescript" | "json",
              hints: l.challenge.hints,
              testCases: l.challenge.testCases.map((t) => ({
                id: t.id,
                name: t.name,
                input: t.input,
                expectedOutput: t.expectedOutput,
              })),
            }
          : undefined,
      })),
    })),
    prerequisites: c.prerequisites,
    tags: c.tags,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

const courseInclude = {
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        orderBy: { order: "asc" as const },
        include: {
          challenge: {
            include: {
              testCases: { orderBy: { order: "asc" as const } },
            },
          },
        },
      },
    },
  },
  _count: {
    select: { enrollments: true },
  },
} as const;

async function fetchCourseRaw(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: courseInclude,
  });
}

export async function getAllCourses(): Promise<Course[]> {
  // Payload CMS is the source of truth for content
  try {
    const payload = await getPayload();
    const [result, completionGroups] = await Promise.all([
      payload.find({
        collection: "courses",
        where: { isActive: { equals: true } },
        sort: "trackNumId",
        limit: 1000,
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { completedAt: { not: null } },
        _count: { courseId: true },
      }),
    ]);

    if (result.docs.length > 0) {
      const courseIds = result.docs.map((d) => d.id);
      const [modulesMap, enrollmentGroups] = await Promise.all([
        fetchModulesWithLessons(payload, courseIds),
        prisma.enrollment.groupBy({
          by: ["courseId"],
          _count: { courseId: true },
        }),
      ]);

      const completionMap = new Map(
        completionGroups.map((g) => [g.courseId, g._count.courseId]),
      );
      const enrollmentMap = new Map(
        enrollmentGroups.map((g) => [g.courseId, g._count.courseId]),
      );

      return result.docs.map((doc) => {
        const modules = modulesMap.get(String(doc.id)) ?? [];
        const course = payloadCourseToCourse(doc, modules);
        course.totalEnrollments = enrollmentMap.get(String(doc.id)) ?? 0;
        course.totalCompletions = completionMap.get(String(doc.id)) ?? 0;
        return course;
      });
    }
  } catch {
    // Payload not configured — fall through to Prisma
  }

  // Prisma fallback
  const [courses, completionGroups] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      include: courseInclude,
      orderBy: [{ trackId: "asc" }, { trackLevel: "asc" }],
    }),
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { completedAt: { not: null } },
      _count: { courseId: true },
    }),
  ]);

  if (courses.length > 0) {
    const completionMap = new Map(
      completionGroups.map((g) => [g.courseId, g._count.courseId]),
    );
    return courses.map((c) => formatCourse(c, completionMap.get(c.id) ?? 0));
  }

  return MOCK_COURSES;
}

export async function getCourseBySlug(
  slug: string,
): Promise<Course | undefined> {
  // Try Payload CMS first
  try {
    const payload = await getPayload();
    const result = await payload.find({
      collection: "courses",
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (result.docs.length > 0) {
      const doc = result.docs[0];
      const courseId = String(doc.id);
      const [modulesMap, enrollments, completions] = await Promise.all([
        fetchModulesWithLessons(payload, [doc.id]),
        prisma.enrollment.count({ where: { courseId } }),
        prisma.enrollment.count({
          where: { courseId, completedAt: { not: null } },
        }),
      ]);
      const modules = modulesMap.get(courseId) ?? [];
      const course = payloadCourseToCourse(doc, modules);
      course.totalEnrollments = enrollments;
      course.totalCompletions = completions;
      return course;
    }
  } catch {
    // Payload not configured or DB not available — fall through to Prisma
  }

  const course = await fetchCourseRaw(slug);
  if (!course) return MOCK_COURSES.find((c) => c.slug === slug);
  const completions = await prisma.enrollment.count({
    where: { courseId: course.id, completedAt: { not: null } },
  });
  return formatCourse(course, completions);
}

export async function getCoursesByTrack(trackId: number): Promise<Course[]> {
  try {
    const payload = await getPayload();
    const [result, completionGroups, enrollmentGroups] = await Promise.all([
      payload.find({
        collection: "courses",
        where: {
          and: [
            { trackNumId: { equals: trackId } },
            { isActive: { equals: true } },
          ],
        },
        sort: "trackLevel",
        limit: 1000,
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { completedAt: { not: null } },
        _count: { courseId: true },
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        _count: { courseId: true },
      }),
    ]);

    if (result.docs.length > 0) {
      const courseIds = result.docs.map((d) => d.id);
      const modulesMap = await fetchModulesWithLessons(payload, courseIds);

      const completionMap = new Map(
        completionGroups.map((g) => [g.courseId, g._count.courseId]),
      );
      const enrollmentMap = new Map(
        enrollmentGroups.map((g) => [g.courseId, g._count.courseId]),
      );
      return result.docs.map((doc) => {
        const modules = modulesMap.get(String(doc.id)) ?? [];
        const course = payloadCourseToCourse(doc, modules);
        course.totalEnrollments = enrollmentMap.get(String(doc.id)) ?? 0;
        course.totalCompletions = completionMap.get(String(doc.id)) ?? 0;
        return course;
      });
    }
  } catch {
    // Payload not configured — fall through to Prisma
  }

  const [courses, completionGroups] = await Promise.all([
    prisma.course.findMany({
      where: { trackId, isActive: true },
      include: courseInclude,
      orderBy: { trackLevel: "asc" },
    }),
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { completedAt: { not: null } },
      _count: { courseId: true },
    }),
  ]);

  if (courses.length === 0)
    return MOCK_COURSES.filter((c) => c.trackId === trackId);

  const completionMap = new Map(
    completionGroups.map((g) => [g.courseId, g._count.courseId]),
  );
  return courses.map((c) => formatCourse(c, completionMap.get(c.id) ?? 0));
}

export async function getCoursesByDifficulty(
  difficulty: Course["difficulty"],
): Promise<Course[]> {
  try {
    const payload = await getPayload();
    const [result, completionGroups, enrollmentGroups] = await Promise.all([
      payload.find({
        collection: "courses",
        where: {
          and: [
            { difficultyValue: { equals: difficulty } },
            { isActive: { equals: true } },
          ],
        },
        sort: "trackNumId",
        limit: 1000,
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { completedAt: { not: null } },
        _count: { courseId: true },
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        _count: { courseId: true },
      }),
    ]);

    if (result.docs.length > 0) {
      const courseIds = result.docs.map((d) => d.id);
      const modulesMap = await fetchModulesWithLessons(payload, courseIds);

      const completionMap = new Map(
        completionGroups.map((g) => [g.courseId, g._count.courseId]),
      );
      const enrollmentMap = new Map(
        enrollmentGroups.map((g) => [g.courseId, g._count.courseId]),
      );
      return result.docs.map((doc) => {
        const modules = modulesMap.get(String(doc.id)) ?? [];
        const course = payloadCourseToCourse(doc, modules);
        course.totalEnrollments = enrollmentMap.get(String(doc.id)) ?? 0;
        course.totalCompletions = completionMap.get(String(doc.id)) ?? 0;
        return course;
      });
    }
  } catch {
    // Payload not configured — fall through to Prisma
  }

  const [courses, completionGroups] = await Promise.all([
    prisma.course.findMany({
      where: { difficulty, isActive: true },
      include: courseInclude,
      orderBy: [{ trackId: "asc" }, { trackLevel: "asc" }],
    }),
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { completedAt: { not: null } },
      _count: { courseId: true },
    }),
  ]);
  const completionMap = new Map(
    completionGroups.map((g) => [g.courseId, g._count.courseId]),
  );

  return courses.map((c) => formatCourse(c, completionMap.get(c.id) ?? 0));
}

// ── Platform Stats ──────────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<{
  learnerCount: string;
  courseCount: string;
  credentialCount: string;
  totalXpFormatted: string;
}> {
  const [learnerCount, courseCount, credentialCount, xpAgg] = await Promise.all(
    [
      prisma.user.count(),
      prisma.course.count({ where: { isActive: true } }),
      prisma.userCredential.count(),
      prisma.xPEvent.aggregate({ _sum: { amount: true } }),
    ],
  );

  const totalXp = xpAgg._sum.amount ?? 0;

  function fmt(n: number): string {
    if (n >= 1_000_000)
      return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
    return n > 0 ? `${n}+` : "0";
  }

  return {
    learnerCount: fmt(learnerCount),
    courseCount: fmt(courseCount),
    credentialCount: fmt(credentialCount),
    totalXpFormatted: fmt(totalXp),
  };
}

// ── Learning Paths ──────────────────────────────────────────────────────────

export async function getAllLearningPaths(): Promise<LearningPath[]> {
  // Learning paths are derived from tracks
  const tracks = await prisma.course.findMany({
    where: { isActive: true },
    select: { trackId: true, trackName: true, slug: true, trackLevel: true },
    orderBy: [{ trackId: "asc" }, { trackLevel: "asc" }],
  });

  const pathMap = new Map<number, { name: string; slugs: string[] }>();
  for (const t of tracks) {
    if (!pathMap.has(t.trackId)) {
      pathMap.set(t.trackId, { name: t.trackName, slugs: [] });
    }
    pathMap.get(t.trackId)!.slugs.push(t.slug);
  }

  const icons = [
    "BookOpen",
    "Anchor",
    "Coins",
    "TrendingUp",
    "Shield",
    "Layers",
  ];
  const colors = [
    "#9945FF",
    "#14F195",
    "#FFD700",
    "#00D4FF",
    "#FF6B6B",
    "#4ECDC4",
  ];

  return Array.from(pathMap.entries()).map(([id, { name, slugs }]) => ({
    id: String(id),
    name,
    description: `Master ${name} through hands-on courses`,
    icon: icons[id] ?? "BookOpen",
    courses: slugs,
    color: colors[id] ?? "#9945FF",
  }));
}

// ── Achievements ────────────────────────────────────────────────────────────

export async function getAllAchievements(): Promise<Achievement[]> {
  const achievements = await prisma.achievement.findMany({
    orderBy: { id: "asc" },
  });

  return achievements.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category as Achievement["category"],
    xpReward: a.xpReward,
    claimed: false,
  }));
}
