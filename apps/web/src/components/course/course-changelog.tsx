"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ClockCounterClockwise,
  RocketLaunch,
  PlusCircle,
  MinusCircle,
  Lightning,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import type {
  CourseChangelogEntry,
  ChangelogLessonRef,
} from "@/lib/courses/changelog-types";

interface CourseChangelogProps {
  entries: CourseChangelogEntry[];
  /**
   * ISO timestamp the current learner enrolled, or `null` when signed-out /
   * not enrolled. Entries newer than this are flagged "new since you enrolled"
   * (issue #654 point 3) — a date compare, not an on-chain generation read.
   */
  enrolledAt?: string | null;
}

function iconFor(kind: CourseChangelogEntry["kind"]) {
  switch (kind) {
    case "deployed":
      return RocketLaunch;
    case "lessons_added":
      return PlusCircle;
    case "lessons_removed":
      return MinusCircle;
    case "xp_changed":
      return Lightning;
    case "content_updated":
      return ArrowsClockwise;
  }
}

/**
 * Course changelog (#654) — learner-visible log of how a course evolved after
 * deployment (lessons added/retired, xp changes, content re-syncs). Data is
 * captured server-side at mutation time and passed in already decoded; this
 * component only formats it. Titles are snapshots taken when the change
 * happened, so a since-retired lesson still reads under its original name.
 */
export function CourseChangelog({ entries, enrolledAt }: CourseChangelogProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  );

  const enrolledAtMs = enrolledAt ? Date.parse(enrolledAt) : NaN;
  const newSinceEnrolled = useMemo(() => {
    if (Number.isNaN(enrolledAtMs)) return 0;
    return entries.filter((e) => Date.parse(e.createdAt) > enrolledAtMs).length;
  }, [entries, enrolledAtMs]);

  return (
    <section
      aria-labelledby="course-changelog-heading"
      className="space-y-4 border-t border-border pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="course-changelog-heading"
          className="flex items-center gap-2 font-display text-2xl font-extrabold"
        >
          <ClockCounterClockwise
            size={24}
            weight="duotone"
            className="text-primary"
            aria-hidden="true"
          />
          {t("changelog")}
        </h2>
        {newSinceEnrolled > 0 && (
          <span className="border-primary/40 bg-primary/10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold text-primary">
            {t("changelogSinceEnrolled", { count: newSinceEnrolled })}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-text-3">{t("changelogEmpty")}</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => {
            const Icon = iconFor(entry.kind);
            const isNew =
              !Number.isNaN(enrolledAtMs) &&
              Date.parse(entry.createdAt) > enrolledAtMs;
            return (
              <li
                key={entry.id}
                className={`rounded-xl border-[2px] bg-card p-4 shadow-card ${
                  isNew ? "border-primary/50" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    size={22}
                    weight="duotone"
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-text">
                        <ChangelogTitle entry={entry} t={t} />
                      </span>
                      {isNew && (
                        <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                          {t("changelogNew")}
                        </span>
                      )}
                    </div>
                    <ChangelogBody entry={entry} t={t} />
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-text-3">
                      <time dateTime={entry.createdAt}>
                        {dateFmt.format(new Date(entry.createdAt))}
                      </time>
                      <span aria-hidden="true">&middot;</span>
                      <span className="font-mono">
                        {t("changelogVersion", { version: entry.version })}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

type Translate = ReturnType<typeof useTranslations<"courses">>;

function ChangelogTitle({
  entry,
  t,
}: {
  entry: CourseChangelogEntry;
  t: Translate;
}) {
  switch (entry.kind) {
    case "deployed":
      return <>{t("changelogDeployed")}</>;
    case "lessons_added":
      return (
        <>
          {t("changelogLessonsAdded", { count: entry.detail.lessons.length })}
        </>
      );
    case "lessons_removed":
      return (
        <>
          {t("changelogLessonsRemoved", { count: entry.detail.lessons.length })}
        </>
      );
    case "xp_changed":
      return <>{t("changelogXpChanged")}</>;
    case "content_updated":
      return <>{t("changelogContentUpdated")}</>;
  }
}

function lessonLabel(lesson: ChangelogLessonRef, t: Translate): string {
  return lesson.title ?? t("changelogLessonSlot", { slot: lesson.slot });
}

function ChangelogBody({
  entry,
  t,
}: {
  entry: CourseChangelogEntry;
  t: Translate;
}) {
  switch (entry.kind) {
    case "deployed":
      return (
        <p className="text-sm text-text-2">
          {t("changelogDeployedDetail", { count: entry.detail.lessonCount })}
        </p>
      );
    case "lessons_added":
    case "lessons_removed":
      return (
        <ul className="flex flex-wrap gap-1.5">
          {entry.detail.lessons.map((lesson) => (
            <li
              key={lesson.slot}
              className="rounded-full border border-border bg-subtle px-2.5 py-0.5 text-xs text-text-2"
            >
              {lessonLabel(lesson, t)}
            </li>
          ))}
        </ul>
      );
    case "xp_changed":
      return (
        <p className="text-sm text-text-2">
          {t("changelogXpChangedDetail", {
            from: entry.detail.from,
            to: entry.detail.to,
          })}
        </p>
      );
    case "content_updated":
      return (
        <p className="text-sm text-text-2">
          {t("changelogContentUpdatedDetail")}
        </p>
      );
  }
}
