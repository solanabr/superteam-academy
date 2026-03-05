"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, Clock, Loader2, X as XIcon, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEnroll } from "@/hooks/use-enroll";
import { CertificateMintModal } from "@/components/certificate-mint-modal";
import { useMintCertificate } from "@/hooks/use-mint-certificate";

interface LessonData {
  id: string;
  title: string;
  slug: string;
  type: "content" | "challenge";
  durationMinutes: number;
  xpReward: number;
}

interface ModuleData {
  id: string;
  title: string;
  lessons: LessonData[];
}

interface CourseInteractiveProps {
  courseSlug: string;
  modules: ModuleData[];
  totalLessons: number;
  xpTotal: number;
  firstLessonSlug: string;
}

function getEnrollmentKey(wallet: string, courseSlug: string) {
  return `st-academy:${wallet}:enrolled:${courseSlug}`;
}

function getLessonKey(wallet: string, courseSlug: string, lessonId: string) {
  return `st-academy:${wallet}:lesson:${courseSlug}:${lessonId}`;
}

// Legacy keys for migration
const LEGACY_ENROLLMENT_PREFIX = "st-academy:enrolled:";
function legacyLessonKey(courseSlug: string, lessonId: string) {
  return `st-academy:lesson:${courseSlug}:${lessonId}`;
}

export function CourseEnrollButton({
  courseSlug,
  courseTitle,
  firstLessonSlug,
  xpTotal,
  totalLessons,
  moduleCount,
}: {
  courseSlug: string;
  courseTitle: string;
  firstLessonSlug: string;
  xpTotal: number;
  totalLessons: number;
  moduleCount: number;
}) {
  const t = useTranslations("course");
  const tCert = useTranslations("certificate");
  const tCommon = useTranslations("common");
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const [enrolled, setEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const {
    enroll: enrollOnChain,
    checkEnrolled,
    loading: enrollLoading,
  } = useEnroll();
  const { checkMinted, getCertificate } = useMintCertificate();

  useEffect(() => {
    if (!walletAddr) return;

    // Check on-chain enrollment first, then localStorage
    (async () => {
      let isEnrolled = false;
      try {
        isEnrolled = await checkEnrolled(courseSlug);
      } catch {
        /* RPC error */
      }

      // Fallback: check wallet-scoped localStorage
      if (!isEnrolled) {
        isEnrolled =
          localStorage.getItem(getEnrollmentKey(walletAddr, courseSlug)) ===
          "true";
      }
      // Migrate legacy enrollment
      if (
        !isEnrolled &&
        localStorage.getItem(`${LEGACY_ENROLLMENT_PREFIX}${courseSlug}`) ===
          "true"
      ) {
        localStorage.setItem(getEnrollmentKey(walletAddr, courseSlug), "true");
        isEnrolled = true;
      }

      // Sync: if enrolled on-chain but not in localStorage, persist it
      if (isEnrolled) {
        localStorage.setItem(getEnrollmentKey(walletAddr, courseSlug), "true");
      }
      setEnrolled(isEnrolled);
    })();

    // Count completed lessons (wallet-scoped, deduplicated)
    try {
      const completedIds = new Set<string>();
      const keys = Object.keys(localStorage);
      const walletLessonPrefix = `st-academy:${walletAddr}:lesson:${courseSlug}:`;
      const legacyLessonPrefix = `st-academy:lesson:${courseSlug}:`;
      // First pass: collect wallet-scoped completions
      for (const key of keys) {
        if (
          key.startsWith(walletLessonPrefix) &&
          localStorage.getItem(key) === "completed"
        ) {
          completedIds.add(key.replace(walletLessonPrefix, ""));
        }
      }
      // Second pass: migrate legacy keys not yet in wallet-scoped
      for (const key of keys) {
        if (
          key.startsWith(legacyLessonPrefix) &&
          localStorage.getItem(key) === "completed"
        ) {
          const lessonId = key.replace(legacyLessonPrefix, "");
          if (!completedIds.has(lessonId)) {
            localStorage.setItem(
              getLessonKey(walletAddr, courseSlug, lessonId),
              "completed",
            );
            completedIds.add(lessonId);
          }
        }
      }
      setCompletedLessons(Math.min(completedIds.size, totalLessons));
    } catch {
      /* */
    }
  }, [courseSlug, walletAddr, checkEnrolled, totalLessons]);

  const handleEnroll = async () => {
    if (!walletAddr) return;

    // Attempt on-chain enrollment (learner-signed transaction)
    try {
      const sig = await enrollOnChain(courseSlug);
      if (sig) {
        // On-chain enrollment succeeded — persist locally too
        localStorage.setItem(getEnrollmentKey(walletAddr, courseSlug), "true");
        setEnrolled(true);
        return;
      }
    } catch {
      // On-chain failed (program not deployed, no SOL, etc.)
    }

    // Fallback: localStorage-only enrollment
    localStorage.setItem(getEnrollmentKey(walletAddr, courseSlug), "true");
    setEnrolled(true);
  };

  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {totalLessons} {t("lessons")} · {moduleCount} {t("modules")}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {t("progress")}: {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedLessons}/{totalLessons} {t("lessons")}
          </span>
          <span>{xpTotal} XP</span>
        </div>
      </div>

      {enrolled ? (
        progressPercent >= 100 ? (
          checkMinted(courseSlug) ? (
            // 100% + already minted → "Certificado" button → view details
            <Button
              onClick={() => setShowCertModal(true)}
              className="w-full gap-2 bg-[hsl(var(--brand-logo-yellow))] text-[hsl(var(--brand-dark))] hover:bg-[hsl(var(--brand-logo-yellow))]/90 dark:bg-[#008c4C] dark:text-white dark:hover:bg-[#006b3a]"
            >
              <Award className="h-4 w-4" />
              {tCert("certificateButton")}
            </Button>
          ) : (
            // 100% + not minted → "Gerar Certificado" button → mint flow
            <Button
              onClick={() => setShowCertModal(true)}
              className="w-full gap-2 bg-[hsl(var(--brand-logo-yellow))] text-[hsl(var(--brand-dark))] hover:bg-[hsl(var(--brand-logo-yellow))]/90 dark:bg-[#008c4C] dark:text-white dark:hover:bg-[#006b3a]"
            >
              <Award className="h-4 w-4" />
              {tCert("claimCertificate")}
            </Button>
          )
        ) : (
          // Enrolled but < 100% → "Matriculado" badge
          <div className="flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--brand-logo-yellow))]/20 px-3 py-2 text-sm font-medium text-[hsl(var(--brand-logo-yellow))] dark:bg-[#008c4C]/10 dark:text-[#008c4C]">
            <BookOpen className="h-4 w-4" />
            {t("enrolled")}
          </div>
        )
      ) : (
        <Button
          onClick={handleEnroll}
          disabled={enrollLoading}
          className="card-button w-full bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
        >
          {enrollLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            tCommon("enroll")
          )}
        </Button>
      )}

      <CertificateMintModal
        courseSlug={courseSlug}
        courseTitle={courseTitle}
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        existingCert={
          checkMinted(courseSlug) ? getCertificate(courseSlug) : undefined
        }
      />
    </div>
  );
}

export function CourseModules({
  courseSlug,
  modules,
}: {
  courseSlug: string;
  modules: ModuleData[];
}) {
  const t = useTranslations("course");
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const [enrolled, setEnrolled] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!walletAddr) return;
    // Wallet-scoped enrollment check with legacy migration
    let isEnrolled =
      localStorage.getItem(getEnrollmentKey(walletAddr, courseSlug)) === "true";
    if (
      !isEnrolled &&
      localStorage.getItem(`${LEGACY_ENROLLMENT_PREFIX}${courseSlug}`) ===
        "true"
    ) {
      localStorage.setItem(getEnrollmentKey(walletAddr, courseSlug), "true");
      isEnrolled = true;
    }
    setEnrolled(isEnrolled);

    const completed = new Set<string>();
    try {
      for (const mod of modules) {
        for (const lesson of mod.lessons) {
          const walletKey = getLessonKey(walletAddr, courseSlug, lesson.id);
          const legacyKey = legacyLessonKey(courseSlug, lesson.id);
          if (localStorage.getItem(walletKey) === "completed") {
            completed.add(lesson.id);
          } else if (localStorage.getItem(legacyKey) === "completed") {
            // Migrate legacy
            localStorage.setItem(walletKey, "completed");
            completed.add(lesson.id);
          }
        }
      }
    } catch {
      /* */
    }
    setCompletedSet(completed);

    const handleStorageChange = () => {
      setEnrolled(
        localStorage.getItem(getEnrollmentKey(walletAddr, courseSlug)) ===
          "true",
      );
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [courseSlug, modules, walletAddr]);

  return (
    <>
      <Accordion type="multiple" className="w-full">
        {modules.map((mod) => (
          <AccordionItem key={mod.id} value={mod.id}>
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]" />
                {mod.title}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {mod.lessons.map((lesson) => {
                  const isCompleted = completedSet.has(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLesson(lesson)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded text-xs ${
                            isCompleted
                              ? "bg-[hsl(var(--brand-logo-green))] text-white"
                              : "bg-muted"
                          }`}
                        >
                          {isCompleted ? "\u2713" : "\u2014"}
                        </span>
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {lesson.durationMinutes} {t("min")} ·{" "}
                          {lesson.xpReward} XP
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Lesson summary modal */}
      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLesson(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-yellow))] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedLesson(null)}
              className="absolute right-3 top-3 rounded-full p-1 text-[hsl(var(--brand-logo-green))] transition-colors hover:bg-[hsl(var(--brand-logo-green))]/10"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <h3 className="mb-3 pr-8 text-lg font-bold text-[hsl(var(--brand-logo-green))]">
              {selectedLesson.title}
            </h3>

            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1 text-[hsl(var(--brand-logo-green))]">
                <Clock className="h-4 w-4" />
                {t("lessonDuration")}: {selectedLesson.durationMinutes}{" "}
                {t("min")}
              </span>
              <span className="font-medium text-sky-600">
                {selectedLesson.xpReward} XP
              </span>
              <span className="rounded bg-[hsl(var(--brand-logo-green))]/10 px-2 py-0.5 text-xs font-medium text-[hsl(var(--brand-logo-green))]">
                {selectedLesson.type === "challenge" ? "Challenge" : "Content"}
              </span>
            </div>

            {enrolled ? (
              <Button
                asChild
                className="card-button w-full bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
              >
                <Link
                  href={`/courses/${courseSlug}/lessons/${selectedLesson.slug}`}
                  className="text-white"
                >
                  {t("viewLesson")}
                </Link>
              </Button>
            ) : (
              <p className="rounded-lg bg-[hsl(var(--brand-logo-green))]/10 px-3 py-2 text-center text-sm text-[hsl(var(--brand-logo-green))]">
                {t("enrollToAccess")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
