/**
 * @fileoverview Course catalog and learning path data models.
 * Defines the structure for courses, user stats, and learning paths used in the dashboard and catalog.
 */

/**
 * High-level course metadata for catalog cards and tracking.
 */
export interface Course {
	id?: string; // Legacy ID
	_id?: string; // Sanity Document ID
	slug: string;
	title: string;
	description: string;
	imageUrl?: string;
	category?: string; // legacy string
	difficulty: number | string; // Sanity stores 1 (Beginner), 2 (Medium), 3 (Hard)
	duration?: string;
	durationMinutes?: number;
	progress?: number;
	isLocked?: boolean;
	modules?: number;
	moduleCount?: number;
	totalLessons?: number;
	xp?: number;
	xp_per_lesson?: number;
	track_id?: number;
	track_level?: number;
	tag?: string;
	icon?: string;
}

/**
 * A curated sequence of courses forming a learning track.
 */
export interface LearningPath {
	id: string;
	slug: string;
	ref: string;
	track: "beginner" | "intermediate" | "advanced";
	title: string;
	description: string;
	icon: string; // lucide icon name
	modules: number;
	duration: string;
	xp: number;
	progress: number;
	courses: string[]; // course IDs
}

/**
 * User achievement and activity statistics.
 */
export interface UserStats {
	totalXP: number;
	coursesActive: number;
	completionRate: number;
	certificates: number;
	currentStreak: number;
	level: number;
}

/**
 * Metadata for the course most recently accessed by the user.
 */
export interface LastAccessedCourse {
	courseId: string;
	title: string;
	progress: number;
	lessons: {
		title: string;
		completed: boolean;
	}[];
}

// Mock learning paths
export const mockLearningPaths: LearningPath[] = [
	{
		id: "mock-solana-fundamentals",
		slug: "mock-solana-fundamentals",
		ref: "SL-001",
		track: "beginner",
		title: "SOLANA FUNDAMENTALS",
		description:
			"Complete introduction to the Solana ecosystem. From wallet basics to your first on-chain program.",
		icon: "Stack",
		modules: 12,
		duration: "~24 HOURS",
		xp: 1200,
		progress: 45,
		courses: ["rust-syntax", "account-model", "client-side"],
	},
	{
		id: "defi-developer",
		slug: "defi-developer",
		ref: "DF-202",
		track: "advanced",
		title: "DEFI DEVELOPER",
		description:
			"Master liquidity pools, AMMs, and lending protocols. Security auditing included.",
		icon: "Cpu",
		modules: 8,
		duration: "~32 HOURS",
		xp: 2400,
		progress: 0,
		courses: ["token-program", "security-audit"],
	},
];
