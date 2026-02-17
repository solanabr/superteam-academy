import type { Metadata } from "next";
import Link from "next/link";
import {
	Users,
	MessageSquare,
	Calendar,
	Trophy,
	ArrowRight,
	ExternalLink,
	BookOpen,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Community | Superteam Academy",
	description:
		"Join the Superteam Academy community. Connect with learners, attend events, and build together.",
};

const STATS = [
	{ label: "Learners", value: "12,000+", icon: Users },
	{ label: "Courses completed", value: "48,000+", icon: BookOpen },
	{ label: "XP earned", value: "2.4M", icon: Zap },
	{ label: "Countries", value: "85+", icon: Trophy },
];

const CHANNELS = [
	{
		name: "Discord",
		description: "Real-time discussions, help channels, and study groups.",
		members: "8,200+",
		href: "#",
		color: "bg-indigo-500/10 text-indigo-500",
	},
	{
		name: "Forum",
		description: "Long-form discussions, project showcases, and Q&A threads.",
		members: "3,400+",
		href: "#",
		color: "bg-[#008c4c]/10 text-[#008c4c]",
	},
	{
		name: "Twitter / X",
		description: "Updates, announcements, and community highlights.",
		members: "15,000+",
		href: "#",
		color: "bg-foreground/10 text-foreground",
	},
];

const UPCOMING_EVENTS = [
	{
		title: "Solana Program Security Workshop",
		date: "Jan 20, 2026",
		type: "Workshop",
		attendees: 156,
	},
	{
		title: "DeFi Protocol Design AMA",
		date: "Jan 25, 2026",
		type: "AMA",
		attendees: 89,
	},
	{
		title: "Weekend Hackathon: ZK Compression",
		date: "Feb 1-2, 2026",
		type: "Hackathon",
		attendees: 234,
	},
];

const TOP_CONTRIBUTORS = [
	{ name: "Alex Chen", xp: "24,500 XP", rank: 1, courses: 18 },
	{ name: "Maria Santos", xp: "22,100 XP", rank: 2, courses: 15 },
	{ name: "James Wilson", xp: "19,800 XP", rank: 3, courses: 14 },
	{ name: "Priya Patel", xp: "18,200 XP", rank: 4, courses: 13 },
	{ name: "Yuki Tanaka", xp: "17,500 XP", rank: 5, courses: 12 },
];

export default function CommunityPage() {
	return (
		<div className="mx-auto px-4 sm:px-6 py-12 space-y-16">
			<div className="text-center max-w-2xl mx-auto">
				<h1 className="text-4xl font-bold font-display mb-3">Community</h1>
				<p className="text-lg text-muted-foreground">
					Learn together, build together. Join thousands of developers mastering Solana
					through collaboration.
				</p>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{STATS.map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.label}
							className="rounded-2xl border border-border/60 bg-card p-5 text-center"
						>
							<Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
							<p className="text-2xl font-bold font-display">{stat.value}</p>
							<p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
						</div>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div>
					<h2 className="text-xl font-bold font-display mb-4">Join the conversation</h2>
					<div className="space-y-3">
						{CHANNELS.map((ch) => (
							<a
								key={ch.name}
								href={ch.href}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors"
							>
								<div
									className={`h-10 w-10 rounded-xl ${ch.color} flex items-center justify-center shrink-0`}
								>
									<MessageSquare className="h-5 w-5" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-sm font-semibold">{ch.name}</p>
										<ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
									<p className="text-xs text-muted-foreground mt-0.5">
										{ch.description}
									</p>
								</div>
								<span className="text-xs text-muted-foreground shrink-0">
									{ch.members}
								</span>
							</a>
						))}
					</div>
				</div>

				<div>
					<h2 className="text-xl font-bold font-display mb-4">Upcoming events</h2>
					<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
						<div className="divide-y divide-border/40">
							{UPCOMING_EVENTS.map((event) => (
								<div
									key={event.title}
									className="px-5 py-4 flex items-center gap-4"
								>
									<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
										<Calendar className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{event.title}
										</p>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="text-xs text-muted-foreground">
												{event.date}
											</span>
											<span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
												{event.type}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
										<Users className="h-3 w-3" />
										{event.attendees}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold font-display">Top contributors</h2>
					<Button variant="ghost" size="sm" asChild>
						<Link href="/leaderboard">
							Full leaderboard
							<ArrowRight className="h-3.5 w-3.5 ml-1.5" />
						</Link>
					</Button>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
					<div className="divide-y divide-border/40">
						{TOP_CONTRIBUTORS.map((user) => (
							<div key={user.rank} className="px-5 py-3.5 flex items-center gap-4">
								<span
									className={`text-sm font-bold w-6 text-center ${
										user.rank <= 3 ? "text-[#ffd23f]" : "text-muted-foreground"
									}`}
								>
									{user.rank}
								</span>
								<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
									{user.name
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium">{user.name}</p>
									<p className="text-xs text-muted-foreground">
										{user.courses} courses completed
									</p>
								</div>
								<div className="flex items-center gap-1 text-sm font-semibold text-[#ffd23f]">
									<Zap className="h-3.5 w-3.5" />
									{user.xp}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-linear-to-br from-[#2f6b3f] to-[#008c4c] p-8 sm:p-12 text-center text-white">
				<h2 className="text-2xl font-bold font-display mb-2">Ready to start learning?</h2>
				<p className="text-white/80 mb-6 max-w-md mx-auto">
					Join the community, earn XP, and build your on-chain credentials.
				</p>
				<div className="flex gap-3 justify-center">
					<Button size="sm" className="bg-white text-[#2f6b3f] hover:bg-white/90" asChild>
						<Link href="/courses">Browse courses</Link>
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="border-white/40 text-white hover:bg-white/10"
						asChild
					>
						<Link href="/leaderboard">View leaderboard</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
