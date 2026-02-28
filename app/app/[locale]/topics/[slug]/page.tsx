import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
	BookOpen,
	ArrowLeft,
	Search,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CourseGrid } from "@/components/courses/course-grid";
import { CoursesFilters } from "@/components/courses/courses-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getCoursesCMS, isSanityConfigured, resolveCourseImageUrl } from "@/lib/cms";
import { getAcademyClient } from "@/lib/academy";

type TopicCourse = {
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
	topics: string[];
	xpReward: number;
	price: number;
	featured: boolean;
	gradient: string;
};

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

interface TopicDetailPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		level?: string;
		sort?: string;
	}>;
}

export async function generateMetadata({ params }: TopicDetailPageProps): Promise<Metadata> {
	const { slug } = await params;
	const topic = TOPICS.find((t) => t.slug === slug);

	if (!topic) {
		return {
			title: "Topic Not Found | Superteam Academy",
		};
	}

	return {
		title: `${topic.name} Courses | Superteam Academy`,
		description: topic.description,
	};
}

export default async function TopicDetailPage({ params, searchParams }: TopicDetailPageProps) {
	const { slug } = await params;
	const { level = "all", sort = "popular" } = await searchParams;

	const topic = TOPICS.find((t) => t.slug === slug);

	if (!topic) {
		notFound();
	}

	const Icon = topic.icon;
	const t = await getTranslations("topics");

	return (
		<div className="min-h-screen">
			<div className="border-b border-border/60 noise">
				<div className="mx-auto px-4 sm:px-6 py-10 sm:py-14">
					<Link
						href="/topics"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("backToTopics")}
					</Link>

					<div className="flex items-start gap-5">
						<div
							className={`h-16 w-16 rounded-2xl ${topic.bg} flex items-center justify-center shrink-0`}
						>
							<Icon className={`h-8 w-8 ${topic.color}`} />
						</div>
						<div className="flex-1">
							<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
								{topic.name}
							</h1>
							<p className="mt-3 text-lg text-muted-foreground max-w-2xl">
								{topic.description}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="sticky top-16 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
				<div className="mx-auto px-4 sm:px-6 py-3">
					<CoursesFilters q="" category="all" level={level} duration="all" sort={sort} />
				</div>
			</div>

			<div className="mx-auto px-4 sm:px-6 py-8">
				<Suspense fallback={<TopicCoursesSkeleton />}>
					<TopicCoursesContent slug={slug} level={level} sort={sort} />
				</Suspense>
			</div>
		</div>
	);
}

async function TopicCoursesContent({
	slug,
	level,
	sort,
}: {
	slug: string;
	level: string;
	sort: string;
}) {
	const courses = await getTopicCourses(slug, level, sort);
	const t = await getTranslations("topics");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<BookOpen className="h-4 w-4 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						{courses.length === 1
							? t("detail.count", { count: courses.length })
							: t("detail.countPlural", { count: courses.length })}
					</p>
				</div>
			</div>

			{courses.length > 0 ? (
				<CourseGrid courses={courses} />
			) : (
				<div className="text-center py-20 space-y-4">
					<div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
						<Search className="h-7 w-7 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold">{t("detail.empty.title")}</h3>
					<p className="text-muted-foreground max-w-sm mx-auto text-sm">
						{t("detail.empty.description")}
					</p>
					<Button variant="outline" size="sm" asChild>
						<Link href="/courses">{t("detail.empty.browseCourses")}</Link>
					</Button>
				</div>
			)}
		</div>
	);
}

function TopicCoursesSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-32" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="rounded-2xl bg-muted/30 border border-border/40 overflow-hidden"
					>
						<Skeleton className="h-40 w-full" />
						<div className="p-5 space-y-3">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-full" />
							<div className="flex gap-3 pt-1">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-14" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

async function getTopicCourses(slug: string, level: string, sort: string) {
	const academyClient = getAcademyClient();
	const [onchainCourses, cmsCourses] = await Promise.all([
		academyClient.fetchAllCourses(),
		isSanityConfigured ? getCoursesCMS() : Promise.resolve([]),
	]);

	const cmsByCourseId = new Map(
		cmsCourses.map((course) => [course.slug?.current ?? course._id, course])
	);

	const mapDifficultyToLevel = (difficulty: number) => {
		if (difficulty >= 3) return "advanced";
		if (difficulty === 2) return "intermediate";
		return "beginner";
	};

	const topicKeywords: Record<string, string[]> = {
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

	const deriveTopics = (category: string, tags: string[]) => {
		const haystack = `${category} ${tags.join(" ")}`.toLowerCase();
		return Object.entries(topicKeywords)
			.filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
			.map(([topicSlug]) => topicSlug);
	};

	const baseCourses: TopicCourse[] = onchainCourses
		.map((entry) => {
			const courseId = entry.account.courseId;
			const cms = cmsByCourseId.get(courseId);
			const lessonCount = entry.account.lessonCount;
			const category = cms?.track ?? "solana";
			const tags = cms?.track ? [cms.track] : ["solana"];

			return {
				id: courseId,
				title: cms?.title ?? courseId,
				description: cms?.description ?? "",
				category,
				level: cms?.level ?? mapDifficultyToLevel(entry.account.difficulty),
				duration: cms?.duration ?? `${Math.max(lessonCount, 1) * 10} min`,
				students: entry.account.totalEnrollments,
				instructor: "",
				image: resolveCourseImageUrl(cms?.image, 960, 540) ?? "/courses/default.jpg",
				tags,
				topics: deriveTopics(category, tags),
				xpReward: entry.account.xpPerLesson * lessonCount,
				price: 0,
				featured: false,
				gradient: "from-green to-forest",
			};
		});

	let filtered = baseCourses.filter((course) => course.topics?.includes(slug));

	if (level && level !== "all") {
		filtered = filtered.filter((course) => course.level === level);
	}

	if (sort === "xp") {
		filtered.sort((a, b) => b.xpReward - a.xpReward);
	} else if (sort === "newest") {
		filtered.reverse();
	} else if (sort === "duration") {
		filtered.sort((a, b) => parseInt(a.duration, 10) - parseInt(b.duration, 10));
	} else {
		filtered.sort((a, b) => b.students - a.students);
	}

	return filtered;
}
