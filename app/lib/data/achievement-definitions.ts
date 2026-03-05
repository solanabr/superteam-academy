/**
 * @fileoverview Static achievement definitions and interfaces.
 * Separated from database logic to allow usage in Client Components.
 */

/**
 * Represents a user achievement or milestone.
 */
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt?: string;
	category: "progress" | "streak" | "skill" | "community" | "special";
}

/**
 * List of all possible achievements in the system.
 */
export const achievementDefinitions: Achievement[] = [
	// Progress achievements
	{
		id: "first-steps",
		name: "First Steps",
		description: "Complete your first lesson",
		icon: "Footprints",
		category: "progress",
	},
	{
		id: "course-completer",
		name: "Course Completer",
		description: "Complete your first course",
		icon: "Trophy",
		category: "progress",
	},
	{
		id: "speed-runner",
		name: "Speed Runner",
		description: "Complete 5 lessons in one day",
		icon: "Lightning",
		category: "progress",
	},

	// Streak achievements
	{
		id: "week-warrior",
		name: "Week Warrior",
		description: "Maintain a 7-day streak",
		icon: "CalendarCheck",
		category: "streak",
	},
	{
		id: "monthly-master",
		name: "Monthly Master",
		description: "Maintain a 30-day streak",
		icon: "Calendar",
		category: "streak",
	},
	{
		id: "consistency-king",
		name: "Consistency King",
		description: "Maintain a 100-day streak",
		icon: "Fire",
		category: "streak",
	},

	// Skill achievements
	{
		id: "rust-rookie",
		name: "Rust Rookie",
		description: "Complete Rust Fundamentals",
		icon: "Cpu",
		category: "skill",
	},
	{
		id: "anchor-expert",
		name: "Anchor Expert",
		description: "Master the Anchor Framework",
		icon: "ShieldCheck",
		category: "skill",
	},
	{
		id: "full-stack-solana",
		name: "Full Stack Solana",
		description: "Complete both frontend and backend tracks",
		icon: "Stack",
		category: "skill",
	},

	// Community achievements
	{
		id: "helper",
		name: "Helper",
		description: "Help 10 other learners",
		icon: "Users",
		category: "community",
	},
	{
		id: "first-comment",
		name: "First Comment",
		description: "Leave your first comment",
		icon: "ChatCircle",
		category: "community",
	},
	{
		id: "top-contributor",
		name: "Top Contributor",
		description: "Be in top 100 contributors",
		icon: "Star",
		category: "community",
	},

	// Special achievements
	{
		id: "early-adopter",
		name: "Early Adopter",
		description: "Join in the first month",
		icon: "SealCheck",
		category: "special",
	},
	{
		id: "bug-hunter",
		name: "Bug Hunter",
		description: "Report a valid bug",
		icon: "Bug",
		category: "special",
	},
	{
		id: "perfect-score",
		name: "Perfect Score",
		description: "Get 100% on a challenge",
		icon: "Medal",
		category: "special",
	},
];
