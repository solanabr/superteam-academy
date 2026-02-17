import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock API handlers
const handlers = [
	// User API mocks
	http.get("/api/user/profile", () => {
		return HttpResponse.json({
			id: "test-user-id",
			email: "test@example.com",
			name: "Test User",
			avatar: "https://example.com/avatar.jpg",
			createdAt: "2024-01-01T00:00:00Z",
		});
	}),

	http.post("/api/user/profile", () => {
		return HttpResponse.json({ success: true });
	}),

	// Course API mocks
	http.get("/api/courses", () => {
		return HttpResponse.json([
			{
				id: "course-1",
				title: "Introduction to Solana",
				description: "Learn the basics of Solana blockchain development",
				instructor: "John Doe",
				duration: 3600,
				level: "beginner",
				tags: ["solana", "blockchain"],
			},
		]);
	}),

	http.get("/api/courses/:id", ({ params }) => {
		const { id } = params;
		return HttpResponse.json({
			id,
			title: "Introduction to Solana",
			description: "Learn the basics of Solana blockchain development",
			instructor: "John Doe",
			duration: 3600,
			level: "beginner",
			lessons: [
				{
					id: "lesson-1",
					title: "What is Solana?",
					type: "video",
					duration: 600,
				},
			],
		});
	}),

	// Analytics API mocks
	http.post("/api/analytics/event", () => {
		return HttpResponse.json({ success: true });
	}),

	// Wallet API mocks
	http.get("/api/wallet/balance", () => {
		return HttpResponse.json({
			sol: 1.5,
			tokens: [
				{
					mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
					amount: 100,
					symbol: "USDC",
				},
			],
		});
	}),
];

// Setup server
export const server = setupServer(...handlers);

// Mock data generators
export const mockUser = {
	id: "test-user-id",
	email: "test@example.com",
	name: "Test User",
	avatar: "https://example.com/avatar.jpg",
	createdAt: "2024-01-01T00:00:00Z",
	preferences: {
		theme: "dark",
		language: "en",
	},
};

export const mockCourse = {
	id: "course-1",
	title: "Introduction to Solana",
	description: "Learn the basics of Solana blockchain development",
	instructor: "John Doe",
	duration: 3600,
	level: "beginner" as const,
	tags: ["solana", "blockchain"],
	lessons: [
		{
			id: "lesson-1",
			title: "What is Solana?",
			type: "video" as const,
			duration: 600,
			content: "Solana is a high-performance blockchain...",
		},
	],
	enrollmentCount: 1250,
	rating: 4.8,
	createdAt: "2024-01-01T00:00:00Z",
};

export const mockLesson = {
	id: "lesson-1",
	title: "What is Solana?",
	type: "video" as const,
	duration: 600,
	content: "Solana is a high-performance blockchain platform...",
	resources: [
		{
			type: "link",
			title: "Solana Documentation",
			url: "https://docs.solana.com",
		},
	],
	quiz: {
		questions: [
			{
				id: "q1",
				question: "What makes Solana fast?",
				options: ["Proof of Work", "Proof of Stake", "Proof of History"],
				correctAnswer: 2,
			},
		],
	},
};

export const mockChallenge = {
	id: "challenge-1",
	title: "Build a Simple Counter DApp",
	description: "Create a decentralized counter application on Solana",
	difficulty: "beginner" as const,
	language: "typescript" as const,
	xpReward: 50,
	timeLimit: 1800, // 30 minutes
	starterCode: `// Write your Solana program here
import { PublicKey } from '@solana/web3.js';

export class CounterProgram {
  // Your code here
}`,
	testCases: [
		{
			input: {},
			expected: { count: 0 },
			description: "Initial counter value should be 0",
		},
	],
};

export const mockAchievement = {
	id: "achievement-1",
	title: "First Steps",
	description: "Complete your first lesson",
	icon: "🎯",
	xpReward: 10,
	rarity: "common" as const,
	unlockedAt: "2024-01-01T00:00:00Z",
};

export const mockWallet = {
	publicKey: "11111111111111111111111111111112",
	connected: true,
	balance: {
		sol: 1.5,
		tokens: [
			{
				mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
				amount: 100,
				symbol: "USDC",
				decimals: 6,
			},
		],
	},
};

// Mock service implementations
export const mockAuthService: Record<string, (...args: unknown[]) => unknown> = {
	signIn: vi.fn(),
	signOut: vi.fn(),
	getCurrentUser: vi.fn().mockResolvedValue(mockUser),
	refreshToken: vi.fn(),
};

export const mockCourseService: Record<string, (...args: unknown[]) => unknown> = {
	getCourses: vi.fn().mockResolvedValue([mockCourse]),
	getCourse: vi.fn().mockResolvedValue(mockCourse),
	enrollInCourse: vi.fn().mockResolvedValue({ success: true }),
	getUserProgress: vi.fn().mockResolvedValue({ completedLessons: ["lesson-1"] }),
};

export const mockWalletService: Record<string, (...args: unknown[]) => unknown> = {
	connect: vi.fn().mockResolvedValue(mockWallet),
	disconnect: vi.fn(),
	getBalance: vi.fn().mockResolvedValue(mockWallet.balance),
	signTransaction: vi.fn(),
};
