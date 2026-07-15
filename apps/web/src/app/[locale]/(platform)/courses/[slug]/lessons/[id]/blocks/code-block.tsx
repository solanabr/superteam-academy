"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("lesson");

  const hasTests = !!(b.tests && b.tests.length > 0);
  // The rail carries the lesson instructions (threaded from lesson-client) above
  // the test cases, so the description sits beside the editor instead of stacked
  // full-width on top of it.
  const taskSlot =
    ctx.instructionsSlot || hasTests ? (
      <div className="space-y-5 p-4 sm:p-5">
        {ctx.instructionsSlot}
        {hasTests && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-text-3">
              {t("testCases")}
            </h4>
            <div className="space-y-1.5">
              {b.tests!.map((tc) => (
                <div
                  key={tc.id}
                  className="rounded-md border border-border p-2 text-xs [background:var(--input)]"
                >
                  <span className="font-medium">{tc.description}</span>
                  <div className="mt-1 flex gap-4 font-mono text-text-3">
                    <span>
                      {t("input")}: <code>{tc.input}</code>
                    </span>
                    <span>
                      {t("expected")}: <code>{tc.expectedOutput}</code>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : undefined;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border-[2.5px] border-border shadow-card">
      <div className="flex w-full flex-col overflow-hidden lg:h-[calc(100vh-150px)]">
        <ChallengeInterface
          lessonId={ctx.lesson._id}
          courseSlug={ctx.courseSlug}
          lessonSlug={ctx.lesson.slug}
          taskSlot={taskSlot}
          initialCode={b.starter}
          language={b.language === "rust" ? "rust" : "typescript"}
          buildType={b.buildType ?? undefined}
          isDeployable={b.deployable ?? undefined}
          tests={b.tests}
          hints={b.hints ?? []}
          xpReward={ctx.xpReward}
          earnedXp={ctx.earnedXp}
          isAlreadyCompleted={ctx.isCompleted}
          isEnrolled={ctx.isEnrolled}
          onEnroll={ctx.onEnroll}
          className="h-full"
        />
      </div>
    </div>
  );
}
