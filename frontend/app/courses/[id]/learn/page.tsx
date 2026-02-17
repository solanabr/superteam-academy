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

interface LessonPageProps {
	params: {
		id: string;
	};
	searchParams: {
		lesson?: string;
	};
}

export async function generateMetadata({
	params,
	searchParams,
}: LessonPageProps): Promise<Metadata> {
	// This would fetch course and lesson data from CMS/API
	const course = await getCourse(params.id);
	const lesson = await getLesson(searchParams.lesson || "1-1");

	return {
		title: `${lesson.title} | ${course.title} | Superteam Academy`,
		description: lesson.description,
	};
}

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<LessonSkeleton />}>
				<LessonContentWrapper
					courseId={params.id}
					lessonId={searchParams.lesson || "1-1"}
				/>
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
	const lesson = await getLesson(lessonId);
	const progress = await getLessonProgress(courseId, lessonId);

	return (
		<div className="flex flex-col lg:flex-row min-h-screen">
			<div className="flex-1 flex flex-col">
				<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Button variant="ghost" asChild={true} className="gap-2">
									<a href={`/courses/${courseId}`}>
										<ArrowLeft className="h-4 w-4" />
										Back to Course
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
								<TabsTrigger value="content">Content</TabsTrigger>
								<TabsTrigger value="notes">Notes</TabsTrigger>
								<TabsTrigger value="quiz">Quiz</TabsTrigger>
								<TabsTrigger value="resources">Resources</TabsTrigger>
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
							<CardTitle className="text-base">Quick Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button variant="outline" className="w-full justify-start gap-2">
								<BookOpen className="h-4 w-4" />
								Take Notes
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2">
								<CheckCircle className="h-4 w-4" />
								Mark as Complete
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2">
								<Maximize className="h-4 w-4" />
								Fullscreen
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

// Mock data - replace with actual API calls
async function getCourse(id: string) {
	return {
		id,
		title: "Introduction to Blockchain Technology",
		modules: [
			{
				id: "1",
				title: "Blockchain Basics",
				lessons: [
					{ id: "1-1", title: "What is Blockchain?", completed: true },
					{ id: "1-2", title: "How Blockchain Works", completed: true },
					{ id: "1-3", title: "Consensus Mechanisms", completed: false },
					{ id: "1-4", title: "Cryptographic Foundations", completed: false },
					{ id: "1-5", title: "Module Quiz", completed: false },
				],
			},
			{
				id: "2",
				title: "Smart Contracts",
				lessons: [
					{ id: "2-1", title: "Introduction to Smart Contracts", completed: false },
					{ id: "2-2", title: "Solidity Basics", completed: false },
				],
			},
		],
	};
}

async function getLesson(id: string) {
	return {
		id,
		title: "What is Blockchain?",
		description: "Learn the fundamental concepts of blockchain technology",
		duration: "15 min",
		videoUrl: "/videos/blockchain-intro.mp4",
		content: {
			sections: [
				{
					id: "s1",
					title: "Introduction",
					type: "text" as const,
					content:
						"Blockchain is a distributed ledger technology that maintains a continuously growing list of records, called blocks, which are linked and secured using cryptography.",
					order: 1,
				},
				{
					id: "s2",
					title: "Key Characteristics",
					type: "text" as const,
					content:
						"Decentralized - No central authority. Immutable - Records cannot be altered. Transparent - All transactions are visible. Secure - Cryptographic protection.",
					order: 2,
				},
				{
					id: "s3",
					title: "Block Structure Example",
					type: "code" as const,
					content: `// Simple blockchain block structure\nconst block = {\n  index: 1,\n  timestamp: Date.now(),\n  data: 'Hello Blockchain',\n  previousHash: '0000',\n  hash: calculateHash()\n}`,
					order: 3,
				},
			],
		},
		quiz: {
			id: "quiz-1",
			title: "Blockchain Basics Quiz",
			questions: [
				{
					id: "q1",
					question: "What is blockchain?",
					options: [
						"A type of cryptocurrency",
						"A distributed ledger technology",
						"A programming language",
						"A database system",
					],
					correctAnswer: 1,
				},
			],
			passingScore: 70,
		},
		resources: [
			{
				id: "r1",
				title: "Blockchain Whitepaper",
				description: "The original Bitcoin whitepaper by Satoshi Nakamoto",
				type: "document" as const,
				url: "/resources/blockchain-whitepaper.pdf",
			},
			{
				id: "r2",
				title: "Additional Reading",
				description: "Comprehensive blockchain overview on Wikipedia",
				type: "link" as const,
				url: "https://en.wikipedia.org/wiki/Blockchain",
			},
		],
	};
}

async function getLessonProgress(_courseId: string, _lessonId: string) {
	return {
		completedLessons: 5,
		totalLessons: 12,
		timeSpent: 45,
		xpEarned: 250,
		xpRequired: 500,
		achievements: [
			{
				id: "first-lesson",
				title: "First Steps",
				description: "Complete your first lesson",
				unlocked: true,
				icon: "book",
			},
		],
	};
}
