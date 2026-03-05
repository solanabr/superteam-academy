/**
 * @fileoverview CourseCard component for the dashboard.
 * Displays a single course's progress, title, and "Next Lesson" quick-link.
 */

"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { CodeIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import { CourseProgress } from "@/lib/data/user";

interface CourseCardProps {
	course: CourseProgress;
}

export function CourseCard({ course }: CourseCardProps) {
	const t = useTranslations("Dashboard.activeCourses");

	return (
		<Link
			href={`/courses/${course.courseId}`}
			onClick={() => {
				posthog.capture("dashboard_course_clicked", {
					courseId: course.courseId,
					courseTitle: course.courseTitle,
					progress: course.progress,
				});
				sendGAEvent("event", "select_content", {
					content_type: "dashboard_course",
					item_id: course.courseId,
				});
			}}
		>
			<div className="card border border-border relative bg-bg-surface transition-all duration-200 hover:border-ink-primary hover:shadow-[4px_4px_0_rgba(13,20,18,0.1)] dark:hover:shadow-[4px_4px_0_rgba(255,255,255,0.1)] hover:bg-ink-primary/5 hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer grid grid-cols-[100px_1fr] min-h-[160px] rounded-none group overflow-hidden">
				{/* Corner brackets */}
				<div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-ink-primary z-10"></div>
				<div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-ink-primary z-10"></div>

				{/* Visual Section */}
				<div className="border-r border-ink-secondary/20 relative flex items-center justify-center bg-ink-secondary/5">
					<div
						className="absolute inset-0 opacity-20"
						style={{
							backgroundImage:
								"linear-gradient(45deg, var(--ink-secondary) 1px, transparent 1px)",
							backgroundSize: "10px 10px",
						}}
					></div>
					<CodeIcon
						size={32}
						className="text-ink-primary relative z-10"
						weight="duotone"
					/>

					<div className="absolute bottom-2 left-2 text-[8px] uppercase tracking-widest text-ink-secondary">
						{course.courseCode}
					</div>
				</div>

				{/* Content Section */}
				<div className="p-5 flex flex-col justify-between overflow-hidden">
					<div>
						<div className="flex justify-between items-start mb-2">
							<div className="text-[10px] uppercase tracking-widest text-ink-secondary">
								{"//"} {t("lesson")}{" "}
								{course.currentLesson
									? course.progress > 0
										? course.progress === 100
											? t("completed")
											: course.currentLesson.id.split("-").pop()
										: "1"
									: "1"}
							</div>
						</div>

						<h3 className="font-display text-xl leading-none mb-4 group-hover:text-ink-primary/80 transition-colors truncate">
							{course.courseTitle}
						</h3>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between text-[10px] mb-1">
							<span className="uppercase tracking-widest font-bold">
								{t("progress")}
							</span>
							<span className="font-mono">{course.progress}%</span>
						</div>

						<Progress value={course.progress} className="h-2" />

						{course.currentLesson && course.progress < 100 && (
							<div className="pt-3 mt-1">
								<span className="text-[10px] uppercase tracking-widest text-ink-primary block truncate font-bold">
									{t("resume")}: {course.currentLesson.title} →
								</span>
							</div>
						)}
						{course.progress === 100 && (
							<div className="pt-3 mt-1">
								<span className="text-[10px] uppercase tracking-widest text-ink-primary block truncate font-bold">
									{t("review")} →
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
