/**
 * @fileoverview LessonViewClient is the main container for the redesigned lesson experience.
 * It handles layout (split-pane for challenges), content rendering (markdown/Sanity),
 * navigation between lessons, and on-chain progress tracking.
 */
"use client";
import {
	CaretDownIcon,
	CaretRightIcon,
	CheckCircleIcon,
	CircleIcon,
	CodeIcon,
	TextColumnsIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { CodeEditor } from "@/components/lesson/CodeEditor";
import { markdownComponents } from "@/components/lesson/LessonContent";
import { LessonNavigation } from "@/components/lesson/LessonNavigation";
import { ModuleOverview } from "@/components/lesson/ModuleOverview";
import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Link } from "@/i18n/routing";
import { Lesson } from "@/lib/data/lesson";
import { useCourseDetails } from "@/lib/hooks/use-course";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { learningProgressService } from "@/lib/services/learning-progress";

/**
 * Main container for the lesson experience.
 * Manages layout, content, navigation, and progress tracking.
 */
interface LessonViewClientProps {
	slug: string;
	lessonId: string;
}
/**
 * Extended Lesson interface for flat navigation across modules.
 */
interface FlatLesson extends Omit<Lesson, "testCases"> {
	moduleId: string;
	moduleTitle: string;
	/** Global ordering across modules */
	moduleOrder: number;
	/** Index within the module */
	localIndex: number;
	hints?: string[];
	starterCode?: string;
	solutionCode?: string;
	testCases?: {
		name: string;
		description: string;
		status: "pass" | "fail" | "pending";
	}[];
}
/**
 * Orchestrates the lesson viewing experience.
 */
export function LessonViewClient({ slug, lessonId }: LessonViewClientProps) {
	const t = useTranslations("Lesson");
	const isMobile = useMediaQuery("(max-width: 1024px)");
	const wallet = useWallet();
	const queryClient = useQueryClient();
	const { data: course, isLoading, error } = useCourseDetails(slug);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [showEditor, setShowEditor] = useState(false);
	const [showHints, setShowHints] = useState(false);
	const [testResults, setTestResults] = useState<
		{ name: string; description: string; status: "pass" | "fail" | "pending" }[]
	>([]);
	const [lastLessonId, setLastLessonId] = useState(lessonId);
	const { flatLessons, cleanModules } = useMemo(() => {
		if (!course) return { flatLessons: [], cleanModules: [] };
		const flat: FlatLesson[] = [];
		const cleaned = course.modules.map((mod) => {
			// Deduplicate lessons by ID within each module
			const seenIds = new Set<string>();
			const uniqueLessons = mod.lessons.filter((l) => {
				if (seenIds.has(l.id)) return false;
				seenIds.add(l.id);
				return true;
			});
			uniqueLessons.forEach((les, idx) => {
				flat.push({
					id: les.id,
					title: les.title,
					duration: les.duration,
					type: les.type,
					completed: les.completed,
					locked: les.locked,
					content: les.content,
					moduleId: mod.id,
					moduleTitle: mod.title,
					moduleOrder: mod.number,
					moduleNumber: mod.number,
					number: `${mod.number}.${idx + 1}`,
					ref: les.id,
					localIndex: idx,
					hints: les.hints,
					starterCode: les.starterCode,
					solutionCode: les.solutionCode,
					testCases: les.testCases,
				});
			});
			return {
				...mod,
				lessons: uniqueLessons,
			};
		});
		return { flatLessons: flat, cleanModules: cleaned };
	}, [course]);
	const lessonIndex = useMemo(() => {
		if (!flatLessons.length) return -1;
		return flatLessons.findIndex((l) => l.id === lessonId);
	}, [flatLessons, lessonId]);
	const currentLesson = useMemo(() => {
		if (lessonIndex === -1) return null;
		return flatLessons[lessonIndex];
	}, [flatLessons, lessonIndex]);
	// Sync editor and test results when navigating
	if (lessonId !== lastLessonId) {
		setLastLessonId(lessonId);
		setShowHints(false);
		if (currentLesson?.type === "challenge") {
			setShowEditor(true);
			setTestResults(currentLesson.testCases || []);
		} else {
			setTestResults([]);
		}
	}
	// Initial load sync
	useEffect(() => {
		if (testResults.length === 0 && currentLesson?.testCases) {
			setTestResults(currentLesson.testCases);
		}
	}, [currentLesson, testResults.length]);
	// Sanity content processing
	const formattedContent = useMemo(() => {
		if (!currentLesson || !currentLesson.content) return null;
		let rawText = "";
		if (typeof currentLesson.content === "string") {
			rawText = currentLesson.content;
		} else if (Array.isArray(currentLesson.content)) {
			// Extract plain text from Portable Text blocks to parse as Markdown
			rawText = currentLesson.content
				.map((block: Record<string, unknown>) => {
					if (block._type === "block" && Array.isArray(block.children)) {
						return block.children
							.map((child: Record<string, unknown>) => child.text as string)
							.join("");
					}
					if (block._type === "code" && block.code) {
						// wrap Sanity code blocks back into markdown syntax
						return `\`\`\`${block.language || "text"}\n${block.code}\n\`\`\``;
					}
					if (block._type === "markdown" && block.markdown) {
						return block.markdown;
					}
					return "";
				})
				.filter(Boolean)
				.join("\n\n");
		}
		if (!rawText) return null;
		// Strip ALL leading H1/H2/H3 titles if present at the very beginning
		rawText = rawText.replace(/^(#+\s+[^\n]+(?:\n|$))+/, "");
		// Replace literal escaped newlines with actual newlines
		return rawText.replace(/\\n/g, "\n").trim();
	}, [currentLesson]);
	const contentHasTitle = useMemo(() => {
		if (!currentLesson || typeof formattedContent !== "string") return false;
		// Check if content starts with an H1 that looks like our lesson title
		const match = formattedContent.match(/^#\s+(.+)/);
		if (!match) return false;
		const h1Text = match[1].toLowerCase();
		return (
			h1Text.includes(currentLesson.title.toLowerCase()) ||
			currentLesson.title.toLowerCase().includes(h1Text)
		);
	}, [formattedContent, currentLesson]);
	if (isLoading) {
		return (
			<div className="min-h-screen bg-bg-base flex items-center justify-center">
				<div className="text-ink-secondary animate-pulse uppercase tracking-widest text-xs">
					{t("loadingProtocol")}
				</div>
			</div>
		);
	}
	if (error || !course || !currentLesson) {
		// If we finished loading but have no current lesson, it's a 404 condition
		if (!isLoading && !error && course && lessonIndex === -1) {
			notFound();
		}
		return (
			<div className="min-h-screen bg-bg-base flex items-center justify-center">
				<div className="text-red-500 uppercase tracking-widest text-xs">
					{t("errorNotFound")}
				</div>
			</div>
		);
	}
	const prevLessonId =
		lessonIndex > 0 ? flatLessons[lessonIndex - 1].id : undefined;
	const nextLessonId =
		lessonIndex < flatLessons.length - 1
			? flatLessons[lessonIndex + 1].id
			: undefined;
	const nextLessonType =
		lessonIndex < flatLessons.length - 1
			? flatLessons[lessonIndex + 1].type
			: undefined;
	// Challenge completion handler
	const handleChallengeComplete = async () => {
		if (!wallet.publicKey) {
			toast.error("Connect wallet to save challenge progress");
			return;
		}
		try {
			const res = await learningProgressService.completeLesson({
				courseSlug: slug,
				learnerAddress: wallet.publicKey.toBase58(),
				lessonIndex,
			});
			if (res.success) {
				posthog.capture("challenge_completed", {
					course_slug: slug,
					lesson_index: lessonIndex,
					lesson_title: currentLesson?.title,
					lesson_type: currentLesson?.type,
				});
				toast.success("Challenge points awarded on-chain!");
				queryClient.invalidateQueries({ queryKey: ["course", slug] });
			} else {
				throw new Error(res.error);
			}
		} catch (err) {
			posthog.captureException(err);
			console.error("Challenge completion failed:", err);
			toast.error("Failed to save challenge progress");
		}
	};
	return (
		<div className="min-h-screen bg-bg-base">
			<div
				className={`grid grid-cols-1 ${sidebarOpen ? "lg:grid-cols-[60px_280px_1fr]" : "lg:grid-cols-[60px_60px_1fr]"} lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full transition-all duration-300`}
			>
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>
				<NavRail />
				<div className="hidden lg:block h-full overflow-visible border-r border-ink-secondary/20 dark:border-border bg-bg-base transition-all duration-300">
					<ModuleOverview
						modules={cleanModules.map((m) => ({
							id: m.id,
							title: m.title,
							number: m.number,
							lessons: m.lessons.map((l, idx) => ({
								id: l.id,
								title: l.title,
								completed: l.completed,
								locked: l.locked,
								type: l.type,
								duration: l.duration,
								number: `${m.number}.${idx + 1}`,
								active: l.id === lessonId,
							})),
						}))}
						courseSlug={slug}
						activeLessonId={lessonId}
						collapsed={!sidebarOpen}
					/>
				</div>
				<main className="flex-1 overflow-visible lg:overflow-hidden relative h-auto lg:h-full">
					<ResizablePanelGroup
						orientation={isMobile ? "vertical" : "horizontal"}
						className="h-full w-full"
					>
						<ResizablePanel
							defaultSize={showEditor ? (isMobile ? 100 : 50) : 100}
							minSize={isMobile ? 0 : 30}
							className="flex flex-col h-full bg-bg-base relative"
						>
							<div className="flex-1 px-4 lg:px-12 py-8 overflow-y-auto">
								<nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ink-secondary select-none mb-6">
									<Link
										href="/dashboard"
										className="hover:text-ink-primary transition-colors"
									>
										Dashboard
									</Link>
									<CaretRightIcon size={10} className="text-ink-tertiary" />
									<Link
										href="/courses"
										className="hover:text-ink-primary transition-colors"
									>
										Courses
									</Link>
									<CaretRightIcon size={10} className="text-ink-tertiary" />
									<Link
										href={`/courses/${slug}`}
										className="hover:text-ink-primary transition-colors truncate max-w-[120px]"
										title={course.title}
									>
										{course.title}
									</Link>
									<CaretRightIcon size={10} className="text-ink-tertiary" />
									<span
										className="text-ink-primary font-bold truncate max-w-[150px]"
										title={currentLesson.title}
									>
										{currentLesson.title}
									</span>
								</nav>
								{/* Conditionally hide lesson title if it's already in the Markdown content as H1 */}
								{!contentHasTitle && (
									<div className="flex items-center justify-between mb-8">
										<h1 className="text-3xl font-display font-bold uppercase tracking-wider">
											{currentLesson.title}
										</h1>
										<Button
											variant="ghost"
											size="sm"
											className="text-ink-secondary hover:text-ink-primary font-bold uppercase text-[10px] tracking-widest gap-2"
											onClick={() => {
												posthog.capture("editor_toggle_clicked", {
													lessonId: currentLesson.id,
													newState: !showEditor ? "open" : "closed",
												});
												setShowEditor(!showEditor);
											}}
										>
											{showEditor ? (
												<>
													<TextColumnsIcon size={14} /> {t("viewContentOnly")}
												</>
											) : currentLesson.type === "challenge" ? (
												<>
													<CodeIcon size={14} /> {t("solveChallenge")}
												</>
											) : (
												<>
													<CodeIcon size={14} /> {t("openSandbox")}
												</>
											)}
										</Button>
									</div>
								)}
								<div className="prose prose-sm lg:prose-base max-w-none">
									{formattedContent ? (
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											components={markdownComponents}
										>
											{formattedContent}
										</ReactMarkdown>
									) : (
										<p>No content provided for this lesson.</p>
									)}
								</div>
								{/* Integrated Hints Section */}
								{currentLesson.hints && currentLesson.hints.length > 0 && (
									<div className="mt-10 border border-dashed border-ink-secondary/50 p-4 mb-8 bg-bg-surface/50">
										<button
											onClick={() => {
												if (!showHints) {
													posthog.capture("lesson_hint_opened", {
														lessonId,
														courseSlug: slug,
													});
												}
												setShowHints(!showHints);
											}}
											className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer w-full text-ink-primary"
										>
											<CaretDownIcon
												size={12}
												className={`transition-transform ${showHints ? "rotate-0" : "-rotate-90"}`}
											/>
											{t("needHint")}
										</button>
										{showHints && (
											<div className="mt-3 space-y-2">
												{currentLesson.hints.map((hint, index) => (
													<div
														key={index}
														className="flex flex-row items-baseline gap-2 text-[12px] text-ink-secondary leading-relaxed"
													>
														<span className="font-mono min-w-[12px]">
															{index + 1}.
														</span>
														<div className="flex-1">
															<ReactMarkdown
																components={{
																	p: ({ children }) => (
																		<span className="m-0">{children}</span>
																	),
																	code: ({ children }) => (
																		<span className="bg-ink-secondary/15 px-1 py-0.5 rounded text-[11px] font-mono text-ink-primary mx-0.5">
																			{children}
																		</span>
																	),
																}}
															>
																{hint}
															</ReactMarkdown>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								)}
								{/* Verification Section - Professional Design */}
								{testResults.length > 0 && (
									<div className="mt-10 pt-8 border-t border-border/40 dark:border-white/10">
										<span className="block text-[10px] uppercase font-bold tracking-[0.2em] mb-6 text-ink-secondary/60">
											{t("tests")}
										</span>
										<div className="space-y-4">
											{testResults.map((test, i) => (
												<div key={i} className="flex items-start gap-3 group">
													<div className="shrink-0 mt-0.5">
														{test.status === "pass" ? (
															<CheckCircleIcon
																size={18}
																weight="fill"
																className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
															/>
														) : test.status === "fail" ? (
															<XCircleIcon
																size={18}
																weight="fill"
																className="text-red-500"
															/>
														) : (
															<CircleIcon
																size={18}
																className="text-ink-tertiary/40"
															/>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="text-[12px] font-bold uppercase tracking-tight text-ink-primary dark:text-white mb-1 leading-none">
															{test.name}
														</div>
														<div className="text-[11px] text-ink-secondary italic leading-relaxed">
															{test.description}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
							<div className="px-4 lg:px-12 py-3 border-t border-ink-secondary/20 dark:border-border bg-bg-base/50 backdrop-blur-sm shrink-0">
								<LessonNavigation
									courseSlug={slug}
									lessonId={lessonId}
									prevLessonId={prevLessonId}
									nextLessonId={nextLessonId}
									nextLessonType={nextLessonType}
									lessonIndex={lessonIndex}
									isLastLesson={lessonIndex === flatLessons.length - 1}
									sidebarOpen={sidebarOpen}
									onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
								/>
							</div>
						</ResizablePanel>
						{showEditor && (
							<>
								<ResizableHandle
									withHandle
									className="bg-border hover:bg-ink-primary/20 transition-colors"
								/>
								<ResizablePanel
									defaultSize={50}
									minSize={20}
									className="flex flex-col h-[500px] lg:h-full bg-border overflow-hidden lg:pl-px"
								>
									<CodeEditor
										lessonId={currentLesson.id}
										courseId={slug}
										key={currentLesson.id}
										initialCode={
											currentLesson.type === "challenge"
												? currentLesson.starterCode || ""
												: `// Sandbox Environment\n\nconsole.log("Welcome to ${currentLesson.title}");`
										}
										solution={currentLesson.solutionCode || ""}
										testResults={testResults}
										onTestResultsChange={setTestResults}
										onComplete={
											currentLesson.type === "challenge"
												? handleChallengeComplete
												: undefined
										}
									/>
								</ResizablePanel>
							</>
						)}
					</ResizablePanelGroup>
				</main>
			</div>
		</div>
	);
}
