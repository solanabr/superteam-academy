"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen } from "@phosphor-icons/react";
import type { LearningPath } from "@superteam-lms/types";
import {
  DEFAULT_SEGMENT,
  GOAL_FRAMING_KEY,
  SEGMENT_PATH_MODALITY,
  type GoalId,
  type LearnerSegment,
  type PathGuidanceModality,
} from "@/lib/courses/learner-segment";
import { cn } from "@/lib/utils";
import {
  LearningPathSection,
  type PathCourseProgress,
} from "@/components/course/learning-path-section";

interface PathsViewProps {
  learningPaths: LearningPath[];
  progress: Map<string, PathCourseProgress>;
  /** Always-available escape back to the full catalog (S9: don't punish experts). */
  onBrowseAll: () => void;
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
}

const GUIDANCE_KEY: Record<PathGuidanceModality, string> = {
  fixed: "pathGuidanceFixed",
  "guided-skip": "pathGuidanceGuided",
  open: "pathGuidanceOpen",
};

/**
 * Path-page presentation (LX-A7): a sequenced list per path with exactly one
 * highlighted "start here" card and a secondary "Browse all courses" escape —
 * NOT a catalog grid. Per-segment modality changes guidance copy/prominence
 * only; the content and sequence are identical for every segment.
 */
export function PathsView({
  learningPaths,
  progress,
  onBrowseAll,
  segment = DEFAULT_SEGMENT,
  goal,
}: PathsViewProps) {
  const t = useTranslations("courses");
  const modality = SEGMENT_PATH_MODALITY[segment];

  const nonEmptyPaths = useMemo(
    () => learningPaths.filter((p) => (p.courses?.length ?? 0) > 0),
    [learningPaths]
  );

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

      {/* Guidance line + browse-all escape */}
      <div className="path-guidance-row">
        <p className="path-guidance">{t(GUIDANCE_KEY[modality])}</p>
        <button
          type="button"
          className={cn("path-browse-all", modality === "open" && "prominent")}
          onClick={onBrowseAll}
        >
          {t("browseAllCourses")}
          <ArrowRight size={13} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {/* Sequenced path lists */}
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
