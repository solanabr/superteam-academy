/**
 * @fileoverview Sidebar component for quickly resuming the most recently accessed course.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import { LastAccessedCourse } from "@/lib/data/courses";

import { useCoursesDashboard } from "@/lib/hooks/use-courses";

interface LastAccessedProps {
	initialCourse: LastAccessedCourse | null;
}

/**
 * LastAccessed Component
 * Displays a summary of the last course the user was working on, with a resume button.
 */
export function LastAccessed({ initialCourse }: LastAccessedProps) {
	const t = useTranslations("Courses");
	const { data } = useCoursesDashboard({ lastAccessed: initialCourse });

	const course = data?.lastAccessed || initialCourse;

	if (!course) return null;

	return (
		<div className="border border-dashed border-border p-4 bg-bg-surface relative">
			{/* Crosshairs */}
			<div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px]">
				<div className="absolute bg-ink-secondary w-full h-px top-1/2" />
				<div className="absolute bg-ink-secondary h-full w-px left-1/2" />
			</div>
			<div className="absolute -bottom-[5px] -left-[5px] w-[10px] h-[10px]">
				<div className="absolute bg-ink-secondary w-full h-px top-1/2" />
				<div className="absolute bg-ink-secondary h-full w-px left-1/2" />
			</div>

			<div className="text-[10px] uppercase tracking-widest text-ink-secondary mb-2">
				{t("lastAccessed.title")}
			</div>
			<h4 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[28px]">
				{course.title}
			</h4>

			<div className="my-4">
				<div className="flex justify-between mb-2">
					<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
						PROGRESS
					</span>
					<span className="text-[10px] font-bold font-mono">
						{course.progress}%
					</span>
				</div>
				<Progress value={course.progress} className="h-1" />
			</div>

			<div className="flex flex-col gap-2 my-1">
				{course.lessons.map(
					(lesson: { title: string; completed: boolean }, index: number) => (
						<div key={index} className="flex gap-2 items-center">
							{lesson.completed ? (
								<CheckSquareIcon size={14} className="text-ink-secondary" />
							) : (
								<SquareIcon size={14} className="text-ink-secondary" />
							)}
							<span
								className={`text-[10px] uppercase tracking-widest ${lesson.completed ? "" : "font-bold"}`}
							>
								{lesson.title}
							</span>
						</div>
					),
				)}
			</div>

			<Button
				asChild
				className="w-full rounded-none uppercase text-[10px] font-bold px-3 py-2 h-auto tracking-widest mt-4 bg-ink-primary text-bg-base hover:bg-ink-primary/90"
			>
				<Link
					href={`/courses/${course.courseId}`}
					onClick={() => {
						posthog.capture("resume_course_clicked", {
							slug: course.courseId,
							title: course.title,
						});
						sendGAEvent("event", "select_content", {
							content_type: "resume_course",
							item_id: course.courseId,
						});
					}}
				>
					{t("lastAccessed.resume")}
				</Link>
			</Button>
		</div>
	);
}
