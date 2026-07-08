"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
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

function CodeBlockWithCopy({
  children,
  ...props
}: { children?: ReactNode } & React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-lg border-[2.5px] border-border bg-card px-2.5 py-1 font-display text-xs font-bold text-text shadow-push-sm transition-colors hover:bg-subtle"
        aria-label="Copy code"
      >
        {copied ? (
          <span className="text-success">Copied</span>
        ) : (
          <span>Copy</span>
        )}
      </button>
    </div>
  );
}

const markdownComponents = {
  pre: CodeBlockWithCopy,
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // Vimeo: vimeo.com/ID
    if (u.hostname === "www.vimeo.com" || u.hostname === "vimeo.com") {
      const id = u.pathname.slice(1);
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div className="mb-6 overflow-hidden rounded-lg border-[2.5px] border-border shadow-card">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}

const ChallengeInterface = dynamic(
  () =>
    import("@/components/editor/challenge-interface").then((mod) => ({
      default: mod.ChallengeInterface,
    })),
  { ssr: false }
);

const WalletFundingCard = dynamic(
  () =>
    import("@/components/deploy/wallet-funding-card").then((mod) => ({
      default: mod.WalletFundingCard,
    })),
  { ssr: false }
);

const DeployPanel = dynamic(
  () =>
    import("@/components/deploy/deploy-panel").then((mod) => ({
      default: mod.DeployPanel,
    })),
  { ssr: false }
);

const GenericProgramExplorer = dynamic(
  () =>
    import("@/components/deploy/generic-program-explorer").then((mod) => ({
      default: mod.GenericProgramExplorer,
    })),
  { ssr: false }
);

interface LessonPageClientProps {
  lesson: Lesson;
  allLessons: Pick<Lesson, "_id" | "title" | "slug" | "type">[];
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
  submittedCode?: string
): Promise<CompletionResponse> {
  const res = await fetch("/api/lessons/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, courseId, submittedCode }),
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

  const { isEnrolling, handleEnroll, enrollError } = useOnChainEnroll({
    courseId,
    userId,
    onSuccess: () => setIsEnrolled(true),
  });

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

  const isChallenge = lesson.type === "challenge";

  const handleComplete = useCallback(
    async (submittedCode?: string) => {
      if (isCompleted || isCompleting) return;
      if (hasLinkedWallet === false) return;
      setIsCompleting(true);
      setCompletionError(null);
      try {
        const result = await completeLessonAPI(
          lesson._id,
          courseId,
          submittedCode
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
          // XP, level-up, achievement, and certificate popups are now triggered
          // by Supabase Realtime via useGamificationEvents (in GamificationOverlays).
        }
      } catch (err) {
        // Surface WHY completion failed instead of failing silently. A 403 on a
        // challenge means the server's full test suite (including hidden tests
        // the browser never runs) rejected the submission; a 403 on a plain
        // lesson means no on-chain enrollment was found. Anything else is a
        // transient/server error the learner can retry.
        setIsCompleting(false);
        const status = err instanceof CompletionError ? err.status : 0;
        const message =
          status === 403 && isChallenge
            ? t("completionFailedChallenge")
            : status === 403
              ? t("completionFailedEnrollment")
              : t("completionFailedGeneric");
        setCompletionError(message);
        // Unstick the challenge editor's "saving" overlay and show the reason
        // there too (challenge submits originate from ChallengeInterface).
        window.dispatchEvent(
          new CustomEvent("superteam:lesson-complete-error", {
            detail: { lessonId: lesson._id, message },
          })
        );
      }
    },
    [
      lesson._id,
      courseId,
      courseXpPerLesson,
      isCompleted,
      isCompleting,
      hasLinkedWallet,
      isChallenge,
      t,
    ]
  );

  // Listen for challenge completion events from ChallengeInterface
  useEffect(() => {
    const handleChallengeComplete = (e: Event) => {
      const detail = (
        e as CustomEvent<{ lessonId: string; submittedCode?: string }>
      ).detail;
      if (detail.lessonId === lesson._id) {
        handleComplete(detail.submittedCode);
      }
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
  }, [lesson._id, handleComplete]);

  // Listen for build-complete events (deployable challenge lessons)
  useEffect(() => {
    if (
      lesson.type !== "challenge" ||
      !("deployable" in lesson && lesson.deployable)
    )
      return;

    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          buildUuid: string;
          programKeypairSecret?: number[];
        }>
      ).detail;
      setBuildUuid(detail.buildUuid);
      if (detail.programKeypairSecret) {
        setProgramKeypairSecret(detail.programKeypairSecret);
      }
    };
    window.addEventListener("superteam:build-complete", handler);
    return () =>
      window.removeEventListener("superteam:build-complete", handler);
  }, [lesson]);

  // Challenge lessons: workspace layout — task brief + editor + output + AI
  // Partner all visible via ChallengeInterface, which owns the resizable
  // task/AI rail split (it also needs the editor's live code/execution
  // state, which is local to that component).
  if (isChallenge) {
    // Hidden tests are already excluded server-side (GROQ projection, P0-C4),
    // so every test in the payload is safe to display.
    const visibleTests = lesson.tests ?? [];

    // Pull the H1 out of the markdown so it can headline a full-width header;
    // the rest is the "Your Task" body shown in the rail.
    const rawContent = lesson.content ?? "";
    const h1 = rawContent.match(/^\s*#\s+(.+?)\s*$/m);
    const challengeTitle = h1?.[1]?.trim() ?? lesson.title;
    const taskBody = h1 ? rawContent.replace(h1[0], "").trim() : rawContent;

    const taskSlot = (
      <div className="space-y-5 p-4 sm:p-5">
        {/* Video embed (if lesson has a video) */}
        {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}

        {/* Markdown content (H1 stripped — headlined by the page header) */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={markdownComponents}
          >
            {taskBody}
          </ReactMarkdown>
        </div>

        {/* Test cases */}
        {visibleTests.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-text-3">
              {t("testCases")}
            </h4>
            <div className="space-y-1.5">
              {visibleTests.map((tc) => (
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
    );

    return (
      <div className="grid-bg -mx-4 -my-6 min-h-[calc(100vh-60px)] bg-[var(--bg)] px-4 py-4 md:-mx-8 md:-my-8 md:px-8 md:py-6">
        {/* Header + workspace share one rounded card; the header's border-b is
            an internal divider, so there's no stray double line. */}
        <div className="overflow-hidden rounded-[var(--r-lg)] border-[2.5px] border-border shadow-card">
          {/* Header — challenge title, XP, progress */}
          <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-6">
            <Link
              href={`/${locale}/courses/${courseSlug}`}
              className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
            >
              <ArrowLeft size={16} weight="bold" />
              {tCommon("back")}
            </Link>
            <h1 className="min-w-0 flex-1 truncate font-display text-base font-black text-text sm:text-lg">
              {challengeTitle}
            </h1>
            <div className="flex items-center gap-3 sm:gap-4">
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
          </header>

          {/* Workspace — fills the screen below the header at lg; stacks (auto height) below lg */}
          <div className="flex w-full flex-col overflow-hidden lg:h-[calc(100vh-168px)]">
            {lesson.code && lesson.tests ? (
              <ChallengeInterface
                lessonId={lesson._id}
                courseSlug={courseSlug}
                lessonSlug={lesson.slug}
                taskSlot={taskSlot}
                description=""
                initialCode={lesson.code}
                language={lesson.language === "rust" ? "rust" : "typescript"}
                buildType={
                  lesson.type === "challenge" ? lesson.buildType : undefined
                }
                isDeployable={
                  lesson.type === "challenge" && "deployable" in lesson
                    ? lesson.deployable
                    : undefined
                }
                tests={lesson.tests}
                hints={lesson.hints ?? []}
                xpReward={courseXpPerLesson}
                earnedXp={earnedXp}
                isAlreadyCompleted={isCompleted}
                isEnrolled={isEnrolled}
                onEnroll={handleEnroll}
                hideDescription
                className="h-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center [background:var(--input)]">
                <p className="text-text-3">{t("content")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Full-width nav + discussion below (page scrolls to reach) */}
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
          {/* Deploy panel for deployable challenge lessons —
              Always render for deployable lessons so it can load
              existing deployments from the server on page refresh. */}
          {lesson.type === "challenge" &&
            "deployable" in lesson &&
            lesson.deployable && (
              <DeployPanel
                buildUuid={buildUuid ?? ""}
                lessonId={lesson._id}
                courseSlug={courseSlug}
                courseId={courseId}
                programKeypairSecret={programKeypairSecret ?? undefined}
                onBuildExpired={() => {
                  setBuildUuid(null);
                  setProgramKeypairSecret(null);
                }}
              />
            )}

          {/* Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
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
            {nextLesson ? (
              <Button
                variant="push"
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
                variant="push"
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
      </div>
    );
  }

  // Content lessons: natural flow within platform layout
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
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 font-display text-sm font-black text-xp">
            <Lightning size={14} weight="fill" />+
            {earnedXp ?? courseXpPerLesson} XP
          </span>
          <span
            className="hidden text-[16px] leading-none text-text-3 sm:inline"
            aria-hidden="true"
          >
            &middot;
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

      {/* Video embed (if lesson has a video) */}
      {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}

      {/* Markdown content */}
      <div className="prose max-w-3xl dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={markdownComponents}
        >
          {lesson.content}
        </ReactMarkdown>
      </div>

      {/* Deploy widgets */}
      {lesson.type === "content" &&
        "widgets" in lesson &&
        lesson.widgets?.includes("wallet-funding") && <WalletFundingCard />}
      {lesson.type === "content" &&
        "widgets" in lesson &&
        lesson.widgets?.includes("program-explorer") &&
        "programIdl" in lesson &&
        lesson.programIdl && (
          <GenericProgramExplorer
            idlJson={lesson.programIdl}
            courseSlug={courseSlug}
            courseId={courseId}
          />
        )}

      {/* Navigation + completion */}
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

          {userId ? (
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
          )}

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
