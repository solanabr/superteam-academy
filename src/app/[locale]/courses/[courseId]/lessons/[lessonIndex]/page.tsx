import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import {
  getLessons,
  getCourseMeta,
  getResolvedContentId,
  localize,
} from "@/lib/content";
import { sanityClient } from "@/lib/sanity";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LessonMarkdown } from "@/components/LessonMarkdown";
import { LessonModuleOverview } from "@/components/LessonModuleOverview";
import { LessonVideo } from "@/components/LessonVideo";
import DeferredPlayground from "./DeferredPlayground";
import type {
  CourseMeta,
  LessonContent,
  Locale,
  LocalizedString,
} from "@/lib/content";

function toLocalizedString(
  value: unknown,
  fallback = "",
): LocalizedString {
  if (typeof value === "string") {
    return { en: value, pt: value, es: value };
  }
  if (value && typeof value === "object") {
    const v = value as Partial<LocalizedString>;
    const en = typeof v.en === "string" ? v.en : fallback;
    const pt = typeof v.pt === "string" ? v.pt : en;
    const es = typeof v.es === "string" ? v.es : en;
    return { en, pt, es };
  }
  return { en: fallback, pt: fallback, es: fallback };
}

function normalizeLanguage(value: unknown): LessonContent["language"] {
  return value === "javascript" ||
    value === "typescript" ||
    value === "rust" ||
    value === "json"
    ? value
    : undefined;
}

function mergeMarkdown(
  description: LocalizedString,
  content: string | undefined,
): LocalizedString {
  if (!content) return description;
  return {
    en: [description.en, content].filter(Boolean).join("\n\n"),
    pt: [description.pt, content].filter(Boolean).join("\n\n"),
    es: [description.es, content].filter(Boolean).join("\n\n"),
  };
}

async function getSanityLessonBundle(
  courseId: string,
): Promise<{ lessons: LessonContent[]; meta: CourseMeta | null }> {
  if (!sanityClient) return { lessons: [], meta: null };
  try {
    const [lessonDocs, courseDoc] = await Promise.all([
      sanityClient.fetch(
        `*[_type == "lesson" && courseId == $courseId] | order(lessonIndex asc){
          lessonIndex, title, description, content, starterCode, tests, videoUrl, solutionCode, language, fileName, hints
        }`,
        { courseId },
      ),
      sanityClient.fetch(
        `*[_type == "course" && courseId == $courseId][0]{
          courseId, title, description, trackCollection
        }`,
        { courseId },
      ),
    ]);

    const lessons = Array.isArray(lessonDocs)
      ? lessonDocs.map((doc, index): LessonContent => {
          const baseDescription = toLocalizedString(doc?.description, "");
          const description = mergeMarkdown(
            baseDescription,
            typeof doc?.content === "string" ? doc.content : undefined,
          );
          const hints = Array.isArray(doc?.hints)
            ? doc.hints.map((hint: unknown) => toLocalizedString(hint, ""))
            : [];
          const testCode =
            Array.isArray(doc?.tests) &&
            typeof doc.tests[0]?.assertion === "string"
              ? doc.tests[0].assertion
              : "";

          return {
            title: toLocalizedString(doc?.title, `Lesson ${index + 1}`),
            description,
            hints,
            starterCode:
              typeof doc?.starterCode === "string" ? doc.starterCode : "",
            testCode,
            language: normalizeLanguage(doc?.language),
            fileName:
              typeof doc?.fileName === "string" ? doc.fileName : "solution.js",
            solutionCode:
              typeof doc?.solutionCode === "string"
                ? doc.solutionCode
                : undefined,
            videoUrl:
              typeof doc?.videoUrl === "string" ? doc.videoUrl : undefined,
          };
        })
      : [];

    const meta: CourseMeta | null = courseDoc
      ? {
          courseId: courseDoc.courseId ?? courseId,
          title: toLocalizedString(courseDoc.title, courseId),
          description: toLocalizedString(courseDoc.description, ""),
          trackCollection:
            typeof courseDoc.trackCollection === "string"
              ? courseDoc.trackCollection
              : "",
        }
      : null;

    return { lessons, meta };
  } catch {
    return { lessons: [], meta: null };
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string; lessonIndex: string }>;
}) {
  const { locale, courseId, lessonIndex: indexStr } = await params;
  const lang = (["en", "pt", "es"].includes(locale) ? locale : "en") as Locale;
  const t = await getTranslations({ locale, namespace: "LessonView" });
  const lessonIndex = parseInt(indexStr, 10);

  if (isNaN(lessonIndex) || lessonIndex < 0) notFound();

  const localLessons = getLessons(courseId);
  const localMeta = getCourseMeta(courseId);
  let lessons = localLessons;
  let meta = localMeta;

  if (lessons.length === 0) {
    const sanity = await getSanityLessonBundle(courseId);
    if (sanity.lessons.length > 0) {
      lessons = sanity.lessons;
    }
    if (!meta && sanity.meta) {
      meta = sanity.meta;
    }
  }

  const lesson = lessons[lessonIndex] ?? null;
  const count = lessons.length;
  const lessonItems = lessons.map((item, index) => ({
    index,
    title: localize(item.title, lang),
  }));
  const courseTitle = meta ? localize(meta.title, lang) : courseId;
  const resolvedContentId = getResolvedContentId(courseId);
  const isAliasedContent = resolvedContentId !== courseId;

  const hasPrev = lessonIndex > 0;
  const hasNext = count > 0 && lessonIndex < count - 1;

  const navBtnBase = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "40px",
    padding: "0 16px",
    borderRadius: "10px",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 150ms ease",
  };

  const navBtnSecondary = {
    ...navBtnBase,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-secondary)",
  };

  const navBtnPrimary = {
    ...navBtnBase,
    background: "var(--solana-purple)",
    color: "#fff",
    border: "none",
  };

  if (!lesson) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-2xl">
          <Breadcrumbs
            items={[
              { label: t("breadcrumbs.courses"), href: `/${locale}` },
              { label: courseTitle, href: `/${locale}/courses/${courseId}` },
              { label: t("breadcrumbs.lessonN", { index: lessonIndex + 1 }) },
            ]}
          />
          <div className="mb-6">
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {t("header.lessonN", { index: lessonIndex + 1 })}
            </p>
            <h1
              className="text-3xl font-bold tracking-tight mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              {t("header.lessonN", { index: lessonIndex + 1 })}
            </h1>
          </div>
          <div
            className="rounded-xl px-5 py-4 text-sm"
            style={{
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.25)",
              color: "#fbbf24",
            }}
          >
            {t("missing.intro")} (
            <code
              className="font-mono px-1 py-0.5 rounded"
              style={{ background: "var(--bg-elevated)" }}
            >
              {courseId}
            </code>
            ). {t("missing.publishHint")}
          </div>
        </div>
        <div className="mt-8 max-w-2xl flex items-center justify-between gap-4">
          {hasPrev ? (
            <Link
              href={`/${locale}/courses/${courseId}/lessons/${lessonIndex - 1}`}
              prefetch={false}
              style={navBtnSecondary as CSSProperties}
            >
              {t("nav.prevLesson", { index: lessonIndex })}
            </Link>
          ) : (
            <Link
              href={`/${locale}/courses/${courseId}`}
              prefetch={false}
              style={navBtnSecondary as CSSProperties}
            >
              {t("nav.backToCourse")}
            </Link>
          )}
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6">
      <div className="min-w-0">
        <div className="max-w-2xl">
          <Breadcrumbs
            items={[
              { label: t("breadcrumbs.courses"), href: `/${locale}` },
              { label: courseTitle, href: `/${locale}/courses/${courseId}` },
              { label: t("breadcrumbs.lessonN", { index: lessonIndex + 1 }) },
            ]}
          />

          <div className="mb-6">
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              {t("header.lessonN", { index: lessonIndex + 1 })}
              {count > 0 && ` ${t("header.ofCount", { count })}`}
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {localize(lesson.title, lang)}
            </h1>
            {isAliasedContent && (
              <p
                className="text-xs mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {t("alias.contentPack", { pack: resolvedContentId })}
              </p>
            )}
            <LessonMarkdown content={localize(lesson.description, lang)} />
          </div>

          {lesson.videoUrl && (
            <LessonVideo
              url={lesson.videoUrl}
              title={t("video.title")}
              openExternalLabel={t("video.openExternal")}
            />
          )}

          {lesson.hints.length > 0 && (
            <details
              className="mb-6 rounded-xl overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <summary
                className="cursor-pointer px-4 py-3 text-sm font-medium select-none transition-colors duration-150"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("hints.title", { count: lesson.hints.length })}
              </summary>
              <ul className="px-4 pb-4 space-y-2 mt-1">
                {lesson.hints.map((hint, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      className="shrink-0 font-semibold mt-0.5 text-sm"
                      style={{ color: "var(--text-purple)" }}
                    >
                      {i + 1}.
                    </span>
                    <LessonMarkdown
                      className="min-w-0"
                      content={localize(hint, lang)}
                    />
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details
            className="mb-6 rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <summary
              className="cursor-pointer px-4 py-3 text-sm font-medium select-none transition-colors duration-150"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("solution.title")}
            </summary>
            <div className="px-4 pb-4">
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {t("solution.warning")}
              </p>
              {lesson.solutionCode ? (
                <LessonMarkdown
                  content={`\`\`\`${lesson.language ?? "javascript"}\n${lesson.solutionCode}\n\`\`\``}
                />
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("solution.unavailable")}
                </p>
              )}
            </div>
          </details>
        </div>

        <DeferredPlayground
          courseId={courseId}
          lessonIndex={lessonIndex}
          lessonCount={count}
          starterCode={lesson.starterCode}
          testCode={lesson.testCode}
          language={lesson.language}
          fileName={lesson.fileName}
        />

        <div className="mt-8 max-w-2xl flex items-center justify-between gap-4">
          {hasPrev ? (
            <Link
              href={`/${locale}/courses/${courseId}/lessons/${lessonIndex - 1}`}
              prefetch={false}
              style={navBtnSecondary as CSSProperties}
            >
              {t("nav.prevLesson", { index: lessonIndex })}
            </Link>
          ) : (
            <Link
              href={`/${locale}/courses/${courseId}`}
              prefetch={false}
              style={navBtnSecondary as CSSProperties}
            >
              {t("nav.backToCourse")}
            </Link>
          )}

          {hasNext ? (
            <Link
              href={`/${locale}/courses/${courseId}/lessons/${lessonIndex + 1}`}
              prefetch={false}
              style={navBtnPrimary as CSSProperties}
            >
              {t("nav.nextLesson", { index: lessonIndex + 2 })}
            </Link>
          ) : (
            <Link
              href={`/${locale}/courses/${courseId}`}
              prefetch={false}
              style={navBtnPrimary as CSSProperties}
            >
              {t("nav.finishCourse")}
            </Link>
          )}
        </div>
      </div>

      <div className="xl:pt-9">
        <div className="xl:sticky xl:top-24">
          <LessonModuleOverview
            locale={locale}
            courseId={courseId}
            currentLessonIndex={lessonIndex}
            lessons={lessonItems}
          />
        </div>
      </div>
    </div>
    </div>
  );
}
