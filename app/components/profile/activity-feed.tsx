import { formatDistanceToNow } from "date-fns";
import { Trophy, BookOpen, Target, Flame, CheckCircle, Play, Zap, ArrowUp } from "lucide-react";

interface Activity {
	id: string;
	type:
		| "achievement"
		| "course_completed"
		| "lesson_completed"
		| "challenge_completed"
		| "streak"
		| "level_up"
		| "enrollment";
	title: string;
	description: string;
	timestamp: string;
	xpGained?: number;
	metadata?: {
		courseName?: string;
		lessonName?: string;
		challengeName?: string;
		achievementName?: string;
		level?: number;
		streakDays?: number;
	};
}

interface ActivityFeedProps {
	activities: Activity[];
}

const ACTIVITY_CONFIG: Record<Activity["type"], { Icon: typeof Trophy; color: string }> = {
	achievement: { Icon: Trophy, color: "text-gold bg-gold/10" },
	course_completed: { Icon: BookOpen, color: "text-green bg-green/10" },
	lesson_completed: { Icon: CheckCircle, color: "text-primary bg-primary/10" },
	challenge_completed: { Icon: Target, color: "text-forest bg-forest/10" },
	streak: { Icon: Flame, color: "text-destructive bg-destructive/10" },
	level_up: { Icon: ArrowUp, color: "text-gold bg-gold/10" },
	enrollment: { Icon: Play, color: "text-muted-foreground bg-muted" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
	if (activities.length === 0) {
		return (
			<div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
				<BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
				<p className="text-sm text-muted-foreground">No activity yet. Start learning!</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-5 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">Recent Activity</h3>
			</div>

			<div className="divide-y divide-border/30 max-h-80 overflow-y-auto">
				{activities.map((activity) => {
					const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.enrollment;
					const { Icon, color } = config;
					const metaTag =
						activity.metadata?.courseName ??
						activity.metadata?.lessonName ??
						activity.metadata?.challengeName ??
						activity.metadata?.achievementName;

					return (
						<div
							key={activity.id}
							className="px-5 py-3.5 flex gap-3 hover:bg-muted/20 transition-colors"
						>
							<div
								className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}
							>
								<Icon className="h-4 w-4" />
							</div>

							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{activity.title}</p>
								<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
									{activity.description}
								</p>
								{metaTag && (
									<span className="inline-block mt-1.5 text-[10px] font-medium bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md">
										{metaTag}
									</span>
								)}
							</div>

							<div className="shrink-0 text-right space-y-1">
								{activity.xpGained ? (
									<span className="text-xs font-semibold text-green flex items-center gap-0.5 justify-end">
										<Zap className="h-3 w-3" />+{activity.xpGained}
									</span>
								) : null}
								<span className="text-[10px] text-muted-foreground block">
									{formatDistanceToNow(new Date(activity.timestamp), {
										addSuffix: true,
									})}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
