"use client";

import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    ArrowRight,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar, PageHeader, StreakCalendar, DailyReward } from "@/components/app";
import { getAllCourses, getCourseIdForProgram, getEffectiveLessonCount } from "@/lib/services/content-service";
import { getMockStreakData } from "@/lib/services/mock-leaderboard";
import { useXpBalance, useCourse, useEnrollment } from "@/hooks";
import { getLessonFlagsFromEnrollment, countCompletedLessons, getCompletedAtFromEnrollment } from "@/lib/lesson-bitmap";
import { levelFromXp } from "@/lib/level";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { MockCourse } from "@/lib/services/content-service";

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
    const { data: xp } = useXpBalance();
    const streak = getMockStreakData();
    const [courses, setCourses] = useState<MockCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const t = useTranslations("dashboard");
    const tCommon = useTranslations("common");

    useEffect(() => {
        getAllCourses().then((data) => {
            setCourses(data);
            setIsLoading(false);
        });
    }, []);

    const xpValue = xp ?? 0;
    const level = levelFromXp(xpValue);

    return (
        <>
            <DailyReward streakCount={streak.current} />
            <div className="space-y-5 sm:space-y-7">
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

                        {/* Invite Friend */}
                        <div className="flex flex-col items-center mt-6 sm:mt-8 p-4 border rounded-2xl bg-card">
                            <Image src="/mail.png" alt="invite friend" width={80} height={80} className="w-16 h-16 sm:w-20 sm:h-20" />
                            <h2 className="text-2xl sm:text-3xl font-game text-center mt-2">Invite Friend</h2>
                            <p className="font-game text-center text-sm sm:text-base mt-1">Having Fun? Share the love with a friend! Enter an email and we will send them a personal invite</p>
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto max-w-sm mt-4">
                                <input placeholder="Enter Invitee Email" className="border border-input rounded-md bg-background px-3 py-2 font-game w-full min-w-0" />
                                <Button variant="pixel" className="font-game shrink-0">Invite</Button>
                            </div>
                        </div>
                    </div>

                    {/* Side column (1/3) */}
                    <div className="lg:col-span-1">
                        {/* User Status — with pixel art icons */}
                        <div className="p-4 border-4 rounded-2xl">
                            <div className="flex gap-3 items-center mb-4">
                                <Image src="/alex_walk.gif" alt="Alex walking" width={70} height={70} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" unoptimized />
                                <h2 className="font-game text-xl sm:text-2xl">{t("yourStats")}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-5">
                                <div className="flex gap-3 items-center">
                                    <Image src="/star.png" alt="Star" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">{xpValue}</h2>
                                        <h2 className="font-game text-xl text-muted-foreground">{t("totalXp")}</h2>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Image src="/badge.png" alt="Badge" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">0</h2>
                                        <h2 className="font-game text-xl text-muted-foreground">{t("badge")}</h2>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Image src="/fire.png" alt="fire" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">{streak.current}</h2>
                                        <h2 className="font-game text-xl text-muted-foreground">{t("dailyStreak")}</h2>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Image src="/book.png" alt="level" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">Lv.{level}</h2>
                                        <h2 className="font-game text-xl text-muted-foreground">{tCommon("rank")}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upgrade to Pro / Get Certified */}
                        <div className="flex p-4 items-center flex-col border-4 rounded-2xl mt-6 sm:mt-8">
                            <h2 className="text-2xl sm:text-3xl font-game text-center">{t("getCertified")}</h2>
                            <p className="font-game text-muted-foreground text-base sm:text-xl text-center mt-1">{t("getCertifiedHint")}</p>
                            <Link href="/certificates">
                                <Button className="font-game text-2xl mt-3" variant="pixel" size="lg">
                                    {t("viewCerts")}
                                </Button>
                            </Link>
                        </div>

                        {/* Weekly Streak Calendar */}
                        <StreakCalendar currentStreak={streak.current} />
                    </div>
                </div>
            </div>
        </>
    );
}
