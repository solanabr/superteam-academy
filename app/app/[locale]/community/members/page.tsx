import { Search, Trophy, Zap, BookOpen, Award, Flame, Crown } from "lucide-react";
import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getTranslations } from "next-intl/server";
import { getAllUsers, type AcademyUser } from "@/lib/sanity-users";
import type { MemberWithMeta } from "@superteam-academy/cms";
import { getLocalizedPageMetadata } from "@/lib/metadata";
import { getAcademyClient } from "@/lib/academy";
import { LeaderboardService } from "@/services/leaderboard-service";
import { levelFromXP } from "@superteam-academy/gamification";
import { getGravatarUrl } from "@/lib/utils";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	return getLocalizedPageMetadata(locale, "communityMembers");
}

// Normalized member shape (consistent between Sanity and mock data)
type NormalizedMember = {
	id: string;
	name: string;
	image: string;
	title: string;
	wallet: string;
	xp: number;
	level: number;
	courses: number;
	streak: number;
	achievements: number;
	joinedAt: string;
	badges: string[];
};

function normalizeMember(
	member: MemberWithMeta | AcademyUser | NormalizedMember
): NormalizedMember {
	if ("image" in member && "name" in member && "wallet" in member) {
		return member as NormalizedMember;
	}

	if ("authId" in member) {
		const user = member as AcademyUser;
		return {
			id: user._id,
			name: user.name,
			image: user.image || getGravatarUrl(user.email || user.name),
			title:
				user.role === "superadmin"
					? "Super Admin"
					: user.role === "admin"
						? "Admin"
						: "Solana Developer",
			wallet: user.walletAddress ?? "",
			xp: user.xpBalance,
			level: Math.floor(user.xpBalance / 1000),
			courses: user.completedCourses?.length || 0,
			streak: 0, // Not available in AcademyUser
			achievements: 0, // Not available in AcademyUser
			joinedAt: user._createdAt
				? new Date(user._createdAt).toLocaleDateString("en-US", {
						month: "short",
						year: "numeric",
					})
				: "Unknown",
			badges: user.role === "superadmin" || user.role === "admin" ? ["top-contributor"] : [],
		};
	}

	const sanityMember = member as MemberWithMeta;
	const memberName = sanityMember.user?.name || "Unknown";
	return {
		id: sanityMember._id,
		name: memberName,
		image: sanityMember.user?.image || getGravatarUrl(memberName),
		title: sanityMember.title || "Solana Developer",
		wallet: "",
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

	let allMembers: NormalizedMember[] = [];
	let topMembers: NormalizedMember[] = [];
	let mentorMembers: NormalizedMember[] = [];
	let risingStarMembers: NormalizedMember[] = [];

	try {
		const sanityUsers = await getAllUsers();
		allMembers = sanityUsers.map(normalizeMember);

		// Fetch actual on-chain XP balances
		const academyClient = getAcademyClient();
		const config = await academyClient.fetchConfig();
		if (config) {
			const service = new LeaderboardService(
				academyClient.connection,
				academyClient.programId
			);
			const leaderboard = await service.getLeaderboard(config.xpMint, 200);
			const xpByWallet = new Map(leaderboard.map((e) => [e.publicKey, Number(e.xpBalance)]));

			for (const member of allMembers) {
				const onChainXp = member.wallet ? xpByWallet.get(member.wallet) : undefined;
				if (onChainXp !== undefined) {
					member.xp = onChainXp;
					member.level = levelFromXP(onChainXp);
				}
			}
		}

		topMembers = [...allMembers].sort((a, b) => b.xp - a.xp).slice(0, 5);
		mentorMembers = allMembers.filter((m) => m.badges.includes("mentor"));
		risingStarMembers = allMembers.filter((m) => m.badges.includes("rising-star"));
	} catch (error) {
		console.error("Failed to fetch members from Sanity:", error);
		allMembers = [];
		topMembers = [];
		mentorMembers = [];
		risingStarMembers = [];
	}

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
								<Avatar className="h-12 w-12 mx-auto">
									<AvatarImage src={user.image} alt={user.name} />
								</Avatar>
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
					{allMembers.length > 0 ? (
						allMembers.map((user, i) => (
							<MemberRow key={user.id} member={user} rank={i + 1} t={t} />
						))
					) : (
						<div className="text-center py-16 space-y-3">
							<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
								<Search className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold">{t("members.empty")}</h3>
							<p className="text-sm text-muted-foreground max-w-sm mx-auto">
								{t("members.emptyDescription")}
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value="mentors" className="space-y-3">
					{mentorMembers.length > 0 ? (
						mentorMembers.map((user, i) => (
							<MemberRow key={user.id} member={user} rank={i + 1} t={t} />
						))
					) : (
						<div className="text-center py-16 space-y-3">
							<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
								<Award className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold">{t("members.noMentors")}</h3>
							<p className="text-sm text-muted-foreground max-w-sm mx-auto">
								{t("members.noMentorsDescription")}
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value="rising" className="space-y-3">
					{risingStarMembers.length > 0 ? (
						risingStarMembers.map((user, i) => (
							<MemberRow key={user.id} member={user} rank={i + 1} t={t} />
						))
					) : (
						<div className="text-center py-16 space-y-3">
							<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
								<Flame className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold">{t("members.noRisingStars")}</h3>
							<p className="text-sm text-muted-foreground max-w-sm mx-auto">
								{t("members.noRisingStarsDescription")}
							</p>
						</div>
					)}
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
	member: NormalizedMember;
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
			<Avatar className="h-10 w-10 shrink-0">
				<AvatarImage src={member.image} alt={member.name} />
			</Avatar>
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
