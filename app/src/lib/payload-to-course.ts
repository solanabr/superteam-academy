import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { Course } from "@/types";

// Payload generates these types after `payload generate:types` — we use `any` until then
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayloadCourse = Record<string, any>;

function lexicalToHtml(data: unknown): string | undefined {
  if (!data) return undefined;
  try {
    const html = convertLexicalToHTML({
      data: data as Parameters<typeof convertLexicalToHTML>[0]["data"],
    });
    return html || undefined;
  } catch {
    return undefined;
  }
}

export function payloadCourseToCourse(doc: PayloadCourse): Course {
  const modules = (doc.modules ?? []).map((m: PayloadCourse, mIdx: number) => {
    const lessons = (m.lessons ?? []).map((l: PayloadCourse, lIdx: number) => {
      const content = lexicalToHtml(l.content);
      const isChallenge = l.type === "challenge";

      return {
        id: l.id ?? `${doc.id}-m${mIdx}-l${lIdx}`,
        title: l.title ?? "",
        description: l.description ?? "",
        type: (l.type ?? "content") as "content" | "challenge",
        order: l.order ?? lIdx,
        xpReward: l.xpReward ?? 0,
        duration: l.duration ?? undefined,
        videoUrl: l.videoUrl ?? undefined,
        content,
        challenge:
          isChallenge && l.challenge
            ? {
                id: l.id ?? `${doc.id}-m${mIdx}-l${lIdx}-c`,
                prompt:
                  lexicalToHtml(l.challenge.prompt) ?? l.challenge.prompt ?? "",
                starterCode: l.challenge.starterCode ?? "",
                language: (l.challenge.language ?? "typescript") as
                  | "rust"
                  | "typescript"
                  | "json",
                hints: (l.challenge.hints ?? []).map(
                  (h: PayloadCourse) => h.hint ?? h,
                ),
                testCases: (l.challenge.testCases ?? []).map(
                  (t: PayloadCourse, tIdx: number) => ({
                    id: t.id ?? `${doc.id}-m${mIdx}-l${lIdx}-t${tIdx}`,
                    name: t.name ?? "",
                    input: t.input ?? "",
                    expectedOutput: t.expectedOutput ?? "",
                  }),
                ),
              }
            : undefined,
      };
    });

    const lessonCount = lessons.length;
    const challengeCount = lessons.filter(
      (l: { type: string }) => l.type === "challenge",
    ).length;

    return {
      id: m.id ?? `${doc.id}-m${mIdx}`,
      title: m.title ?? "",
      description: m.description ?? "",
      order: m.order ?? mIdx,
      lessons,
      lessonCount,
      challengeCount,
    };
  });

  const allLessons = modules.flatMap((m: { lessons: unknown[] }) => m.lessons);
  const lessonCount = allLessons.length;
  const challengeCount = allLessons.filter(
    (l: { type: string }) => l.type === "challenge",
  ).length;

  const thumbnail =
    typeof doc.thumbnail === "object" && doc.thumbnail?.url
      ? (doc.thumbnail.url as string)
      : ((doc.thumbnail as string | undefined) ?? "");

  return {
    id: doc.id,
    slug: doc.slug ?? "",
    title: doc.title ?? "",
    description: doc.description ?? "",
    thumbnail,
    difficulty: (doc.difficulty ?? "beginner") as Course["difficulty"],
    duration: doc.duration ?? "",
    lessonCount,
    challengeCount,
    xpTotal: doc.xpTotal ?? 0,
    trackId: doc.trackId ?? 1,
    trackLevel: doc.trackLevel ?? 1,
    trackName: doc.trackName ?? "",
    creator: doc.creator ?? "",
    creatorAvatar: doc.creatorAvatar ?? undefined,
    isActive: doc.isActive ?? true,
    totalEnrollments: 0,
    totalCompletions: 0,
    modules,
    prerequisites: (doc.prerequisites ?? []).map(
      (p: PayloadCourse) => p.slug ?? p,
    ),
    tags: (doc.tags ?? []).map((t: PayloadCourse) => t.tag ?? t),
    createdAt: doc.createdAt ?? new Date().toISOString(),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
  };
}
