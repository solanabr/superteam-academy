export interface DraftLesson {
	id: string;
	title: string;
	type: "reading" | "challenge";
	content: Record<string, unknown>[];
}

export interface DraftModule {
	id: string;
	title: string;
	order: number;
	lessons: DraftLesson[];
}

export interface CreatorCourse {
	id: string;
	title: string;
	status: "DRAFT" | "ACTIVE" | "ARCHIVED";
	lastModified: string;
	enrolledCount: number;
	xpReward: number;
	modules: number | DraftModule[];
}

export const mockCreatorCourses: CreatorCourse[] = [
	{
		id: "crs-temp-1",
		title: "Solana Fundamentals",
		status: "ACTIVE",
		lastModified: "2 days ago",
		enrolledCount: 1204,
		xpReward: 1500,
		modules: 4,
	},
	{
		id: "crs-temp-2",
		title: "Anchor FW Advanced",
		status: "DRAFT",
		lastModified: "4 hours ago",
		enrolledCount: 0,
		xpReward: 2500,
		modules: 2,
	},
	{
		id: "crs-temp-3",
		title: "Rust Basics (Legacy)",
		status: "ARCHIVED",
		lastModified: "6 months ago",
		enrolledCount: 450,
		xpReward: 500,
		modules: 3,
	},
];
