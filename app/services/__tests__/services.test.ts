import { describe, it, expect, vi, beforeEach } from "vitest";
import { PublicKey, Connection } from "@solana/web3.js";

// Mock @superteam/anchor
vi.mock("@superteam/anchor", () => {
	const mockClient = {
		fetchConfig: vi.fn(),
		fetchCourse: vi.fn(),
		fetchEnrollment: vi.fn(),
		fetchEnrollmentsForLearner: vi.fn(),
		fetchAllCourses: vi.fn(),
		fetchAllAchievementTypes: vi.fn(),
		fetchAchievementReceipt: vi.fn(),
		fetchXpBalance: vi.fn(),
	};
	return {
		AcademyClient: vi.fn(() => mockClient),
		countCompletedLessons: vi.fn(() => 3),
		isLessonCompleted: vi.fn(() => true),
		__mockClient: mockClient,
	};
});

vi.mock("@superteam/solana", () => ({
	findToken2022ATA: vi.fn(() => PublicKey.default),
}));

const PROGRAM_ID = PublicKey.default;
const MOCK_LEARNER = new PublicKey("11111111111111111111111111111111");

function createMockConnection() {
	return {
		getTokenLargestAccounts: vi.fn().mockResolvedValue({ value: [] }),
		getMultipleAccountsInfo: vi.fn().mockResolvedValue([]),
	} as unknown as Connection;
}

describe("AchievementService", () => {
	let service: Awaited<typeof import("@/services/AchievementService")>["AchievementService"];
	let mockClient: ReturnType<typeof getMockClient>;

	function getMockClient() {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("@superteam/anchor").__mockClient;
	}

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/AchievementService");
		service = new mod.AchievementService(createMockConnection(), PROGRAM_ID);
		mockClient = getMockClient();
	});

	it("getAllAchievementTypes returns mapped accounts", async () => {
		const mockTypes = [
			{
				pubkey: PublicKey.default,
				account: {
					achievementId: "first-course",
					name: "First Course",
					metadataUri: "https://arweave.net/abc",
					collection: PublicKey.default,
					xpReward: 100,
					maxSupply: 0,
					currentSupply: 5,
					isActive: true,
					createdAt: 1700000000,
				},
			},
		];
		mockClient.fetchAllAchievementTypes.mockResolvedValue(mockTypes);

		const result = await service.getAllAchievementTypes();
		expect(result).toHaveLength(1);
		expect(result[0].achievementId).toBe("first-course");
		expect(result[0].xpReward).toBe(100);
	});

	it("hasAchievement returns true when receipt exists", async () => {
		mockClient.fetchAchievementReceipt.mockResolvedValue({ awardedAt: 1700000000 });
		const result = await service.hasAchievement("first-course", MOCK_LEARNER);
		expect(result).toBe(true);
	});

	it("hasAchievement returns false when receipt is null", async () => {
		mockClient.fetchAchievementReceipt.mockResolvedValue(null);
		const result = await service.hasAchievement("first-course", MOCK_LEARNER);
		expect(result).toBe(false);
	});

	it("getLearnerAchievements enriches with receipt data", async () => {
		const mockTypes = [
			{
				pubkey: PublicKey.default,
				account: {
					achievementId: "a1",
					name: "Achievement 1",
					metadataUri: "",
					collection: PublicKey.default,
					xpReward: 50,
					maxSupply: 0,
					currentSupply: 0,
					isActive: true,
					createdAt: 1700000000,
				},
			},
		];
		mockClient.fetchAllAchievementTypes.mockResolvedValue(mockTypes);
		mockClient.fetchAchievementReceipt.mockResolvedValue({
			awardedAt: 1700001000,
			asset: PublicKey.default,
		});

		const result = await service.getLearnerAchievements(MOCK_LEARNER);
		expect(result).toHaveLength(1);
		expect(result[0].earned).toBe(true);
		expect(result[0].awardedAt).toBe(1700001000);
	});
});

describe("LeaderboardService", () => {
	let service: Awaited<typeof import("@/services/LeaderboardService")>["LeaderboardService"];

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/LeaderboardService");
		service = new mod.LeaderboardService(createMockConnection(), PROGRAM_ID);
	});

	it("getUserXp returns 0n when no balance", async () => {
		const mockClient = require("@superteam/anchor").__mockClient;
		mockClient.fetchXpBalance.mockResolvedValue(null);

		const result = await service.getUserXp(MOCK_LEARNER, PublicKey.default);
		expect(result).toBe(0n);
	});

	it("getUserXp returns balance when available", async () => {
		const mockClient = require("@superteam/anchor").__mockClient;
		mockClient.fetchXpBalance.mockResolvedValue(500n);

		const result = await service.getUserXp(MOCK_LEARNER, PublicKey.default);
		expect(result).toBe(500n);
	});

	it("getLeaderboard returns empty array when no accounts", async () => {
		const result = await service.getLeaderboard(PublicKey.default, 10);
		expect(result).toEqual([]);
	});
});

describe("CredentialService", () => {
	let service: Awaited<typeof import("@/services/CredentialService")>["CredentialService"];

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/CredentialService");
		service = new mod.CredentialService(createMockConnection(), PROGRAM_ID);
	});

	it("getTrackRequirements returns correct thresholds", () => {
		const reqs = service.getTrackRequirements("Beginner");
		expect(reqs).toEqual({ courses: 1, xp: 100 });
	});

	it("getTrackRequirements throws for invalid track", () => {
		expect(() => service.getTrackRequirements("Nonexistent")).toThrow("Invalid track");
	});
});
