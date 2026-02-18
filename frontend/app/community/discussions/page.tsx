import type { Metadata } from "next";
import Link from "next/link";
import {
	Search,
	MessageCircle,
	Eye,
	ThumbsUp,
	Pin,
	Filter,
	Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
	title: "Discussions | Community | Superteam Academy",
	description:
		"Join discussions about Solana development, share projects, ask questions, and connect with other builders.",
};

const CATEGORIES = [
	"all",
	"announcements",
	"technicalQA",
	"projectShowcase",
	"featureRequests",
	"studyGroups",
	"offTopic",
] as const;

const DISCUSSIONS = [
	{
		id: "1",
		title: "Best practices for PDA design in complex programs?",
		excerpt:
			"I'm building a multi-vault system and wondering about the best approach to PDA derivation when you have nested accounts that reference each other...",
		author: { name: "Alex Chen", initials: "AC" },
		category: "technicalQA",
		views: 1240,
		comments: 28,
		points: 45,
		tags: ["anchor", "pda", "architecture"],
		createdAt: "2h ago",
		pinned: false,
		solved: true,
	},
	{
		id: "2",
		title: "Season 3 Launch: ZK Compression Track — Everything you need to know",
		excerpt:
			"We're excited to announce the launch of our ZK Compression learning track. This track covers Light Protocol, compressed state, and building efficient dApps...",
		author: { name: "Team Academy", initials: "TA" },
		category: "announcements",
		views: 3420,
		comments: 42,
		points: 128,
		tags: ["announcement", "zk", "season-3"],
		createdAt: "1d ago",
		pinned: true,
		solved: false,
	},
	{
		id: "3",
		title: "How I built a DEX aggregator in 2 weeks — lessons learned",
		excerpt:
			"After completing the DeFi track, I decided to build a real DEX aggregator. Here's what I learned about routing algorithms, Jupiter integration, and CU optimization...",
		author: { name: "Maria Santos", initials: "MS" },
		category: "projectShowcase",
		views: 892,
		comments: 15,
		points: 67,
		tags: ["defi", "project", "tutorial"],
		createdAt: "3d ago",
		pinned: false,
		solved: false,
	},
	{
		id: "4",
		title: "Token-2022 transfer hooks: when to use them?",
		excerpt:
			"I'm confused about when transfer hooks are the right choice vs. just using a custom instruction. What are the tradeoffs in terms of CU cost and composability?",
		author: { name: "James Wilson", initials: "JW" },
		category: "technicalQA",
		views: 654,
		comments: 12,
		points: 23,
		tags: ["token-2022", "extensions"],
		createdAt: "4d ago",
		pinned: false,
		solved: true,
	},
	{
		id: "5",
		title: "Request: Interactive Solana Explorer in course labs",
		excerpt:
			"It would be amazing to have a built-in explorer panel in the lab environment so we can inspect accounts and transactions without leaving the page...",
		author: { name: "Priya Patel", initials: "PP" },
		category: "featureRequests",
		views: 321,
		comments: 8,
		points: 34,
		tags: ["feature-request", "labs"],
		createdAt: "5d ago",
		pinned: false,
		solved: false,
	},
	{
		id: "6",
		title: "Study group: Anchor Masterclass — Week 3 check-in",
		excerpt:
			"Hey everyone! How's week 3 going? Let's share our progress on the PDAs and CPIs section. I found the CPI signing examples really helpful...",
		author: { name: "Yuki Tanaka", initials: "YT" },
		category: "studyGroups",
		views: 189,
		comments: 22,
		points: 15,
		tags: ["study-group", "anchor", "week-3"],
		createdAt: "6d ago",
		pinned: false,
		solved: false,
	},
	{
		id: "7",
		title: "On-chain credential verification — my experience using the API",
		excerpt:
			"I integrated the credential verification API into my portfolio site. Here are some tips for displaying Metaplex Core NFT metadata correctly...",
		author: { name: "Carlos Rodriguez", initials: "CR" },
		category: "projectShowcase",
		views: 445,
		comments: 6,
		points: 29,
		tags: ["credentials", "metaplex", "api"],
		createdAt: "1w ago",
		pinned: false,
		solved: false,
	},
];

interface DiscussionsPageProps {
	searchParams: {
		q?: string;
		category?: string;
		tag?: string;
	};
}

export default async function DiscussionsPage({ searchParams }: DiscussionsPageProps) {
	const { q = "", category = "all", tag } = searchParams;
	const t = await getTranslations("community");

	const filtered = DISCUSSIONS.filter((d) => {
		if (category !== "all" && d.category !== category) return false;
		if (tag && !d.tags.includes(tag)) return false;
		if (q) {
			const query = q.toLowerCase();
			return (
				d.title.toLowerCase().includes(query) ||
				d.excerpt.toLowerCase().includes(query)
			);
		}
		return true;
	});

	const pinned = filtered.filter((d) => d.pinned);
	const regular = filtered.filter((d) => !d.pinned);

	return (
		<div className="space-y-6">
			{/* Toolbar */}
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("discussions.searchPlaceholder")}
							className="pl-9 h-9 bg-muted/50 border-border/60 rounded-lg"
							defaultValue={q}
						/>
					</div>
					<Select defaultValue={category}>
						<SelectTrigger className="h-9 w-40 text-sm bg-muted/50 border-border/60 rounded-lg">
							<Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CATEGORIES.map((c) => (
								<SelectItem key={c} value={c}>
									{t(`discussions.categories.${c}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button size="sm" className="gap-1.5">
					<Plus className="h-3.5 w-3.5" />
					{t("discussions.newDiscussion")}
				</Button>
			</div>

			{tag && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{t("discussions.filteredByTag")}:</span>
					<Badge variant="secondary" className="gap-1">
						{tag}
						<Link
							href="/community/discussions"
							className="ml-1 text-muted-foreground hover:text-foreground"
						>
							×
						</Link>
					</Badge>
				</div>
			)}

			{/* Tabs */}
			<Tabs defaultValue="recent" className="space-y-5">
				<TabsList className="bg-muted/50 p-1 rounded-xl">
					<TabsTrigger
						value="recent"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("discussions.tabs.recent")}
					</TabsTrigger>
					<TabsTrigger
						value="trending"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("discussions.tabs.trending")}
					</TabsTrigger>
					<TabsTrigger
						value="unanswered"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("discussions.tabs.unanswered")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="recent" className="space-y-3">
					{pinned.length > 0 && (
						<div className="space-y-2 mb-4">
							{pinned.map((d) => (
								<DiscussionRow key={d.id} discussion={d} t={t} />
							))}
						</div>
					)}
					{regular.map((d) => (
						<DiscussionRow key={d.id} discussion={d} t={t} />
					))}
				</TabsContent>

				<TabsContent value="trending" className="space-y-3">
					{[...filtered]
						.sort((a, b) => b.points - a.points)
						.map((d) => (
							<DiscussionRow key={d.id} discussion={d} t={t} />
						))}
				</TabsContent>

				<TabsContent value="unanswered" className="space-y-3">
					{filtered
						.filter((d) => !d.solved)
						.map((d) => (
							<DiscussionRow key={d.id} discussion={d} t={t} />
						))}
				</TabsContent>
			</Tabs>

			{filtered.length === 0 && (
				<div className="text-center py-16 space-y-3">
					<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
						<MessageCircle className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold">{t("discussions.empty")}</h3>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">
						{t("discussions.emptyDescription")}
					</p>
				</div>
			)}
		</div>
	);
}

function DiscussionRow({
	discussion: d,
	t,
}: {
	discussion: (typeof DISCUSSIONS)[number];
	t: Awaited<ReturnType<typeof getTranslations<"community">>>;
}) {
	return (
		<Link
			href={`/community/discussions/${d.id}`}
			className="block rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors"
		>
			<div className="flex items-start gap-4">
				<div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
					{d.author.initials}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1 flex-wrap">
						{d.pinned && (
							<Pin className="h-3 w-3 text-amber-500 shrink-0" />
						)}
						{d.solved && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0 border-green-500/40 text-green-600 dark:text-green-400"
							>
								{t("discussions.solved")}
							</Badge>
						)}
						<span className="text-xs text-primary font-medium">
							{t(`discussions.categories.${d.category}`)}
						</span>
					</div>
					<p className="text-sm font-semibold mb-1 line-clamp-1">{d.title}</p>
					<p className="text-xs text-muted-foreground line-clamp-1 mb-2">
						{d.excerpt}
					</p>
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-xs text-muted-foreground">
							{d.author.name}
						</span>
						<span className="text-xs text-muted-foreground">·</span>
						<span className="text-xs text-muted-foreground">
							{d.createdAt}
						</span>
						<span className="hidden sm:inline text-xs text-muted-foreground">·</span>
						<div className="hidden sm:flex items-center gap-2">
							{d.tags.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="text-[10px] font-normal px-1.5 py-0"
								>
									{tag}
								</Badge>
							))}
						</div>
					</div>
				</div>
				<div className="flex flex-col items-end gap-1.5 shrink-0 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Eye className="h-3 w-3" />
						{d.views.toLocaleString()}
					</span>
					<span className="flex items-center gap-1">
						<MessageCircle className="h-3 w-3" />
						{d.comments}
					</span>
					<span className="flex items-center gap-1">
						<ThumbsUp className="h-3 w-3" />
						{d.points}
					</span>
				</div>
			</div>
		</Link>
	);
}
