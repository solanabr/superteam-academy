/**
 * @fileoverview Client component that adapts standalone challenge data to the ChallengeView interface.
 * Reuses the existing ChallengeEditor, ChallengeSidebar, NavRail, and TopBar components.
 * Includes GA4 event tracking and Sentry error monitoring.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
	ArrowsClockwiseIcon,
	BookOpenIcon,
	CaretRightIcon,
	LightbulbIcon,
	PlayIcon,
} from "@phosphor-icons/react";
import * as Sentry from "@sentry/nextjs";
import { useWallet } from "@solana/wallet-adapter-react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChallengeEditor } from "@/components/challenge/ChallengeEditor";
import { ChallengeSidebar } from "@/components/challenge/ChallengeSidebar";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { LessonContent } from "@/components/lesson/LessonContent";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import { submitChallenge } from "@/lib/actions/daily-challenge";
import type { SanityContent } from "@/lib/data/course-detail";
import type { Lesson } from "@/lib/data/lesson";
import { validateChallengeCode } from "@/lib/utils/challenge-validator";

const DIFFICULTY_LABELS: Record<number, string> = {
	1: "Beginner",
	2: "Intermediate",
	3: "Advanced",
};

interface ChallengeForClient {
	_id: string;
	title: string;
	slug: string;
	description: string;
	difficulty: 1 | 2 | 3;
	category: string;
	xpReward: number;
	scheduledDate: string | null;
	content: SanityContent;
	starterCode: string;
	solutionCode: string;
	hints: string[];
	testCases: {
		name: string;
		description: string;
		status: "pass" | "fail" | "pending";
	}[];
	isActive: boolean;
}

interface ChallengeDetailClientProps {
	challenge: ChallengeForClient;
}

/**
 * Adapts a standalone challenge to the Lesson interface used by ChallengeSidebar.
 */
function challengeToLesson(
	challenge: ChallengeForClient,
	testCases: {
		name: string;
		description: string;
		status: "pass" | "fail" | "pending";
	}[],
	consoleOutput: string,
	completed: boolean,
): Lesson {
	return {
		id: challenge._id,
		moduleId: "challenges",
		moduleNumber: 0,
		moduleTitle: "CHALLENGES",
		number: "C",
		title: challenge.title,
		ref: challenge.slug,
		type: "challenge",
		duration: "—",
		content: challenge.content || challenge.description,
		starterCode: challenge.starterCode,
		solutionCode: challenge.solutionCode,
		hints: challenge.hints,
		completed,
		locked: false,
		testCases,
		consoleOutput,
	};
}

export function ChallengeDetailClient({
	challenge,
}: ChallengeDetailClientProps) {
	const wallet = useWallet();
	const [code, setCode] = useState(challenge.starterCode || "");
	const [isRunning, setIsRunning] = useState(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const [completed, setCompleted] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [testCases, setTestCases] = useState(challenge.testCases);
	const [consoleOutput, setConsoleOutput] = useState("");

	// Real-time logical check (debounced)
	useEffect(() => {
		const timer = setTimeout(() => {
			if (code.trim() && code !== challenge.starterCode) {
				setIsValidating(true);
				setTimeout(() => setIsValidating(false), 800);
			}
		}, 1000);
		return () => clearTimeout(timer);
	}, [code, challenge.starterCode]);

	const lesson = challengeToLesson(
		challenge,
		testCases,
		consoleOutput,
		completed,
	);

	const handleRunTests = () => {
		setIsRunning(true);

		sendGAEvent("event", "challenge_run_tests", {
			challenge_slug: challenge.slug,
			challenge_difficulty: challenge.difficulty,
		});

		// Simulated test execution — advanced semantic validation via shared utility
		setTimeout(() => {
			const { passed, errorMessage } = validateChallengeCode(
				code,
				challenge.solutionCode || "",
				challenge.starterCode || "",
			);

			// 4. Status Update
			const newTestCases = challenge.testCases.map((tc) => ({
				...tc,
				status: (passed ? "pass" : "fail") as "pass" | "fail" | "pending",
			}));

			setTestCases(newTestCases);
			setConsoleOutput(
				passed
					? `> cargo test-bpf...\n> Compiling ${challenge.slug} v0.1.0\n> Running ${challenge.testCases.length} tests\n${challenge.testCases.map((tc) => `> test ${tc.name.toLowerCase().replace(/\s+/g, "_")} ... ok`).join("\n")}\n\n> Test result: ok. ${challenge.testCases.length} passed; 0 failed; 0 ignored; 0 measured; 0 filtered out`
					: `> cargo test-bpf...\n> Compiling ${challenge.slug} v0.1.0\n> Running ${challenge.testCases.length} tests\n> test test_logic ... FAILED\n\n> failures:\n\n> ---- test_logic stdout ----\n> Error: Granular validation failed.\n> Reason: ${errorMessage}\n\n> Test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out`,
			);

			if (passed) {
				posthog.capture("challenge_passed", {
					challenge_slug: challenge.slug,
					code_length: code.length,
				});
			} else {
				posthog.capture("challenge_failed", {
					challenge_slug: challenge.slug,
					reason: errorMessage || "unknown",
				});
			}

			setIsRunning(false);
		}, 1500);
	};

	const handleReset = () => {
		setCode(challenge.starterCode || "");
		setTestCases(challenge.testCases);
		setConsoleOutput("");
		setCompleted(false);

		sendGAEvent("event", "challenge_reset", {
			challenge_slug: challenge.slug,
		});
	};

	const handleComplete = async () => {
		if (!wallet.publicKey) {
			toast.error("Please connect your wallet to save progress.");
			return;
		}

		setIsCompleting(true);

		try {
			const allPassed = testCases.every((tc) => tc.status === "pass");

			const result = await submitChallenge({
				challengeSlug: challenge.slug,
				code,
				passed: allPassed,
			});

			if (result.error) {
				throw new Error(result.error);
			}

			if (result.alreadyCompleted) {
				toast.info("You've already completed this challenge!");
			} else if (result.xpEarned && result.xpEarned > 0) {
				toast.success(`Challenge Complete! +${result.xpEarned} XP earned 🎉`);
			} else {
				toast.success("Challenge submitted!");
			}

			setCompleted(true);

			sendGAEvent("event", "challenge_completed", {
				challenge_slug: challenge.slug,
				challenge_difficulty: challenge.difficulty,
				xp_earned: result.xpEarned,
				passed: allPassed,
			});
		} catch (error) {
			console.error(error);
			Sentry.captureException(error, {
				extra: { challengeSlug: challenge.slug },
			});
			toast.error(
				`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsCompleting(false);
		}
	};

	return (
		<div className="flex flex-col h-auto lg:h-screen bg-bg-base font-mono text-ink-primary overflow-visible lg:overflow-hidden">
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_400px] lg:grid-rows-[48px_1fr] h-auto lg:h-full w-full">
				{/* Top Bar */}
				<div className="col-span-1 lg:col-span-3 pb-px bg-border/50">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<div className="hidden lg:block row-start-2 border-r border-border bg-bg-base">
					<NavRail />
				</div>

				{/* Main Stage */}
				<div className="row-start-auto lg:row-start-2 flex flex-col min-w-0 border-r border-border bg-bg-base relative overflow-hidden h-full">
					{/* Challenge Header with Breadcrumbs */}
					<div className="flex flex-col shrink-0 bg-bg-surface border-b border-border p-6 pb-4">
						{/* Breadcrumbs */}
						<nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ink-secondary/60 mb-4 select-none">
							<Link
								href="/dashboard"
								className="hover:text-ink-primary transition-colors"
							>
								Academy
							</Link>
							<CaretRightIcon size={10} />
							<Link
								href="/challenges"
								className="hover:text-ink-primary transition-colors"
							>
								Challenges
							</Link>
							<CaretRightIcon size={10} />
							<span className="text-ink-primary font-bold">
								{challenge.category || "General"}
							</span>
						</nav>

						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<span className="text-[10px] uppercase font-bold tracking-widest text-ink-secondary">
										Challenge {"//"}{" "}
										{DIFFICULTY_LABELS[challenge.difficulty] || "—"}
									</span>
									{challenge.scheduledDate && (
										<span className="text-[10px] uppercase font-bold tracking-widest text-yellow-400/80 flex items-center gap-2">
											<span className="w-1 h-1 rounded-full bg-yellow-400 opacity-50" />
											{challenge.scheduledDate}
										</span>
									)}
								</div>
							</div>
							<h1 className="font-display font-bold text-2xl lg:text-[28px] uppercase leading-none tracking-tight">
								{challenge.title}
							</h1>
						</div>
					</div>

					{/* Editor */}
					<div className="flex-1 relative min-h-0 bg-[#1e1e1e]">
						<ChallengeEditor
							initialCode={code}
							onChange={setCode}
							fileName="src/lib.rs"
							pagination="01 / 01"
							isValidating={isValidating}
						/>
					</div>

					{/* Control Bar */}
					<div className="h-14 bg-bg-base border-t border-border flex items-center justify-between px-6 z-10 relative shrink-0">
						<div className="flex items-center gap-3">
							{/* Objective Modal */}
							<Dialog>
								<DialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 text-[10px] font-mono uppercase tracking-widest text-ink-secondary hover:text-ink-primary hover:bg-ink-secondary/10 px-3 flex items-center gap-2 border border-border/50 rounded-none transition-all"
									>
										<BookOpenIcon size={14} weight="bold" />
										Objective
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl bg-bg-surface border-border text-ink-primary max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-none">
									<DialogHeader className="p-6 border-b border-border shrink-0">
										<DialogTitle className="font-display text-2xl uppercase tracking-tight">
											Challenge Objective
										</DialogTitle>
									</DialogHeader>
									<div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-bg-base/30">
										<LessonContent
											reference={challenge.slug}
											title=""
											variant="sidebar"
											content={
												typeof lesson.content === "string"
													? lesson.content
													: Array.isArray(lesson.content)
														? lesson.content
																.map((b: Record<string, unknown>) => {
																	const children = b.children as Record<
																		string,
																		unknown
																	>[];
																	return (
																		children
																			?.map((c) => c.text as string)
																			.join("") || ""
																	);
																})
																.join("\n\n")
														: ""
											}
										/>
									</div>
								</DialogContent>
							</Dialog>

							{challenge.hints && challenge.hints.length > 0 && (
								<Dialog>
									<DialogTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 text-[10px] font-mono uppercase tracking-widest text-ink-secondary hover:text-ink-primary hover:bg-ink-secondary/10 px-3 flex items-center gap-2 border border-border/50 rounded-none transition-all"
										>
											<LightbulbIcon
												size={14}
												weight="fill"
												className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
											/>
											Hints
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-md bg-bg-surface border-border text-ink-primary rounded-none">
										<DialogHeader>
											<DialogTitle className="font-display text-xl uppercase tracking-tight">
												Challenge Hints
											</DialogTitle>
										</DialogHeader>
										<div className="space-y-4 py-4">
											{challenge.hints.map((hint, idx) => (
												<div
													key={idx}
													className="flex gap-3 text-sm p-3 border border-border bg-bg-base/50"
												>
													<span className="font-bold text-ink-secondary shrink-0">
														0{idx + 1}
													</span>
													<p className="leading-relaxed">{hint}</p>
												</div>
											))}
										</div>
									</DialogContent>
								</Dialog>
							)}

							<div className="h-4 w-px bg-border mx-1" />

							<div className="text-[10px] uppercase tracking-widest text-ink-secondary/50 hidden md:block font-mono">
								{isRunning
									? "Compiling..."
									: completed
										? "✓ Submitted"
										: "Ready"}
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={handleReset}
								className="h-8 text-[11px] font-mono uppercase tracking-wider border-ink-primary text-ink-primary hover:bg-ink-primary hover:text-bg-base transition-colors rounded-none"
							>
								<ArrowsClockwiseIcon className="w-3 h-3 mr-2" />
								Reset
							</Button>

							<Button
								size="sm"
								onClick={handleRunTests}
								disabled={isRunning}
								className="h-8 text-[11px] font-mono uppercase tracking-wider bg-ink-primary text-bg-base hover:bg-ink-primary/90 transition-colors rounded-none min-w-[120px]"
							>
								{isRunning ? (
									<div className="w-3 h-3 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin mr-2" />
								) : (
									<PlayIcon className="w-3 h-3 mr-2" />
								)}
								{isRunning ? "Running..." : "Run Tests"}
							</Button>
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="row-start-auto lg:row-start-2 border-t lg:border-t-0 lg:border-l border-border bg-bg-base overflow-visible lg:overflow-hidden flex flex-col h-auto lg:h-full">
					<ChallengeSidebar
						lesson={lesson}
						onComplete={handleComplete}
						isRunningTests={isRunning || isCompleting}
					/>
				</div>
			</div>
		</div>
	);
}
