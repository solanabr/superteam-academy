"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, ArrowRight, Sparkle } from "@phosphor-icons/react";
import type { ReviewSessionItem } from "@/lib/review/interleave";
import { trackReviewCompleted } from "@/lib/analytics/events";
import { ReviewQuizItem } from "./review-quiz-item";

interface ReviewSessionProps {
  items: ReviewSessionItem[];
}

/**
 * The review session surface (LX-B5). Renders each due item as its own card —
 * a gradable retrieval-close quiz, or a revisit link for a lesson with no
 * authored quiz yet. Session progress counts only gradable items. The list
 * never mounts a Monaco editor: a challenge-only item is a link, never an
 * embedded editor (the mobile constraint holds by construction).
 */
export function ReviewSession({ items }: ReviewSessionProps) {
  const t = useTranslations("review");
  const locale = useLocale();
  const [graded, setGraded] = useState<Set<string>>(new Set());

  const onGraded = useCallback((itemKey: string) => {
    setGraded((prev) => {
      if (prev.has(itemKey)) return prev;
      const next = new Set(prev);
      next.add(itemKey);
      return next;
    });
  }, []);

  // Counted before the empty-session early return below, so the completion
  // effect stays unconditional (rules of hooks).
  const gradableTotal = items.filter((i) => i.quiz.length > 0).length;
  const gradableDone = items.filter(
    (i) => i.quiz.length > 0 && graded.has(i.itemKey)
  ).length;
  const allDone = gradableTotal > 0 && gradableDone === gradableTotal;

  // `review_completed` fires ONCE per session (#873). `graded` only ever grows,
  // so latch on the transition into all-done — without the ref every later
  // render would re-fire it and inflate the very metric this event measures.
  const completedFired = useRef(false);
  useEffect(() => {
    if (!allDone || completedFired.current) return;
    completedFired.current = true;
    trackReviewCompleted({ gradable: gradableTotal, itemsShown: items.length });
  }, [allDone, gradableTotal, items.length]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--r-lg)] border border-border bg-card px-6 py-16 text-center">
        <span
          className="bg-success/10 flex h-12 w-12 items-center justify-center rounded-full text-success"
          aria-hidden="true"
        >
          <CheckCircle size={28} weight="fill" />
        </span>
        <div>
          <h2 className="font-display text-lg font-black">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-text-3">{t("emptyHint")}</p>
        </div>
        <Link
          href={`/${locale}/courses`}
          className="inline-flex items-center gap-1.5 font-display text-sm font-extrabold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("browseCourses")}
          <ArrowRight size={15} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {gradableTotal > 0 && (
        <p
          className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-text-3"
          aria-live="polite"
        >
          {t("progress", { done: gradableDone, total: gradableTotal })}
        </p>
      )}

      {allDone && (
        <div className="border-success/40 bg-success/5 flex items-center gap-2.5 rounded-[var(--r-md)] border p-4 text-sm text-text">
          <Sparkle
            size={18}
            weight="fill"
            className="shrink-0 text-success"
            aria-hidden="true"
          />
          <span>{t("sessionComplete")}</span>
        </div>
      )}

      <ul className="space-y-5">
        {items.map((item) => (
          <li key={item.itemKey}>
            {item.quiz.length > 0 ? (
              <ReviewQuizItem item={item} onGraded={onGraded} />
            ) : (
              <RevisitCard item={item} locale={locale} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A due item whose lesson has no authored retrieval-close quiz yet: not
 * inline-gradable in v1, so it points back to the lesson to refresh. Honest
 * transitional state while retrieval-close authoring (LX-D2) rolls out.
 */
function RevisitCard({
  item,
  locale,
}: {
  item: ReviewSessionItem;
  locale: string;
}) {
  const t = useTranslations("review");
  return (
    <Link
      href={`/${locale}/courses/${item.courseSlug}/lessons/${item.lessonSlug}`}
      className="hover:border-primary/40 group flex items-center gap-4 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-3">
          {t("revisitLabel")}
        </p>
        <h2 className="mt-0.5 truncate font-display text-base font-black tracking-[-0.25px]">
          {item.lessonTitle}
        </h2>
        <p className="mt-1 text-xs text-text-3">{t("revisitHint")}</p>
      </div>
      <span
        className="flex shrink-0 items-center gap-1.5 font-display text-sm font-extrabold text-primary transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        {t("revisitCta")}
        <ArrowRight size={15} weight="bold" />
      </span>
    </Link>
  );
}
