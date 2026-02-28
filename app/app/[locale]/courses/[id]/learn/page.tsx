import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, Maximize, Settings, Clock, BookOpen, Code, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
	LessonVideoPlayerWrapper,
	LessonQuizWrapper,
	LessonNavigationWrapper,
	LessonMarkCompleteWrapper,
} from "@/components/lessons/lesson-interactive";
import { LessonContent } from "@/components/lessons/lesson-content";
import { LessonProgress } from "@/components/lessons/lesson-progress";
import { LessonNotes } from "@/components/lessons/lesson-notes";
import { LessonResources } from "@/components/lessons/lesson-resources";
import { getTranslations } from "next-intl/server";
import { getCourseById } from "@/lib/cms";
import { getAcademyClient } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { mapCourseToDetail } from "@/lib/course-data";
import { getLessonQuizPageData } from "@/lib/challenge-content";
import { PublicKey } from "@solana/web3.js";
import { countCompletedLessons } from "@superteam-academy/anchor";

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
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const lessonId = resolvedSearchParams?.lesson || "1-1";

	return buildLessonMetadata(id, lessonId);
}

export async function buildLessonMetadata(courseId: string, lessonId: string): Promise<Metadata> {
	const course = await getCourse(courseId);
	const lesson = await getLesson(courseId, lessonId);

	return {
		title: `${lesson.title} | ${course.title} | Superteam Academy`,
		description: lesson.description,
	};
}

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const lessonId = resolvedSearchParams?.lesson || "1-1";
	redirect(`/courses/${id}/lessons/${lessonId}`);
}

export async function LessonPageContent({
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

	const allLessons = course.modules.flatMap((m) => m.lessons);
	const currentLessonMeta = allLessons.find((l) => l.id === lessonId);
	const isInteractive = currentLessonMeta?.type === "interactive";
	const challengeHref = `/courses/${courseId}/challenges/${lessonId}`;

	const lessonTabs = (
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
							<LessonQuizWrapper
								courseId={courseId}
								lessonIndex={progress.lessonIndex}
								quiz={lesson.quiz}
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
	);

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
					<LessonVideoPlayerWrapper
						courseId={courseId}
						lessonIndex={progress.lessonIndex}
						videoUrl={lesson.videoUrl}
						lessonTitle={lesson.title}
					/>
				</div>

				<div className="flex-1 overflow-hidden">
					{isInteractive ? (
						<div className="h-full flex flex-col lg:flex-row">
							<div className="h-full lg:flex-1 min-h-0">{lessonTabs}</div>
							<div className="hidden lg:block w-px bg-border" />
							<div className="h-112 lg:h-full lg:w-[42%] lg:min-w-90 lg:max-w-[70%] lg:shrink-0 lg:resize-x overflow-hidden border-t lg:border-t-0 lg:border-l bg-muted/20">
								<div className="h-full flex flex-col">
									<div className="border-b px-4 py-3 flex items-center justify-between">
										<div className="text-sm font-medium flex items-center gap-2">
											<Code className="h-4 w-4" />
											{t("tryChallenge")}
										</div>
										<Button variant="outline" size="sm" asChild={true}>
											<a href={challengeHref} className="gap-2">
												<ExternalLink className="h-3.5 w-3.5" />
												{t("tryChallenge")}
											</a>
										</Button>
									</div>
									<iframe
										title={`${lesson.title} challenge`}
										src={challengeHref}
										className="h-full w-full border-0"
									/>
								</div>
							</div>
						</div>
					) : (
						lessonTabs
					)}
				</div>
			</div>

			<div className="w-full lg:w-80 border-l bg-muted/30">
				<div className="p-4 space-y-6">
					<LessonProgress
						progress={progress}
						currentLesson={{ id: lessonId, title: lesson.title, progress: 0 }}
					/>

					<LessonNavigationWrapper
						courseId={courseId}
						lessonId={lessonId}
						lessons={course.modules.flatMap((m) =>
							m.lessons.map((l) => ({ ...l, duration: 15 }))
						)}
						hasPrevious={false}
						hasNext={true}
					/>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">{t("quickActions")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{isInteractive && (
								<Button
									variant="default"
									className="w-full justify-start gap-2"
									asChild={true}
								>
									<a href={challengeHref}>
										<Code className="h-4 w-4" />
										{t("tryChallenge")}
									</a>
								</Button>
							)}
							<Button variant="outline" className="w-full justify-start gap-2">
								<BookOpen className="h-4 w-4" />
								{t("takeNotes")}
							</Button>
							<LessonMarkCompleteWrapper
								courseId={courseId}
								lessonIndex={progress.lessonIndex}
								label={t("markComplete")}
							/>
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

// Removed: handleVideoProgress, handleLessonComplete, handleQuizComplete, handleLessonSelect
// Interactive behavior now lives in lesson-interactive.tsx client components

async function getCourse(id: string) {
	const academyClient = getAcademyClient();
	const [onchainCourse, onchainCourses, cmsCourse] = await Promise.all([
		academyClient.fetchCourse(id),
		academyClient.fetchAllCourses(),
		getCourseById(id).catch(() => null),
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

	const detail = await mapCourseToDetail(id, cmsCourse, onchainMeta);

	return {
		id: detail.id,
		title: detail.title,
		modules: detail.modules.map((module) => ({
			id: module.id,
			title: module.title,
			lessons: module.lessonsList.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				type: lesson.type,
				completed: lesson.completed,
			})),
		})),
	};
}

async function getLesson(courseId: string, lessonId: string) {
	const academyClient = getAcademyClient();
	const [cmsCourse, onchainCourse] = await Promise.all([
		getCourseById(courseId).catch(() => null),
		academyClient.fetchCourse(courseId),
	]);

	const lessons =
		cmsCourse?.modules?.flatMap((module) =>
			(module.lessons ?? []).map((lesson) => ({
				id: lesson.slug?.current ?? lesson._id,
				title: lesson.title,
				duration: lesson.duration ?? "10 min",
				content: lesson.content,
			}))
		) ?? [];

	const fallbackLessons = Array.from(
		{ length: Math.max(1, onchainCourse?.lessonCount ?? 1) },
		(_, index) => ({
			id: `${courseId}-lesson-${index + 1}`,
			title: `Lesson ${index + 1}`,
			duration: "10 min",
			content: [],
		})
	);

	const lessonPool = lessons.length > 0 ? lessons : fallbackLessons;
	const lesson = lessonPool.find((entry) => entry.id === lessonId) ?? lessonPool[0];
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

	const quizData = await getLessonQuizPageData(courseId, lesson.id);
	const quiz = quizData
		? {
				id: quizData.quiz.slug.current,
				title: quizData.quiz.title,
				questions: quizData.quiz.questions.map((question) => ({
					id: question.id,
					question: question.prompt,
					options: question.options.map((option) => option.text),
					correctAnswer: Math.max(
						0,
						question.options.findIndex(
							(option) => option.id === question.correctOptionId
						)
					),
					explanation: question.explanation,
				})),
				passingScore: quizData.quiz.passingScore,
			}
		: {
				id: `${lesson.id}-quiz`,
				title: `${lesson.title} Quiz`,
				questions: [],
				passingScore: 70,
			};

	return {
		id: lesson.id,
		title: lesson.title,
		description: `Lesson from ${cmsCourse?.title ?? "course"}`,
		duration: lesson.duration,
		videoUrl,
		content: { sections },
		quiz,
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
	const wallet = await getLinkedWallet();

	const onchainCourse = await academyClient.fetchCourse(courseId);
	const lessonCount = onchainCourse?.lessonCount ?? 1;
	const lessonIndex = Number.parseInt(lessonId.split("-").at(-1) ?? "1", 10) - 1;

	let completedLessons = 0;

	if (wallet) {
		const learner = new PublicKey(wallet);
		const enrollment = await academyClient.fetchEnrollment(courseId, learner);
		if (enrollment) {
			completedLessons = countCompletedLessons(enrollment.lessonFlags);
		}
	}

	return {
		completedLessons,
		totalLessons: lessonCount,
		lessonIndex: Math.min(Math.max(lessonIndex, 0), lessonCount - 1),
		timeSpent: completedLessons * 10,
		xpEarned: completedLessons * (onchainCourse?.xpPerLesson ?? 0),
		xpRequired: lessonCount * (onchainCourse?.xpPerLesson ?? 0),
		achievements: [
			{
				id: "course-progress",
				title: "Course Progress",
				description: "Complete lessons to progress through this course",
				unlocked: completedLessons > 0,
				icon: "book",
			},
		],
	};
}
