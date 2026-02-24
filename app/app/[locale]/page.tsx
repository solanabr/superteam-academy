import { Link } from "@superteam-academy/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	BookOpen,
	Users,
	Zap,
	Shield,
	Code,
	Award,
	TrendingUp,
	Clock,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import HeroWave from "@/public/hero-wave.svg";
import { NewsletterForm } from "@/components/newsletter-form";
import { getCoursesCMS } from "@/lib/cms";
import { FeaturedCoursesSkeleton } from "@/components/home/featured-courses-skeleton";

const TOPICS = [
	{ name: "Solana Basics", courses: 12, color: "bg-green/10 text-green" },
	{ name: "Anchor Framework", courses: 8, color: "bg-forest/10 text-forest" },
	{ name: "Token Programs", courses: 6, color: "bg-gold/10 text-gold" },
	{ name: "DeFi Development", courses: 9, color: "bg-green/10 text-green" },
	{ name: "NFT & Metaplex", courses: 5, color: "bg-forest/10 text-forest" },
	{ name: "Security & Auditing", courses: 7, color: "bg-destructive/10 text-destructive" },
	{ name: "Web3 Frontend", courses: 10, color: "bg-gold/10 text-gold" },
	{ name: "Compressed NFTs", courses: 4, color: "bg-green/10 text-green" },
];

const FEATURED_COURSES = [
	{
		title: "Solana Development Fundamentals",
		description: "Master the core concepts of Solana: accounts, transactions, PDAs, and CPIs.",
		level: "Beginner",
		duration: "8 hours",
		lessons: 24,
		students: 2450,
		xp: 500,
		slug: "solana-development-fundamentals",
		gradient: "from-green to-forest",
	},
	{
		title: "Smart Contract Security",
		description:
			"Learn vulnerability patterns, auditing techniques, and secure coding on Solana.",
		level: "Advanced",
		duration: "12 hours",
		lessons: 32,
		students: 1280,
		xp: 1200,
		slug: "smart-contract-security",
		gradient: "from-forest to-dark",
	},
	{
		title: "DeFi Protocol Engineering",
		description: "Build production-grade DeFi: AMMs, lending markets, and yield protocols.",
		level: "Intermediate",
		duration: "16 hours",
		lessons: 40,
		students: 890,
		xp: 2000,
		slug: "defi-protocol-development",
		gradient: "from-gold via-amber-500 to-gold",
	},
];

const TESTIMONIALS = [
	{
		name: "Ana Costa",
		role: "Smart Contract Developer",
		location: "Lisbon, Portugal",
		quote: "The hands-on approach made all the difference. I went from zero Rust knowledge to deploying my first Solana program in two weeks.",
	},
	{
		name: "Carlos Rodriguez",
		role: "DeFi Protocol Engineer",
		location: "Buenos Aires, Argentina",
		quote: "The security course alone saved our protocol from multiple vulnerabilities. The on-chain credentials helped me land my current role.",
	},
	{
		name: "Priya Sharma",
		role: "Full-Stack Web3 Dev",
		location: "Bangalore, India",
		quote: "The gamification keeps me motivated. Maintaining my streak for 60+ days turned learning into a daily habit I actually enjoy.",
	},
];

async function HeroSection() {
	const t = await getTranslations("home.hero");

	return (
		<section className="relative overflow-hidden noise">
			<div className="absolute inset-0 pattern-dots opacity-40" />
			<div className="absolute top-0 right-0 w-150 h-150 bg-linear-to-bl from-green/8 via-transparent to-transparent rounded-full blur-3xl" />
			<div className="absolute bottom-0 left-0 w-100 h-100 bg-linear-to-tr from-gold/6 via-transparent to-transparent rounded-full blur-3xl" />

			<div className="relative mx-auto px-4 sm:px-6">
				<div className="flex items-center gap-8 lg:gap-12">
					<div className="max-w-3xl py-20 sm:py-28 lg:py-36">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-highlight text-highlight-foreground text-sm font-medium mb-6 animate-fade-in">
							<span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse-soft" />
							{t("badge")}
						</div>

						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-balance animate-fade-up">
							{t("title")}{" "}
							<span className="text-gradient">{t("titleHighlight")}</span>{" "}
							{t("titleSuffix")}
						</h1>

						<p
							className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-up"
							style={{ animationDelay: "100ms" }}
						>
							{t("description")}
						</p>

						<div
							className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-up"
							style={{ animationDelay: "200ms" }}
						>
							<Button
								size="lg"
								className="text-base px-6 h-12 font-semibold shadow-lg shadow-primary/20"
								asChild
							>
								<Link href="/courses">
									{t("cta")}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="text-base px-6 h-12"
								asChild
							>
								<Link href="/courses?view=paths">{t("explorePaths")}</Link>
							</Button>
						</div>

						<div
							className="mt-14 flex items-center gap-8 sm:gap-12 animate-fade-up"
							style={{ animationDelay: "300ms" }}
						>
							<div>
								<div className="text-2xl sm:text-3xl font-bold text-foreground">
									10k+
								</div>
								<div className="text-sm text-muted-foreground mt-0.5">
									{t("learners")}
								</div>
							</div>
							<div className="w-px h-10 bg-border" />
							<div>
								<div className="text-2xl sm:text-3xl font-bold text-foreground">
									50+
								</div>
								<div className="text-sm text-muted-foreground mt-0.5">
									{t("courses")}
								</div>
							</div>
							<div className="w-px h-10 bg-border" />
							<div>
								<div className="text-2xl sm:text-3xl font-bold text-foreground">
									95%
								</div>
								<div className="text-sm text-muted-foreground mt-0.5">
									{t("completion")}
								</div>
							</div>
						</div>
					</div>

					<div className="hidden flex-1 w-full shrink-0 md:flex justify-end">
						<div className="relative hero-wave-stack animate-float">
							<HeroWave
								width={540}
								height={960}
								className="hero-wave-base text-foreground dark:text-gold"
							/>
							<HeroWave
								width={540}
								height={960}
								aria-hidden="true"
								className="hero-wave-highlight text-forest dark:text-cream"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

async function TopicsStrip() {
	const t = await getTranslations("home.topics");

	return (
		<section className="border-y border-border bg-muted/30">
			<div className="mx-auto px-4 sm:px-6 py-6">
				<div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
					<span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
						{t("popular")}
					</span>
					{TOPICS.map((topic) => (
						<Link
							key={topic.name}
							href={`/topics/${topic.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
							className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105 ${topic.color}`}
						>
							{topic.name}
							<span className="text-xs opacity-60">{topic.courses}</span>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

async function FeaturesSection() {
	const t = await getTranslations("home.features");

	const FEATURES = [
		{
			icon: Code,
			title: t("interactiveCoding"),
			description: t("interactiveCodingDesc"),
		},
		{
			icon: Zap,
			title: t("earnXp"),
			description: t("earnXpDesc"),
		},
		{
			icon: Award,
			title: t("credentials"),
			description: t("credentialsDesc"),
		},
		{
			icon: Shield,
			title: t("expertContent"),
			description: t("expertContentDesc"),
		},
		{
			icon: TrendingUp,
			title: t("streaks"),
			description: t("streaksDesc"),
		},
		{
			icon: Users,
			title: t("community"),
			description: t("communityDesc"),
		},
	];

	return (
		<section className="py-20 lg:py-28">
			<div className="mx-auto px-4 sm:px-6">
				<div className="max-w-2xl mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
						{t("title")} <span className="text-gradient">{t("titleHighlight")}</span>
					</h2>
					<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
						{t("description")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
					{FEATURES.map((feature) => (
						<div
							key={feature.title}
							className="group relative p-6 rounded-2xl surface-inset hover:surface-elevated transition-all duration-300"
						>
							<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
								<feature.icon className="h-5 w-5 text-primary" />
							</div>
							<h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

async function FeaturedCoursesSection() {
	const t = await getTranslations("home.featured");

	// Try CMS data first, fall back to hardcoded
	let courses = FEATURED_COURSES;
	try {
		const cmsCourses = await getCoursesCMS();
		if (cmsCourses.length > 0) {
			courses = cmsCourses.slice(0, 3).map((c, i) => ({
				title: c.title,
				description: c.description ?? c.title,
				level: c.level,
				duration: c.duration ?? "",
				lessons: 0,
				students: 0,
				xp: c.xpReward,
				slug: c.slug.current,
				gradient:
					i === 0
						? "from-green to-forest"
						: i === 1
							? "from-forest to-dark"
							: "from-gold via-amber-500 to-gold",
			}));
		}
	} catch {
		// Use hardcoded fallback
	}

	return (
		<section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
			<div className="mx-auto px-4 sm:px-6">
				<div className="flex items-end justify-between mb-10">
					<div>
						<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
							{t("title")}
						</h2>
						<p className="mt-3 text-lg text-muted-foreground">{t("description")}</p>
					</div>
					<Button variant="outline" className="hidden sm:inline-flex" asChild>
						<Link href="/courses">
							{t("viewAll")}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{courses.map((course) => (
						<Link
							key={course.slug}
							href={`/courses/${course.slug}`}
							className="group relative flex flex-col rounded-2xl surface-elevated overflow-hidden hover:shadow-lg transition-all duration-300"
						>
							<div
								className={`h-40 bg-linear-to-br ${course.gradient} relative overflow-hidden`}
							>
								<div className="absolute inset-0 bg-black/10" />
								<div className="absolute bottom-4 left-5 right-5">
									<span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
										{course.level}
									</span>
								</div>
							</div>

							<div className="flex-1 p-5 space-y-3">
								<h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
									{course.title}
								</h3>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{course.description}
								</p>

								<div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
									<span className="flex items-center gap-1">
										<BookOpen className="h-3.5 w-3.5" />
										{t("lessons", { count: course.lessons })}
									</span>
									<span className="flex items-center gap-1">
										<Clock className="h-3.5 w-3.5" />
										{course.duration}
									</span>
									<span className="flex items-center gap-1">
										<Zap className="h-3.5 w-3.5" />
										{course.xp} XP
									</span>
								</div>
							</div>

							<div className="px-5 pb-4 pt-0">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{t("learners", { count: course.students.toLocaleString() })}
									</span>
									<span className="font-medium text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
										{t("startCourse")}
										<ArrowRight className="h-3.5 w-3.5" />
									</span>
								</div>
							</div>
						</Link>
					))}
				</div>

				<div className="mt-8 text-center sm:hidden">
					<Button variant="outline" asChild>
						<Link href="/courses">
							{t("viewAll")}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}

async function TestimonialsSection() {
	const t = await getTranslations("home.testimonials");
	return (
		<section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
			<div className="mx-auto px-4 sm:px-6">
				<div className="text-center max-w-2xl mx-auto mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("title")}</h2>
					<p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{TESTIMONIALS.map((item) => (
						<div
							key={item.name}
							className="p-6 rounded-2xl bg-card border border-border/60 space-y-4"
						>
							<p className="text-sm leading-relaxed text-foreground/90">
								&ldquo;{item.quote}&rdquo;
							</p>
							<div className="pt-2 border-t border-border/60">
								<div className="font-medium text-sm">{item.name}</div>
								<div className="text-xs text-muted-foreground">
									{item.role} &middot; {item.location}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

async function HowItWorksSection() {
	const t = await getTranslations("home.howItWorks");
	const steps = [
		{ step: "01", titleKey: "step1Title" as const, descKey: "step1Desc" as const },
		{ step: "02", titleKey: "step2Title" as const, descKey: "step2Desc" as const },
		{ step: "03", titleKey: "step3Title" as const, descKey: "step3Desc" as const },
	];

	return (
		<section className="py-20 lg:py-28">
			<div className="mx-auto px-4 sm:px-6">
				<div className="text-center max-w-2xl mx-auto mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("title")}</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{steps.map((s) => (
						<div key={s.step} className="text-center space-y-4">
							<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary text-lg font-bold">
								{s.step}
							</div>
							<h3 className="text-xl font-semibold">{t(s.titleKey)}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
								{t(s.descKey)}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

async function CTASection() {
	return (
		<section className="relative py-20 lg:py-28 overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-forest via-green to-forest" />
			<div className="absolute inset-0 pattern-dots opacity-10" />

			<div className="relative mx-auto px-4 sm:px-6">
				<NewsletterForm />
			</div>
		</section>
	);
}

export default function Home() {
	return (
		<>
			<HeroSection />
			<TopicsStrip />
			<FeaturesSection />
			<Suspense fallback={<FeaturedCoursesSkeleton />}>
				<FeaturedCoursesSection />
			</Suspense>
			<HowItWorksSection />
			<TestimonialsSection />
			<CTASection />
		</>
	);
}
