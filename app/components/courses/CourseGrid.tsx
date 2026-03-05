/**
 * @fileoverview Responsive grid layout for displaying course cards.
 */
"use client";

import { useTranslations } from "next-intl";
import { Course } from "@/lib/data/courses";
import { CourseCard } from "./CourseCard";

interface CourseGridProps {
	courses: Course[];
}

/**
 * CourseGrid Component
 * Displays a list of courses in a responsive grid.
 */
export function CourseGrid({ courses }: CourseGridProps) {
	const t = useTranslations("Courses");

	return (
		<div>
			<div className="flex justify-between items-end mb-6">
				<h3 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[24px] sm:text-[32px]">
					{t("individualCourses.title")}
				</h3>
				<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
					{t("individualCourses.sort")}
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{courses.map((course) => (
					<CourseCard key={course.id || course._id} course={course} />
				))}
			</div>
		</div>
	);
}
