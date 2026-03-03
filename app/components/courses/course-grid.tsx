import type { Course } from "@/types/course";
import { CourseCard } from "./course-card";

interface CourseGridProps {
	courses: Course[];
}

export function CourseGrid({ courses }: CourseGridProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} />
			))}
		</div>
	);
}
