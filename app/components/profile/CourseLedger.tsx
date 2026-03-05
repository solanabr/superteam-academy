/**
 * @fileoverview Component for displaying a list of courses and their completion progress.
 */
"use client";

import { Progress } from "@/components/ui/progress";
import { CourseProgress } from "@/lib/data/user";

interface CourseLedgerProps {
	courses: CourseProgress[];
}

export function CourseLedger({ courses }: CourseLedgerProps) {
	return (
		<div className="border border-border bg-bg-surface p-6">
			<span className="text-[10px] uppercase tracking-widest font-bold block mb-4">
				COURSE_LEDGER
			</span>

			<div className="flex flex-col gap-3">
				{courses.map((course) => (
					<div
						key={course.courseId}
						className="grid grid-cols-[100px_1fr_60px] items-center gap-4 pb-2 border-b border-dotted border-ink-secondary"
					>
						<span className="text-[10px] uppercase tracking-widest">
							{course.courseCode}
						</span>
						<Progress value={course.progress} />
						<span className="text-[10px] text-right">{course.progress}%</span>
					</div>
				))}
			</div>
		</div>
	);
}
