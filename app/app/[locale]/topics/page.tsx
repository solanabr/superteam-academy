import type { Metadata } from "next";
import { Link } from "@superteam-academy/i18n/navigation";
import {
	Code,
	Layers,
	Shield,
	Coins,
	Palette,
	BarChart3,
	Blocks,
	Globe,
	Cpu,
	Smartphone,
	ArrowRight,
	BookOpen,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCoursesIndex, isSanityConfigured } from "@/lib/cms";
import { getAcademyClient } from "@/lib/academy";
import { getLocalizedPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	return getLocalizedPageMetadata(locale, "topics");
}

const TOPICS = [
	{
		name: "Solana Development",
		slug: "solana-development",
		description: "Build programs, dApps, and protocols on Solana using Rust and Anchor.",
		icon: Code,
		color: "text-[#008c4c]",
		bg: "bg-[#008c4c]/10",
	},
	{
		name: "Smart Contracts",
		slug: "smart-contracts",
		description: "Master on-chain program development with Anchor framework.",
		icon: Blocks,
		color: "text-primary",
		bg: "bg-primary/10",
	},
	{
		name: "DeFi",
		slug: "defi",
		description: "Learn to build decentralized finance protocols, AMMs, and lending platforms.",
		icon: Coins,
		color: "text-[#ffd23f]",
		bg: "bg-[#ffd23f]/10",
	},
	{
		name: "Security",
		slug: "security",
		description: "Audit programs, find vulnerabilities, and build secure on-chain systems.",
		icon: Shield,
		color: "text-destructive",
		bg: "bg-destructive/10",
	},
	{
		name: "Frontend & dApps",
		slug: "frontend-dapps",
		description: "Build user-facing applications that interact with Solana programs.",
		icon: Palette,
		color: "text-purple-500",
		bg: "bg-purple-500/10",
	},
	{
		name: "Token Economics",
		slug: "token-economics",
		description: "Design tokenomics, launch tokens, and understand the SPL token standard.",
		icon: BarChart3,
		color: "text-[#2f6b3f]",
		bg: "bg-[#2f6b3f]/10",
	},
	{
		name: "NFTs & Digital Assets",
		slug: "nfts-digital-assets",
		description: "Create, mint, and manage NFTs using Metaplex and compressed NFTs.",
		icon: Layers,
		color: "text-pink-500",
		bg: "bg-pink-500/10",
	},
	{
		name: "Web3 Fundamentals",
		slug: "web3-fundamentals",
		description: "Understand blockchain basics, cryptography, and distributed systems.",
		icon: Globe,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	{
		name: "ZK & Compression",
		slug: "zk-compression",
		description: "Learn zero-knowledge proofs, ZK Compression, and Light Protocol on Solana.",
		icon: Cpu,
		color: "text-cyan-500",
		bg: "bg-cyan-500/10",
	},
	{
		name: "Mobile Development",
		slug: "mobile-development",
		description: "Build mobile dApps with Solana Mobile Stack and Saga integration.",
		icon: Smartphone,
		color: "text-orange-500",
		bg: "bg-orange-500/10",
	},
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
	"solana-development": ["solana", "anchor", "program"],
	"smart-contracts": ["contract", "anchor", "program"],
	defi: ["defi", "amm", "dex", "liquidity"],
	security: ["security", "audit", "vulnerability"],
	"frontend-dapps": ["frontend", "dapp", "react", "ui"],
	"token-economics": ["token", "economics", "tokenomics", "spl"],
	"nfts-digital-assets": ["nft", "metaplex", "asset", "collection"],
	"web3-fundamentals": ["web3", "blockchain", "fundamental"],
	"zk-compression": ["zk", "compression", "light protocol"],
	"mobile-development": ["mobile", "saga", "sms"],
};

async function getTopicCourseCounts(): Promise<Map<string, number>> {
	const academyClient = getAcademyClient();
	const [onchainCourses, cmsCourses] = await Promise.all([
		academyClient.fetchAllCourses(),
		isSanityConfigured ? getCoursesIndex().catch(() => []) : Promise.resolve([]),
	]);

	const cmsByCourseId = new Map(cmsCourses.map((c) => [c.slug?.current ?? c._id, c]));

	const counts = new Map<string, number>();
	for (const topic of TOPICS) {
		counts.set(topic.slug, 0);
	}

	for (const entry of onchainCourses) {
		if (!entry.account.isActive) continue;
		const courseId = entry.account.courseId;
		const cms = cmsByCourseId.get(courseId);
		const category = cms?.track ?? "solana";
		const tags = cms?.track ? [cms.track] : ["solana"];
		const haystack = `${category} ${tags.join(" ")}`.toLowerCase();

		for (const [topicSlug, keywords] of Object.entries(TOPIC_KEYWORDS)) {
			if (keywords.some((kw) => haystack.includes(kw))) {
				counts.set(topicSlug, (counts.get(topicSlug) ?? 0) + 1);
			}
		}
	}

	return counts;
}

export default async function TopicsPage() {
	const t = await getTranslations("topics");
	const courseCounts = await getTopicCourseCounts();
	return (
		<div className="mx-auto px-4 sm:px-6 py-12">
			<div className="max-w-2xl mb-12">
				<h1 className="text-4xl font-bold font-display mb-3">{t("title")}</h1>
				<p className="text-lg text-muted-foreground">{t("description")}</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{TOPICS.map((topic) => {
					const Icon = topic.icon;
					const count = courseCounts.get(topic.slug) ?? 0;
					return (
						<Link
							key={topic.slug}
							href={`/topics/${topic.slug}`}
							className="group rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-sm transition-all"
						>
							<div className="flex items-start gap-4">
								<div
									className={`h-12 w-12 rounded-xl ${topic.bg} flex items-center justify-center shrink-0`}
								>
									<Icon className={`h-6 w-6 ${topic.color}`} />
								</div>
								<div className="flex-1 min-w-0">
									<h2 className="text-base font-semibold group-hover:text-primary transition-colors">
										{topic.name}
									</h2>
									<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
										{topic.description}
									</p>
									<div className="flex items-center gap-2 mt-3">
										<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs text-muted-foreground">
											{t("courses", { count })}
										</span>
										<ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
