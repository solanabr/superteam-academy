"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomCursor } from "@/components/ui/landing-animations";
import { useUser } from "@/lib/hooks/use-user";
import { useTranslations } from "next-intl";
import { useAllEnrollments } from "@/lib/hooks/use-all-enrollments";
import { courses } from "@/lib/services/courses";
import {
  calculateLevel,
  xpToNextLevel,
  xpForLevel,
} from "@/lib/constants";
import { DailyChallenges } from "@/components/gamification/daily-challenges";
import { SeasonalEventBanner } from "@/components/gamification/seasonal-event-banner";

import { Reveal } from "./_components/dashboard-primitives";
import { D, C, M } from "./_components/dashboard-primitives";
import { DashboardXP } from "./_components/dashboard-xp";
import { DashboardStreak } from "./_components/dashboard-streak";
import { DashboardCourses } from "./_components/dashboard-courses";
import { DashboardStatsGrid, DashboardStatsList } from "./_components/dashboard-activity";
import { DashboardActions } from "./_components/dashboard-actions";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { user, connected } = useUser();
  const t = useTranslations("dashboard");
  const { progressMap } = useAllEnrollments();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const xp = user.xp;
  const level = calculateLevel(xp);
  const nextLevelXp = xpForLevel(level + 1);
  const xpRemaining = xpToNextLevel(xp);

  const completedCourses = useMemo(
    () => courses.filter((c) => progressMap[c.id]?.isComplete),
    [progressMap],
  );

  const inProgressCourses = useMemo(
    () =>
      courses.filter(
        (c) => progressMap[c.id]?.enrolled && !progressMap[c.id]?.isComplete,
      ),
    [progressMap],
  );

  const unenrolledCourses = useMemo(
    () => courses.filter((c) => !progressMap[c.id]?.enrolled),
    [progressMap],
  );

  const currentCourse = inProgressCourses[0] ?? null;
  const currentProgress = currentCourse ? progressMap[currentCourse.id] : null;

  const resumeTarget = useMemo(() => {
    if (!currentCourse || !currentProgress) return null;
    let lessonIdx = 0;
    for (const mod of currentCourse.modules) {
      for (const lesson of mod.lessons) {
        if (lessonIdx >= currentProgress.completed) {
          return { slug: currentCourse.slug, lessonId: lesson.id };
        }
        lessonIdx++;
      }
    }
    return null;
  }, [currentCourse, currentProgress]);

  const handleResume = () => {
    if (resumeTarget) {
      router.push(
        `/${locale}/courses/${resumeTarget.slug}/lessons/${resumeTarget.lessonId}`,
      );
    }
  };

  const handleViewCerts = () => router.push(`/${locale}/certificates`);
  const handleNavigate = (path: string) => router.push(path);

  const enrolledCount = Object.values(progressMap).filter(
    (p) => p.enrolled,
  ).length;

  const credentials = user.credentials;
  const streakDays = user.streak.currentStreak;

  return (
    <div style={{ cursor: mobile ? "auto" : "none" }}>
      {!mobile && <CustomCursor />}
        <div style={{ background: D, color: C, minHeight: "100vh", contain: "layout style" }}>
          {/* Inline connect banner — visible when wallet not connected */}
          {!connected && (
            <div
              style={{
                margin: "0 auto",
                maxWidth: 720,
                padding: "80px 24px 0",
              }}
            >
              <div
                style={{
                  border: "1px solid var(--c-border-subtle)",
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: "var(--c-text-dim)",
                    margin: 0,
                  }}
                >
                  {t("walletGate.label")}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    color: "var(--c-text-dim)",
                    maxWidth: 400,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {t("walletGate.subtext")}
                </p>
                <button
                  onClick={() => window.dispatchEvent(new Event("open-wallet-gateway"))}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    padding: "14px 40px",
                    background: "transparent",
                    color: "var(--xp)",
                    border: "1px solid var(--xp)",
                    cursor: "pointer",
                  }}
                >
                  {t("walletGate.connectWallet")}
                </button>
              </div>
            </div>
          )}

          {/* Grid layout driven by CSS media queries (globals.css .dash-grid)
              to prevent CLS from JS mobile state flip */}
          <div className="dash-grid">
            {/* Left Column */}
            <div className="dash-col-left">
              <Reveal>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    letterSpacing: 3,
                    color: M,
                    margin: "0 0 4px",
                  }}
                >
                  WELCOME BACK
                </p>
                <h1
                  className="dash-heading"
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontWeight: 400,
                    color: C,
                    lineHeight: 1,
                  }}
                >
                  Keep
                  <br />
                  <span
                    style={{
                      fontStyle: "italic",
                      color: "var(--c-text-dim)",
                    }}
                  >
                    building.
                  </span>
                </h1>
              </Reveal>

              <DashboardStatsGrid
                xp={xp}
                completedCount={completedCourses.length}
                totalCourses={courses.length}
                streakDays={streakDays}
                level={level}
              />

              <DashboardCourses
                currentCourse={currentCourse}
                currentProgress={currentProgress}
                completedCourses={completedCourses}
                unenrolledCourses={unenrolledCourses}
                allCourses={courses}
                credentials={credentials}
                resumeTarget={resumeTarget}
                locale={locale}
                onResume={handleResume}
                onNavigate={handleNavigate}
              />
            </div>

            {/* Right Column */}
            <div className="dash-col-right">
              <div style={{ minHeight: 0, contain: "layout" }}>
                <SeasonalEventBanner />
              </div>

              <DashboardXP
                xp={xp}
                level={level}
                nextLevelXp={nextLevelXp}
                xpRemaining={xpRemaining}
              />

              <DashboardStreak
                streakDays={streakDays}
                activityHistory={user.streak.activityHistory}
              />

              <DashboardStatsList
                level={level}
                enrolledCount={enrolledCount}
                completedCount={completedCourses.length}
                credentialCount={credentials.length}
              />

              <DashboardActions
                resumeTarget={resumeTarget}
                onResume={handleResume}
                onViewCerts={handleViewCerts}
              />

              <Reveal delay={750}>
                <DailyChallenges />
              </Reveal>
            </div>
          </div>

          <style>{`
          @keyframes stPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
        </div>
    </div>
  );
}
