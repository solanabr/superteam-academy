import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeft, Maximize, Settings, CheckCircle, Clock, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { LessonVideoPlayer } from "@/components/lessons/lesson-video-player";
import { LessonContent } from "@/components/lessons/lesson-content";
import { LessonNavigation } from "@/components/lessons/lesson-navigation";
import { LessonProgress } from "@/components/lessons/lesson-progress";
import { LessonNotes } from "@/components/lessons/lesson-notes";
import { LessonQuiz } from "@/components/lessons/lesson-quiz";
import { LessonResources } from "@/components/lessons/lesson-resources";
import { getTranslations } from "next-intl/server";
import { getCourseById } from "@/lib/cms";
import { getAcademyClient } from "@/lib/academy";
import { mapCourseToDetail } from "@/lib/course-data";

interface LessonPageProps {
	params: Promise<{
		id: string;
	}>;
	searchParams?: Promise<{
		lesson?: string;
	}>;
}

export async function generateMetadata({
	params,
	searchParams,
}: LessonPageProps): Promise<Metadata> {
	// This would fetch course and lesson data from CMS/API
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const lessonId = resolvedSearchParams?.lesson || "1-1";
	const course = await getCourse(id);
	const lesson = await getLesson(id, lessonId);

	return {
		title: `${lesson.title} | ${course.title} | Superteam Academy`,
		description: lesson.description,
	};
}

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const lessonId = resolvedSearchParams?.lesson || "1-1";

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<LessonSkeleton />}>
				<LessonContentWrapper courseId={id} lessonId={lessonId} />
			</Suspense>
		</div>
	);
}

async function LessonContentWrapper({
	courseId,
	lessonId,
}: {
	courseId: string;
	lessonId: string;
}) {
	const course = await getCourse(courseId);
	const lesson = await getLesson(courseId, lessonId);
	const progress = await getLessonProgress(courseId, lessonId);
	const t = await getTranslations("learn");

	return (
		<div className="flex flex-col lg:flex-row min-h-screen">
			<div className="flex-1 flex flex-col">
				<div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Button variant="ghost" asChild={true} className="gap-2">
									<a href={`/courses/${courseId}`}>
										<ArrowLeft className="h-4 w-4" />
										{t("backToCourse")}
									</a>
								</Button>

								<Separator orientation="vertical" className="h-6" />

								<div>
									<h1 className="font-semibold text-lg">{course.title}</h1>
									<p className="text-sm text-muted-foreground">{lesson.title}</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Badge variant="outline" className="gap-1">
									<Clock className="h-3 w-3" />
									{lesson.duration}
								</Badge>
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className="relative bg-black">
					<LessonVideoPlayer
						videoUrl={lesson.videoUrl}
						title={lesson.title}
						onProgress={handleVideoProgress}
						onComplete={handleLessonComplete}
					/>
				</div>

				<div className="flex-1 overflow-hidden">
					<Tabs defaultValue="content" className="h-full flex flex-col">
						<div className="border-b px-4">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="content">{t("tabs.content")}</TabsTrigger>
								<TabsTrigger value="notes">{t("tabs.notes")}</TabsTrigger>
								<TabsTrigger value="quiz">{t("tabs.quiz")}</TabsTrigger>
								<TabsTrigger value="resources">{t("tabs.resources")}</TabsTrigger>
							</TabsList>
						</div>

						<div className="flex-1 overflow-hidden">
							<TabsContent value="content" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<LessonContent content={lesson.content} />
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="notes" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<LessonNotes lessonId={lessonId} currentTime={0} />
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="quiz" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<LessonQuiz
											quiz={lesson.quiz}
											onComplete={handleQuizComplete}
										/>
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="resources" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<LessonResources resources={lesson.resources} />
									</div>
								</ScrollArea>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</div>

			<div className="w-full lg:w-80 border-l bg-muted/30">
				<div className="p-4 space-y-6">
					<LessonProgress
						progress={progress}
						currentLesson={{ id: lessonId, title: lesson.title, progress: 0 }}
					/>

					<LessonNavigation
						currentLessonId={lessonId}
						lessons={course.modules.flatMap((m) =>
							m.lessons.map((l) => ({ ...l, duration: 15 }))
						)}
						onLessonSelect={handleLessonSelect}
						hasPrevious={false}
						hasNext={true}
					/>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">{t("quickActions")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button variant="outline" className="w-full justify-start gap-2">
								<BookOpen className="h-4 w-4" />
								{t("takeNotes")}
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2">
								<CheckCircle className="h-4 w-4" />
								{t("markComplete")}
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2">
								<Maximize className="h-4 w-4" />
								{t("fullscreen")}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function LessonSkeleton() {
	return (
		<div className="flex flex-col lg:flex-row min-h-screen">
			<div className="flex-1 flex flex-col">
				<div className="border-b p-4">
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<div className="h-6 w-48 bg-muted animate-pulse rounded" />
							<div className="h-4 w-32 bg-muted animate-pulse rounded" />
						</div>
						<div className="h-8 w-20 bg-muted animate-pulse rounded" />
					</div>
				</div>

				<div className="aspect-video bg-muted animate-pulse" />

				<div className="flex-1 p-6 space-y-4">
					<div className="h-8 w-64 bg-muted animate-pulse rounded" />
					<div className="space-y-2">
						<div className="h-4 w-full bg-muted animate-pulse rounded" />
						<div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
						<div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
					</div>
				</div>
			</div>

			<div className="w-full lg:w-80 border-l p-4 space-y-6">
				<div className="space-y-4">
					<div className="h-32 bg-muted animate-pulse rounded" />
					<div className="h-48 bg-muted animate-pulse rounded" />
				</div>
			</div>
		</div>
	);
}

// Event handlers (would be implemented with actual API calls)
async function handleVideoProgress(_progress: number) {
	// ignored
}

async function handleLessonComplete() {
	// ignored
}

async function handleQuizComplete(_score: number, _passed: boolean) {
	// ignored
}

function handleLessonSelect(_lessonId: string) {
	// ignored
}

async function getCourse(id: string) {
	const academyClient = getAcademyClient();
	const [cmsCourse, onchainCourse, onchainCourses] = await Promise.all([
		getCourseById(id),
		academyClient.fetchCourse(id),
		academyClient.fetchAllCourses(),
	]);

	let prerequisiteLabel: string | null = null;
	const prerequisite = onchainCourse?.prerequisite ?? null;
	if (prerequisite) {
		const prereq = onchainCourses.find((course) => course.pubkey.equals(prerequisite));
		prerequisiteLabel = prereq?.account.courseId ?? prerequisite.toBase58();
	}

	const onchainMeta = {
		...(onchainCourse
			? {
					xpPerLesson: onchainCourse.xpPerLesson,
					lessonCount: onchainCourse.lessonCount,
					trackId: onchainCourse.trackId,
					trackLevel: onchainCourse.trackLevel,
				}
			: {}),
		...(prerequisiteLabel ? { prerequisiteLabel } : {}),
	};

	const detail = mapCourseToDetail(id, cmsCourse, onchainMeta);

	return {
		id: detail.id,
		title: detail.title,
		modules: detail.modules.map((module) => ({
			id: module.id,
			title: module.title,
			lessons: module.lessonsList.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				completed: lesson.completed,
			})),
		})),
	};
}

async function getLesson(courseId: string, lessonId: string) {
	const cmsCourse = await getCourseById(courseId);
	const lessons =
		cmsCourse?.modules?.flatMap((module) =>
			(module.lessons ?? []).map((lesson) => ({
				id: lesson.slug?.current ?? lesson._id,
				title: lesson.title,
				duration: lesson.duration ?? "10 min",
				content: lesson.content,
			}))
		) ?? [];

	const lesson = lessons.find((entry) => entry.id === lessonId) ??
		lessons[0] ?? {
			id: lessonId,
			title: "Lesson",
			duration: "10 min",
			content: [],
		};
	const links = extractLinksFromBlocks(lesson.content ?? []);
	const videoUrl =
		links.find((link) => isVideoUrl(link.href))?.href ??
		links.find((link) => link.href.endsWith(".mp4"))?.href ??
		"/videos/placeholder.mp4";
	const resources = links
		.filter((link) => link.href !== videoUrl)
		.map((link, index) => ({
			id: `${lesson.id}-resource-${index + 1}`,
			title: link.title,
			description: "Referenced in lesson content",
			type: inferResourceType(link.href),
			url: link.href,
			tags: ["lesson"],
		}));

	const sections = (lesson.content ?? []).map((block, index) => ({
		id: `${lesson.id}-section-${index + 1}`,
		title: block.style === "h2" ? "Section" : `Part ${index + 1}`,
		type: "text" as const,
		content: (block.children ?? []).map((child) => child.text).join(" "),
		order: index + 1,
	}));

	return {
		id: lesson.id,
		title: lesson.title,
		description: `Lesson from ${cmsCourse?.title ?? "course"}`,
		duration: lesson.duration,
		videoUrl,
		content: { sections },
		quiz: {
			id: `${lesson.id}-quiz`,
			title: `${lesson.title} Quiz`,
			questions: [],
			passingScore: 70,
		},
		resources,
	};
}

type SanityLessonBlock = {
	children?: Array<{ text?: string; marks?: string[] }>;
	markDefs?: Array<{ _key?: string; _type?: string; href?: string }>;
};

function extractLinksFromBlocks(blocks: SanityLessonBlock[]) {
	const links: Array<{ href: string; title: string }> = [];

	for (const block of blocks) {
		const defs = block.markDefs ?? [];
		const children = block.children ?? [];

		for (const child of children) {
			const markKeys = child.marks ?? [];
			for (const markKey of markKeys) {
				const def = defs.find((item) => item._key === markKey && item._type === "link");
				const href = def?.href;
				if (!href) continue;

				const title = child.text?.trim() || safeHostname(href) || "Resource";
				if (!links.some((link) => link.href === href)) {
					links.push({ href, title });
				}
			}
		}
	}

	return links;
}

function safeHostname(href: string) {
	try {
		return new URL(href).hostname.replace("www.", "");
	} catch {
		return "";
	}
}

function isVideoUrl(url: string) {
	return /youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?)/i.test(url);
}

function inferResourceType(
	url: string
): "article" | "video" | "document" | "link" | "book" | "tool" {
	if (isVideoUrl(url)) return "video";
	if (/\.pdf($|\?)/i.test(url)) return "document";
	if (/docs\.|notion\.so|readme|guide|article|blog/i.test(url)) return "article";
	if (/book|ebook|handbook/i.test(url)) return "book";
	if (/github\.com|figma\.com|tool|app\./i.test(url)) return "tool";
	return "link";
}

async function getLessonProgress(courseId: string, lessonId: string) {
	const academyClient = getAcademyClient();
	const onchainCourse = await academyClient.fetchCourse(courseId);
	const lessonCount = onchainCourse?.lessonCount ?? 1;
	const lessonIndex = Number.parseInt(lessonId.split("-").at(-1) ?? "1", 10) - 1;
	const completedLessons = Math.min(Math.max(lessonIndex, 0), lessonCount);

	return {
		completedLessons,
		totalLessons: lessonCount,
		timeSpent: completedLessons * 10,
		xpEarned: completedLessons * (onchainCourse?.xpPerLesson ?? 0),
		xpRequired: lessonCount * (onchainCourse?.xpPerLesson ?? 0),
		achievements: [
			{
				id: "course-progress",
				title: "Course Progress",
				description: "Complete lessons to progress through this course",
				unlocked: true,
				icon: "book",
			},
		],
	};
}
