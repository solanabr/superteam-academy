"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Clock,
  Code2,
  Target,
  CheckCircle2,
  Award,
  Play,
  Circle,
  Video,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentService } from "@/services/content-service";
import { learningProgressService } from "@/services/learning-progress-service";
import { onchainAcademyService } from "@/services/onchain-academy-service";
import type { CourseDetail, Difficulty } from "@/types/domain";
import { useUserStore } from "@/store/user-store";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import { apiFetch } from "@/lib/api-client";
import { formatMinutes } from "@/lib/utils";

type LinkedAccountsResponse = {
  userId: string;
  wallets: Array<{ address: string; isPrimary: boolean }>;
  providers: Array<{ provider: string; providerAccountId: string }>;
};

const DIFF_ACCENT: Record<Difficulty, string> = {
  beginner: "#14F195",
  intermediate: "#9945FF",
  advanced: "#FF8C42",
};

const DIFF_LABEL: Record<Difficulty, string> = {
  beginner: "INIT",
  intermediate: "CORE",
  advanced: "DEEP",
};

export default function CourseDetailPage(): React.JSX.Element {
  const { t } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { walletAddress } = useUserStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState(0);
  const [enrollStatus, setEnrollStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [finalizeStatus, setFinalizeStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [hasLinkedWallet, setHasLinkedWallet] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    void contentService.getCourseBySlug(params.slug).then((data) => {
      setCourse(data);
      if (data && session?.user?.id) {
        void learningProgressService
          .getProgress(session.user.id, data.id)
          .then((row) => {
            setProgress(row.completionPercent);
            setIsEnrolled(row.completionPercent > 0);
          })
          .catch(() => setProgress(0));
      } else {
        setProgress(0);
        setIsEnrolled(false);
      }
    });
  }, [params.slug, session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setHasLinkedWallet(false);
      return;
    }
    void apiFetch<LinkedAccountsResponse>(
      `/auth/account/links/${encodeURIComponent(userId)}`,
    )
      .then((r) => setHasLinkedWallet(r.wallets.length > 0))
      .catch(() => setHasLinkedWallet(false));
  }, [session?.user?.id]);

  const groupedLessons = useMemo(() => {
    if (!course)
      return [] as Array<{ module: string; lessons: CourseDetail["lessons"] }>;
    const map = new Map<string, CourseDetail["lessons"]>();
    for (const lesson of course.lessons) {
      const bucket = map.get(lesson.module) ?? [];
      bucket.push(lesson);
      map.set(lesson.module, bucket);
    }
    return [...map.entries()].map(([module, lessons]) => ({ module, lessons }));
  }, [course]);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative h-10 w-10">
          <div
            className="absolute inset-0 rounded-full border-t-2 animate-spin"
            style={{ borderColor: "#14F195" }}
          />
          <div
            className="absolute inset-2 rounded-full border-t-2 animate-spin opacity-40"
            style={{ borderColor: "#9945FF", animationDuration: "0.7s" }}
          />
        </div>
        <span className="font-mono text-xs tracking-widest text-white/25 animate-pulse">
          {t("courseDetailPage.loadingCourse")}
        </span>
      </div>
    );
  }

  const accent = DIFF_ACCENT[course.difficulty] ?? "#14F195";
  const diffLabel = DIFF_LABEL[course.difficulty] ?? "INIT";
  const completedCount = Math.round((progress / 100) * course.lessons.length);

  async function handleEnroll(): Promise<void> {
    if (!course) return;
    if (!wallet) {
      setEnrollStatus({
        status: "error",
        message: t("courseDetailPage.connectWalletFirst"),
      });
      return;
    }
    setEnrollStatus({
      status: "loading",
      message: t("courseDetailPage.signEnroll"),
    });
    try {
      const signature = await onchainAcademyService.enroll({
        connection,
        wallet,
        courseId: course.id,
      });
      trackEvent("course_enroll_submitted", { courseId: course.id });
      setIsEnrolled(true);
      setEnrollStatus({
        status: "success",
        message: `${t("courseDetailPage.enrollSuccess")} ${signature.slice(0, 8)}...`,
      });
    } catch (error) {
      setEnrollStatus({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t("courseDetailPage.enrollFailed"),
      });
    }
  }

  async function handleFinalizeCourse(): Promise<void> {
    if (!course) return;
    if (!walletAddress || !hasLinkedWallet) {
      setFinalizeStatus({
        status: "error",
        message: t("courseDetailPage.linkWalletFinalize"),
      });
      return;
    }
    try {
      setFinalizeStatus({
        status: "loading",
        message: t("courseDetailPage.submittingFinalize"),
      });
      const response = await learningProgressService.finalizeCourse(
        {
          courseId: course.id,
        },
        session?.backendToken,
      );
      trackEvent("course_finalize_requested", {
        courseId: course.id,
        requestId: response.requestId,
      });
      setFinalizeStatus({
        status: "success",
        message: `${t("courseDetailPage.finalizeQueued")} ${response.requestId.slice(0, 8)}...`,
      });
    } catch (error) {
      setFinalizeStatus({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t("courseDetailPage.finalizeFailed"),
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/courses")}
        className="flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors mb-10 tracking-widest uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("courseDetailPage.backCatalog")}
      </motion.button>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017] overflow-hidden mb-8"
      >
        {/* Top accent stripe */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}44 55%, transparent)`,
          }}
        />

        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 0% 0%, ${accent}, transparent)`,
          }}
        />

        <div className="relative z-10 p-8 sm:p-10 flex flex-col lg:flex-row gap-8">
          {/* Left: meta */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase">
              <span
                className="px-2 py-1 rounded font-bold"
                style={{ color: accent, background: accent + "18" }}
              >
                {diffLabel}
              </span>
              <span className="text-white/25">·</span>
              <span className="text-white/35">{course.track}</span>
            </div>

            {/* Title */}
            <h1 className="font-bold text-3xl sm:text-4xl leading-tight text-white">
              {course.title}
            </h1>

            <p className="text-base text-white/45 leading-relaxed max-w-xl">
              {course.description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-5 font-mono text-[11px] text-white/35 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatMinutes(course.durationMinutes)}
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ color: accent }}
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                {course.xpTotal} XP
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {course.lessons.length} {t("courseDetailPage.modules")}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {t("courseDetailPage.xpReward")}
              </span>
            </div>
          </div>

          {/* Right: action card */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="rounded-xl border border-white/[0.1] bg-black/30 p-6 space-y-5 backdrop-blur-sm">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-white/40">
                  <span>{t("courseDetailPage.yourProgress")}</span>
                  <span
                    style={{ color: progress === 100 ? accent : undefined }}
                  >
                    {completedCount}/{course.lessons.length}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
                    }}
                  />
                </div>

                {progress === 100 && (
                  <div
                    className="flex items-center gap-1.5 font-mono text-[10px]"
                    style={{ color: accent }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {t("courseDetailPage.completed")}
                  </div>
                )}
              </div>

              {/* CTA */}
              {!isEnrolled ? (
                <div className="space-y-2.5">
                  <button
                    onClick={handleEnroll}
                    disabled={enrollStatus.status === "loading"}
                    className="w-full h-11 rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
                    style={{
                      background: accent,
                      color: accent === "#14F195" ? "#0a1a12" : "#ffffff",
                    }}
                  >
                    {enrollStatus.status === "loading"
                      ? t("courseDetailPage.confirming")
                      : t("courseDetailPage.enrollOnchain")}
                  </button>
                  {enrollStatus.message && (
                    <p
                      className={`font-mono text-[10px] text-center tracking-wide ${
                        enrollStatus.status === "error"
                          ? "text-red-400"
                          : "text-white/40"
                      }`}
                    >
                      {enrollStatus.message}
                    </p>
                  )}
                </div>
              ) : progress === 100 ? (
                <div className="space-y-2.5">
                  <button
                    onClick={handleFinalizeCourse}
                    disabled={finalizeStatus.status === "loading"}
                    className="w-full h-11 rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
                    style={{
                      background: accent,
                      color: accent === "#14F195" ? "#0a1a12" : "#ffffff",
                    }}
                  >
                    {finalizeStatus.status === "loading"
                      ? t("courseDetailPage.submitting")
                      : t("courseDetailPage.finalizeCourse")}
                  </button>
                  {finalizeStatus.message && (
                    <p
                      className={`font-mono text-[10px] text-center tracking-wide ${
                        finalizeStatus.status === "error"
                          ? "text-red-400"
                          : "text-white/40"
                      }`}
                    >
                      {finalizeStatus.message}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  className="w-full h-11 font-bold text-sm border-0"
                  style={{
                    background: accent,
                    color: accent === "#14F195" ? "#0a1a12" : "#ffffff",
                  }}
                  asChild
                >
                  <Link
                    href={`/courses/${course.slug}/lessons/${course.lessons?.[0]?.id ?? ""}`}
                  >
                    {progress > 0
                      ? t("courseDetailPage.resumeLearning")
                      : t("courseDetailPage.startCourse")}
                    <Play className="ml-2 h-3.5 w-3.5 fill-current" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Syllabus ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-xl text-white">
            {t("courseDetailPage.syllabus")}
          </h2>
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="font-mono text-[10px] text-white/25 tracking-widest">
            {course.lessons.length.toString().padStart(2, "0")} LESSONS
          </span>
        </div>

        <div className="space-y-2">
          {groupedLessons.map((group, groupIndex) => (
            <motion.div
              key={group.module}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + groupIndex * 0.06 }}
              className="rounded-xl border border-white/[0.08] bg-[#0c1017] overflow-hidden"
            >
              {/* Module header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
                <span
                  className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: accent, background: accent + "18" }}
                >
                  {String(groupIndex + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-sm text-white/80">
                  {group.module}
                </h3>
                <span className="ml-auto font-mono text-[10px] text-white/20">
                  {group.lessons.length}L
                </span>
              </div>

              {/* Lessons */}
              <div className="divide-y divide-white/[0.04]">
                {group.lessons.map((lesson, lessonIndex) => {
                  const globalIdx = course.lessons.findIndex(
                    (l) => l.id === lesson.id,
                  );
                  const isCompleted =
                    progress > (globalIdx / course.lessons.length) * 100;

                  return (
                    <div
                      key={lesson.id}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors"
                    >
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2
                            className="h-4 w-4"
                            style={{ color: accent }}
                          />
                        ) : (
                          <Circle className="h-4 w-4 text-white/20" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate transition-colors ${
                            isCompleted
                              ? "text-white/35"
                              : "text-white/75 group-hover:text-white"
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-white/25">
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            {lesson.type === "challenge" ? (
                              <Code2 className="h-3 w-3" />
                            ) : lesson.type === "video" ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            {lesson.type}
                          </span>
                          <span>·</span>
                          <span>10 XP</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-white/20">
                          {String(lessonIndex + 1).padStart(2, "0")}
                        </span>
                        <Link
                          href={`/courses/${course.slug}/lessons/${lesson.id}`}
                          className="h-7 w-7 rounded-lg flex items-center justify-center border border-white/[0.08] text-white/25 hover:text-white hover:border-white/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
