/**
 * @fileoverview ModuleList component for the course detail page.
 * Renders an accordion-style list of modules and their constituent lessons.
 */

"use client";

import {
	CaretDownIcon,
	CheckSquareIcon,
	CodeIcon,
	LockIcon,
	SquareIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import type { Module } from "@/lib/data/course-detail";
import { cn } from "@/lib/utils";

/**
 * Props for the ModuleList component.
 */
interface ModuleListProps {
	modules: Module[];
	/** Completion percentage */
	progress: number;
	courseSlug: string;
	enrolled: boolean;
}

/**
 * Renders the curriculum section of a course, grouping lessons into expandable modules.
 */
export function ModuleList({
	modules,
	progress,
	courseSlug,
	enrolled,
}: ModuleListProps) {
	const t = useTranslations("CourseDetail");
	const [expandedModules, setExpandedModules] = useState<string[]>(
		modules.length > 0 ? [modules[0].id] : [],
	);

	const toggleModule = (moduleId: string) => {
		setExpandedModules((prev) =>
			prev.includes(moduleId)
				? prev.filter((id) => id !== moduleId)
				: [...prev, moduleId],
		);
	};

	return (
		<div>
			{/* Curriculum Header */}
			<div className="flex justify-between items-end mb-4">
				<h3 className="uppercase font-bold tracking-widest">
					{t("curriculum.title")}
				</h3>
				<div className="text-right">
					<div className="text-[10px] uppercase tracking-widest text-ink-secondary">
						{t("curriculum.completion")}: {progress}%
					</div>
					<div className="h-1 bg-ink-secondary/10 w-[150px] relative mt-1">
						<div
							className="h-full bg-ink-primary relative"
							style={{ width: `${progress}%` }}
						>
							<div className="absolute right-0 -top-px h-[6px] w-px bg-ink-primary" />
						</div>
					</div>
				</div>
			</div>

			{/* Module List */}
			<div className="flex flex-col gap-2">
				{modules.map((module) => {
					const isExpanded = expandedModules.includes(module.id);
					const isLocked = !enrolled || module.lessons.every((l) => l.locked);

					return (
						<div
							key={module.id}
							className={cn(
								"border border-border bg-bg-surface p-4",
								isLocked && "opacity-60",
							)}
						>
							{/* Module Header */}
							<div
								className="flex justify-between items-center cursor-pointer"
								onClick={() => !isLocked && toggleModule(module.id)}
							>
								<span className="font-bold uppercase tracking-wide">
									{module.title}
								</span>
								{isLocked ? (
									<LockIcon size={16} className="text-ink-primary" />
								) : (
									<div className="flex items-center gap-4">
										{/* Module Progress Bar */}
										{!isLocked && module.total > 0 && (
											<div className="hidden sm:flex items-center gap-2">
												<div className="text-[10px] uppercase text-ink-secondary tracking-widest">
													{Math.round((module.completed / module.total) * 100)}%
												</div>
												<div className="h-1 bg-ink-secondary/10 w-[60px] relative">
													<div
														className="h-full bg-ink-primary relative transition-all"
														style={{
															width: `${(module.completed / module.total) * 100}%`,
														}}
													/>
												</div>
											</div>
										)}
										<CaretDownIcon
											size={16}
											className={cn(
												"text-ink-primary transition-transform",
												isExpanded && "rotate-180",
											)}
										/>
									</div>
								)}
							</div>

							{/* Lesson List */}
							{isExpanded && !isLocked && (
								<div className="mt-3">
									{module.lessons.map((lesson, index) => (
										<Link
											key={lesson.id}
											href={`/courses/${courseSlug}/lessons/${lesson.id}`}
											onClick={() => {
												posthog.capture("lesson_clicked", {
													courseSlug,
													lessonId: lesson.id,
													lessonTitle: lesson.title,
													lessonType: lesson.type,
												});
											}}
											className={cn(
												"flex items-center justify-between py-2 hover:bg-ink-secondary/5 transition-colors cursor-pointer",
												index < module.lessons.length - 1 &&
													"border-b border-dashed border-border",
											)}
										>
											<div className="flex items-center gap-3">
												{lesson.completed ? (
													<CheckSquareIcon
														size={14}
														weight="fill"
														className="text-ink-primary"
													/>
												) : (
													<SquareIcon size={14} className="text-ink-primary" />
												)}
												<span className="text-[13px]">{lesson.title}</span>
												{lesson.type === "challenge" && (
													<div className="flex items-center gap-2">
														<span className="flex items-center gap-1 bg-ink-primary/5 text-ink-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-ink-primary/10">
															<CodeIcon size={10} weight="bold" />
															{t("solveChallenge")}
														</span>
														{lesson.hints && lesson.hints.length > 0 && (
															<span className="text-[9px] text-ink-secondary uppercase tracking-widest font-bold">
																{lesson.hints.length} {t("hint")}
																{lesson.hints.length > 1 ? "s" : ""}
															</span>
														)}
													</div>
												)}
											</div>
											<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
												{lesson.duration}
											</span>
										</Link>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
