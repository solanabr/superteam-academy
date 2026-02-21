import { Search, Trophy, Zap, BookOpen, Award, Flame, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslations } from "next-intl/server";
import {
	getAllMembers,
	getTopMembers,
	getMembersByBadge,
	isSanityConfigured,
	type MemberWithMeta,
} from "@/lib/community-cms";

export const metadata = {
	title: "Members | Community | Superteam Academy",
	description: "Discover top contributors and active members of the Superteam Academy community.",
};

// Normalized member shape (consistent between Sanity and mock data)
type NormalizedMember = {
	id: string;
	name: string;
	initials: string;
	title: string;
	xp: number;
	level: number;
	courses: number;
	streak: number;
	achievements: number;
	joinedAt: string;
	badges: string[];
};

// Helper functions
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function normalizeMember(member: MemberWithMeta | (typeof MEMBERS)[number]): NormalizedMember {
	// If already normalized (mock data), return as-is
	if ("initials" in member && "name" in member && typeof member.initials === "string") {
		return member as NormalizedMember;
	}

	// Normalize Sanity data
	const sanityMember = member as MemberWithMeta;
	return {
		id: sanityMember._id,
		name: sanityMember.user?.name || "Unknown",
		initials: getInitials(sanityMember.user?.name || "Unknown"),
		title: sanityMember.title || "Solana Developer",
		xp: sanityMember.user?.xpBalance || 0,
		level: Math.floor((sanityMember.user?.xpBalance || 0) / 1000),
		courses: sanityMember.user?.courseCount || 0,
		streak: sanityMember.streak || 0,
		achievements: sanityMember.achievementCount || 0,
		joinedAt: new Date(sanityMember.joinedAt || sanityMember._createdAt).toLocaleDateString(
			"en-US",
			{
				month: "short",
				year: "numeric",
			}
		),
		badges: sanityMember.badges || [],
	};
}

const MEMBERS = [
	{
		id: "1",
		name: "Alex Chen",
		initials: "AC",
		title: "Solana Core Developer",
		xp: 24_500,
		level: 28,
		courses: 18,
		streak: 45,
		achievements: 47,
		joinedAt: "Jun 2025",
		badges: ["top-contributor", "mentor"],
	},
	{
		id: "2",
		name: "Maria Santos",
		initials: "MS",
		title: "DeFi Protocol Engineer",
		xp: 22_100,
		level: 26,
		courses: 15,
		streak: 32,
		achievements: 43,
		joinedAt: "Jul 2025",
		badges: ["top-contributor"],
	},
	{
		id: "3",
		name: "James Wilson",
		initials: "JW",
		title: "Security Researcher",
		xp: 19_800,
		level: 24,
		courses: 14,
		streak: 28,
		achievements: 41,
		joinedAt: "Aug 2025",
		badges: ["mentor"],
	},
	{
		id: "4",
		name: "Priya Patel",
		initials: "PP",
		title: "Full-Stack Solana Dev",
		xp: 18_200,
		level: 22,
		courses: 13,
		streak: 21,
		achievements: 38,
		joinedAt: "Sep 2025",
		badges: [],
	},
	{
		id: "5",
		name: "Yuki Tanaka",
		initials: "YT",
		title: "NFT & Token Engineer",
		xp: 17_500,
		level: 21,
		courses: 12,
		streak: 18,
		achievements: 35,
		joinedAt: "Aug 2025",
		badges: [],
	},
	{
		id: "6",
		name: "Carlos Rodriguez",
		initials: "CR",
		title: "Anchor Developer",
		xp: 16_200,
		level: 20,
		courses: 11,
		streak: 15,
		achievements: 32,
		joinedAt: "Oct 2025",
		badges: ["rising-star"],
	},
	{
		id: "7",
		name: "Lisa Park",
		initials: "LP",
		title: "Frontend & Wallet UX",
		xp: 14_800,
		level: 19,
		courses: 10,
		streak: 22,
		achievements: 29,
		joinedAt: "Sep 2025",
		badges: [],
	},
	{
		id: "8",
		name: "Pedro Lima",
		initials: "PL",
		title: "ZK Researcher",
		xp: 13_500,
		level: 18,
		courses: 9,
		streak: 14,
		achievements: 26,
		joinedAt: "Nov 2025",
		badges: ["rising-star"],
	},
];

const BADGE_LABELS: Record<string, { icon: typeof Crown; color: string }> = {
	"top-contributor": {
		icon: Crown,
		color: "border-amber-500/40 text-amber-600 dark:text-amber-400",
	},
	mentor: {
		icon: Award,
		color: "border-blue-500/40 text-blue-600 dark:text-blue-400",
	},
	"rising-star": {
		icon: Flame,
		color: "border-pink-500/40 text-pink-600 dark:text-pink-400",
	},
};

export default async function MembersPage() {
	const t = await getTranslations("community");

	// Fetch members from Sanity or use mock data
	const allMembers = isSanityConfigured ? (await getAllMembers()).map(normalizeMember) : MEMBERS;
	const topMembers = isSanityConfigured
		? (await getTopMembers(5)).map(normalizeMember)
		: MEMBERS.slice(0, 5);
	const mentorMembers = isSanityConfigured
		? (await getMembersByBadge("mentor")).map(normalizeMember)
		: allMembers.filter((m) => m.badges.includes("mentor"));
	const risingStarMembers = isSanityConfigured
		? (await getMembersByBadge("rising-star")).map(normalizeMember)
		: allMembers.filter((m) => m.badges.includes("rising-star"));

	return (
		<div className="space-y-8">
			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-5 border-b border-border/40 flex items-center gap-2">
					<Trophy className="h-4 w-4 text-[#ffd23f]" />
					<h2 className="text-base font-semibold">{t("members.leadersThisMonth")}</h2>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
					{topMembers.map((user, i) => (
						<div key={user.id} className="p-5 text-center">
							<div className="relative inline-block mb-2">
								<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium mx-auto">
									{user.initials}
								</div>
								{i < 3 && (
									<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ffd23f] text-[10px] font-bold text-black flex items-center justify-center">
										{i + 1}
									</span>
								)}
							</div>
							<p className="text-sm font-medium truncate">{user.name}</p>
							<div className="flex items-center justify-center gap-1 text-xs font-semibold text-[#ffd23f] mt-1">
								<Zap className="h-3 w-3" />
								{user.xp.toLocaleString()} XP
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("members.searchPlaceholder")}
						className="pl-9 h-9 bg-muted/50 border-border/60 rounded-lg"
					/>
				</div>
			</div>

			<Tabs defaultValue="all" className="space-y-5">
				<TabsList className="bg-muted/50 p-1 rounded-xl">
					<TabsTrigger
						value="all"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("members.tabs.all")}
					</TabsTrigger>
					<TabsTrigger
						value="mentors"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("members.tabs.mentors")}
					</TabsTrigger>
					<TabsTrigger
						value="rising"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("members.tabs.risingStars")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-3">
					{allMembers.map((user, i) => (
						<MemberRow key={user.id} member={user} rank={i + 1} t={t} />
					))}
				</TabsContent>

				<TabsContent value="mentors" className="space-y-3">
					{mentorMembers.map((user, i) => (
						<MemberRow key={user.id} member={user} rank={i + 1} t={t} />
					))}
				</TabsContent>

				<TabsContent value="rising" className="space-y-3">
					{risingStarMembers.map((user, i) => (
						<MemberRow key={user.id} member={user} rank={i + 1} t={t} />
					))}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function MemberRow({
	member,
	rank,
	t,
}: {
	member: (typeof MEMBERS)[number];
	rank: number;
	t: Awaited<ReturnType<typeof getTranslations<"community">>>;
}) {
	return (
		<div className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4">
			<span
				className={`text-sm font-bold w-6 text-center shrink-0 ${
					rank <= 3 ? "text-[#ffd23f]" : "text-muted-foreground"
				}`}
			>
				{rank}
			</span>
			<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
				{member.initials}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<p className="text-sm font-semibold">{member.name}</p>
					{member.badges.map((badge) => {
						const config = BADGE_LABELS[badge];
						if (!config) return null;
						const Icon = config.icon;
						return (
							<Badge
								key={badge}
								variant="outline"
								className={`text-[10px] px-1.5 py-0 gap-0.5 ${config.color}`}
							>
								<Icon className="h-2.5 w-2.5" />
								{t(`members.badges.${badge}`)}
							</Badge>
						);
					})}
				</div>
				<p className="text-xs text-muted-foreground mt-0.5">{member.title}</p>
			</div>
			<div className="hidden sm:flex items-center gap-5 shrink-0 text-xs text-muted-foreground">
				<span className="flex items-center gap-1" title={t("members.stats.courses")}>
					<BookOpen className="h-3 w-3" />
					{member.courses}
				</span>
				<span className="flex items-center gap-1" title={t("members.stats.streak")}>
					<Flame className="h-3 w-3" />
					{member.streak}
				</span>
				<span className="flex items-center gap-1" title={t("members.stats.achievements")}>
					<Award className="h-3 w-3" />
					{member.achievements}
				</span>
			</div>
			<div className="flex items-center gap-1 text-sm font-semibold text-[#ffd23f] shrink-0">
				<Zap className="h-3.5 w-3.5" />
				{member.xp.toLocaleString()}
			</div>
		</div>
	);
}
