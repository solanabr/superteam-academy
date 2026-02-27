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
import { Lightning, CheckCircle, ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/course/progress-bar";
import { AuthModal } from "@/components/auth/auth-modal";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { useOnChainEnroll } from "@/hooks/use-on-chain-enroll";
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

async function completeLessonAPI(
  lessonId: string,
  courseId: string
): Promise<CompletionResponse> {
  const res = await fetch("/api/lessons/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, courseId }),
  });
  if (!res.ok) {
    throw new Error("Failed to complete lesson");
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

  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  // null = still loading, false = no wallet linked, true = wallet linked
  const [hasLinkedWallet, setHasLinkedWallet] = useState<boolean | null>(null);
  const [buildUuid, setBuildUuid] = useState<string | null>(null);
  const [programKeypairSecret, setProgramKeypairSecret] = useState<
    number[] | null
  >(null);
  const { isEnrolling, handleEnroll, enrollError } = useOnChainEnroll({
    courseId,
    userId,
    onSuccess: () => setIsEnrolled(true),
  });

  // Check auth state, enrollment, and completion on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);

      // Check whether user has linked a wallet (required for on-chain XP)
      supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          setHasLinkedWallet(!!data?.wallet_address);
        });

      // Check enrollment
      supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setIsEnrolled(true);
        });

      // Check completion
      supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", session.user.id)
        .eq("lesson_id", lesson._id)
        .eq("completed", true)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setIsCompleted(true);
        });
    });
  }, [lesson._id, courseId]);

  const currentIndex = allLessons.findIndex((l) => l._id === lesson._id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isChallenge = lesson.type === "challenge";

  const handleComplete = useCallback(async () => {
    if (isCompleted || isCompleting) return;
    if (hasLinkedWallet === false) return;
    setIsCompleting(true);
    try {
      const result = await completeLessonAPI(lesson._id, courseId);
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
    } catch {
      // Allow retry on failure
      setIsCompleting(false);
    }
  }, [
    lesson._id,
    courseId,
    courseXpPerLesson,
    isCompleted,
    isCompleting,
    hasLinkedWallet,
  ]);

  // Listen for challenge completion events from ChallengeInterface
  useEffect(() => {
    const handleChallengeComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonId: string }>).detail;
      if (detail.lessonId === lesson._id) {
        handleComplete();
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

  // Challenge lessons: split panel — content + test cases left, editor right
  if (isChallenge) {
    const visibleTests = lesson.tests?.filter((tc) => !tc.hidden) ?? [];

    return (
      <div className="grid-bg -mx-4 -my-6 flex h-[calc(100vh-60px)] flex-col bg-[var(--bg)] pt-4 md:-mx-8 md:-my-8">
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left pane: description + test cases + navigation */}
          <div className="w-full overflow-auto lg:w-1/2 lg:border-r-[2.5px] lg:border-border">
            <div className="space-y-6 p-6 pb-12">
              {/* Lesson top bar */}
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Link
                  href={`/${locale}/courses/${courseSlug}`}
                  className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
                >
                  <ArrowLeft size={16} weight="bold" />
                  {tCommon("back")}
                </Link>
                <div className="ml-auto flex items-center gap-4">
                  <span className="flex items-center gap-1 font-display text-sm font-black text-xp">
                    <Lightning size={14} weight="fill" />+
                    {earnedXp ?? courseXpPerLesson} XP
                  </span>
                  <span
                    className="text-[16px] leading-none text-text-3"
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
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              {/* Video embed (if lesson has a video) */}
              {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}

              {/* Markdown content */}
              <div className="prose max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  components={markdownComponents}
                >
                  {lesson.content}
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

              {/* Navigation */}
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
                {prevLesson && (
                  <Button
                    variant="pushOutline"
                    size="default"
                    asChild
                    className="min-w-[120px] justify-center"
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
                    className="min-w-[120px] justify-center"
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
                    className="min-w-[120px] justify-center"
                  >
                    <Link href={`/${locale}/courses/${courseSlug}`}>
                      {t("lessonComplete")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right pane: code editor + output only */}
          <div className="flex w-full flex-col overflow-hidden lg:w-1/2">
            {lesson.code && lesson.tests && lesson.solution ? (
              <ChallengeInterface
                lessonId={lesson._id}
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
                solution={lesson.solution}
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
          </div>
        </div>
      </div>
    );
  }

  // Content lessons: natural flow within platform layout
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Lesson top bar */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href={`/${locale}/courses/${courseSlug}`}
          className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-text-3 transition-colors hover:text-text"
        >
          <ArrowLeft size={16} weight="bold" />
          {tCommon("back")}
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1 font-display text-sm font-black text-xp">
            <Lightning size={14} weight="fill" />+
            {earnedXp ?? courseXpPerLesson} XP
          </span>
          <span
            className="text-[16px] leading-none text-text-3"
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
              className="w-20"
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
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
          {prevLesson && (
            <Button
              variant="pushOutline"
              size="default"
              asChild
              className="min-w-[120px] justify-center"
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
                className="gap-2"
              >
                {isCompleting ? (
                  <>
                    <div
                      className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Loading...</span>
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
                    <span className="sr-only">Loading...</span>
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
              className="min-w-[120px] justify-center"
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
              className="min-w-[120px] justify-center"
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
    </div>
  );
}
