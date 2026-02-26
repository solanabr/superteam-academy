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
import { getAllCourses } from "@/lib/services/content-service";
import { getMockStreakData } from "@/lib/services/mock-leaderboard";
import { useXpBalance } from "@/hooks";
import { useEnrollment } from "@/hooks/useEnrollment";
import { getLessonFlagsFromEnrollment, countCompletedLessons } from "@/lib/lesson-bitmap";
import { levelFromXp } from "@/lib/level";
import { useState, useEffect } from "react";
import type { MockCourse } from "@/lib/services/content-service";

function EnrolledCourseCard({ course }: { course: MockCourse }) {
    const { data: enrollment } = useEnrollment(course.id);
    const lessonFlags = getLessonFlagsFromEnrollment(enrollment ?? undefined);
    const completedCount = lessonFlags.length > 0 ? countCompletedLessons(lessonFlags) : 0;
    return (
        <Link href={`/courses/${course.slug}`} className="h-full">
            <div className="border-4 rounded-2xl h-full">
                <div className="font-game p-4 h-full flex flex-col">
                    <div>
                        <h2 className="text-lg font-light text-gray-500">Course</h2>
                        <h2 className="text-3xl line-clamp-2 min-h-[4.5rem]">{course.title}</h2>
                    </div>
                    <div className="mt-auto pt-4">
                        <h2 className="text-lg text-gray-400">
                            {completedCount} Completed <span>out {course.lessonCount}</span>
                        </h2>
                        <ProgressBar value={completedCount} max={course.lessonCount} />
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
            <div className="p-8 md:px-10 lg:px-12  ">
                <div className="grid grid-cols-3 gap-7">
                    {/* Main column (2/3) */}
                    <div className="col-span-2">
                        {/* Welcome banner — robot + speech bubble */}
                        <div className="flex gap-3 items-center">
                            <Image
                                src="/machine.webp"
                                alt="robo"
                                width={120}
                                height={120}
                            />
                            <h2 className="font-game text-2xl p-4 border bg-zinc-800 rounded-lg rounded-bl-none">
                                Welcome back <span className="text-yellow-400">Builder</span>, Start learning something new...
                            </h2>
                        </div>

                        {/* Enrolled Courses */}
                        <div className="mt-8">
                            <h2 className="text-4xl mb-2 font-game">Your Enrolled Courses</h2>
                            {courses.length === 0 && !isLoading ? (
                                <div className="flex flex-col items-center gap-3 p-7 border rounded-2xl bg-zinc-900">
                                    <Image src="/books.png" alt="book" width={90} height={90} />
                                    <h2 className="font-game text-2xl">
                                        You Don&apos;t have any enrolled courses
                                    </h2>
                                    <Link href="/courses">
                                        <Button variant="pixel" className="font-game text-lg" size="lg">
                                            Browse All Courses
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
                        <div className="mt-8">
                            <h2 className="text-4xl mb-2 font-game">Explore More</h2>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="flex gap-2 p-2 border rounded-xl bg-zinc-900">
                                    <Image src="/tree.png" alt="Quizz" width={80} height={80} />
                                    <div>
                                        <h2 className="font-medium text-2xl font-game">Quiz Pack</h2>
                                        <p className="font-game text-gray-400">Practice what you learned with bite-sized challenges.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-2 border rounded-xl bg-zinc-900">
                                    <Image src="/game.png" alt="Projects" width={80} height={80} />
                                    <div>
                                        <h2 className="font-medium text-2xl font-game">Projects</h2>
                                        <p className="font-game text-gray-400">Build real-world Solana dApps from scratch.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-2 border rounded-xl bg-zinc-900">
                                    <Image src="/growth.png" alt="Community" width={80} height={80} />
                                    <div>
                                        <h2 className="font-medium text-2xl font-game">Community</h2>
                                        <p className="font-game text-gray-400">Collaborate with Solana builders worldwide.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-2 border rounded-xl bg-zinc-900">
                                    <Image src="/start-up.png" alt="Apps" width={80} height={80} />
                                    <div>
                                        <h2 className="font-medium text-2xl font-game">Explore dApps</h2>
                                        <p className="font-game text-gray-400">Explore prebuilt apps to kickstart your journey.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invite Friend */}
                        <div className="flex flex-col items-center mt-8 p-4 border rounded-2xl bg-zinc-900">
                            <Image src="/mail.png" alt="invite friend" width={80} height={80} />
                            <h2 className="text-3xl font-game">Invite Friend</h2>
                            <p className="font-game">Having Fun? Share the love with a friend! Enter an email and we will send them a personal invite</p>
                            <div className="flex gap-2 items-center mt-5">
                                <input placeholder="Enter Invitee Email" className="border rounded-md bg-zinc-800 px-3 py-2 font-game min-w-[280px]" />
                                <Button variant="pixel" className="font-game">Invite</Button>
                            </div>
                        </div>
                    </div>

                    {/* Side column (1/3) */}
                    <div>
                        {/* User Status — with pixel art icons */}
                        <div className="p-4 border-4 rounded-2xl">
                            <div className="flex gap-3 items-center mb-4">
                                <Image src="/alex_walk.gif" alt="Alex walking" width={70} height={70} unoptimized />
                                <h2 className="font-game text-2xl">Your Stats</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="flex gap-3 items-center">
                                    <Image src="/star.png" alt="Star" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">{xpValue}</h2>
                                        <h2 className="font-game text-xl text-gray-500">Total XP</h2>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Image src="/badge.png" alt="Badge" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">0</h2>
                                        <h2 className="font-game text-xl text-gray-500">Badge</h2>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Image src="/fire.png" alt="fire" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">{streak.current}</h2>
                                        <h2 className="font-game text-xl text-gray-500">Daily Streak</h2>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Image src="/book.png" alt="level" width={35} height={35} />
                                    <div>
                                        <h2 className="font-game text-3xl">Lv.{level}</h2>
                                        <h2 className="font-game text-xl text-gray-500">Rank</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upgrade to Pro / Get Certified */}
                        <div className="flex p-4 items-center flex-col border-4 rounded-2xl mt-8">
                            <Image
                                src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
                                alt="logo"
                                width={70}
                                height={70}
                                className="h-16 w-16 object-contain"
                            />
                            <h2 className="text-3xl font-game">Get Certified</h2>
                            <p className="font-game text-gray-500 text-xl text-center">Complete courses to earn on-chain credential NFTs</p>
                            <Link href="/certificates">
                                <Button className="font-game text-2xl mt-3" variant="pixel" size="lg">
                                    View Certs
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
