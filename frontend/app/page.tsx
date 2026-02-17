import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	BookOpen,
	Users,
	Zap,
	Shield,
	Code,
	Layers,
	Award,
	TrendingUp,
	Clock,
} from "lucide-react";

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
		students: 2_450,
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
		students: 1_280,
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

const FEATURES = [
	{
		icon: Code,
		title: "Interactive Coding",
		description:
			"Write, test, and deploy Solana programs directly in your browser with instant feedback.",
	},
	{
		icon: Zap,
		title: "Earn XP & Level Up",
		description: "Gain experience points for every lesson, challenge, and course you complete.",
	},
	{
		icon: Award,
		title: "On-Chain Credentials",
		description:
			"Receive verifiable, soulbound credentials stored on Solana that prove your expertise.",
	},
	{
		icon: Shield,
		title: "Expert-Curated Content",
		description:
			"Courses built by auditors, core contributors, and builders who ship on mainnet.",
	},
	{
		icon: TrendingUp,
		title: "Track Your Streaks",
		description:
			"Build learning habits with daily streaks, weekly goals, and milestone celebrations.",
	},
	{
		icon: Users,
		title: "Global Community",
		description:
			"Join thousands of Solana builders, share progress, and compete on leaderboards.",
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

function HeroSection() {
	return (
		<section className="relative overflow-hidden noise">
			<div className="absolute inset-0 pattern-dots opacity-40" />
			<div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green/8 via-transparent to-transparent rounded-full blur-3xl" />
			<div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gold/6 via-transparent to-transparent rounded-full blur-3xl" />

			<div className="relative mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
				<div className="max-w-3xl">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-highlight text-highlight-foreground text-sm font-medium mb-6 animate-fade-in">
						<span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse-soft" />
						Free courses available now
					</div>

					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-balance animate-fade-up">
						Build on Solana. <span className="text-gradient">Prove your skills</span>{" "}
						on-chain.
					</h1>

					<p
						className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-up"
						style={{ animationDelay: "100ms" }}
					>
						Interactive courses, hands-on challenges, and verifiable credentials. Master
						blockchain development the way real builders learn — by shipping code.
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
								Start learning free
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button variant="outline" size="lg" className="text-base px-6 h-12" asChild>
							<Link href="/courses?view=paths">Explore paths</Link>
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
							<div className="text-sm text-muted-foreground mt-0.5">Learners</div>
						</div>
						<div className="w-px h-10 bg-border" />
						<div>
							<div className="text-2xl sm:text-3xl font-bold text-foreground">
								50+
							</div>
							<div className="text-sm text-muted-foreground mt-0.5">Courses</div>
						</div>
						<div className="w-px h-10 bg-border" />
						<div>
							<div className="text-2xl sm:text-3xl font-bold text-foreground">
								95%
							</div>
							<div className="text-sm text-muted-foreground mt-0.5">Completion</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function TopicsStrip() {
	return (
		<section className="border-y border-border bg-muted/30">
			<div className="mx-auto px-4 sm:px-6 py-6">
				<div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
					<span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
						Popular topics:
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

function FeaturesSection() {
	return (
		<section className="py-20 lg:py-28">
			<div className="mx-auto px-4 sm:px-6">
				<div className="max-w-2xl mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
						Designed for <span className="text-gradient">real progress</span>
					</h2>
					<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
						Everything you need to go from beginner to proficient Solana developer, with
						tools and incentives that keep you moving forward.
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

function FeaturedCoursesSection() {
	return (
		<section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
			<div className="mx-auto px-4 sm:px-6">
				<div className="flex items-end justify-between mb-10">
					<div>
						<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
							Featured courses
						</h2>
						<p className="mt-3 text-lg text-muted-foreground">
							Start here. Master the foundations with our most popular tracks.
						</p>
					</div>
					<Button variant="outline" className="hidden sm:inline-flex" asChild>
						<Link href="/courses">
							View all courses
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{FEATURED_COURSES.map((course) => (
						<Link
							key={course.slug}
							href={`/courses/${course.slug}`}
							className="group relative flex flex-col rounded-2xl surface-elevated overflow-hidden hover:shadow-lg transition-all duration-300"
						>
							<div
								className={`h-40 bg-gradient-to-br ${course.gradient} relative overflow-hidden`}
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
										{course.lessons} lessons
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
										{course.students.toLocaleString()} learners
									</span>
									<span className="font-medium text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
										Start course
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
							View all courses
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}

function PathsSection() {
	const paths = [
		{
			title: "Solana Core Developer",
			description: "Full path from Rust basics to deploying production programs on mainnet.",
			courses: 6,
			duration: "40 hours",
			icon: Code,
		},
		{
			title: "Security Auditor",
			description:
				"Learn to identify vulnerabilities and audit Solana programs professionally.",
			courses: 4,
			duration: "28 hours",
			icon: Shield,
		},
		{
			title: "Full-Stack dApp Builder",
			description:
				"End-to-end: on-chain programs, TypeScript SDK, React frontend, deployment.",
			courses: 8,
			duration: "52 hours",
			icon: Layers,
		},
	];
	return (
		<section className="py-20 lg:py-28">
			<div className="mx-auto px-4 sm:px-6">
				<div className="text-center max-w-2xl mx-auto mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
						Structured learning paths
					</h2>
					<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
						Follow a curated sequence of courses to build expertise in a specific
						domain. No guessing what to learn next.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{paths.map((path) => (
						<div
							key={path.title}
							className="group relative p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300"
						>
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green/10 to-forest/10 flex items-center justify-center mb-5">
								<path.icon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-xl font-semibold mb-2">{path.title}</h3>
							<p className="text-sm text-muted-foreground mb-5 leading-relaxed">
								{path.description}
							</p>
							<div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
								<span className="flex items-center gap-1.5">
									<BookOpen className="h-4 w-4" />
									{path.courses} courses
								</span>
								<span className="flex items-center gap-1.5">
									<Clock className="h-4 w-4" />
									{path.duration}
								</span>
							</div>
							<Button
								variant="outline"
								className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
								asChild
							>
								<Link href="/courses?view=paths">
									View path
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function TestimonialsSection() {
	return (
		<section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
			<div className="mx-auto px-4 sm:px-6">
				<div className="text-center max-w-2xl mx-auto mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
						Built by builders, for builders
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						Hear from developers who accelerated their Solana careers.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{TESTIMONIALS.map((t) => (
						<div
							key={t.name}
							className="p-6 rounded-2xl bg-card border border-border/60 space-y-4"
						>
							<p className="text-sm leading-relaxed text-foreground/90">
								&ldquo;{t.quote}&rdquo;
							</p>
							<div className="pt-2 border-t border-border/60">
								<div className="font-medium text-sm">{t.name}</div>
								<div className="text-xs text-muted-foreground">
									{t.role} &middot; {t.location}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function HowItWorksSection() {
	const steps = [
		{
			step: "01",
			title: "Pick a course or path",
			description:
				"Browse our catalog of 50+ courses organized by topic, difficulty, and career path.",
		},
		{
			step: "02",
			title: "Learn by doing",
			description:
				"Complete interactive lessons, solve coding challenges, and build real projects in-browser.",
		},
		{
			step: "03",
			title: "Earn XP & credentials",
			description:
				"Collect experience points, maintain streaks, and unlock soulbound on-chain credentials.",
		},
	];

	return (
		<section className="py-20 lg:py-28">
			<div className="mx-auto px-4 sm:px-6">
				<div className="text-center max-w-2xl mx-auto mb-14">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{steps.map((s) => (
						<div key={s.step} className="text-center space-y-4">
							<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary text-lg font-bold">
								{s.step}
							</div>
							<h3 className="text-xl font-semibold">{s.title}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
								{s.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function CTASection() {
	return (
		<section className="relative py-20 lg:py-28 overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-forest via-green to-forest" />
			<div className="absolute inset-0 pattern-dots opacity-10" />

			<div className="relative mx-auto px-4 sm:px-6 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
					Your Solana journey starts here
				</h2>
				<p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
					Join 10,000+ developers already building the future of Web3. Start with our free
					courses today.
				</p>
				<div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
					<Button
						size="lg"
						className="bg-gold text-dark hover:bg-gold/90 text-base px-8 h-12 font-semibold shadow-lg"
						asChild
					>
						<Link href="/courses">
							Get started free
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-12"
						asChild
					>
						<Link href="/pricing">View pricing</Link>
					</Button>
				</div>
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
			<FeaturedCoursesSection />
			<PathsSection />
			<HowItWorksSection />
			<TestimonialsSection />
			<CTASection />
		</>
	);
}
