"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Lightning,
  CheckCircle,
  ArrowLeft,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import type { CodeBlockData, Lesson } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/course/progress-bar";
import { AuthModal } from "@/components/auth/auth-modal";
import { trackEvent } from "@/lib/analytics";
import { completionErrorKey } from "@/lib/lessons/completion-error";
import { createClient } from "@/lib/supabase/client";
import { isCapstoneLesson } from "@/lib/credentials/capstone-identity";
import { useAuth } from "@/lib/auth/auth-provider";
import { useOnChainEnroll } from "@/hooks/use-on-chain-enroll";
import { bankCompletion, removeBanked } from "@/lib/lessons/progress-bank";
import { REPLAY_BANKED_EVENT } from "@/components/lessons/banked-progress-replay";
import { ThreadList } from "@/components/community/thread-list";
import { CreateThreadModal } from "@/components/community/create-thread-modal";
import { LessonSection } from "@/components/lessons/lesson-section";
import { RENDERERS, type BlockContext } from "./blocks";

/** Anchor for the toolbar's jump-to-discussion affordance (#942). */
const DISCUSSION_ANCHOR_ID = "lesson-discussion";
const TOPICS_ANCHOR_ID = "lesson-topics";
const HINTS_ANCHOR_ID = "lesson-hints";

interface LessonPageClientProps {
  lesson: Lesson;
  allLessons: Pick<Lesson, "_id" | "title" | "slug">[];
  /**
   * Authored skill tags for this lesson — rendered as the "Topics" disclosure
   * chips (#942). Optional: the teacher preview bundle has no skills
   * projection, and an absent/empty list simply omits the section.
   */
  skills?: string[];
  locale: string;
  courseSlug: string;
  courseId: string;
  courseXpPerLesson: number;
  /**
   * Base path for in-lesson navigation (back, prev/next). Defaults to the live
   * catalogue (`/{locale}/courses`); the teacher preview (#831) points it at
   * itself so navigation never escapes into `/courses`, where an unpublished
   * lesson does not exist.
   */
  hrefBase?: string;
  /**
   * Preview mode (#831). A previewed lesson is not in the live bundle and its
   * course is not on-chain, so every write path must be inert: no completion
   * POST, no enrolment, and no anonymous progress banked into localStorage.
   * Defaults to false — live behaviour is untouched.
   */
  readOnly?: boolean;
}

interface CompletionResponse {
  success: boolean;
  alreadyCompleted: boolean;
  signature: string | null;
}

/**
 * Carries the HTTP status plus the route's `reason` discriminator so the
 * caller can map the failure to the RIGHT localized copy (#564).
 */
class CompletionError extends Error {
  readonly status: number;
  readonly reason?: string;
  constructor(status: number, reason?: string) {
    super(`Failed to complete lesson (${status})`);
    this.name = "CompletionError";
    this.status = status;
    this.reason = reason;
  }
}

async function completeLessonAPI(
  lessonId: string,
  courseId: string,
  proofs: Record<string, unknown>
): Promise<CompletionResponse> {
  const res = await fetch("/api/lessons/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, courseId, proofs }),
  });
  if (!res.ok) {
    let reason: string | undefined;
    try {
      const body = (await res.json()) as { reason?: unknown };
      if (typeof body.reason === "string") reason = body.reason;
    } catch {
      // Non-JSON error body — the status alone drives the mapping.
    }
    throw new CompletionError(res.status, reason);
  }
  return res.json() as Promise<CompletionResponse>;
}

export function LessonPageClient({
  lesson,
  allLessons,
  skills = [],
  locale,
  courseSlug,
  courseId,
  courseXpPerLesson,
  hrefBase,
  readOnly = false,
}: LessonPageClientProps) {
  // Live catalogue unless a caller overrides it (#831 teacher preview).
  const linkBase = hrefBase ?? `/${locale}/courses`;
  const t = useTranslations("lesson");
  const tCommon = useTranslations("common");
  const tCourses = useTranslations("courses");
  const tCommunity = useTranslations("community");

  const { userId, profile: authProfile, isLoading: authLoading } = useAuth();

  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const hasLinkedWallet = authProfile ? !!authProfile.wallet_address : null;
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  // Discussion is an inline collapsible section at the bottom of the lesson
  // pane on every lesson type (#942) — it used to be a modal on challenges
  // (#770). This is the section's disclosure state (distinct from the
  // create-thread modal above); the toolbar button jumps to it and opens it.
  const [isDiscussionListOpen, setIsDiscussionListOpen] = useState(false);
  const [threadCount, setThreadCount] = useState<string | null>(null);
  const handleThreadCount = useCallback((count: number, hasMore: boolean) => {
    setThreadCount(hasMore ? `${count}+` : String(count));
  }, []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [buildUuid, setBuildUuid] = useState<string | null>(null);
  const [programKeypairSecret, setProgramKeypairSecret] = useState<
    number[] | null
  >(null);

  // Per-block proofs, submitted to the inverted completion gate. Transient — a
  // ref (not state) since block-level results are never persisted or rendered.
  const proofsRef = useRef<Record<string, unknown>>({});
  const setProof = useCallback((blockKey: string, proof: unknown) => {
    proofsRef.current[blockKey] = proof;
  }, []);
  const resetBuild = useCallback(() => {
    setBuildUuid(null);
    setProgramKeypairSecret(null);
  }, []);

  // Bank the work done on THIS lesson so an anonymous learner never loses it at
  // the sign-in wall (LX-A4c). Stores exactly the proofs the completion POST
  // would carry; on sign-in they replay server-side (which re-grades them).
  const bankCurrentLesson = useCallback(() => {
    // #831: never persist preview work — a previewed lesson id would replay
    // against the live bundle on sign-in and fail there.
    if (readOnly) return;
    bankCompletion({
      courseId,
      courseSlug,
      lessonId: lesson._id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      proofs: { ...proofsRef.current },
    });
  }, [readOnly, courseId, courseSlug, lesson._id, lesson.slug, lesson.title]);

  // Claim moment: bank first, THEN open the sign-in prompt with its "Later"
  // escape. Ordering matters — the modal's Later path relies on the work
  // already being saved.
  const openClaimAuth = useCallback(() => {
    bankCurrentLesson();
    setIsAuthModalOpen(true);
  }, [bankCurrentLesson]);

  const { isEnrolling, handleEnroll, enrollError } = useOnChainEnroll({
    courseId,
    userId,
    // Anonymous Enroll (e.g. the challenge "tests passed" overlay) banks the
    // learner's work and opens the auth modal instead of silently no-oping
    // (#556) or dead-ending (LX-A4).
    onRequireAuth: openClaimAuth,
    onSuccess: () => {
      setIsEnrolled(true);
      // Now enrolled — invite the global replay to finish any banked lessons
      // for this course (they 403'd on enrollment_missing before this point).
      window.dispatchEvent(new CustomEvent(REPLAY_BANKED_EVENT));
    },
  });

  const hasCodeBlock = lesson.blocks.some((b) => b._type === "code");
  const hasQuizBlock = lesson.blocks.some((b) => b._type === "quiz");

  // Challenge pages are viewport-locked: the IDE column is sized to the screen,
  // so the document must not scroll at all. Without this, any few-pixel
  // mismatch between the column's calc() height and the real header height
  // leaves the page scrollable — which is what surfaced the dead strip below
  // the editor (#770). Locking `body` also kills the phantom horizontal
  // scrollbar from the full-bleed `w-screen` children (100vw counts the
  // scrollbar gutter). Desktop only; below lg the page scrolls normally.
  useEffect(() => {
    if (!hasCodeBlock) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      document.body.style.overflow = mq.matches ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, [hasCodeBlock]);

  // F18 (#564): retrieval stays AI-free. Each QuizBlock reports whether all of
  // its questions have been checked; while any quiz block in the lesson is
  // still unanswered, the AI Partner pane inside ChallengeInterface stays
  // hidden (mixed code+quiz lessons — nothing to gate elsewhere). A lesson the
  // learner already completed never suppresses.
  const [answeredQuizzes, setAnsweredQuizzes] = useState<
    Record<string, boolean>
  >({});
  const setQuizAnswered = useCallback((blockKey: string, answered: boolean) => {
    setAnsweredQuizzes((prev) =>
      prev[blockKey] === answered ? prev : { ...prev, [blockKey]: answered }
    );
  }, []);
  // AI hard-off on the capstone (#867) — the CLIENT leg of the server refusal
  // in /api/ai/partner, derived from the same `capstone-identity` constant as
  // the credential gate (never a second hardcoded id). Distinct from
  // `aiSuppressed`: quiz suppression is temporary (answer the quiz and the
  // tutor returns) and simply HIDES the pane, whereas this is permanent and
  // must be EXPLAINED — the pane renders the AI-free rationale in place of its
  // actions, so a learner who expected a tutor learns why there isn't one
  // rather than finding a blank column.
  const capstoneAiOff = isCapstoneLesson(lesson._id);

  const aiSuppressed =
    hasQuizBlock &&
    !isCompleted &&
    lesson.blocks.some((b) => b._type === "quiz" && !answeredQuizzes[b.key]);

  // Parallelize enrollment + completion checks once auth is ready
  useEffect(() => {
    if (authLoading || !userId) return;

    const supabase = createClient();

    Promise.all([
      supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle(),
      supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", userId)
        .eq("lesson_id", lesson._id)
        .eq("completed", true)
        .maybeSingle(),
    ]).then(([enrollmentResult, progressResult]) => {
      if (enrollmentResult.data) setIsEnrolled(true);
      if (progressResult.data) setIsCompleted(true);
    });
  }, [authLoading, userId, lesson._id, courseId]);

  const currentIndex = allLessons.findIndex((l) => l._id === lesson._id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleComplete = useCallback(async () => {
    // #831: a previewed lesson is not in the live bundle, so completing it
    // would POST an unknown lessonId. Refuse before the request is built.
    if (readOnly) return;
    if (isCompleted || isCompleting) return;
    if (hasLinkedWallet === false) return;
    setIsCompleting(true);
    setCompletionError(null);
    try {
      const result = await completeLessonAPI(
        lesson._id,
        courseId,
        proofsRef.current
      );
      setIsCompleting(false);
      setIsCompleted(true);
      // Completed for real on the authed path — drop any banked copy so it can
      // never re-replay (e.g. a stale entry the learner redid in-app).
      removeBanked(courseId, lesson._id);

      if (!result.alreadyCompleted) {
        setEarnedXp(courseXpPerLesson);
        trackEvent("lesson_completed", {
          lessonId: lesson._id,
          courseId,
          signature: result.signature,
        });
      }
    } catch (err) {
      setIsCompleting(false);
      // The route's `reason` discriminator picks the copy — a failed quiz no
      // longer reads as a broken enrollment (#564). 429 stays a throttle
      // notice, never a failure (see completionErrorKey).
      const message = t(
        err instanceof CompletionError
          ? completionErrorKey(err.status, err.reason, {
              hasCodeBlock,
              hasQuizBlock,
            })
          : "completionFailedGeneric"
      );
      setCompletionError(message);
      // Unstick the challenge editor's "saving" overlay and show the reason
      // there too (code submits originate from ChallengeInterface).
      window.dispatchEvent(
        new CustomEvent("superteam:lesson-complete-error", {
          detail: { lessonId: lesson._id, message },
        })
      );
    }
  }, [
    lesson._id,
    courseId,
    courseXpPerLesson,
    isCompleted,
    isCompleting,
    hasLinkedWallet,
    hasCodeBlock,
    hasQuizBlock,
    t,
  ]);

  // A passing code submission originates in ChallengeInterface, which dispatches
  // `superteam:lesson-complete` with the submitted code. Capture it as the code
  // block's proof, then drive completion (the server re-grades it).
  useEffect(() => {
    const handleChallengeComplete = (e: Event) => {
      const detail = (
        e as CustomEvent<{ lessonId: string; submittedCode?: string }>
      ).detail;
      if (detail.lessonId !== lesson._id) return;
      const codeBlock = lesson.blocks.find((b) => b._type === "code");
      if (codeBlock && typeof detail.submittedCode === "string") {
        proofsRef.current[codeBlock.key] = { code: detail.submittedCode };
      }
      handleComplete();
    };

    window.addEventListener(
      "superteam:lesson-complete",
      handleChallengeComplete
    );
    return () =>
      window.removeEventListener(
        "superteam:lesson-complete",
        handleChallengeComplete
      );
  }, [lesson, handleComplete]);

  // An anonymous learner who passes a challenge submits BEFORE enrolling, so the
  // passing code never rides `superteam:lesson-complete` (which drives an authed
  // completion). Capture it here as the code block's proof so `bankCurrentLesson`
  // banks a real submission, not an empty payload — the server re-grades it.
  useEffect(() => {
    const handleChallengeProof = (e: Event) => {
      const detail = (
        e as CustomEvent<{ lessonId: string; submittedCode?: string }>
      ).detail;
      if (detail.lessonId !== lesson._id) return;
      const codeBlock = lesson.blocks.find((b) => b._type === "code");
      if (codeBlock && typeof detail.submittedCode === "string") {
        proofsRef.current[codeBlock.key] = { code: detail.submittedCode };
      }
    };
    window.addEventListener("superteam:challenge-proof", handleChallengeProof);
    return () =>
      window.removeEventListener(
        "superteam:challenge-proof",
        handleChallengeProof
      );
  }, [lesson]);

  // Build-complete events (deployable code blocks / deployed-program card).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{ buildUuid: string; programKeypairSecret?: number[] }>
      ).detail;
      setBuildUuid(detail.buildUuid);
      if (detail.programKeypairSecret) {
        setProgramKeypairSecret(detail.programKeypairSecret);
      }
    };
    window.addEventListener("superteam:build-complete", handler);
    return () =>
      window.removeEventListener("superteam:build-complete", handler);
  }, []);

  const ctx = useMemo<BlockContext>(
    () => ({
      lesson,
      courseSlug,
      courseId,
      locale,
      isEnrolled,
      isCompleted,
      xpReward: courseXpPerLesson,
      earnedXp,
      onEnroll: handleEnroll,
      setProof,
      setQuizAnswered,
      aiSuppressed,
      capstoneAiOff,
      buildUuid,
      programKeypairSecret,
      resetBuild,
    }),
    [
      lesson,
      courseSlug,
      courseId,
      locale,
      isEnrolled,
      isCompleted,
      courseXpPerLesson,
      earnedXp,
      handleEnroll,
      setProof,
      setQuizAnswered,
      aiSuppressed,
      capstoneAiOff,
      buildUuid,
      programKeypairSecret,
      resetBuild,
    ]
  );

  // Challenge lessons get a wide, editor-dominant layout: the non-code blocks
  // (the description/instructions) render inside the IDE's side rail next to the
  // test cases, and only the code block(s) occupy the main area — restoring the
  // dedicated coding-challenge experience the unified block renderer flattened.
  const instructionBlocks = lesson.blocks.filter((b) => b._type !== "code");
  const codeBlocks = lesson.blocks.filter((b) => b._type === "code");

  // LeetCode-style disclosure rows below the prose (#942): the authored hints
  // (each openable on demand — the 3-failed-runs auto-reveal inside the editor
  // is untouched), the lesson's skill tags as Topics chips, and Discussion
  // inline with its thread count.
  const authoredHints = codeBlocks.flatMap(
    (b) => (b as CodeBlockData).hints ?? []
  );
  const askAction = userId ? (
    <Button
      variant="pushOutline"
      size="sm"
      onClick={() => setIsDiscussionOpen(true)}
    >
      {t("askQuestion")}
    </Button>
  ) : (
    <AuthModal
      trigger={
        <Button variant="pushOutline" size="sm">
          {t("signInToAsk")}
        </Button>
      }
    />
  );
  const paneSections = (
    <div className="mt-2">
      {skills.length > 0 && (
        <LessonSection id={TOPICS_ANCHOR_ID} title={t("topics")}>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-subtle px-2.5 py-1 font-mono text-xs text-text-2"
              >
                {skill}
              </span>
            ))}
          </div>
        </LessonSection>
      )}
      {authoredHints.map((hint, i) => (
        <LessonSection
          key={`hint-${i}`}
          id={i === 0 ? HINTS_ANCHOR_ID : undefined}
          title={t("stuckNudgeHintLabel", { number: i + 1 })}
        >
          <p className="text-sm leading-relaxed text-text-2">{hint}</p>
        </LessonSection>
      ))}
      <LessonSection
        id={DISCUSSION_ANCHOR_ID}
        title={t("discussion")}
        count={threadCount}
        open={isDiscussionListOpen}
        onOpenChange={setIsDiscussionListOpen}
        keepMounted
      >
        <div className="mb-3 flex justify-end">{askAction}</div>
        <div className="text-sm [&_button]:px-2.5 [&_button]:py-1 [&_button]:text-xs">
          <ThreadList
          scope={{ courseId, lessonId: lesson._id }}
          showFilters
          emptyMessage={tCommunity("empty.lesson")}
            onCountChange={handleThreadCount}
          />
        </div>
      </LessonSection>
    </div>
  );

  const instructionsSlot = hasCodeBlock ? (
    <div className="space-y-6">
      {instructionBlocks.map((block) => {
        const Renderer = RENDERERS[block._type];
        return <Renderer key={block.key} block={block} ctx={ctx} />;
      })}
    </div>
  ) : null;
  const codeCtx: BlockContext = {
    ...ctx,
    instructionsSlot,
    sectionsSlot: paneSections,
  };

  return (
    <div
      className={`mx-auto ${
        hasCodeBlock
          ? // Challenge pages fill exactly one viewport at lg with no page
            // scroll: cancel the platform container's pt-8/pb-8 (#770) with
            // negative margins and become a fixed-height flex column
            // (100dvh minus the fixed header's 60px offset). Top bar is
            // shrink-0; the IDE flex-fills the rest.
            "max-w-[1600px] space-y-0 lg:-mb-8 lg:-mt-8 lg:flex lg:h-[calc(100dvh-60px)] lg:flex-col"
          : "max-w-3xl space-y-6"
      }`}
    >
      {/* Lesson top bar — full-bleed on challenges so its bottom border and
          content line up with the edge-to-edge editor split below. Three
          columns: back (left), Prev/Next (center, challenge pages),
          discussion+XP+progress (right). The lesson TITLE deliberately does
          not live here (#942): the prose h1 immediately below owns document
          identity, and printing it twice was pure duplication. lg:shrink-0 so
          it never eats the IDE's flex height. */}
      <div
        className={`flex items-center gap-2 border-b border-border py-2 sm:gap-3 lg:shrink-0 ${
          hasCodeBlock ? "mx-[calc(50%_-_50vw)] w-screen px-3 sm:px-4" : ""
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href={`${linkBase}/${courseSlug}`}
            className="inline-flex shrink-0 items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
          >
            <ArrowLeft size={16} weight="bold" />
            <span className="hidden sm:inline">{tCommon("back")}</span>
          </Link>
        </div>

        {/* Prev/Next centered on challenge pages (#770) — labeled + visible. */}
        {hasCodeBlock && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="pushOutline"
              size="sm"
              asChild={!!prevLesson}
              disabled={!prevLesson}
              className="gap-1"
            >
              {prevLesson ? (
                <Link
                  href={`${linkBase}/${courseSlug}/lessons/${prevLesson.slug}`}
                >
                  <CaretLeft size={14} weight="bold" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {tCommon("previous")}
                  </span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <CaretLeft size={14} weight="bold" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {tCommon("previous")}
                  </span>
                </span>
              )}
            </Button>
            <Button
              variant="pushOutline"
              size="sm"
              asChild={!!nextLesson}
              disabled={!nextLesson}
              className="gap-1"
            >
              {nextLesson ? (
                <Link
                  href={`${linkBase}/${courseSlug}/lessons/${nextLesson.slug}`}
                >
                  <span className="hidden sm:inline">{tCommon("next")}</span>
                  <CaretRight size={14} weight="bold" aria-hidden="true" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="hidden sm:inline">{tCommon("next")}</span>
                  <CaretRight size={14} weight="bold" aria-hidden="true" />
                </span>
              )}
            </Button>
          </div>
        )}

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <span className="flex shrink-0 items-center gap-1 font-display text-sm font-black text-xp">
            <Lightning size={14} weight="fill" />+
            {earnedXp ?? courseXpPerLesson} XP
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-mono text-xs tabular-nums text-text-3">
              {currentIndex + 1}/{allLessons.length}
            </span>
            <ProgressBar
              value={currentIndex + 1}
              max={allLessons.length}
              className="hidden w-16 sm:block sm:w-20"
            />
          </div>
        </div>
      </div>

      {/* Blocks — challenges render only the code block(s) here (the wide IDE);
          the instructions ride in the IDE rail via ctx.instructionsSlot. The
          split is full-bleed (w-screen + calc margin) so it escapes the platform
          `container` max-width and spans the viewport edge-to-edge, LeetCode
          style. `px` leaves a small gutter from the screen edges. */}
      {hasCodeBlock ? (
        <div className="mx-[calc(50%_-_50vw)] w-screen space-y-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-0">
          {codeBlocks.map((block, i) => {
            const Renderer = RENDERERS[block._type];
            // Only the FIRST code block carries the instructions rail. A lesson
            // with multiple code blocks would otherwise render the same
            // instructionsSlot inside every editor (duplicated description +
            // test cases). None ship today — this guards future content. (#457)
            return (
              <Renderer
                key={block.key}
                block={block}
                ctx={i === 0 ? codeCtx : ctx}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {lesson.blocks.map((block) => {
            const Renderer = RENDERERS[block._type];
            return <Renderer key={block.key} block={block} ctx={ctx} />;
          })}
        </div>
      )}

      {/* Completion + navigation — challenge pages render NOTHING below the
          IDE (#770): the viewport-locked column owns the screen, Prev/Next sit
          in the top bar, and completion happens via the in-IDE submit. Leaving
          this wrapper mounted there contributed the dead strip under the
          editor. */}
      {!hasCodeBlock && (
        <div className="space-y-2">
          {completionError && (
            <div
              role="alert"
              className="rounded-lg border-[2.5px] px-4 py-3 text-sm text-danger"
              style={{
                borderColor: "var(--danger-border)",
                background: "var(--danger-bg)",
              }}
            >
              {completionError}
            </div>
          )}
          {/* Bottom nav hidden on challenge pages (#770): Prev/Next live in the
            top bar and code lessons complete via the ChallengeInterface submit. */}
          {!hasCodeBlock && (
            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              {prevLesson && (
                <Button
                  variant="pushOutline"
                  size="default"
                  asChild
                  className="w-full justify-center sm:w-auto sm:min-w-[120px]"
                >
                  <Link
                    href={`${linkBase}/${courseSlug}/lessons/${prevLesson.slug}`}
                  >
                    &larr; {tCommon("previous")}
                  </Link>
                </Button>
              )}

              {/* Code lessons complete via the ChallengeInterface submit; other
              lessons complete via this explicit button. */}
              {!hasCodeBlock &&
                (userId ? (
                  isEnrolled ? (
                    <Button
                      variant={isCompleted ? "outline" : "pushSuccess"}
                      size="lg"
                      disabled={
                        isCompleted || isCompleting || hasLinkedWallet === false
                      }
                      onClick={() => handleComplete()}
                      className="w-full gap-2 sm:w-auto"
                    >
                      {isCompleting ? (
                        <>
                          <div
                            className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white"
                            aria-hidden="true"
                          />
                          <span className="sr-only">{tCommon("loading")}</span>
                        </>
                      ) : isCompleted ? (
                        <CheckCircle
                          size={20}
                          weight="duotone"
                          className="text-success"
                          aria-hidden="true"
                        />
                      ) : null}
                      {isCompleted ? t("lessonComplete") : t("markComplete")}
                    </Button>
                  ) : (
                    <Button
                      variant="push"
                      size="lg"
                      disabled={isEnrolling}
                      onClick={handleEnroll}
                      className="gap-2"
                    >
                      {isEnrolling && (
                        <>
                          <div
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                            aria-hidden="true"
                          />
                          <span className="sr-only">{tCommon("loading")}</span>
                        </>
                      )}
                      {tCourses("enrollNow")}
                    </Button>
                  )
                ) : (
                  // Anonymous: banks the work done so far, then opens the sign-in
                  // prompt with its "Later" escape (LX-A4). The controlled modal is
                  // rendered once below.
                  <Button
                    variant="push"
                    size="lg"
                    className="gap-2"
                    onClick={openClaimAuth}
                  >
                    {t("signInToTrack")}
                  </Button>
                ))}

              {nextLesson ? (
                <Button
                  variant={isCompleted ? "push" : "pushOutline"}
                  size="default"
                  asChild
                  className="w-full justify-center sm:w-auto sm:min-w-[120px]"
                >
                  <Link
                    href={`${linkBase}/${courseSlug}/lessons/${nextLesson.slug}`}
                  >
                    {tCommon("next")} &rarr;
                  </Link>
                </Button>
              ) : (
                <Button
                  variant={isCompleted ? "push" : "pushOutline"}
                  size="default"
                  asChild
                  className="w-full justify-center sm:w-auto sm:min-w-[120px]"
                >
                  <Link href={`${linkBase}/${courseSlug}`}>
                    {t("lessonComplete")}
                  </Link>
                </Button>
              )}
            </div>
          )}
          {enrollError && (
            <p role="alert" className="text-center text-sm text-danger">
              {tCourses("enrollFailed")}
            </p>
          )}
          {hasLinkedWallet === false && isEnrolled && (
            <p role="alert" className="text-center text-sm text-text-3">
              {t("linkWalletToEarnXp")}{" "}
              <Link
                href={`/${locale}/settings`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("linkWalletSettings")}
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Programmatic auth modal — opened at the claim moment (the "tests
          passed" enroll overlay, or the "Sign in to track" button). The work is
          already banked before it opens, so it offers a "Later" escape framed as
          "your progress is saved", never "discard" (LX-A4b). Controlled only
          (#556). */}
      {!userId && (
        <AuthModal
          open={isAuthModalOpen}
          onOpenChange={setIsAuthModalOpen}
          showLater
        />
      )}

      {/* Hints / Topics / Discussion — inline collapsible sections at the
          bottom of the LESSON PANE (#942). Challenge lessons render them inside
          the IDE rail via `instructionsSlot`; reading lessons render them here,
          below the prose. Discussion is the same inline section on both, never
          a modal. */}
      {!hasCodeBlock && paneSections}
      <CreateThreadModal
        open={isDiscussionOpen}
        onOpenChange={setIsDiscussionOpen}
        defaultScope={{ courseId, lessonId: lesson._id }}
      />
    </div>
  );
}
