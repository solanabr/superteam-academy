"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Lightning,
  CheckCircle,
  ArrowLeft,
  ChatCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/course/progress-bar";
import { AuthModal } from "@/components/auth/auth-modal";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useOnChainEnroll } from "@/hooks/use-on-chain-enroll";
import { ThreadList } from "@/components/community/thread-list";
import { CreateThreadModal } from "@/components/community/create-thread-modal";
import type { Lesson } from "@/lib/sanity/types";
import { RENDERERS, type BlockContext } from "./blocks";

interface LessonPageClientProps {
  lesson: Lesson;
  allLessons: Pick<Lesson, "_id" | "title" | "slug">[];
  locale: string;
  courseSlug: string;
  courseId: string;
  courseXpPerLesson: number;
}

interface CompletionResponse {
  success: boolean;
  alreadyCompleted: boolean;
  signature: string | null;
}

/** Carries the HTTP status so the caller can map it to a localized reason. */
class CompletionError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Failed to complete lesson (${status})`);
    this.name = "CompletionError";
    this.status = status;
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
    throw new CompletionError(res.status);
  }
  return res.json() as Promise<CompletionResponse>;
}

export function LessonPageClient({
  lesson,
  allLessons,
  locale,
  courseSlug,
  courseId,
  courseXpPerLesson,
}: LessonPageClientProps) {
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

  const { isEnrolling, handleEnroll, enrollError } = useOnChainEnroll({
    courseId,
    userId,
    onSuccess: () => setIsEnrolled(true),
  });

  const hasCodeBlock = lesson.blocks.some((b) => b._type === "code");

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
      const status = err instanceof CompletionError ? err.status : 0;
      const message =
        status === 403 && hasCodeBlock
          ? t("completionFailedChallenge")
          : status === 403
            ? t("completionFailedEnrollment")
            : t("completionFailedGeneric");
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
      buildUuid,
      programKeypairSecret,
      resetBuild,
    ]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Lesson top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4 sm:gap-3">
        <Link
          href={`/${locale}/courses/${courseSlug}`}
          className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
        >
          <ArrowLeft size={16} weight="bold" />
          {tCommon("back")}
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-base font-black text-text sm:text-lg">
          {lesson.title}
        </h1>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 font-display text-sm font-black text-xp">
            <Lightning size={14} weight="fill" />+
            {earnedXp ?? courseXpPerLesson} XP
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tabular-nums text-text-3">
              {currentIndex + 1}/{allLessons.length}
            </span>
            <ProgressBar
              value={currentIndex + 1}
              max={allLessons.length}
              className="w-16 sm:w-20"
            />
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-6">
        {lesson.blocks.map((block) => {
          const Renderer = RENDERERS[block._type];
          return <Renderer key={block.key} block={block} ctx={ctx} />;
        })}
      </div>

      {/* Completion + navigation */}
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
        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          {prevLesson && (
            <Button
              variant="pushOutline"
              size="default"
              asChild
              className="w-full justify-center sm:w-auto sm:min-w-[120px]"
            >
              <Link
                href={`/${locale}/courses/${courseSlug}/lessons/${prevLesson.slug}`}
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
              <AuthModal
                trigger={
                  <Button variant="push" size="lg" className="gap-2">
                    {t("signInToTrack")}
                  </Button>
                }
              />
            ))}

          {nextLesson ? (
            <Button
              variant={isCompleted ? "push" : "pushOutline"}
              size="default"
              asChild
              className="w-full justify-center sm:w-auto sm:min-w-[120px]"
            >
              <Link
                href={`/${locale}/courses/${courseSlug}/lessons/${nextLesson.slug}`}
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
              <Link href={`/${locale}/courses/${courseSlug}`}>
                {t("lessonComplete")}
              </Link>
            </Button>
          )}
        </div>
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

      {/* Discussion */}
      <div className="border-t border-border pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-text">
            <ChatCircle size={20} weight="duotone" />
            {t("discussion")}
          </h3>
          {userId ? (
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
          )}
        </div>
        <ThreadList
          scope={{ courseId, lessonId: lesson._id }}
          showFilters
          emptyMessage={tCommunity("empty.lesson")}
        />
        <CreateThreadModal
          open={isDiscussionOpen}
          onOpenChange={setIsDiscussionOpen}
          defaultScope={{ courseId, lessonId: lesson._id }}
        />
      </div>
    </div>
  );
}
