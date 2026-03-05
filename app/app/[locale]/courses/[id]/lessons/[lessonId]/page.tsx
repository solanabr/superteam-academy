import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { LessonNotes } from "@/components/lessons/lesson-notes";
import { LessonResources } from "@/components/lessons/lesson-resources";
import { getTranslations } from "next-intl/server";
import { getCourseById } from "@/lib/cms";
import { getAcademyClient } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { mapCourseToDetail } from "@/lib/course-data";
import { getLessonQuizPageData, getChallengePageData } from "@/lib/challenge-content";
import { PublicKey } from "@solana/web3.js";
import { countCompletedLessons } from "@superteam-academy/anchor";

interface LessonPageProps {
	params: Promise<{
		locale: string;
		id: string;
		lessonId: string;
	}>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
	const { id, lessonId, locale } = await params;
	const t = await getTranslations({ locale, namespace: "seo.dynamic.lesson" });
	const course = await getLessonCourse(id);
	if (!course) return { title: "Course not found" };

	const lesson = await getLesson(id, lessonId);

	return {
		title: t("title", {
			lesson: lesson?.title ?? lessonId,
			course: course.title,
		}),
		description: lesson?.description ?? "",
	};
}

export default async function LessonPage({ params }: LessonPageProps) {
	const { id, lessonId } = await params;

	const course = await getLessonCourse(id);
	if (!course) notFound();

	const lesson = await getLesson(id, lessonId);
	if (!lesson) notFound();

	const progress = await getLessonProgress(id, lessonId);
	const t = await getTranslations("learn");

	const hasChallenge = Boolean(lesson.challenge);
	const challengeHref = `/courses/${id}/challenges/${lessonId}`;

	const lessonTabs = (
		<Tabs defaultValue="content" className="h-full flex flex-col">
			<div className="border-b">
				<TabsList className="h-9 bg-transparent rounded-none px-4 gap-1">
					<TabsTrigger
						value="content"
						className="text-xs rounded-sm px-3 py-1.5 data-[state=active]:bg-muted"
					>
						{t("tabs.content")}
					</TabsTrigger>
					<TabsTrigger
						value="notes"
						className="text-xs rounded-sm px-3 py-1.5 data-[state=active]:bg-muted"
					>
						{t("tabs.notes")}
					</TabsTrigger>
					<TabsTrigger
						value="quiz"
						className="text-xs rounded-sm px-3 py-1.5 data-[state=active]:bg-muted"
					>
						{t("tabs.quiz")}
					</TabsTrigger>
					{hasChallenge && (
						<TabsTrigger
							value="challenge"
							className="text-xs rounded-sm px-3 py-1.5 data-[state=active]:bg-muted"
						>
							{t("tabs.challenge")}
						</TabsTrigger>
					)}
					<TabsTrigger
						value="resources"
						className="text-xs rounded-sm px-3 py-1.5 data-[state=active]:bg-muted"
					>
						{t("tabs.resources")}
					</TabsTrigger>
				</TabsList>
			</div>

			<div className="flex-1 overflow-hidden">
				<TabsContent value="content" className="h-full m-0">
					<ScrollArea className="h-full">
						<div className="p-5">
							<LessonContent content={lesson.content} />
						</div>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="notes" className="h-full m-0">
					<ScrollArea className="h-full">
						<div className="p-5">
							<LessonNotes lessonId={lessonId} currentTime={0} />
						</div>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="quiz" className="h-full m-0">
					<ScrollArea className="h-full">
						<div className="p-5">
							{lesson.quiz ? (
								<LessonQuizWrapper
									courseId={id}
									lessonIndex={progress.lessonIndex}
									quiz={lesson.quiz}
								/>
							) : (
								<p className="text-muted-foreground text-sm">{t("noQuiz")}</p>
							)}
						</div>
					</ScrollArea>
				</TabsContent>

				{hasChallenge && lesson.challenge && (
					<TabsContent value="challenge" className="h-full m-0">
						<ScrollArea className="h-full">
							<div className="p-5 space-y-3">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<h3 className="text-sm font-semibold">
											{lesson.challenge.title}
										</h3>
										<Badge
											variant="outline"
											className="text-[10px] px-1.5 py-0 h-4"
										>
											{lesson.challenge.difficulty}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground">
										{lesson.challenge.description}
									</p>
								</div>
								{lesson.challenge.objectives.length > 0 && (
									<div>
										<h4 className="text-xs font-medium mb-1">
											{t("challengeObjectives")}
										</h4>
										<ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
											{lesson.challenge.objectives.map((obj, i) => (
												<li key={i}>{obj}</li>
											))}
										</ul>
									</div>
								)}
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<span>{lesson.challenge.estimatedTime}</span>
									<span>
										{lesson.challenge.tests} {t("challengeTests")}
									</span>
								</div>
								<Button size="sm" asChild={true} className="w-full gap-1.5">
									<a href={challengeHref}>
										<Code className="h-3.5 w-3.5" />
										{t("tryChallenge")}
									</a>
								</Button>
							</div>
						</ScrollArea>
					</TabsContent>
				)}

				<TabsContent value="resources" className="h-full m-0">
					<ScrollArea className="h-full">
						<div className="p-5">
							<LessonResources resources={lesson.resources} />
						</div>
					</ScrollArea>
				</TabsContent>
			</div>
		</Tabs>
	);

	return (
		<div className="min-h-screen bg-background">
			<div className="flex flex-col lg:flex-row min-h-screen">
				<div className="flex-1 flex flex-col">
					<div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
						<div className="px-4 py-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<Button
										variant="ghost"
										size="sm"
										asChild={true}
										className="gap-2"
									>
										<a href={`/courses/${id}`}>
											<ArrowLeft className="h-4 w-4" />
											{t("backToCourse")}
										</a>
									</Button>

									<Separator orientation="vertical" className="h-5" />

									<div>
										<h1 className="font-semibold text-sm">{course.title}</h1>
										<p className="text-xs text-muted-foreground">
											{lesson.title}
										</p>
									</div>
								</div>

								<Badge variant="outline" className="gap-1 text-xs">
									<Clock className="h-3 w-3" />
									{lesson.duration}
								</Badge>
							</div>
						</div>
					</div>

					<div className="relative bg-black">
						<LessonVideoPlayerWrapper
							courseId={id}
							lessonIndex={progress.lessonIndex}
							videoUrl={lesson.videoUrl}
							lessonTitle={lesson.title}
						/>
					</div>

					<div className="flex-1 overflow-hidden">{lessonTabs}</div>
				</div>

				<div className="w-full lg:w-72 border-l bg-muted/20">
					<div className="p-3 space-y-3">
						<LessonMarkCompleteWrapper
							courseId={id}
							lessonIndex={progress.lessonIndex}
							label={t("markComplete")}
						/>
						{hasChallenge && (
							<Button
								size="sm"
								variant="outline"
								className="w-full justify-start gap-1.5 text-xs"
								asChild={true}
							>
								<a href={challengeHref}>
									<Code className="h-3.5 w-3.5" />
									{t("tryChallenge")}
								</a>
							</Button>
						)}

						<LessonNavigationWrapper
							courseId={id}
							lessonId={lessonId}
							lessons={course.modules.flatMap((m) =>
								m.lessons.map((l) => ({ ...l, duration: 15 }))
							)}
							hasPrevious={false}
							hasNext={true}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// --- Data fetching: onchain-first, CMS enrichment only ---

async function getLessonCourse(id: string) {
	const academyClient = getAcademyClient();
	const onchainCourse = await academyClient.fetchCourse(id);
	if (!onchainCourse) return null;

	const [onchainCourses, cmsCourse] = await Promise.all([
		academyClient.fetchAllCourses(),
		getCourseById(id).catch(() => null),
	]);

	let prerequisiteLabel: string | null = null;
	const prerequisite = onchainCourse.prerequisite ?? null;
	if (prerequisite) {
		const prereq = onchainCourses.find((course) => course.pubkey.equals(prerequisite));
		prerequisiteLabel = prereq?.account.courseId ?? prerequisite.toBase58();
	}

	const detail = await mapCourseToDetail(id, cmsCourse, {
		xpPerLesson: onchainCourse.xpPerLesson,
		lessonCount: onchainCourse.lessonCount,
		trackId: onchainCourse.trackId,
		trackLevel: onchainCourse.trackLevel,
		...(prerequisiteLabel ? { prerequisiteLabel } : {}),
	});

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
	const cmsCourse = await getCourseById(courseId).catch(() => null);

	const lessons =
		cmsCourse?.modules?.flatMap((module) =>
			(module.lessons ?? []).map((lesson) => ({
				id: lesson.slug?.current ?? lesson._id,
				title: lesson.title,
				duration: lesson.duration ?? "10 min",
				content: lesson.content,
			}))
		) ?? [];

	const lesson = lessons.find((entry) => entry.id === lessonId);
	if (!lesson) return null;

	const links = extractLinksFromBlocks(lesson.content ?? []);
	const videoUrl =
		links.find((link) => isVideoUrl(link.href))?.href ??
		links.find((link) => link.href.endsWith(".mp4"))?.href ??
		null;
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

	const sections = buildLessonSections(lesson.id, lesson.content ?? []);

	const [quizData, challengeData] = await Promise.all([
		getLessonQuizPageData(courseId, lesson.id),
		getChallengePageData(courseId, lesson.id),
	]);
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
		: null;

	const challenge = challengeData
		? {
				title: challengeData.challenge.title,
				description: challengeData.challenge.description,
				difficulty: challengeData.challenge.difficulty,
				estimatedTime: challengeData.challenge.estimatedTime,
				objectives: challengeData.challenge.objectives ?? [],
				tests: challengeData.challenge.tests?.length ?? 0,
			}
		: null;

	return {
		id: lesson.id,
		title: lesson.title,
		description: `Lesson from ${cmsCourse?.title ?? "course"}`,
		duration: lesson.duration,
		videoUrl: videoUrl ?? "",
		content: { sections },
		quiz,
		challenge,
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

/**
 * Groups Sanity content blocks into sections split on h2/h3 headings.
 * Each section gets a meaningful title extracted from the heading text.
 */
function buildLessonSections(
	lessonId: string,
	blocks: Array<{
		style?: string;
		children?: Array<{ text?: string }>;
	}>
) {
	const sections: Array<{
		id: string;
		title: string;
		type: "text";
		content: string;
		order: number;
	}> = [];

	let currentTitle = "Introduction";
	let currentContent: string[] = [];
	let sectionIndex = 0;

	const flush = () => {
		if (currentContent.length > 0) {
			sectionIndex += 1;
			sections.push({
				id: `${lessonId}-section-${sectionIndex}`,
				title: currentTitle,
				type: "text",
				content: currentContent.join("\n"),
				order: sectionIndex,
			});
			currentContent = [];
		}
	};

	for (const block of blocks) {
		const text = (block.children ?? []).map((child) => child.text ?? "").join(" ");
		const isHeading = block.style === "h2" || block.style === "h3";

		if (isHeading && text.trim()) {
			flush();
			currentTitle = text.trim();
		} else {
			currentContent.push(text);
		}
	}

	flush();
	return sections;
}

async function getLessonProgress(courseId: string, lessonId: string) {
	const academyClient = getAcademyClient();
	const onchainCourse = await academyClient.fetchCourse(courseId);
	const lessonCount = onchainCourse?.lessonCount ?? 1;
	const xpPerLesson = onchainCourse?.xpPerLesson ?? 0;
	const lessonIndex = Number.parseInt(lessonId.split("-").at(-1) ?? "1", 10) - 1;

	let completedLessons = 0;
	const wallet = await getLinkedWallet();
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
		xpEarned: completedLessons * xpPerLesson,
		xpRequired: lessonCount * xpPerLesson,
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
