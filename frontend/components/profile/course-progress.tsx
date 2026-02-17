"use client";

import { BookOpen, Clock, CheckCircle, Play, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Course {
	id: string;
	title: string;
	description: string;
	thumbnail?: string;
	instructor: {
		name: string;
		avatar?: string;
	};
	progress: {
		completedLessons: number;
		totalLessons: number;
		completedChallenges: number;
		totalChallenges: number;
		timeSpent: number;
		lastAccessed?: string;
	};
	status: "not_started" | "in_progress" | "completed";
	enrollmentDate: string;
	completionDate?: string;
	certificateEarned?: boolean;
	rating?: number;
}

interface CourseProgressProps {
	courses: Course[];
}

const GRADIENTS = [
	"from-green/80 to-forest/80",
	"from-gold/80 to-amber-600/80",
	"from-primary/80 to-green/80",
];

export function CourseProgress({ courses }: CourseProgressProps) {
	const formatTime = (minutes: number) => {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	};

	const inProgress = courses.filter((c) => c.status === "in_progress");
	const completed = courses.filter((c) => c.status === "completed");
	const notStarted = courses.filter((c) => c.status === "not_started");

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
				<h3 className="font-semibold flex items-center gap-2">
					<BookOpen className="h-4 w-4 text-primary" />
					My Courses
				</h3>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span>{completed.length} completed</span>
					<span>{inProgress.length} in progress</span>
					<span>{notStarted.length} not started</span>
				</div>
			</div>

			<div className="divide-y divide-border/40">
				{inProgress.map((course, i) => {
					const pct = Math.round(
						(course.progress.completedLessons / course.progress.totalLessons) * 100
					);
					return (
						<Link
							key={course.id}
							href={`/courses/${course.id}`}
							className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
						>
							<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center shrink-0`}>
								<Play className="h-5 w-5 text-white" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-sm font-medium truncate">{course.title}</span>
									<span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
										{pct}%
									</span>
								</div>
								<Progress value={pct} className="h-1.5 mb-1" />
								<div className="flex items-center gap-3 text-[11px] text-muted-foreground">
									<span>{course.progress.completedLessons}/{course.progress.totalLessons} lessons</span>
									<span className="inline-flex items-center gap-0.5">
										<Clock className="h-3 w-3" />
										{formatTime(course.progress.timeSpent)}
									</span>
									<span>by {course.instructor.name}</span>
								</div>
							</div>
							<ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
						</Link>
					);
				})}

				{completed.map((course, i) => (
					<Link
						key={course.id}
						href={`/courses/${course.id}`}
						className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
					>
						<div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
							<CheckCircle className="h-5 w-5 text-green" />
						</div>
						<div className="flex-1 min-w-0">
							<span className="text-sm font-medium truncate block">{course.title}</span>
							<div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
								<span className="inline-flex items-center gap-0.5">
									<Clock className="h-3 w-3" />
									{formatTime(course.progress.timeSpent)}
								</span>
								{course.completionDate && (
									<span>
										Completed {new Date(course.completionDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
									</span>
								)}
								{course.certificateEarned && (
									<span className="text-gold font-medium">Credential earned</span>
								)}
							</div>
						</div>
						<ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
					</Link>
				))}

				{notStarted.map((course) => (
					<Link
						key={course.id}
						href={`/courses/${course.id}`}
						className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group opacity-60 hover:opacity-100"
					>
						<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
							<BookOpen className="h-5 w-5 text-muted-foreground" />
						</div>
						<div className="flex-1 min-w-0">
							<span className="text-sm font-medium truncate block">{course.title}</span>
							<div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
								<span>{course.progress.totalLessons} lessons</span>
								<span>by {course.instructor.name}</span>
							</div>
						</div>
						<Button variant="outline" size="sm" className="h-7 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
							Start
						</Button>
					</Link>
				))}
			</div>

			{courses.length === 0 && (
				<div className="px-5 py-10 text-center text-muted-foreground">
					<BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
					<p className="text-sm">No courses enrolled yet</p>
					<Button asChild variant="outline" size="sm" className="mt-3">
						<Link href="/courses">Browse courses</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
