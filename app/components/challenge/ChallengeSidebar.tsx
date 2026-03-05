/**
 * @fileoverview Sidebar component for challenges, displaying objectives,
 * test cases, and terminal output.
 */

"use client";

import {
	CheckCircleIcon,
	CircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { Lesson } from "@/lib/data/lesson";

/**
 * Props for the ChallengeSidebar component.
 */
interface ChallengeSidebarProps {
	lesson: Lesson;
	onComplete: () => void;
	isRunningTests: boolean;
	isLastLesson?: boolean;
}

/**
 * Instructional and feedback sidebar for challenges.
 */
export function ChallengeSidebar({
	lesson,
	onComplete,
	isRunningTests,
	isLastLesson,
}: ChallengeSidebarProps) {
	return (
		<aside className="w-full flex flex-col h-full bg-bg-base overflow-hidden">
			{/* Test Cases Section */}
			<div className="flex-1 p-6 border-b border-border bg-ink-primary/2 overflow-y-auto custom-scrollbar">
				<span className="block text-[10px] uppercase font-bold tracking-[0.2em] mb-6 text-ink-secondary/60">
					Test Cases
				</span>
				<div className="space-y-2.5">
					{lesson.testCases?.map((test, i) => (
						<div
							key={i}
							className="flex items-start gap-2.5 group transition-all"
						>
							{/* Status Icon */}
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
									<CircleIcon size={18} className="text-ink-tertiary/40" />
								)}
							</div>

							<div className="flex-1 min-w-0">
								<div className="text-[12px] font-bold uppercase tracking-tight text-ink-primary mb-1">
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

			{/* Output Panel & Actions */}
			<div className="flex flex-col bg-ink-primary text-bg-base h-[40%] border-t border-bg-base/10 shadow-2xl">
				<div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto custom-scrollbar bg-black/20">
					<div className="flex items-center justify-between mb-4 border-b border-bg-base/5 pb-2">
						<span className="block text-[10px] uppercase font-bold tracking-widest text-bg-base/40">
							Terminal Output
						</span>
						<div className="flex gap-1.5">
							<div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
							<div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30" />
							<div className="w-1.5 h-1.5 rounded-full bg-green-500/30" />
						</div>
					</div>
					<pre className="whitespace-pre-wrap leading-relaxed text-bg-base/80 font-mono italic">
						{lesson.consoleOutput ||
							"> Device initialized. Waiting for test execution..."}
					</pre>
				</div>

				<div className="p-0">
					<button
						onClick={onComplete}
						disabled={isRunningTests}
						className={`w-full h-14 text-white text-[12px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
							lesson.testCases?.every((tc) => tc.status === "pass")
								? "bg-green-600 hover:bg-green-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
								: "bg-ink-secondary hover:bg-ink-secondary/90"
						}`}
					>
						{isRunningTests ? (
							<span className="animate-pulse">Processing...</span>
						) : (
							<>
								<CheckCircleIcon size={16} weight="bold" />
								{lesson.testCases?.every((tc) => tc.status === "pass")
									? isLastLesson
										? "Finish Course"
										: "Finish Challenge"
									: "Submit Challenge"}
							</>
						)}
					</button>
				</div>
			</div>
		</aside>
	);
}
