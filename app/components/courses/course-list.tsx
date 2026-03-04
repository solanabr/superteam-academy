import { Link } from "@superteam-academy/i18n/navigation";
import { Users, Clock, Zap, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CourseImage } from "@/components/courses/course-image";
import type { Course } from "@/types/course";
import { LEVEL_COLORS } from "@/types/course";

interface CourseListProps {
	courses: Course[];
}

export function CourseList({ courses }: CourseListProps) {
	const t = useTranslations("courses");

	return (
		<div className="space-y-3 animate-stagger">
			{courses.map((course) => {
				const levelClass = LEVEL_COLORS[course.level] ?? "bg-muted text-muted-foreground";
				const gradient = course.gradient ?? "from-green to-forest";

				return (
					<Link
						key={course.id}
						href={`/courses/${course.id}`}
						className="group flex gap-5 p-4 rounded-2xl bg-card border border-border/60 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300"
					>
						<div
							className={`relative w-28 h-20 shrink-0 rounded-xl bg-linear-to-br ${gradient} overflow-hidden`}
						>
							<CourseImage
								src={course.image}
								alt={course.title}
								fill={true}
								className="object-cover"
							/>
							{course.featured && (
								<Badge className="absolute top-1.5 left-1.5 bg-white/20 text-white backdrop-blur-sm border-0 text-[10px] px-1.5 py-0">
									Featured
								</Badge>
							)}
							{course.enrolled && course.progress !== undefined && (
								<div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1">
									<Progress value={course.progress} className="h-1" />
								</div>
							)}
						</div>

						<div className="flex-1 min-w-0 space-y-1.5">
							<div className="flex items-start justify-between gap-3">
								<h3 className="font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
									{course.title}
								</h3>
								<span
									className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap border ${levelClass}`}
								>
									{course.level.charAt(0).toUpperCase() + course.level.slice(1)}
								</span>
							</div>

							<p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
								{course.description}
							</p>

							<div className="flex items-center gap-4 text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<Clock className="h-3.5 w-3.5" />
									{course.duration}
								</span>
								<span className="flex items-center gap-1">
									<Zap className="h-3.5 w-3.5" />
									{course.xpReward} XP
								</span>
								<span className="flex items-center gap-1">
									<Users className="h-3.5 w-3.5" />
									{course.students.toLocaleString()}
								</span>
								<span className="text-muted-foreground/60">&middot;</span>
								<span>
									{course.price === 0 ? t("list.free") : `$${course.price}`}
								</span>
							</div>
						</div>

						<div className="hidden sm:flex items-center shrink-0">
							<span className="font-medium text-xs text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
								{course.enrolled ? t("list.continue") : t("list.start")}
								<ArrowRight className="h-3 w-3" />
							</span>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
