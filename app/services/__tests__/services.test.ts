import { describe, it, expect, vi, beforeEach } from "vitest";
import { PublicKey, type Connection } from "@solana/web3.js";

// Mock @superteam-academy/anchor
const __mockClient = {
	fetchConfig: vi.fn(),
	fetchCourse: vi.fn(),
	fetchEnrollment: vi.fn(),
	fetchEnrollmentsForLearner: vi.fn(),
	fetchAllCourses: vi.fn(),
	fetchAllAchievementTypes: vi.fn(),
	fetchAchievementReceipt: vi.fn(),
	fetchXpBalance: vi.fn(),
};

vi.mock("@superteam-academy/anchor", () => {
	return {
		AcademyClient: function AcademyClient() {
			return __mockClient;
		},
		countCompletedLessons: vi.fn(() => 3),
		isLessonCompleted: vi.fn(() => true),
	};
});

vi.mock("@superteam-academy/solana", () => ({
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
	let service: InstanceType<
		Awaited<typeof import("@/services/achievement-service")>["AchievementService"]
	>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/achievement-service");
		service = new mod.AchievementService(createMockConnection(), PROGRAM_ID);
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
					createdAt: 1_700_000_000,
				},
			},
		];
		__mockClient.fetchAllAchievementTypes.mockResolvedValue(mockTypes);

		const result = await service.getAllAchievementTypes();
		expect(result).toHaveLength(1);
		expect(result[0].achievementId).toBe("first-course");
		expect(result[0].xpReward).toBe(100);
	});

	it("hasAchievement returns true when receipt exists", async () => {
		__mockClient.fetchAchievementReceipt.mockResolvedValue({ awardedAt: 1_700_000_000 });
		const result = await service.hasAchievement("first-course", MOCK_LEARNER);
		expect(result).toBe(true);
	});

	it("hasAchievement returns false when receipt is null", async () => {
		__mockClient.fetchAchievementReceipt.mockResolvedValue(null);
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
					createdAt: 1_700_000_000,
				},
			},
		];
		__mockClient.fetchAllAchievementTypes.mockResolvedValue(mockTypes);
		__mockClient.fetchAchievementReceipt.mockResolvedValue({
			awardedAt: 1_700_001_000,
			asset: PublicKey.default,
		});

		const result = await service.getLearnerAchievements(MOCK_LEARNER);
		expect(result).toHaveLength(1);
		expect(result[0].earned).toBe(true);
		expect(result[0].awardedAt).toBe(1_700_001_000);
	});
});

describe("LeaderboardService", () => {
	let service: InstanceType<
		Awaited<typeof import("@/services/leaderboard-service")>["LeaderboardService"]
	>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/leaderboard-service");
		service = new mod.LeaderboardService(createMockConnection(), PROGRAM_ID);
	});

	it("getUserXp returns 0n when no balance", async () => {
		__mockClient.fetchXpBalance.mockResolvedValue(null);

		const result = await service.getUserXp(MOCK_LEARNER, PublicKey.default);
		expect(result).toBe(0n);
	});

	it("getUserXp returns balance when available", async () => {
		__mockClient.fetchXpBalance.mockResolvedValue(500n);

		const result = await service.getUserXp(MOCK_LEARNER, PublicKey.default);
		expect(result).toBe(500n);
	});

	it("getLeaderboard returns empty array when no accounts", async () => {
		const result = await service.getLeaderboard(PublicKey.default, 10);
		expect(result).toEqual([]);
	});
});

describe("CredentialService", () => {
	let service: InstanceType<
		Awaited<typeof import("@/services/credential-service")>["CredentialService"]
	>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/credential-service");
		service = new mod.CredentialService(createMockConnection(), PROGRAM_ID);
	});

	it("getTrackRequirements returns correct thresholds", () => {
		const reqs = service.getTrackRequirements("Beginner");
		expect(reqs).toEqual({ courses: 1, xp: 100 });
	});

	it("getTrackRequirements throws for invalid track", () => {
		expect(() => service.getTrackRequirements("Nonexistent")).toThrow("Invalid track");
	});

	it("getTrackRequirements returns all valid tracks", () => {
		expect(service.getTrackRequirements("Intermediate")).toEqual({ courses: 3, xp: 1000 });
		expect(service.getTrackRequirements("Advanced")).toEqual({ courses: 5, xp: 2500 });
		expect(service.getTrackRequirements("Expert")).toEqual({ courses: 8, xp: 5000 });
	});

	it("issueCredential rejects invalid track", async () => {
		const result = await service.issueCredential(MOCK_LEARNER, "FakeTrack", 1, 100);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Invalid track");
	});

	it("issueCredential rejects unmet requirements", async () => {
		const result = await service.issueCredential(MOCK_LEARNER, "Advanced", 1, 50);
		expect(result.success).toBe(false);
		expect(result.error).toContain("requirements not met");
	});

	it("issueCredential rejects missing options", async () => {
		const result = await service.issueCredential(MOCK_LEARNER, "Beginner", 1, 100);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Missing credential options");
	});

	it("getEnrollmentCredential returns null when no enrollment", async () => {
		__mockClient.fetchEnrollment.mockResolvedValue(null);
		const result = await service.getEnrollmentCredential("course-1", MOCK_LEARNER);
		expect(result).toBeNull();
	});

	it("getEnrollmentCredential returns null when no course found", async () => {
		__mockClient.fetchEnrollment.mockResolvedValue({
			credentialAsset: PublicKey.default,
			course: PublicKey.default,
			enrolledAt: 1_700_000_000,
			completedAt: null,
		});
		__mockClient.fetchCourse.mockResolvedValue(null);
		const result = await service.getEnrollmentCredential("course-1", MOCK_LEARNER);
		expect(result).toBeNull();
	});

	it("getEnrollmentCredential returns credential when enrollment and course exist", async () => {
		__mockClient.fetchEnrollment.mockResolvedValue({
			credentialAsset: PublicKey.default,
			course: PublicKey.default,
			enrolledAt: 1_700_000_000,
			completedAt: 1_700_001_000,
		});
		__mockClient.fetchCourse.mockResolvedValue({
			trackId: 1,
			trackLevel: 2,
			xpPerLesson: 10,
			lessonCount: 5,
		});
		const result = await service.getEnrollmentCredential("course-1", MOCK_LEARNER);
		expect(result).not.toBeNull();
		expect(result?.totalXp).toBe(50);
		expect(result?.isActive).toBe(true);
	});
});

describe("LearningProgressService", () => {
	let service: InstanceType<
		Awaited<typeof import("@/services/learning-progress-service")>["LearningProgressService"]
	>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/learning-progress-service");
		service = new mod.LearningProgressService(createMockConnection(), PROGRAM_ID);
	});

	it("getLearnerStats returns zero stats when no enrollments", async () => {
		__mockClient.fetchEnrollmentsForLearner.mockResolvedValue([]);
		__mockClient.fetchXpBalance.mockResolvedValue(0n);

		const result = await service.getLearnerStats(MOCK_LEARNER, PublicKey.default);
		expect(result.enrolledCourses).toBe(0);
		expect(result.completedCourses).toBe(0);
		expect(result.totalLessonsCompleted).toBe(0);
		expect(result.totalXp).toBe(0n);
	});

	it("getLearnerStats counts completed courses", async () => {
		__mockClient.fetchEnrollmentsForLearner.mockResolvedValue([
			{ account: { lessonFlags: [0xff], completedAt: 1_700_001_000 } },
			{ account: { lessonFlags: [0x01], completedAt: null } },
		]);
		__mockClient.fetchXpBalance.mockResolvedValue(250n);

		const result = await service.getLearnerStats(MOCK_LEARNER, PublicKey.default);
		expect(result.enrolledCourses).toBe(2);
		expect(result.completedCourses).toBe(1);
		expect(result.totalXp).toBe(250n);
	});

	it("getLearnerStats returns 0 xp when xpMint is null", async () => {
		__mockClient.fetchEnrollmentsForLearner.mockResolvedValue([]);
		const result = await service.getLearnerStats(MOCK_LEARNER, null);
		expect(result.totalXp).toBe(0n);
	});

	it("getLearnerOverview includes recommended courses", async () => {
		const enrolledCourseKey = PublicKey.unique();
		const unenrolledCourseKey = PublicKey.unique();

		__mockClient.fetchConfig.mockResolvedValue({ xpMint: PublicKey.default });
		__mockClient.fetchAllCourses.mockResolvedValue([
			{
				pubkey: enrolledCourseKey,
				account: { courseId: "c1", lessonCount: 5, xpPerLesson: 10, isActive: true },
			},
			{
				pubkey: unenrolledCourseKey,
				account: { courseId: "c2", lessonCount: 3, xpPerLesson: 20, isActive: true },
			},
		]);
		__mockClient.fetchEnrollmentsForLearner.mockResolvedValue([
			{
				pubkey: PublicKey.default,
				account: {
					course: enrolledCourseKey,
					lessonFlags: [0x01],
					completedAt: null,
					enrolledAt: 1_700_000_000,
				},
			},
		]);
		__mockClient.fetchXpBalance.mockResolvedValue(100n);
		__mockClient.fetchAllAchievementTypes.mockResolvedValue([]);
		__mockClient.fetchAchievementReceipt.mockResolvedValue(null);

		const result = await service.getLearnerOverview(MOCK_LEARNER);
		expect(result.courses).toHaveLength(1);
		expect(result.recommendedCourses).toHaveLength(1);
		expect(result.recommendedCourses[0].id).toBe("c2");
	});

	it("getLearnerProgressSnapshot maps courses and achievements", async () => {
		__mockClient.fetchConfig.mockResolvedValue({ xpMint: PublicKey.default });
		__mockClient.fetchAllCourses.mockResolvedValue([]);
		__mockClient.fetchEnrollmentsForLearner.mockResolvedValue([]);
		__mockClient.fetchXpBalance.mockResolvedValue(0n);
		__mockClient.fetchAllAchievementTypes.mockResolvedValue([]);

		const result = await service.getLearnerProgressSnapshot(MOCK_LEARNER);
		expect(result.totalXp).toBe(0);
		expect(result.courses).toEqual([]);
		expect(result.achievements).toEqual([]);
	});
});
