import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Star, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseHero } from "@/components/courses/course-hero";
import { CourseDetailTabs } from "@/components/courses/course-detail-tabs";
import { CoursePrerequisites } from "@/components/courses/course-prerequisites";
import { CourseCertificate } from "@/components/courses/course-certificate";
import { CourseEnrollment } from "@/components/courses/course-enrollment";
import { CourseProgress } from "@/components/courses/course-progress";
import { getCourseById, getCourseReviews } from "@/lib/cms";
import { getAcademyClient } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { mapCourseToDetail } from "@/lib/course-data";
import { PublicKey } from "@solana/web3.js";
import {
	countCompletedLessons,
	isLessonCompleted,
	type CourseAccount,
} from "@superteam-academy/anchor";

interface CourseDetailPageProps {
	params: Promise<{
		locale: string;
		id: string;
	}>;
	searchParams?: Promise<{
		tab?: string;
	}>;
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
	const { id, locale } = await params;
	const t = await getTranslations({ locale, namespace: "seo.dynamic.course" });
	const course = await getCourse(id);

	return {
		title: t("title", { course: course.title }),
		description: course.description,
		openGraph: {
			title: course.title,
			description: course.description,
			images: [course.image],
		},
	};
}

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const activeTab = resolvedSearchParams?.tab || "overview";

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<CourseDetailSkeleton />}>
				<CourseDetailContent courseId={id} activeTab={activeTab} />
			</Suspense>
		</div>
	);
}

async function CourseDetailContent({
	courseId,
	activeTab,
}: {
	courseId: string;
	activeTab: string;
}) {
	const t = await getTranslations("courses");
	const course = await getCourse(courseId);

	return (
		<div className="space-y-8">
			<div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
				<div className="container mx-auto px-4 py-4">
					<Button variant="ghost" asChild={true} className="gap-2">
						<a href="/courses">
							<ArrowLeft className="h-4 w-4" />
							{t("backToCourses")}
						</a>
					</Button>
				</div>
			</div>

			<CourseHero course={course} />

			<div className="container mx-auto px-4 pb-4">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<CourseDetailTabs
							course={course}
							courseId={courseId}
							initialTab={activeTab}
						/>
					</div>

					<div className="space-y-6">
						<Card className="sticky top-24" id="enroll">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="h-5 w-5" />
									{t("enrollment.title")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<CourseEnrollment course={course} />

								<div className="space-y-3 pt-4 border-t">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.students")}
										</span>
										<span className="font-medium">
											{course.students.toLocaleString()}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.rating")}
										</span>
										<div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span className="font-medium">{course.rating}</span>
											<span className="text-muted-foreground">
												({course.reviewCount})
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.duration")}
										</span>
										<span className="font-medium">{course.duration}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.level")}
										</span>
										<Badge variant="outline">{course.level}</Badge>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("stats.xp")}
										</span>
										<div className="flex items-center gap-1">
											<Zap className="h-4 w-4 text-yellow-500" />
											<span className="font-medium">
												{course.xpReward.toLocaleString()} XP
											</span>
										</div>
									</div>
								</div>

								{course.finalized && course.certificate && (
									<div className="pt-4 border-t">
										<CourseCertificate certificate={course.certificate} />
									</div>
								)}
							</CardContent>
						</Card>

						{course.prerequisites && course.prerequisites.length > 0 && (
							<CoursePrerequisites prerequisites={course.prerequisites} />
						)}

						{course.enrolled && (
							<CourseProgress courseId={courseId} progress={course.progress} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function CourseDetailSkeleton() {
	return (
		<div className="space-y-8">
			<div className="relative h-96 bg-muted animate-pulse">
				<div className="absolute inset-0 bg-linear-to-r from-primary/20 to-secondary/20" />
			</div>

			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<div className="space-y-4">
							<Skeleton className="h-8 w-3/4" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</div>
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-full mb-4" />
								<div className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

async function getCourse(id: string) {
	const academyClient = getAcademyClient();
	const [wallet, cmsCourse, reviews] = await Promise.all([
		getLinkedWallet(),
		getCourseById(id).catch(() => null),
		getCourseReviews(id).catch(() => []),
	]);

	let onchainCourse: CourseAccount | null = null;
	let onchainCourses: Array<{ pubkey: PublicKey; account: CourseAccount }> = [];
	try {
		[onchainCourse, onchainCourses] = await Promise.all([
			academyClient.fetchCourse(id),
			academyClient.fetchAllCourses(),
		]);
	} catch (error) {
		console.warn("Onchain course fetch failed", error);
	}

	const learner = wallet ? new PublicKey(wallet) : null;
	let prerequisiteInfo: {
		id: string;
		title: string;
		completed: boolean;
	} | null = null;
	let prerequisiteCourseId: string | null = null;

	const prerequisite = onchainCourse?.prerequisite ?? null;
	if (prerequisite) {
		const prereq = onchainCourses.find((course) => course.pubkey.equals(prerequisite));
		prerequisiteCourseId = prereq?.account.courseId ?? null;
		const prerequisiteTitle = prereq?.account.courseId ?? prerequisite.toBase58();
		let completed = false;

		if (learner && prerequisiteCourseId) {
			try {
				const prereqEnrollment = await academyClient.fetchEnrollment(
					prerequisiteCourseId,
					learner
				);
				completed = Boolean(prereqEnrollment?.completedAt);
			} catch (error) {
				console.warn("Onchain prerequisite enrollment fetch failed", error);
			}
		}

		prerequisiteInfo = {
			id: prerequisiteCourseId ?? prerequisite.toBase58(),
			title: prerequisiteTitle,
			completed,
		};
	}

	let enrollment: {
		enrolled: boolean;
		completedLessons: number;
		xpEarned: number;
		finalized: boolean;
		lessonStates: boolean[];
	} | null = null;

	if (wallet && learner && onchainCourse) {
		try {
			const enrollmentData = await academyClient.fetchEnrollment(id, learner);
			if (enrollmentData) {
				const completed = countCompletedLessons(enrollmentData.lessonFlags);
				const lessonStates = Array.from({ length: onchainCourse.lessonCount }, (_, index) =>
					isLessonCompleted(enrollmentData.lessonFlags, index)
				);
				enrollment = {
					enrolled: true,
					completedLessons: completed,
					xpEarned: completed * onchainCourse.xpPerLesson,
					finalized: !!enrollmentData.completedAt,
					lessonStates,
				};
			}
		} catch (error) {
			console.warn("Onchain enrollment fetch failed", error);
		}
	}

	return await mapCourseToDetail(
		id,
		cmsCourse,
		{
			...(onchainCourse
				? {
						xpPerLesson: onchainCourse.xpPerLesson,
						lessonCount: onchainCourse.lessonCount,
						trackId: onchainCourse.trackId,
						trackLevel: onchainCourse.trackLevel,
						totalEnrollments: onchainCourse.totalEnrollments,
					}
				: {}),
			...(prerequisiteInfo ? { prerequisite: prerequisiteInfo } : {}),
		},
		{
			reviews,
			enrollment,
		}
	);
}
