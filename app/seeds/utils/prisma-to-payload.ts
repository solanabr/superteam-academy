/**
 * Converts Prisma nested-create course format to Payload CMS format.
 *
 * With modules/lessons as separate collections:
 * - prismaToPayloadCourse() → course-only fields (no modules)
 * - convertModuleForPayload() → module doc referencing course
 * - convertLessonForPayload() → lesson doc referencing module
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/**
 * Wraps plain text/markdown in a minimal Lexical root node.
 * Sufficient for seed data — real courses use the CMS rich text editor.
 */
export function textToLexical(text: string): AnyRecord {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text }],
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

interface TestCaseData {
  name: string;
  input: string;
  expectedOutput: string;
  order?: number;
}

interface PrismaChallengeData {
  prompt: string;
  starterCode: string;
  language: string;
  solution?: string;
  hints: string[];
  testCases: TestCaseData[] | { create: TestCaseData[] };
}

interface PrismaLessonData {
  title: string;
  description: string;
  type: string;
  order: number;
  xpReward: number;
  duration?: string;
  videoUrl?: string;
  content?: string;
  challenge?: PrismaChallengeData | { create: PrismaChallengeData };
}

export interface PrismaModuleData {
  title: string;
  description: string;
  order: number;
  lessons: { create: PrismaLessonData[] };
}

export interface PrismaCourseData {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  xpTotal: number;
  trackId: number;
  trackLevel: number;
  trackName: string;
  creator: string;
  creatorAvatar?: string;
  thumbnail?: string;
  isActive?: boolean;
  tags: string[];
  prerequisites: string[];
  modules: { create: PrismaModuleData[] };
}

function convertChallenge(c: PrismaChallengeData): AnyRecord {
  const hints = c.hints ?? [];
  const rawTestCases = Array.isArray(c.testCases)
    ? c.testCases
    : ((c.testCases as AnyRecord)?.create ?? []);

  return {
    prompt: textToLexical(c.prompt),
    starterCode: c.starterCode,
    language: c.language,
    solution: c.solution ?? "",
    hints: hints.map((hint) => ({ hint })),
    testCases: rawTestCases.map((t: TestCaseData, idx: number) => ({
      name: t.name,
      input: t.input,
      expectedOutput: t.expectedOutput,
      order: t.order ?? idx,
    })),
  };
}

/**
 * Converts a Prisma course object to Payload CMS create format (course-only, no modules).
 */
export function prismaToPayloadCourse(data: PrismaCourseData): AnyRecord {
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    duration: data.duration,
    xpTotal: data.xpTotal,
    trackLevel: data.trackLevel,
    creator: data.creator,
    creatorAvatar: data.creatorAvatar ?? undefined,
    thumbnail: data.thumbnail ?? undefined,
    isActive: data.isActive ?? true,
    tags: data.tags.map((tag) => ({ tag })),
    prerequisites: data.prerequisites.map((slug) => ({ slug })),
    _status: "published",
  };
}

/**
 * Converts a Prisma module to Payload CMS create format.
 */
export function convertModuleForPayload(
  m: PrismaModuleData,
  courseId: string | number,
): AnyRecord {
  return {
    course: courseId,
    title: m.title,
    description: m.description,
    order: m.order,
  };
}

/**
 * Converts a Prisma lesson to Payload CMS create format.
 */
export function convertLessonForPayload(
  l: PrismaLessonData,
  moduleId: string | number,
): AnyRecord {
  const lesson: AnyRecord = {
    module: moduleId,
    title: l.title,
    description: l.description,
    type: l.type,
    order: l.order,
    xpReward: l.xpReward,
    duration: l.duration ?? "",
  };

  if (l.videoUrl) lesson.videoUrl = l.videoUrl;

  if (l.content) {
    lesson.content = textToLexical(l.content);
  }

  if (l.challenge) {
    const challengeData =
      "create" in l.challenge ? l.challenge.create : l.challenge;
    lesson.challenge = convertChallenge(challengeData);
  }

  return lesson;
}
