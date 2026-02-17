import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, afterEach, afterAll } from "vitest";

// Mock API handlers
export const handlers = [
	// Courses API
	http.get("/api/courses", () => {
		return HttpResponse.json({
			courses: [
				{
					id: "1",
					title: "Introduction to Solana",
					description: "Learn the basics of Solana blockchain",
					instructor: "John Doe",
					duration: 8,
					level: "Beginner",
					xpReward: 500,
					lessons: 12,
					enrolled: 1250,
					rating: 4.8,
					tags: ["Solana", "Blockchain", "Web3"],
				},
			],
			total: 1,
		});
	}),

	http.get("/api/courses/:id", ({ params }) => {
		return HttpResponse.json({
			id: params.id,
			title: "Introduction to Solana",
			description: "Learn the basics of Solana blockchain",
			instructor: "John Doe",
			duration: 8,
			level: "Beginner",
			xpReward: 500,
			lessons: [
				{
					id: "1",
					title: "What is Solana?",
					description: "Understanding the Solana blockchain",
					type: "video",
					duration: 15,
					xpReward: 25,
					completed: false,
					order: 1,
				},
			],
			enrolled: 1250,
			rating: 4.8,
			tags: ["Solana", "Blockchain", "Web3"],
		});
	}),

	// User API
	http.get("/api/user/profile", () => {
		return HttpResponse.json({
			id: "user-1",
			name: "Test User",
			email: "test@example.com",
			avatar: "https://example.com/avatar.jpg",
			walletAddress: "11111111111111111111111111111112",
			level: 3,
			xp: 1250,
			streak: 7,
			achievements: ["first-lesson", "week-streak"],
			enrolledCourses: ["course-1", "course-2"],
		});
	}),

	// Leaderboard API
	http.get("/api/leaderboard", () => {
		return HttpResponse.json({
			leaderboard: [
				{
					rank: 1,
					user: {
						id: "user-1",
						name: "Alice Johnson",
						avatar: "https://example.com/avatar1.jpg",
						level: 5,
						xp: 2500,
					},
					streak: 15,
				},
				{
					rank: 2,
					user: {
						id: "user-2",
						name: "Bob Smith",
						avatar: "https://example.com/avatar2.jpg",
						level: 4,
						xp: 2100,
					},
					streak: 12,
				},
			],
			userRank: 3,
		});
	}),

	// Analytics API
	http.get("/api/analytics/user-stats", () => {
		return HttpResponse.json({
			totalXpEarned: 1250,
			coursesCompleted: 2,
			lessonsCompleted: 24,
			currentStreak: 7,
			longestStreak: 14,
			averageSessionTime: 45,
			weeklyProgress: [
				{ day: "Mon", xp: 150 },
				{ day: "Tue", xp: 200 },
				{ day: "Wed", xp: 175 },
				{ day: "Thu", xp: 225 },
				{ day: "Fri", xp: 180 },
				{ day: "Sat", xp: 120 },
				{ day: "Sun", xp: 200 },
			],
		});
	}),

	// Credentials API
	http.get("/api/credentials", () => {
		return HttpResponse.json({
			credentials: [
				{
					id: "cred-1",
					track: "Beginner",
					issuedAt: "2024-01-15T10:00:00Z",
					coursesCompleted: 3,
					totalXp: 750,
					metadataUri: "https://arweave.net/credential-metadata-1",
					isActive: true,
				},
			],
		});
	}),

	// Generic error handler
	http.get("*", ({ request }) => {
		console.error(`Unhandled request: ${request.method} ${request.url}`);
		return HttpResponse.json({ error: "Unhandled request" }, { status: 500 });
	}),
];

// Setup server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
