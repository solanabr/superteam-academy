"use client";

import { DailyReward, ProgressBar, StreakCalendar } from "@/components/app";
import { OnboardingAssessmentModal } from "@/components/app/OnboardingAssessmentModal";
import { Button } from "@/components/ui/button";
import { useChallenges, useCourse, useEnrollment, useXpBalance } from "@/hooks";
import { countCompletedLessons, getCompletedAtFromEnrollment, getLessonFlagsFromEnrollment } from "@/lib/lesson-bitmap";
import { levelFromXp } from "@/lib/level";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import type { MockCourse } from "@/lib/services/content-service";
import { getAllCourses, getCourseIdForProgram, getEffectiveLessonCount } from "@/lib/services/content-service";
import { getMockStreakData } from "@/lib/services/mock-leaderboard";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function EnrolledCourseCard({ course }: { course: MockCourse }) {
    const programCourseId = getCourseIdForProgram(course);
    const { data: enrollment } = useEnrollment(programCourseId);
    const { data: onChainCourse } = useCourse(programCourseId);
    const lessonFlags = getLessonFlagsFromEnrollment(enrollment ?? undefined);
    const completedCount = lessonFlags.length > 0 ? countCompletedLessons(lessonFlags) : 0;
    const effectiveCount = getEffectiveLessonCount(course, onChainCourse ?? null);
    const completedAt = getCompletedAtFromEnrollment(enrollment ?? undefined);
    const isCourseComplete = completedAt != null;
    const t = useTranslations("dashboard");
    return (
        <Link href={`/courses/${course.slug}`} className="h-full">
            <div className="border-4 rounded-2xl h-full">
                <div className="font-game p-4 h-full flex flex-col">
                    <div>
                        <h2 className="text-lg font-light text-muted-foreground">{t("courseLabel")}</h2>
                        <h2 className="text-2xl sm:text-3xl line-clamp-2 min-h-[3.5rem] sm:min-h-[4.5rem]">{course.title}</h2>
                    </div>
                    <div className="mt-auto pt-4">
                        {isCourseComplete ? (
                            <h2 className="text-lg text-green-600 dark:text-green-400 font-medium">{t("courseComplete")}</h2>
                        ) : (
                            <>
                                <h2 className="text-lg text-muted-foreground">
                                    {completedCount} {t("completedOutOf")} {effectiveCount}
                                </h2>
                                <ProgressBar value={completedCount} max={effectiveCount} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function DashboardPage() {
    const { publicKey } = useWallet();
    const wallet = publicKey?.toBase58();
    const { data: xp } = useXpBalance();
    const { data: challengesData } = useChallenges(wallet);
    const streak = getMockStreakData();
    const [courses, setCourses] = useState<MockCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const t = useTranslations("dashboard");
    const tCommon = useTranslations("common");

    useEffect(() => {
        getAllCourses().then((data) => {
            setCourses(data);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!wallet) {
            setShowOnboardingModal(false);
            return;
        }
        setShowOnboardingModal(!hasCompletedOnboarding(wallet));
    }, [wallet]);

    const xpValue = xp ?? 0;
    const level = levelFromXp(xpValue);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden -m-4 sm:-m-6">
            <OnboardingAssessmentModal
                open={showOnboardingModal}
                walletAddress={wallet ?? null}
                onOpenChange={setShowOnboardingModal}
            />
            <DailyReward streakCount={streak.current} />
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-7">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7">
                    {/* Main column (2/3) */}
                    <div className="lg:col-span-2">
                        {/* Welcome banner — robot + speech bubble */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-start">
                            <Image
                                src="/machine.webp"
                                alt="robo"
                                width={120}
                                height={120}
                                className="w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                            />
                            <h2 className="font-game text-xl sm:text-2xl p-3 sm:p-4 border border-border bg-card rounded-lg rounded-bl-none sm:rounded-bl-lg text-center sm:text-left">
                                {t("welcomeBack")} <span className="text-yellow-400">{t("builder")}</span>, {t("startLearning")}
                            </h2>
                        </div>

                        {/* Enrolled Courses */}
                        <div className="mt-6 sm:mt-8">
                            <h2 className="font-game text-3xl sm:text-4xl mb-2">{t("yourEnrolledCourses")}</h2>
                            {courses.length === 0 && !isLoading ? (
                                <div className="flex flex-col items-center gap-3 p-7 border rounded-2xl bg-card">
                                    <Image src="/books.png" alt="book" width={90} height={90} />
                                    <h2 className="font-game text-2xl">
                                        {t("noEnrolledCourses")}
                                    </h2>
                                    <Link href="/courses">
                                        <Button variant="pixel" className="font-game text-lg" size="lg">
                                            {t("browseAllCourses")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
                                    {courses.slice(0, 2).map((course) => (
                                        <EnrolledCourseCard key={course.id} course={course} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Daily challenges */}
                        {wallet && (challengesData?.challenges?.length ?? 0) > 0 && (
                            <div className="mt-6 sm:mt-8">
                                <h2 className="font-game text-3xl sm:text-4xl mb-2">Daily challenges</h2>
                                <div className="space-y-3">
                                    {challengesData!.challenges.slice(0, 3).map((ch) => (
                                        <Link
                                            key={ch.id}
                                            href="/challenges"
                                            className="block p-3 sm:p-4 border rounded-xl bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-game text-base sm:text-lg line-clamp-1">
                                                    {ch.completed ? "✓ " : ""}{ch.title}
                                                    {ch.xpReward > 0 && (
                                                        <span className="text-yellow-400 ml-1">+{ch.xpReward} XP</span>
                                                    )}
                                                </span>
                                                <span className="font-game text-sm text-muted-foreground shrink-0">View all →</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link href="/challenges" className="inline-block mt-2">
                                    <Button variant="outline" size="sm" className="font-game">
                                        All challenges
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Explore More */}
                        <div className="mt-6 sm:mt-8">
                            <h2 className="font-game text-3xl sm:text-4xl mb-2">{t("exploreMore")}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                                <div className="flex gap-2 p-2 sm:p-2 border rounded-xl bg-card min-w-0">
                                    <Image src="/tree.png" alt="Quizz" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-medium text-lg sm:text-2xl font-game">Quiz Pack</h2>
                                        <p className="font-game text-muted-foreground text-sm sm:text-base">Practice what you learned with bite-sized challenges.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-2 sm:p-2 border rounded-xl bg-card min-w-0">
                                    <Image src="/game.png" alt="Projects" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-medium text-lg sm:text-2xl font-game">Projects</h2>
                                        <p className="font-game text-muted-foreground text-sm sm:text-base">Build real-world Solana dApps from scratch.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-2 sm:p-2 border rounded-xl bg-card min-w-0">
                                    <Image src="/growth.png" alt="Community" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-medium text-lg sm:text-2xl font-game">Community</h2>
                                        <p className="font-game text-muted-foreground text-sm sm:text-base">Collaborate with Solana builders worldwide.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-2 sm:p-2 border rounded-xl bg-card min-w-0">
                                    <Image src="/start-up.png" alt="Apps" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-medium text-lg sm:text-2xl font-game">Explore dApps</h2>
                                        <p className="font-game text-muted-foreground text-sm sm:text-base">Explore prebuilt apps to kickstart your journey.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Side column (1/3) — stats, certify, streak */}
                    <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6 lg:gap-8">
                        {/* User Status — with pixel art icons */}
                        <div className="p-4 sm:p-5 border-4 rounded-2xl">
                            <div className="flex gap-3 items-center mb-3 sm:mb-4">
                                <Image src="/alex_walk.gif" alt="Alex walking" width={70} height={70} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" unoptimized />
                                <h2 className="font-game text-lg sm:text-xl lg:text-2xl">{t("yourStats")}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-5">
                                <div className="flex gap-2 sm:gap-3 items-center min-w-0">
                                    <Image src="/star.png" alt="Star" width={35} height={35} className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-game text-xl sm:text-2xl lg:text-3xl">{xpValue}</h2>
                                        <h2 className="font-game text-sm sm:text-base lg:text-xl text-muted-foreground truncate">{t("totalXp")}</h2>
                                    </div>
                                </div>
                                <div className="flex gap-2 sm:gap-3 items-center min-w-0">
                                    <Image src="/badge.png" alt="Badge" width={35} height={35} className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-game text-xl sm:text-2xl lg:text-3xl">0</h2>
                                        <h2 className="font-game text-sm sm:text-base lg:text-xl text-muted-foreground truncate">{t("badge")}</h2>
                                    </div>
                                </div>
                                <div className="flex gap-2 sm:gap-3 items-center min-w-0">
                                    <Image src="/fire.png" alt="fire" width={35} height={35} className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-game text-xl sm:text-2xl lg:text-3xl">{streak.current}</h2>
                                        <h2 className="font-game text-sm sm:text-base lg:text-xl text-muted-foreground truncate">{t("dailyStreak")}</h2>
                                    </div>
                                </div>
                                <div className="flex gap-2 sm:gap-3 items-center min-w-0">
                                    <Image src="/book.png" alt="level" width={35} height={35} className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 shrink-0" />
                                    <div className="min-w-0">
                                        <h2 className="font-game text-xl sm:text-2xl lg:text-3xl">Lv.{level}</h2>
                                        <h2 className="font-game text-sm sm:text-base lg:text-xl text-muted-foreground truncate">{tCommon("rank")}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upgrade to Pro / Get Certified */}
                        <div className="flex p-4 sm:p-5 items-center flex-col border-4 rounded-2xl">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-game text-center">{t("getCertified")}</h2>
                            <p className="font-game text-muted-foreground text-sm sm:text-base lg:text-lg text-center mt-1">{t("getCertifiedHint")}</p>
                            <Link href="/certificates" className="w-full sm:w-auto">
                                <Button className="font-game text-lg sm:text-xl lg:text-2xl mt-3 w-full sm:w-auto" variant="pixel" size="lg">
                                    {t("viewCerts")}
                                </Button>
                            </Link>
                        </div>

                        {/* Weekly Streak Calendar */}
                        <StreakCalendar currentStreak={streak.current} />
                    </div>
                </div>
            </div>
        </div>
    );
}
