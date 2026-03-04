/**
 * Converts Prisma nested-create course format to Payload CMS flat-array format.
 *
 * Prisma format:  modules: { create: [{ lessons: { create: [...] } }] }
 * Payload format: modules: [{ lessons: [...] }]
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

interface PrismaChallengeData {
  prompt: string;
  starterCode: string;
  language: string;
  solution?: string;
  hints: string[];
  testCases: {
    name: string;
    input: string;
    expectedOutput: string;
    order?: number;
  }[];
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

interface PrismaModuleData {
  title: string;
  description: string;
  order: number;
  lessons: { create: PrismaLessonData[] };
}

interface PrismaCourseData {
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
    testCases: rawTestCases.map(
      (t: PrismaChallengeData["testCases"][number], idx: number) => ({
        name: t.name,
        input: t.input,
        expectedOutput: t.expectedOutput,
        order: t.order ?? idx,
      }),
    ),
  };
}

function convertLesson(l: PrismaLessonData): AnyRecord {
  const lesson: AnyRecord = {
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

function convertModule(m: PrismaModuleData): AnyRecord {
  return {
    title: m.title,
    description: m.description,
    order: m.order,
    lessons: m.lessons.create.map(convertLesson),
  };
}

/**
 * Converts a Prisma nested-create course object to Payload CMS create format.
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
    modules: data.modules.create.map(convertModule),
    _status: "published",
  };
}
