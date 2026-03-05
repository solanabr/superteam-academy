/**
 * @fileoverview ModuleOverview component for the lesson viewer sidebar.
 * Displays a collapsible list of course modules and their constituent lessons.
 */

"use client";

import {
	CaretDownIcon,
	CaretUpIcon,
	CheckCircleIcon,
	CircleIcon,
	LockIcon,
	RadioButtonIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import type { ModuleLesson } from "@/lib/data/lesson";
import { cn } from "@/lib/utils";

/**
 * Props for the ModuleOverview component.
 */
interface ModuleOverviewProps {
	modules: {
		id: string;
		title: string;
		number: number;
		lessons: ModuleLesson[];
	}[];
	courseSlug: string;
	/** Currently active lesson for highlighting */
	activeLessonId?: string;
	collapsed?: boolean;
}

/**
 * Course curriculum sidebar for the lesson view.
 */
export function ModuleOverview({
	modules,
	courseSlug,
	activeLessonId,
	collapsed = false,
}: ModuleOverviewProps) {
	// Initialize with the active module expanded
	const initialExpanded = useMemo(() => {
		const activeModule = modules.find((m) =>
			m.lessons.some((l) => l.id === activeLessonId),
		);
		return activeModule ? new Set([activeModule.id]) : new Set<string>();
	}, [activeLessonId, modules]);

	const [expandedModules, setExpandedModules] =
		useState<Set<string>>(initialExpanded);
	const [prevActiveLessonId, setPrevActiveLessonId] = useState(activeLessonId);

	// Synchronize when activeLessonId changes externally (e.g. navigation)
	// This uses the render-phase adjustment pattern to avoid cascading effects.
	if (activeLessonId !== prevActiveLessonId) {
		setPrevActiveLessonId(activeLessonId);
		const activeModule = modules.find((m) =>
			m.lessons.some((l) => l.id === activeLessonId),
		);
		if (activeModule && !expandedModules.has(activeModule.id)) {
			setExpandedModules(
				(prev) => new Set([...Array.from(prev), activeModule.id]),
			);
		}
	}

	const toggleModule = (moduleId: string) => {
		setExpandedModules((prev) => {
			const next = new Set(prev);
			if (next.has(moduleId)) {
				next.delete(moduleId);
			} else {
				next.add(moduleId);
			}
			return next;
		});
	};

	const getLessonIcon = (lesson: ModuleLesson) => {
		if (lesson.locked)
			return <LockIcon size={18} className="text-ink-secondary" />;
		if (lesson.completed)
			return (
				<CheckCircleIcon size={18} weight="fill" className="text-ink-primary" />
			);
		if (lesson.active)
			return (
				<RadioButtonIcon size={18} weight="fill" className="text-ink-primary" />
			);
		return <CircleIcon size={18} className="text-ink-secondary" />;
	};

	return (
		<aside
			className={cn(
				"border-r border-ink-secondary/20 dark:border-border flex flex-col bg-bg-surface overflow-y-auto transition-all duration-300 relative h-full",
				collapsed ? "w-[60px]" : "w-full",
			)}
		>
			<div className="flex flex-col">
				{modules.map((module) => {
					const isExpanded = expandedModules.has(module.id);
					return (
						<div key={module.id} className="flex flex-col">
							{/* Module Header (Clickable for Accordion) */}
							{!collapsed && (
								<button
									type="button"
									onClick={() => toggleModule(module.id)}
									className="group px-6 py-5 bg-ink-secondary/2 border-b border-ink-secondary/5 font-display flex items-center justify-between text-left hover:bg-ink-secondary/5 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<div className="text-[10px] uppercase tracking-widest text-ink-secondary mb-1 font-bold">
											Module {module.number.toString().padStart(2, "0")}
										</div>
										<div className="font-bold uppercase text-[14px] truncate text-ink-primary">
											{module.title}
										</div>
									</div>
									<div className="ml-4 shrink-0 text-ink-tertiary group-hover:text-ink-secondary">
										{isExpanded ? (
											<CaretUpIcon size={16} weight="bold" />
										) : (
											<CaretDownIcon size={16} weight="bold" />
										)}
									</div>
								</button>
							)}

							{/* Lesson List (Collapsible) */}
							<ul
								className={cn(
									"list-none flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out",
									isExpanded || collapsed
										? "max-h-[1000px] opacity-100"
										: "max-h-0 opacity-0",
								)}
							>
								{module.lessons.map((lesson, idx) => {
									const isActive = lesson.id === activeLessonId;
									return (
										<li
											key={`${module.id}-${lesson.id}-${idx}`}
											className="w-full"
										>
											<Link
												href={`/courses/${courseSlug}/lessons/${lesson.id}`}
												className={cn(
													"flex items-center gap-3 px-6 py-4 border-b border-ink-secondary/10 transition-colors w-full",
													isActive &&
														"bg-bg-base border-l-4 border-l-ink-primary pl-[20px]",
													collapsed && "justify-center px-0 border-l-0",
													lesson.completed && "text-ink-tertiary",
													!lesson.locked &&
														!isActive &&
														"hover:bg-ink-secondary/5",
													lesson.locked && "cursor-not-allowed opacity-60",
												)}
												title={collapsed ? lesson.title : undefined}
											>
												<div className="shrink-0">
													{getLessonIcon({ ...lesson, active: isActive })}
												</div>
												{!collapsed && (
													<div className="flex flex-1 items-center justify-between min-w-0 pr-2">
														<span className="text-[10px] uppercase tracking-widest truncate font-medium flex-1">
															<span className="text-ink-tertiary/60 mr-2 font-mono tabular-nums">
																{module.number}.{idx + 1}
															</span>
															<span className="text-ink-secondary">
																{lesson.title}
															</span>
														</span>
														{lesson.duration && lesson.duration !== "N/A" && (
															<span className="text-[9px] text-ink-tertiary uppercase tracking-widest shrink-0 ml-2">
																{lesson.duration}
															</span>
														)}
													</div>
												)}
											</Link>
										</li>
									);
								})}
							</ul>
						</div>
					);
				})}
			</div>
		</aside>
	);
}
