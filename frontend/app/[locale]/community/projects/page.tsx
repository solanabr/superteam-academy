import { Search, ExternalLink, Github, Star, Users, Zap, Plus, Globe } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
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
import { getTranslations } from "next-intl/server";
import {
	getAllProjects,
	getProjectsByCategory,
	isSanityConfigured,
	type ProjectWithMeta,
} from "@/lib/community-cms";
import type { ProjectCategory } from "@superteam/cms";

const CATEGORIES = ["all", "defi", "nft", "tooling", "gaming", "social", "infra"] as const;

// Normalized project shape (consistent between Sanity and mock data)
type NormalizedProject = {
	id: string;
	title: string;
	description: string;
	author: { name: string; initials: string };
	category: string;
	stars: number;
	contributors: number;
	xpReward: number;
	tags: string[];
	githubUrl?: string;
	liveUrl?: string;
	featured: boolean;
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

function normalizeProject(project: ProjectWithMeta | (typeof PROJECTS)[number]): NormalizedProject {
	// If already normalized (mock data with initials in author), return as-is
	if ("author" in project && typeof project.author === "object" && "initials" in project.author) {
		return project as NormalizedProject;
	}

	// Normalize Sanity data (has _id, author object without initials)
	const sanityProject = project as ProjectWithMeta;
	return {
		id: sanityProject._id,
		title: sanityProject.title,
		description: sanityProject.description,
		author: {
			name: sanityProject.author?.name || "Unknown",
			initials: getInitials(sanityProject.author?.name || "Unknown"),
		},
		category: sanityProject.category,
		stars: sanityProject.stars || 0,
		contributors: sanityProject.contributors || 1,
		xpReward: sanityProject.xpReward || 0,
		tags: sanityProject.tags || [],
		...(sanityProject.githubUrl && { githubUrl: sanityProject.githubUrl }),
		...(sanityProject.liveUrl && { liveUrl: sanityProject.liveUrl }),
		featured: sanityProject.featured || false,
	};
}

const PROJECTS = [
	{
		id: "1",
		title: "SolSwap Aggregator",
		description:
			"A DEX aggregator that finds the best swap routes across Jupiter, Raydium, and Orca. Built during the DeFi track.",
		author: { name: "Maria Santos", initials: "MS" },
		category: "defi",
		stars: 67,
		contributors: 3,
		xpReward: 2000,
		tags: ["defi", "dex", "jupiter"],
		githubUrl: "#",
		liveUrl: "#",
		featured: true,
	},
	{
		id: "2",
		title: "NFT Launchpad Kit",
		description:
			"Open-source toolkit for launching Metaplex Core NFT collections with configurable minting phases, allowlists, and reveal mechanics.",
		author: { name: "Alex Chen", initials: "AC" },
		category: "nft",
		stars: 89,
		contributors: 5,
		xpReward: 1500,
		tags: ["nft", "metaplex", "launchpad"],
		githubUrl: "#",
		liveUrl: null,
		featured: true,
	},
	{
		id: "3",
		title: "Anchor Test Generator",
		description:
			"CLI tool that reads your Anchor IDL and auto-generates TypeScript test boilerplate with proper account setup and assertions.",
		author: { name: "James Wilson", initials: "JW" },
		category: "tooling",
		stars: 124,
		contributors: 2,
		xpReward: 1200,
		tags: ["anchor", "testing", "cli"],
		githubUrl: "#",
		liveUrl: null,
		featured: false,
	},
	{
		id: "4",
		title: "SolQuest",
		description:
			"On-chain quest platform where users complete coding challenges and earn soulbound achievement tokens. Built with Token-2022.",
		author: { name: "Priya Patel", initials: "PP" },
		category: "gaming",
		stars: 45,
		contributors: 2,
		xpReward: 1800,
		tags: ["gamification", "token-2022", "quests"],
		githubUrl: "#",
		liveUrl: "#",
		featured: false,
	},
	{
		id: "5",
		title: "Solana Monitoring Dashboard",
		description:
			"Real-time monitoring dashboard for Solana programs. Track instruction counts, CU usage, error rates, and account changes.",
		author: { name: "Carlos Rodriguez", initials: "CR" },
		category: "infra",
		stars: 56,
		contributors: 1,
		xpReward: 1000,
		tags: ["monitoring", "dashboard", "analytics"],
		githubUrl: "#",
		liveUrl: "#",
		featured: false,
	},
	{
		id: "6",
		title: "Decentralized Study Group",
		description:
			"A social dApp for forming on-chain study groups with shared progress tracking, milestone rewards, and group credentials.",
		author: { name: "Yuki Tanaka", initials: "YT" },
		category: "social",
		stars: 32,
		contributors: 4,
		xpReward: 1400,
		tags: ["social", "education", "credentials"],
		githubUrl: "#",
		liveUrl: null,
		featured: false,
	},
];

interface ProjectsPageProps {
	searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
	const { q = "", category = "all" } = await searchParams;
	const t = await getTranslations("community");

	// Fetch projects from Sanity or use mock data
	const rawProjects = isSanityConfigured
		? category !== "all"
			? await getProjectsByCategory(category as ProjectCategory)
			: await getAllProjects()
		: PROJECTS;

	// Always normalize to ensure consistent shape
	const projects = rawProjects.map(normalizeProject);

	// Filter by search query
	const filtered = projects.filter((p) => {
		if (q) {
			const query = q.toLowerCase();
			return (
				p.title.toLowerCase().includes(query) ||
				p.description.toLowerCase().includes(query) ||
				p.tags?.some((t) => t.includes(query))
			);
		}
		return true;
	});

	const featured = filtered.filter((p) => p.featured);
	const rest = filtered.filter((p) => !p.featured);

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("projects.searchPlaceholder")}
							className="pl-9 h-9 bg-muted/50 border-border/60 rounded-lg"
							defaultValue={q}
						/>
					</div>
					<Select defaultValue={category}>
						<SelectTrigger className="h-9 w-36 text-sm bg-muted/50 border-border/60 rounded-lg">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CATEGORIES.map((c) => (
								<SelectItem key={c} value={c}>
									{t(`projects.categories.${c}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button size="sm" className="gap-1.5" asChild>
					<Link href="/community/projects/new">
						<Plus className="h-3.5 w-3.5" />
						{t("projects.submit")}
					</Link>
				</Button>
			</div>

			{featured.length > 0 && (
				<div>
					<h2 className="text-lg font-semibold mb-4">{t("projects.featured")}</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{featured.map((project) => (
							<ProjectCard key={project.id} project={project} t={t} featured />
						))}
					</div>
				</div>
			)}

			<div>
				{featured.length > 0 && (
					<h2 className="text-lg font-semibold mb-4">{t("projects.allProjects")}</h2>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{rest.map((project) => (
						<ProjectCard key={project.id} project={project} t={t} />
					))}
				</div>
			</div>

			{filtered.length === 0 && (
				<div className="text-center py-16 space-y-3">
					<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
						<Globe className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold">{t("projects.empty")}</h3>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">
						{t("projects.emptyDescription")}
					</p>
				</div>
			)}
		</div>
	);
}

function ProjectCard({
	project: p,
	t,
	featured,
}: {
	project: NormalizedProject;
	t: Awaited<ReturnType<typeof getTranslations<"community">>>;
	featured?: boolean;
}) {
	return (
		<div
			className={`rounded-2xl border bg-card p-5 flex flex-col ${
				featured ? "border-primary/30 ring-1 ring-primary/10" : "border-border/60"
			}`}
		>
			<div className="flex items-start gap-3 mb-3">
				<div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
					{p.author.initials}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold truncate">{p.title}</p>
					<p className="text-xs text-muted-foreground">{p.author.name}</p>
				</div>
				{featured && (
					<Badge
						variant="outline"
						className="text-[10px] border-primary/40 text-primary shrink-0"
					>
						{t("projects.featuredBadge")}
					</Badge>
				)}
			</div>

			<p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
				{p.description}
			</p>

			<div className="flex flex-wrap gap-1.5 mb-3">
				{p.tags.map((tag) => (
					<Badge
						key={tag}
						variant="secondary"
						className="text-[10px] font-normal px-1.5 py-0"
					>
						{tag}
					</Badge>
				))}
			</div>

			<div className="flex items-center justify-between pt-3 border-t border-border/40">
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Star className="h-3 w-3" />
						{p.stars}
					</span>
					<span className="flex items-center gap-1">
						<Users className="h-3 w-3" />
						{p.contributors}
					</span>
					<span className="flex items-center gap-1 text-[#ffd23f]">
						<Zap className="h-3 w-3" />
						{p.xpReward.toLocaleString()} XP
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					{p.githubUrl && (
						<a
							href={p.githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="p-1.5 rounded-lg hover:bg-muted transition-colors"
						>
							<Github className="h-3.5 w-3.5 text-muted-foreground" />
						</a>
					)}
					{p.liveUrl && (
						<a
							href={p.liveUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="p-1.5 rounded-lg hover:bg-muted transition-colors"
						>
							<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
