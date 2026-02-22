export type SeedCourseLevel = "beginner" | "intermediate" | "advanced";
export type SeedLessonKind = "video" | "interactive" | "quiz" | "reading";

interface SeedCourseDefinition {
	id: string;
	courseId: string;
	title: string;
	description: string;
	category: string;
	level: SeedCourseLevel;
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
	trackId: number;
	trackLevel: number;
	prerequisiteCourseId: string | null;
	creatorRewardXp: number;
	minCompletionsForReward: number;
	lessons: Array<{ title: string; kind: SeedLessonKind }>;
}

const COURSE_SEEDS: SeedCourseDefinition[] = [
	{
		id: "solana-intro",
		courseId: "solana-intro",
		title: "Introduction to Solana",
		description:
			"Learn how Solana works: accounts, transactions, programs, and the runtime model.",
		category: "solana",
		level: "beginner",
		duration: "3 hours",
		students: 2450,
		instructor: "Dr. Sarah Chen",
		image: "/courses/blockchain-intro.jpg",
		tags: ["solana", "blockchain", "fundamentals"],
		topics: ["solana-development", "web3-fundamentals"],
		xpReward: 500,
		price: 0,
		featured: true,
		gradient: "from-green to-forest",
		trackId: 1,
		trackLevel: 1,
		prerequisiteCourseId: null,
		creatorRewardXp: 50,
		minCompletionsForReward: 3,
		lessons: [
			{ title: "What Is Solana", kind: "video" },
			{ title: "Accounts and Ownership", kind: "video" },
			{ title: "Transactions and Signers", kind: "interactive" },
			{ title: "Programs and CPI", kind: "video" },
			{ title: "Runtime and Parallelization", kind: "reading" },
			{ title: "Foundations Quiz", kind: "quiz" },
		],
	},
	{
		id: "anchor-deep-dive",
		courseId: "anchor-deep-dive",
		title: "Anchor Framework Deep Dive",
		description:
			"Build, test, and deploy Solana programs using Anchor with real-world examples.",
		category: "anchor",
		level: "intermediate",
		duration: "10 hours",
		students: 1280,
		instructor: "Mike Johnson",
		image: "/courses/solidity.jpg",
		tags: ["anchor", "rust", "programs"],
		topics: ["solana-development", "smart-contracts"],
		xpReward: 1200,
		price: 0,
		featured: false,
		gradient: "from-forest to-dark",
		trackId: 1,
		trackLevel: 2,
		prerequisiteCourseId: "solana-intro",
		creatorRewardXp: 120,
		minCompletionsForReward: 5,
		lessons: [
			{ title: "Anchor Project Anatomy", kind: "video" },
			{ title: "Accounts and Constraints", kind: "interactive" },
			{ title: "Instruction Design", kind: "video" },
			{ title: "PDAs and Bumps", kind: "interactive" },
			{ title: "Events and Errors", kind: "reading" },
			{ title: "Token-2022 CPIs", kind: "video" },
			{ title: "Testing with ts-mocha", kind: "interactive" },
			{ title: "Security Patterns", kind: "reading" },
			{ title: "Deployment Workflow", kind: "video" },
			{ title: "Anchor Quiz", kind: "quiz" },
		],
	},
	{
		id: "defi-engineering",
		courseId: "defi-engineering",
		title: "DeFi Protocol Engineering",
		description:
			"Design and implement AMMs, lending protocols, and yield strategies on Solana.",
		category: "defi",
		level: "advanced",
		duration: "16 hours",
		students: 890,
		instructor: "Alex Rivera",
		image: "/courses/defi.jpg",
		tags: ["defi", "protocols", "amm"],
		topics: ["defi", "smart-contracts", "solana-development"],
		xpReward: 2000,
		price: 0,
		featured: true,
		gradient: "from-gold via-amber-500 to-gold",
		trackId: 2,
		trackLevel: 3,
		prerequisiteCourseId: "anchor-deep-dive",
		creatorRewardXp: 200,
		minCompletionsForReward: 8,
		lessons: [
			{ title: "AMM Math", kind: "video" },
			{ title: "Constant Product Pools", kind: "interactive" },
			{ title: "Liquidity Incentives", kind: "reading" },
			{ title: "Lending Risk Models", kind: "video" },
			{ title: "Liquidation Mechanics", kind: "interactive" },
			{ title: "Oracle Design", kind: "video" },
			{ title: "Vault Strategies", kind: "reading" },
			{ title: "Protocol Fee Systems", kind: "video" },
			{ title: "Governance Hooks", kind: "reading" },
			{ title: "Security Hardening", kind: "interactive" },
			{ title: "Monitoring and Analytics", kind: "video" },
			{ title: "DeFi Quiz", kind: "quiz" },
		],
	},
	{
		id: "token-2022-ext",
		courseId: "token-2022-ext",
		title: "Token-2022 & Extensions",
		description:
			"Master the Token Extensions program: transfer fees, metadata, and confidential transfers.",
		category: "token",
		level: "intermediate",
		duration: "6 hours",
		students: 720,
		instructor: "Maria Santos",
		image: "/courses/token.jpg",
		tags: ["token-2022", "extensions", "spl"],
		topics: ["token-economics", "solana-development"],
		xpReward: 800,
		price: 0,
		featured: false,
		gradient: "from-green/80 to-green",
		trackId: 3,
		trackLevel: 2,
		prerequisiteCourseId: "solana-intro",
		creatorRewardXp: 90,
		minCompletionsForReward: 5,
		lessons: [
			{ title: "Token Program vs Token-2022", kind: "video" },
			{ title: "NonTransferable Extension", kind: "interactive" },
			{ title: "Permanent Delegate", kind: "video" },
			{ title: "Metadata Pointer", kind: "reading" },
			{ title: "Transfer Fee Extension", kind: "interactive" },
			{ title: "Confidential Transfers", kind: "video" },
			{ title: "Extension Composition", kind: "reading" },
			{ title: "Token-2022 Quiz", kind: "quiz" },
		],
	},
	{
		id: "program-security",
		courseId: "program-security",
		title: "Smart Contract Security",
		description:
			"Identify vulnerabilities, write fuzz tests, and audit Solana programs professionally.",
		category: "security",
		level: "advanced",
		duration: "12 hours",
		students: 560,
		instructor: "James Wu",
		image: "/courses/security.jpg",
		tags: ["security", "auditing", "fuzzing"],
		topics: ["security", "smart-contracts", "solana-development"],
		xpReward: 1500,
		price: 0,
		featured: true,
		gradient: "from-dark to-forest",
		trackId: 4,
		trackLevel: 3,
		prerequisiteCourseId: "anchor-deep-dive",
		creatorRewardXp: 180,
		minCompletionsForReward: 7,
		lessons: [
			{ title: "Threat Modeling", kind: "reading" },
			{ title: "Account Validation Pitfalls", kind: "video" },
			{ title: "Arithmetic Safety", kind: "interactive" },
			{ title: "Authority Escalation", kind: "video" },
			{ title: "CPI Safety", kind: "interactive" },
			{ title: "State Consistency", kind: "reading" },
			{ title: "Fuzzing and Invariants", kind: "video" },
			{ title: "Audit Checklists", kind: "reading" },
			{ title: "Incident Postmortems", kind: "video" },
			{ title: "Security Quiz", kind: "quiz" },
		],
	},
	{
		id: "web3-frontend",
		courseId: "web3-frontend",
		title: "Web3 Frontend with Next.js",
		description:
			"Build production dApp frontends: wallet adapters, transaction UX, and real-time data.",
		category: "frontend",
		level: "beginner",
		duration: "8 hours",
		students: 1100,
		instructor: "Lisa Park",
		image: "/courses/frontend.jpg",
		tags: ["nextjs", "react", "wallet-adapter"],
		topics: ["frontend-dapps", "solana-development"],
		xpReward: 700,
		price: 0,
		featured: false,
		gradient: "from-gold/80 to-forest",
		trackId: 5,
		trackLevel: 1,
		prerequisiteCourseId: "solana-intro",
		creatorRewardXp: 80,
		minCompletionsForReward: 5,
		lessons: [
			{ title: "dApp Frontend Architecture", kind: "reading" },
			{ title: "Wallet Adapter Setup", kind: "interactive" },
			{ title: "Transaction UX", kind: "video" },
			{ title: "Optimistic UI Patterns", kind: "interactive" },
			{ title: "RPC and Indexing", kind: "video" },
			{ title: "Error Handling", kind: "reading" },
			{ title: "Performance Patterns", kind: "video" },
			{ title: "Frontend Quiz", kind: "quiz" },
		],
	},
];

export const FRONTEND_SEED_COURSES = COURSE_SEEDS.map((course) => ({
	id: course.id,
	title: course.title,
	description: course.description,
	category: course.category,
	level: course.level,
	duration: course.duration,
	students: course.students,
	instructor: course.instructor,
	image: course.image,
	tags: course.tags,
	topics: course.topics,
	xpReward: course.xpReward,
	price: course.price,
	featured: course.featured,
	gradient: course.gradient,
}));

export type FrontendSeedCourse = (typeof FRONTEND_SEED_COURSES)[number];

export const ONCHAIN_COURSE_STUBS = COURSE_SEEDS.map((course) => ({
	courseId: course.courseId,
	title: course.title,
	description: course.description,
	category: course.category,
	level: course.level,
	duration: course.duration,
	tags: course.tags,
	instructor: course.instructor,
	lessonCount: course.lessons.length,
	xpPerLesson: Math.floor(course.xpReward / course.lessons.length),
	trackId: course.trackId,
	trackLevel: course.trackLevel,
	prerequisiteCourseId: course.prerequisiteCourseId,
	creatorRewardXp: course.creatorRewardXp,
	minCompletionsForReward: course.minCompletionsForReward,
	lessons: course.lessons,
}));

export type OnchainCourseStub = (typeof ONCHAIN_COURSE_STUBS)[number];
