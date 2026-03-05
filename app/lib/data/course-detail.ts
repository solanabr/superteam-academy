/**
 * @fileoverview Course Detail data models for the Superteam Academy.
 * Defines the structure for Courses, Modules, Lessons, and Reviews.
 */

/**
 * Represents Sanity-provided content (PortableText or Markdown).
 */
export type SanityContent = unknown;

/**
 * Individual lesson within a module.
 */
export interface Lesson {
	id: string;
	title: string;
	duration: string;
	type: "content" | "challenge";
	completed: boolean;
	locked: boolean;
	content?: SanityContent;
	hints?: string[];
	starterCode?: string;
	solutionCode?: string;
	testCases?: {
		name: string;
		description: string;
		status: "pass" | "fail" | "pending";
	}[];
}

/**
 * A grouping of lessons within a course.
 */
export interface Module {
	id: string;
	number: number;
	title: string;
	description: string;
	duration: string;
	lessons: Lesson[];
	completed: number;
	total: number;
}

/**
 * User-submitted course review.
 */
export interface Review {
	id: string;
	userName: string;
	userAddress: string;
	rating: number;
	title: string;
	comment: string;
	date: string;
}

/**
 * Full detailed view of a course including modules and lessons.
 */
export interface CourseDetail {
	id: string;
	slug: string;
	title: string;
	ref: string;
	category: string;
	description: string;
	instructor: {
		name: string;
		username: string;
	};
	duration: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	xpBounty: number;
	modules: Module[];
	totalLessons: number;
	completedLessons: number;
	progress: number;
	enrolled: boolean;
	onChainStatus?: string;
	completedAt?: number | null;
	credentialAsset?: string | null;
	prerequisiteSlug?: string;
	reviews: Review[];
}

export const mockCourseDetail: CourseDetail = {
	id: "mock-1",
	slug: "mock-solana-fundamentals",
	title: "SOLANA FUNDAMENTALS",
	ref: "SOL-001",
	category: "DEV-101",
	description:
		"A comprehensive guide to the Solana blockchain. Learn about accounts, programs, and how to build high-performance decentralized applications using the Sealevel runtime.",
	instructor: {
		name: "Anatoly Yakovenko",
		username: "@ANATOLY_S",
	},
	duration: "12.5 HOURS",
	difficulty: "beginner",
	xpBounty: 2500,
	totalLessons: 24,
	completedLessons: 8,
	progress: 34,
	enrolled: true,
	modules: [
		{
			id: "mod-1",
			number: 1,
			title: "ARCHITECTURE OVERVIEW",
			description:
				"Understanding Solana's core architecture and design principles",
			duration: "2.5 hours",
			completed: 2,
			total: 3,
			lessons: [
				{
					id: "lesson-1-1",
					title: "Intro to Proof of History",
					duration: "12:00",
					type: "content",
					completed: true,
					locked: false,
				},
				{
					id: "lesson-1-2",
					title: "Parallel execution engine",
					duration: "18:45",
					type: "content",
					completed: true,
					locked: false,
				},
				{
					id: "lesson-1-3",
					title: "Sealevel Runtime",
					duration: "22:30",
					type: "challenge",
					completed: false,
					locked: false,
				},
			],
		},
		{
			id: "mod-2",
			number: 2,
			title: "THE ACCOUNT MODEL",
			description: "Deep dive into Solana's account-based architecture",
			duration: "3 hours",
			completed: 1,
			total: 4,
			lessons: [
				{
					id: "lesson-2-1",
					title: "Everything is an Account",
					duration: "22:10",
					type: "content",
					completed: true,
					locked: false,
				},
				{
					id: "lesson-2-2",
					title: "Rent and Account lifetimes",
					duration: "15:30",
					type: "content",
					completed: false,
					locked: false,
				},
				{
					id: "lesson-2-3",
					title: "PDAs and Seeds",
					duration: "28:15",
					type: "content",
					completed: false,
					locked: false,
				},
				{
					id: "lesson-2-4",
					title: "Account Challenge",
					duration: "45:00",
					type: "challenge",
					completed: false,
					locked: false,
				},
			],
		},
		{
			id: "mod-3",
			number: 3,
			title: "RUST BASICS FOR SOLANA",
			description: "Essential Rust concepts for Solana development",
			duration: "4 hours",
			completed: 0,
			total: 5,
			lessons: [
				{
					id: "lesson-3-1",
					title: "Ownership and Borrowing",
					duration: "25:00",
					type: "content",
					completed: false,
					locked: true,
				},
				{
					id: "lesson-3-2",
					title: "Structs and Enums",
					duration: "20:00",
					type: "content",
					completed: false,
					locked: true,
				},
				{
					id: "lesson-3-3",
					title: "Error Handling",
					duration: "18:30",
					type: "content",
					completed: false,
					locked: true,
				},
				{
					id: "lesson-3-4",
					title: "Traits and Generics",
					duration: "30:00",
					type: "content",
					completed: false,
					locked: true,
				},
				{
					id: "lesson-3-5",
					title: "Rust Challenge",
					duration: "60:00",
					type: "challenge",
					completed: false,
					locked: true,
				},
			],
		},
	],
	reviews: [
		{
			id: "rev-1",
			userName: "Developer",
			userAddress: "0x72...F12",
			rating: 5,
			title: "BEST INTRO TO SOLANA",
			comment:
				"Clear explanations of PoH. Perfect for developers moving from EVM.",
			date: "2026-01-15",
		},
		{
			id: "rev-2",
			userName: "Builder",
			userAddress: "0x9A...C44",
			rating: 4,
			title: "SOLID CONTENT",
			comment:
				"The account model section cleared up a lot of my confusion. Highly recommended.",
			date: "2026-01-10",
		},
		{
			id: "rev-3",
			userName: "Student",
			userAddress: "0xBB...001",
			rating: 5,
			title: "EXCELLENT PACE",
			comment:
				"The instructor knows his stuff. Coding challenges are tough but fair.",
			date: "2026-01-05",
		},
	],
};
