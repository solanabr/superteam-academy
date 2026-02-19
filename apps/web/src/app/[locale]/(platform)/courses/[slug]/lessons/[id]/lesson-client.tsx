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
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Lightning, CheckCircle, ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/course/progress-bar";
import { AuthModal } from "@/components/auth/auth-modal";
import { dispatchXpGain } from "@/components/gamification/xp-popup";
import { dispatchAchievementUnlock } from "@/components/gamification/achievement-popup";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";
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
}

interface CompletionResponse {
  success: boolean;
  alreadyCompleted: boolean;
  xpEarned: number;
  signature?: string;
  finalized?: boolean;
  finalizationSignature?: string | null;
  credentialMinted?: boolean;
  certificateId?: string;
  newAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
  }[];
  failedAchievements?: string[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  } | null;
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
}: LessonPageClientProps) {
  const t = useTranslations("lesson");
  const tCommon = useTranslations("common");
  const tCourses = useTranslations("courses");

  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
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

  const handleComplete = useCallback(
    async (_xpReward?: number) => {
      if (isCompleted || isCompleting) return;
      setIsCompleting(true);
      try {
        const result = await completeLessonAPI(lesson._id, courseId);
        setIsCompleting(false);
        setIsCompleted(true);

        if (!result.alreadyCompleted && result.xpEarned > 0) {
          dispatchXpGain(result.xpEarned);
          trackEvent("lesson_completed", {
            lessonId: lesson._id,
            courseId,
            xpEarned: result.xpEarned,
            signature: result.signature,
          });

          if (result.finalized) {
            trackEvent("course_finalized", {
              courseId,
              finalizationSignature: result.finalizationSignature ?? undefined,
            });
          }

          if (result.credentialMinted && result.certificateId) {
            dispatchCertificateMinted(result.certificateId);
            trackEvent("certificate_minted", {
              courseId,
              certificateId: result.certificateId,
            });
          }

          for (const achievement of result.newAchievements) {
            dispatchAchievementUnlock(achievement.id, achievement.name);
            trackEvent("achievement_unlocked", {
              achievementId: achievement.id,
              achievementName: achievement.name,
            });
          }
        }
      } catch {
        // Allow retry on failure
        setIsCompleting(false);
      }
    },
    [lesson._id, courseId, isCompleted, isCompleting]
  );

  // Listen for challenge completion events from ChallengeInterface
  useEffect(() => {
    const handleChallengeComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonId: string; xpReward: number }>)
        .detail;
      if (detail.lessonId === lesson._id) {
        handleComplete(detail.xpReward);
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
      <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] flex-col md:-mx-8 md:-my-8">
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left pane: description + test cases + navigation */}
          <div className="w-full overflow-auto lg:w-1/2 lg:border-r-[2.5px] lg:border-border">
            <div className="space-y-6 p-6 pb-12">
              {/* Back + progress */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/${locale}/courses/${courseSlug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-text-3 transition-colors hover:text-text"
                >
                  <ArrowLeft size={16} weight="bold" />
                  {tCommon("back")}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xs font-bold text-text-3">
                    {currentIndex + 1}/{allLessons.length}
                  </span>
                  <ProgressBar
                    value={currentIndex + 1}
                    max={allLessons.length}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Lesson meta */}
              <div className="flex items-center gap-2 text-xs text-text-3">
                <span>{t("challenge")}</span>
                <span className="ml-auto flex items-center gap-1 font-display font-bold text-accent">
                  <Lightning
                    size={14}
                    weight="duotone"
                    className="text-accent"
                  />
                  +{lesson.xpReward} XP
                </span>
              </div>

              {/* Video embed (if lesson has a video) */}
              {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}

              {/* Markdown content */}
              <div className="prose max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
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
                        className="bg-subtle/30 rounded-md border border-border p-2 text-xs"
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
              <div className="flex items-center justify-between border-t border-border pt-6">
                {prevLesson ? (
                  <Button variant="pushOutline" size="sm" asChild>
                    <Link
                      href={`/${locale}/courses/${courseSlug}/lessons/${prevLesson.slug}`}
                    >
                      &larr; {tCommon("previous")}
                    </Link>
                  </Button>
                ) : (
                  <div />
                )}
                {nextLesson ? (
                  <Button variant="push" size="sm" asChild>
                    <Link
                      href={`/${locale}/courses/${courseSlug}/lessons/${nextLesson.slug}`}
                    >
                      {tCommon("next")} &rarr;
                    </Link>
                  </Button>
                ) : (
                  <Button variant="push" size="sm" asChild>
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
                xpReward={lesson.xpReward}
                isAlreadyCompleted={isCompleted}
                isEnrolled={isEnrolled}
                onEnroll={handleEnroll}
                hideDescription
                className="h-full"
              />
            ) : (
              <div className="bg-subtle/30 flex h-full items-center justify-center">
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
      {/* Back + progress */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/courses/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-3 transition-colors hover:text-text"
        >
          <ArrowLeft size={16} weight="bold" />
          {tCommon("back")}
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-display text-xs font-bold text-text-3">
            {currentIndex + 1}/{allLessons.length}
          </span>
          <ProgressBar
            value={currentIndex + 1}
            max={allLessons.length}
            className="w-24"
          />
        </div>
      </div>

      {/* Lesson meta */}
      <div className="flex items-center gap-2 text-xs text-text-3">
        <span>{t("content")}</span>
        <span className="ml-auto flex items-center gap-1 font-display font-bold text-accent">
          <Lightning size={14} weight="duotone" className="text-accent" />+
          {lesson.xpReward} XP
        </span>
      </div>

      {/* Video embed (if lesson has a video) */}
      {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}

      {/* Markdown content */}
      <div className="prose max-w-3xl dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
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
            <Button variant="pushOutline" size="sm" asChild>
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
                disabled={isCompleted || isCompleting}
                onClick={() => handleComplete(lesson.xpReward)}
                className="gap-2"
              >
                {isCompleting ? (
                  <>
                    <div
                      className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent"
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
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
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
                <Button variant="pushSuccess" size="lg" className="gap-2">
                  {t("signInToTrack")}
                </Button>
              }
            />
          )}

          {nextLesson ? (
            <Button
              variant={isCompleted ? "push" : "pushOutline"}
              size="sm"
              asChild
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
              size="sm"
              asChild
            >
              <Link href={`/${locale}/courses/${courseSlug}`}>
                {t("lessonComplete")}
              </Link>
            </Button>
          )}
        </div>
        {enrollError && (
          <p role="alert" className="text-center text-sm text-destructive">
            {tCourses("enrollFailed")}
          </p>
        )}
      </div>
    </div>
  );
}
