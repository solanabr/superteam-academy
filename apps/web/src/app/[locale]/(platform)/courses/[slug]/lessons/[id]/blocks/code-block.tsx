"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CodeBlockData } from "@superteam-lms/types";
import { isLearnerDeployEnabled } from "@/lib/deploy/learner-deploy";
import { ChallengeSkeleton } from "./block-skeleton";
import type { BlockRenderProps } from "./types";

const ChallengeInterface = dynamic(
  () =>
    import("@/components/editor/challenge-interface").then((mod) => ({
      default: mod.ChallengeInterface,
    })),
  { ssr: false, loading: () => <ChallengeSkeleton /> }
);

/**
 * Wraps the existing ChallengeInterface. On a successful submit the interface
 * dispatches `superteam:lesson-complete` with the submitted code and this block's
 * key — lesson-client captures that as this block's `CodeProof` and drives
 * completion once every code block has one (the code grader re-runs it
 * server-side, so a forged client "passed" is rejected).
 */
export function CodeBlock({ block, ctx }: BlockRenderProps) {
  const b = block as CodeBlockData;

  // Start downloading the editor while sign-in resolves.
  useEffect(() => {
    void import("@/components/editor/challenge-interface");
  }, []);

  // The learner can change with the lesson open: a sign-out or another
  // sign-in in a second tab arrives here without a reload. When the code on
  // screen belonged to a signed-in learner, the editor starts over with the
  // next owner's drafts, so their code is neither shown, run nor saved under
  // someone else. Signing in keeps the code, so work done signed out can be
  // submitted.
  const userId = ctx.userId ?? null;
  const [owner, setOwner] = useState(userId);
  const [session, setSession] = useState(0);
  if (userId !== owner) {
    setOwner(userId);
    if (owner !== null) setSession((n) => n + 1);
  }

  // The editor opens the drafts of whoever is signed in, so it waits until
  // that's known rather than open, and then save over, the wrong ones.
  if (ctx.authPending) return <ChallengeSkeleton />;

  // The rail carries ONLY the lesson instructions now: the authored test-case
  // spec moved into the IDE's output panel as its own "Examples" tab (#770), so
  // the reading column stays short and the spec sits next to the run results it
  // describes.
  const taskSlot = ctx.instructionsSlot ? (
    <div className="space-y-5 p-4 sm:p-5">{ctx.instructionsSlot}</div>
  ) : undefined;

  return (
    // #942 item 4: at lg the two panes are separate rounded cards (styled
    // inside ChallengeInterface) floating on the page background, LeetCode
    // style — so this wrapper contributes only the gutter padding and NO
    // bg/border of its own. Below lg the panes stack full-bleed as before,
    // where `bg-card` keeps any empty strip (editor tail, Monaco a11y hint)
    // matching the IDE instead of the page's dotted grid. At lg the wrapper
    // flex-fills the viewport-height column in lesson-client (no page scroll).
    <div className="overflow-hidden border-t border-border bg-card lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:border-t-0 lg:bg-transparent lg:p-2">
      <div className="flex w-full flex-col overflow-hidden lg:min-h-0 lg:flex-1">
        <ChallengeInterface
          key={session}
          lessonId={ctx.lesson._id}
          userId={userId}
          blockKey={b.key}
          codePart={ctx.codePart}
          courseId={ctx.courseId}
          courseSlug={ctx.courseSlug}
          lessonSlug={ctx.lesson.slug}
          taskSlot={taskSlot}
          sectionsSlot={ctx.sectionsSlot}
          initialCode={b.starter}
          language={b.language === "rust" ? "rust" : "typescript"}
          buildType={b.buildType ?? undefined}
          // A deployable block holds its Submit until the deploy lands. With
          // the deploy off, it submits like any other build.
          isDeployable={(b.deployable ?? undefined) && isLearnerDeployEnabled()}
          tests={b.tests}
          hints={b.hints ?? []}
          solution={b.solution}
          xpReward={ctx.xpReward}
          earnedXp={ctx.earnedXp}
          isAlreadyCompleted={ctx.isCompleted}
          isEnrolled={ctx.isEnrolled}
          onEnroll={ctx.onEnroll}
          aiSuppressed={ctx.aiSuppressed}
          capstoneAiOff={ctx.capstoneAiOff}
          className="h-full"
        />
      </div>
    </div>
  );
}
