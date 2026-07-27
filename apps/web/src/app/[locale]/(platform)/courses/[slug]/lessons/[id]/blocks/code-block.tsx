"use client";

import dynamic from "next/dynamic";
import type { CodeBlockData } from "@superteam-lms/types";
import type { BlockRenderProps } from "./types";

const ChallengeInterface = dynamic(
  () =>
    import("@/components/editor/challenge-interface").then((mod) => ({
      default: mod.ChallengeInterface,
    })),
  { ssr: false }
);

/**
 * Wraps the existing ChallengeInterface. On a successful submit the interface
 * dispatches `superteam:lesson-complete` with the submitted code — lesson-client
 * captures that as this block's `CodeProof` and drives completion (the code
 * grader re-runs it server-side, so a forged client "passed" is rejected).
 */
export function CodeBlock({ block, ctx }: BlockRenderProps) {
  const b = block as CodeBlockData;

  // The rail carries ONLY the lesson instructions now: the authored test-case
  // spec moved into the IDE's output panel as its own "Examples" tab (#770), so
  // the reading column stays short and the spec sits next to the run results it
  // describes.
  const taskSlot = ctx.instructionsSlot ? (
    <div className="space-y-5 p-4 sm:p-5">{ctx.instructionsSlot}</div>
  ) : undefined;

  return (
    // Edge-to-edge IDE (#770): no card rounding/shadow/side border — the split
    // sits flush against the viewport and the top bar (top border marks the
    // seam). `bg-card` so any empty strip (resizer, editor tail, the Monaco a11y
    // hint) matches the IDE instead of the page's dotted grid. At lg the wrapper
    // flex-fills the viewport-height column in lesson-client (no page scroll).
    <div className="overflow-hidden border-t border-border bg-card lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="flex w-full flex-col overflow-hidden lg:min-h-0 lg:flex-1">
        <ChallengeInterface
          lessonId={ctx.lesson._id}
          courseId={ctx.courseId}
          courseSlug={ctx.courseSlug}
          lessonSlug={ctx.lesson.slug}
          taskSlot={taskSlot}
          initialCode={b.starter}
          language={b.language === "rust" ? "rust" : "typescript"}
          buildType={b.buildType ?? undefined}
          isDeployable={b.deployable ?? undefined}
          tests={b.tests}
          hints={b.hints ?? []}
          solution={b.solution}
          xpReward={ctx.xpReward}
          earnedXp={ctx.earnedXp}
          isAlreadyCompleted={ctx.isCompleted}
          isEnrolled={ctx.isEnrolled}
          onEnroll={ctx.onEnroll}
          aiSuppressed={ctx.aiSuppressed}
          className="h-full"
        />
      </div>
    </div>
  );
}
