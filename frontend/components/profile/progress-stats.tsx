import { Clock, BookOpen, Target, Award, Flame, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressStatsProps {
	stats: {
		level: number;
		xp: number;
		totalXP: number;
		nextLevelXP: number;
		streak: {
			current: number;
			longest: number;
		};
		courses: {
			completed: number;
			enrolled: number;
			inProgress: number;
		};
		lessons: {
			completed: number;
			total: number;
		};
		challenges: {
			completed: number;
			total: number;
		};
		timeSpent: {
			today: number;
			thisWeek: number;
			total: number;
		};
	};
}

const STAT_ITEMS = [
	{ key: "streak", label: "Streak", Icon: Flame, color: "text-destructive bg-destructive/10" },
	{ key: "courses", label: "Courses", Icon: BookOpen, color: "text-green bg-green/10" },
	{ key: "lessons", label: "Lessons", Icon: Target, color: "text-primary bg-primary/10" },
	{ key: "challenges", label: "Challenges", Icon: Award, color: "text-gold bg-gold/10" },
] as const;

function formatTime(minutes: number) {
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function ProgressStats({ stats }: ProgressStatsProps) {
	const xpPct = Math.min(Math.round((stats.xp / stats.nextLevelXP) * 100), 100);

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-border/60 bg-card p-5">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<Zap className="h-4 w-4 text-gold" />
						<span className="text-sm font-medium">Level {stats.level}</span>
					</div>
					<span className="text-xs text-muted-foreground">
						{stats.xp.toLocaleString()} / {stats.nextLevelXP.toLocaleString()} XP
					</span>
				</div>
				<Progress value={xpPct} className="h-2" />
				<p className="text-xs text-muted-foreground mt-1.5">
					{(stats.nextLevelXP - stats.xp).toLocaleString()} XP to next level
				</p>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{STAT_ITEMS.map(({ key, label, Icon, color }) => {
					const value =
						key === "streak"
							? stats.streak.current
							: key === "courses"
								? stats.courses.completed
								: key === "lessons"
									? stats.lessons.completed
									: stats.challenges.completed;
					const sub =
						key === "streak"
							? `Best: ${stats.streak.longest}`
							: key === "courses"
								? `${stats.courses.inProgress} active`
								: key === "lessons"
									? `of ${stats.lessons.total}`
									: `of ${stats.challenges.total}`;

					return (
						<div key={key} className="rounded-xl border border-border/60 bg-card p-4">
							<div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
								<Icon className="h-4 w-4" />
							</div>
							<div className="text-xl font-bold">{value}</div>
							<div className="text-xs text-muted-foreground">{label}</div>
							<div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>
						</div>
					);
				})}
			</div>

			<div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
				<div className="flex items-center gap-2 mb-3">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">Time Spent</span>
				</div>
				<div className="grid grid-cols-3 gap-3">
					{[
						{ label: "Today", val: stats.timeSpent.today },
						{ label: "This week", val: stats.timeSpent.thisWeek },
						{ label: "All time", val: stats.timeSpent.total },
					].map((t) => (
						<div key={t.label} className="text-center">
							<div className="text-lg font-bold">{formatTime(t.val)}</div>
							<div className="text-[10px] text-muted-foreground">{t.label}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
