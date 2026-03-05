"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { TargetIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { RecommendedCourse } from "@/lib/data/user";

interface RecommendedCourseCardProps {
	course: RecommendedCourse;
}

export function RecommendedCourseCard({ course }: RecommendedCourseCardProps) {
	const t = useTranslations("Dashboard.recommendedTracks");

	return (
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
				<TargetIcon
					size={32}
					className="text-ink-secondary group-hover:text-ink-primary transition-colors relative z-10"
					weight="duotone"
				/>

				<div className="absolute bottom-2 left-2 text-[8px] uppercase tracking-widest text-ink-secondary">
					{course.code || "REF-00"}
				</div>
			</div>

			{/* Content Section */}
			<div className="p-5 flex flex-col justify-between">
				<div>
					<div className="text-[10px] uppercase tracking-widest text-ink-secondary mb-1">
						{"//"} {course.difficulty}
					</div>
					<h4 className="font-display text-xl leading-none group-hover:text-ink-primary/80 transition-colors">
						{course.title}
					</h4>
				</div>

				<Link
					href={`/courses/${course.id}`}
					className="w-full"
					onClick={() => {
						posthog.capture("dashboard_recommended_course_clicked", {
							courseId: course.id,
							courseTitle: course.title,
						});
						sendGAEvent("event", "select_content", {
							content_type: "dashboard_recommended",
							item_id: course.id,
						});
					}}
				>
					<Button
						variant="outline"
						className="rounded-none uppercase text-[10px] font-bold px-3 py-2 h-auto tracking-widest w-full hover:bg-ink-primary hover:text-white border-ink-secondary/30"
					>
						{t("initialize")}
					</Button>
				</Link>
			</div>
		</div>
	);
}
