import Link from "next/link";
import { Clock, Zap, Users, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
	course: {
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
	};
	variant?: "default" | "compact" | "featured";
}

const LEVEL_COLORS: Record<string, string> = {
	beginner: "bg-green/10 text-green border-green/20",
	intermediate: "bg-gold/10 text-gold border-gold/20",
	advanced: "bg-destructive/10 text-destructive border-destructive/20",
};

export function CourseCard({ course, variant = "default" }: CourseCardProps) {
	const isCompact = variant === "compact";
	const levelClass = LEVEL_COLORS[course.level] ?? "bg-muted text-muted-foreground";
	const gradient = course.gradient ?? "from-green to-forest";

	return (
		<Link
			href={`/courses/${course.id}`}
			className="group relative flex flex-col rounded-2xl bg-card border border-border/60 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
		>
			<div
				className={`relative ${isCompact ? "h-28" : "h-36"} bg-gradient-to-br ${gradient} overflow-hidden`}
			>
				<div className="absolute inset-0 bg-black/5" />
				{course.featured && (
					<Badge className="absolute top-3 left-3 bg-white/20 text-white backdrop-blur-sm border-0 text-xs">
						Featured
					</Badge>
				)}
				{course.enrolled && course.progress !== undefined && (
					<div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
						<Progress value={course.progress} className="h-1.5" />
						<span className="text-[10px] text-white/80 mt-0.5 block">
							{course.progress}%
						</span>
					</div>
				)}
				<div className="absolute bottom-3 left-3">
					<span
						className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm border ${levelClass}`}
					>
						{course.level.charAt(0).toUpperCase() + course.level.slice(1)}
					</span>
				</div>
			</div>

			<div className="flex-1 p-4 space-y-2">
				<h3
					className={`font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors ${isCompact ? "text-sm" : "text-base"}`}
				>
					{course.title}
				</h3>

				{!isCompact && (
					<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
						{course.description}
					</p>
				)}

				<div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
					<span className="flex items-center gap-1">
						<Clock className="h-3.5 w-3.5" />
						{course.duration}
					</span>
					<span className="flex items-center gap-1">
						<Zap className="h-3.5 w-3.5" />
						{course.xpReward} XP
					</span>
					{!isCompact && (
						<span className="flex items-center gap-1">
							<Users className="h-3.5 w-3.5" />
							{course.students.toLocaleString()}
						</span>
					)}
				</div>
			</div>

			<div className="px-4 pb-4 pt-0">
				<div className="flex items-center justify-between text-sm">
					<span className="text-xs text-muted-foreground">
						{course.price === 0 ? "Free" : `$${course.price}`}
					</span>
					<span className="font-medium text-primary text-xs group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
						{course.enrolled ? "Continue" : "Start course"}
						<ArrowRight className="h-3 w-3" />
					</span>
				</div>
			</div>
		</Link>
	);
}
