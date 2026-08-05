"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Compass } from "@phosphor-icons/react";
import type { LearningPath } from "@superteam-lms/types";
import {
  DEFAULT_SEGMENT,
  GOAL_FRAMING_KEY,
  SEGMENT_PATH_MODALITY,
  type GoalId,
  type LearnerSegment,
} from "@/lib/courses/learner-segment";
import {
  LearningPathSection,
  type PathCourseProgress,
} from "@/components/course/learning-path-section";

/**
 * Owner-controlled hold on the Paths tab (#998).
 *
 * Only one path exists today, so the tab does not yet represent a real choice
 * of routes through the catalogue. Until there are more, the tab shows a
 * Coming soon state instead of a one-item list.
 *
 * TO LIFT: set this to `false`. Nothing else needs changing — the full path
 * rendering below is untouched and resumes immediately, including its own
 * empty state for the case where no path has courses.
 *
 * Deliberately a constant, not derived from `learningPaths.length`: this is an
 * editorial judgement about when the feature is ready to show, and the owner
 * said they would call it. A derived threshold would flip the tab back on by
 * surprise the moment a second path merged.
 */
const PATHS_COMING_SOON = true;

interface PathsViewProps {
  learningPaths: LearningPath[];
  progress: Map<string, PathCourseProgress>;
  /**
   * Learner segment from the /start intake (LX-A3, #566). Until segment state
   * exists callers omit this and the view renders the segment-1 presentation
   * (guided sequence with visible skip-ahead). When #566 lands, the page reads
   * the stored segment and passes it here — no other change required.
   */
  segment?: LearnerSegment;
  /**
   * Learner goal from the /start intake (LX-A2). When present, a goal-specific
   * framing line renders above the guidance row ("goal→path-page framing
   * copy"). Omitted for learners who never ran the intake.
   */
  goal?: GoalId;
  /**
   * Override the Coming soon hold (#998). Defaults to `PATHS_COMING_SOON`.
   *
   * Exists so the path-rendering behaviour stays under test while the tab is
   * held: those tests pass `false` to exercise what resumes when the hold is
   * lifted. Production never passes this.
   */
  comingSoon?: boolean;
}

/**
 * Path-page presentation (LX-A7): a sequenced list per path with exactly one
 * highlighted "continue here" card — NOT a catalog grid. The All Courses tab
 * is the browse-all escape (S9). Per-segment modality changes lock/skip
 * affordances only; the content and sequence are identical for every segment.
 */
export function PathsView({
  learningPaths,
  progress,
  segment = DEFAULT_SEGMENT,
  goal,
  comingSoon = PATHS_COMING_SOON,
}: PathsViewProps) {
  const t = useTranslations("courses");
  const modality = SEGMENT_PATH_MODALITY[segment];

  const nonEmptyPaths = useMemo(
    () => learningPaths.filter((p) => (p.courses?.length ?? 0) > 0),
    [learningPaths]
  );

  // Held until there are enough paths to be worth browsing (#998). Placed
  // before the empty-state branch so the hold reads the same whether or not
  // content exists behind it.
  if (comingSoon) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-subtle">
          <Compass size={32} weight="duotone" className="text-primary" />
        </div>
        <span className="mb-3 inline-block rounded-full border border-primary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-primary">
          {t("comingSoon")}
        </span>
        <p className="font-semibold">{t("pathsComingSoonTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-3">
          {t("pathsComingSoonDescription")}
        </p>
      </div>
    );
  }

  // One clear start (UIU-07): the first course of the first populated path by
  // the bundle's ordering conventions (order asc, title asc). A path's `draft`
  // / `retired` flags are authoring metadata that the bundle carries but no
  // consumer reads (#627) — emptiness is the only visibility rule, which is why
  // filtering on `courses.length` above is sufficient here.
  // Content-agnostic — recomputes when paths change.
  const startCourse = nonEmptyPaths[0]?.courses[0];
  if (nonEmptyPaths.length === 0 || !startCourse) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-subtle">
          <BookOpen size={32} weight="duotone" className="text-text-3" />
        </div>
        <p className="font-semibold">{t("noCourses")}</p>
        <p className="mt-1 text-sm text-text-3">{t("noCoursesDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Goal-specific framing (LX-A2: goal→path-page framing copy). */}
      {goal ? (
        <p className="path-goal-framing">{t(GOAL_FRAMING_KEY[goal])}</p>
      ) : null}

      {/* Sequenced path lists — the All Courses tab itself is the browse-all
          escape (guidance row removed, owner 2026-08-02) */}
      <div className="space-y-8">
        {nonEmptyPaths.map((path, idx) => (
          <LearningPathSection
            key={path._id}
            learningPath={path}
            progress={progress}
            defaultOpen={idx === 0}
            modality={modality}
          />
        ))}
      </div>
    </div>
  );
}
