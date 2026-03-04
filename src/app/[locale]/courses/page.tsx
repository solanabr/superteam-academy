"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Search, BookOpen } from "lucide-react";
import { useCourses, CourseAccount } from "@/hooks/useCourses";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSigningMode } from "@/hooks/useSigningMode";
import { countCompletedLessons, normalizeFlags } from "@/lib/bitmap";
import {
  countCompletedLessonsStub,
  isCourseEnrolledStub,
  isCourseFinalizedStub,
} from "@/lib/stubStorage";
import { CourseCardSkeleton } from "@/components/Skeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const DIFFICULTY_KEYS: Record<number, string> = {
  0: "filters.all",
  1: "filters.beginner",
  2: "filters.intermediate",
  3: "filters.advanced",
};

const DIFFICULTY_STYLES: Record<
  number,
  { color: string; bg: string; border: string }
> = {
  1: {
    color: "var(--solana-green)",
    bg: "rgba(25,251,155,0.08)",
    border: "rgba(25,251,155,0.25)",
  },
  2: {
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.25)",
  },
  3: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
  },
};

const FILTER_PILLS = [
  { labelKey: "filters.all", value: 0 },
  { labelKey: "filters.beginner", value: 1 },
  { labelKey: "filters.intermediate", value: 2 },
  { labelKey: "filters.advanced", value: 3 },
];

type SourceFilter = "all" | "onchain" | "content";

const SOURCE_FILTER_PILLS: Array<{
  labelKey: "sourceFilters.all" | "sourceFilters.onchain" | "sourceFilters.demo";
  value: SourceFilter;
}> = [
  { labelKey: "sourceFilters.all", value: "all" },
  { labelKey: "sourceFilters.onchain", value: "onchain" },
  { labelKey: "sourceFilters.demo", value: "content" },
];

function DifficultyBadge({
  difficulty,
  source,
}: {
  difficulty: number;
  source: "onchain" | "content";
}) {
  const t = useTranslations("Courses");
  const labelKey = DIFFICULTY_KEYS[difficulty];
  const style = DIFFICULTY_STYLES[difficulty];
  if (!labelKey || !style) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          color: style.color,
          background: style.bg,
          border: `1px solid ${style.border}`,
        }}
      >
        {t(labelKey)}
      </span>
      {source === "onchain" && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            color: "var(--solana-green)",
            background: "rgba(25,251,155,0.1)",
            border: "1px solid rgba(25,251,155,0.25)",
          }}
        >
          {t("source.onchain")}
        </span>
      )}
    </div>
  );
}

function CourseCard({
  course,
}: {
  course: CourseAccount;
}) {
  const t = useTranslations("Courses");
  const { publicKey } = useWallet();
  const signingMode = useSigningMode();
  const wallet = publicKey?.toBase58() ?? null;
  const source = course.source ?? "onchain";
  const isDemoCourse = source === "content";
  const useStubProgress = isDemoCourse && signingMode === "stub" && !!wallet;
  const { data: enrollment } = useEnrollment(
    publicKey && !isDemoCourse ? course.courseId : undefined,
  );

  const stubState = useMemo(() => {
    if (!wallet || !useStubProgress) {
      return { enrolled: false, completed: 0, finalized: false };
    }
    return {
      enrolled: isCourseEnrolledStub(wallet, course.courseId),
      completed: countCompletedLessonsStub(
        wallet,
        course.courseId,
        course.lessonCount,
      ),
      finalized: isCourseFinalizedStub(wallet, course.courseId),
    };
  }, [wallet, useStubProgress, course.courseId, course.lessonCount]);

  const completed = useStubProgress
    ? stubState.completed
    : enrollment
      ? countCompletedLessons(normalizeFlags(enrollment.lessonFlags))
      : 0;
  const isEnrolled = useStubProgress ? stubState.enrolled : !!enrollment;
  const isFinalized = useStubProgress ? stubState.finalized : !!enrollment?.completedAt;
  const progressPct =
    course.lessonCount > 0 ? (completed / course.lessonCount) * 100 : 0;
  const ctaLabel = isDemoCourse
    ? useStubProgress
      ? t("card.cta.start")
      : t("card.cta.preview")
    : t("card.cta.start");

  return (
    <SpotlightCard className="rounded-xl h-full" spotlightColor="rgba(153, 69, 255, 0.2)">
      <Link
        href={`/courses/${course.courseId}`}
        prefetch={false}
        className="group block h-full rounded-xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--solana-purple)]"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2
              className="font-semibold text-base leading-snug mb-1.5 truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {course.courseId}
            </h2>
            <DifficultyBadge difficulty={course.difficulty} source={source} />
          </div>
          {isFinalized ? (
            <span
              className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                color: "var(--solana-green)",
                background: "rgba(25,251,155,0.1)",
                border: "1px solid rgba(25,251,155,0.3)",
              }}
            >
              {t("card.status.done")}
            </span>
          ) : isEnrolled ? (
            <span
              className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                color: "var(--text-purple)",
                background: "rgba(153,69,255,0.1)",
                border: "1px solid rgba(153,69,255,0.25)",
              }}
            >
              {t("card.status.enrolled")}
            </span>
          ) : null}
        </div>

        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{t("card.meta.lessons", { count: course.lessonCount })}</span>
          <span aria-hidden="true">|</span>
          <span style={{ color: "var(--text-purple)" }}>
            {t("card.meta.xpPerLesson", { xp: course.xpPerLesson })}
          </span>
          <span aria-hidden="true">|</span>
          <span>{t("card.meta.track", { track: course.trackId })}</span>
        </div>

        {isEnrolled && !isFinalized && (
          <div>
            <div
              className="flex justify-between text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{t("card.progress.label")}</span>
              <span>
                {completed}/{course.lessonCount}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background:
                    "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
                }}
              />
            </div>
          </div>
        )}

        {!isEnrolled && (
          <div className="flex items-center justify-between pt-1">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-purple)" }}
            >
              {t("card.cta.totalXp", { xp: course.lessonCount * course.xpPerLesson })}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {ctaLabel}
            </span>
          </div>
        )}
      </Link>
    </SpotlightCard>
  );
}

export default function CoursesPage() {
  const params = useParams();
  void params;
  const { data: courses, isLoading, error } = useCourses();
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const t = useTranslations("Courses");

  const filtered = (courses ?? []).filter((c) => {
    const matchSearch = c.courseId.toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === 0 || c.difficulty === diffFilter;
    const source = c.source ?? "onchain";
    const matchSource = sourceFilter === "all" || source === sourceFilter;
    return matchSearch && matchDiff && matchSource;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(153,69,255,0.1)" }}
          >
            <BookOpen size={18} style={{ color: "var(--solana-purple)" }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span style={{ color: "var(--text-primary)" }}>{t("title")}</span>
          </h1>
        </div>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.aria")}
            className="pl-9"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_PILLS.map((pill) => {
            const active = diffFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => setDiffFilter(pill.value)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active
                    ? "rgba(153,69,255,0.15)"
                    : "var(--bg-surface)",
                  border: active
                    ? "1px solid rgba(153,69,255,0.4)"
                    : "1px solid var(--border-default)",
                  color: active
                    ? "var(--text-purple)"
                    : "var(--text-secondary)",
                }}
                aria-pressed={active}
              >
                {t(pill.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {SOURCE_FILTER_PILLS.map((pill) => {
          const active = sourceFilter === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => setSourceFilter(pill.value)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: active
                  ? "rgba(153,69,255,0.15)"
                  : "var(--bg-surface)",
                border: active
                  ? "1px solid rgba(153,69,255,0.4)"
                  : "1px solid var(--border-default)",
                color: active
                  ? "var(--text-purple)"
                  : "var(--text-secondary)",
              }}
              aria-pressed={active}
            >
              {t(pill.labelKey)}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorBanner message={t("errors.loadFailed")} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={search || diffFilter || sourceFilter !== "all" ? t("empty.noMatchTitle") : t("empty.noCoursesTitle")}
          description={
            search || diffFilter || sourceFilter !== "all"
              ? t("empty.noMatchDescription")
              : t("empty.noCoursesDescription")
          }
        />
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t("results.count", { count: filtered.length })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
