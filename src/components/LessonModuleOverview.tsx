"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { useEnrollment } from "@/hooks/useEnrollment";
import { isLessonComplete, normalizeFlags } from "@/lib/bitmap";

interface ModuleLessonItem {
  index: number;
  title: string;
}

interface LessonModuleOverviewProps {
  locale: string;
  courseId: string;
  currentLessonIndex: number;
  lessons: ModuleLessonItem[];
}

export function LessonModuleOverview({
  locale,
  courseId,
  currentLessonIndex,
  lessons,
}: LessonModuleOverviewProps) {
  const t = useTranslations("LessonView");
  const { connected } = useWallet();
  const { data: enrollment } = useEnrollment(courseId);

  const lessonFlags = enrollment
    ? normalizeFlags(enrollment.lessonFlags)
    : null;

  return (
    <aside
      className="rounded-xl overflow-hidden h-fit"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("module.title")}
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {t("module.progress", {
            current: Math.min(currentLessonIndex + 1, lessons.length),
            total: lessons.length,
          })}
        </p>
      </div>

      <ul className="p-2 space-y-1">
        {lessons.map((lesson) => {
          const completed = lessonFlags
            ? isLessonComplete(lessonFlags, lesson.index)
            : false;
          const isCurrent = lesson.index === currentLessonIndex;

          return (
            <li key={lesson.index}>
              <Link
                href={`/${locale}/courses/${courseId}/lessons/${lesson.index}`}
                prefetch={false}
                className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                style={
                  isCurrent
                    ? {
                        background: "rgba(153,69,255,0.12)",
                        border: "1px solid rgba(153,69,255,0.35)",
                      }
                    : undefined
                }
              >
                <span
                  className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: completed
                      ? "rgba(20,241,149,0.18)"
                      : isCurrent
                        ? "rgba(153,69,255,0.2)"
                        : "var(--bg-elevated)",
                    color: completed
                      ? "var(--solana-green)"
                      : isCurrent
                        ? "#d8b4fe"
                        : "var(--text-muted)",
                  }}
                >
                  {completed ? "✓" : lesson.index + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-sm leading-snug break-words"
                    style={{
                      color: isCurrent
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {lesson.title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {completed
                      ? t("module.completed")
                      : isCurrent
                        ? t("module.current")
                        : t("module.pending")}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!connected && (
        <p
          className="px-4 pb-4 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {t("module.connectHint")}
        </p>
      )}
    </aside>
  );
}
