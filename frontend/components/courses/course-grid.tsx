import { CourseCard } from "./course-card";

interface Course {
	id: string;
	title: string;
	description: string;
	category: string;
	level: string;
	duration: string;
	students: number;
	instructor: string;
	image: string;
	tags: string[];
	xpReward: number;
	price: number;
	featured?: boolean;
	enrolled?: boolean;
	progress?: number;
	gradient?: string;
}

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
