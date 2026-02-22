import { describe, it, expect, vi, beforeEach } from "vitest";
import { StubCredentialService } from "@/services/StubCredentialService";
import { Connection, PublicKey } from "@solana/web3.js";
import { createMockUser } from "@/test/utils/test-utils";

describe("StubCredentialService", () => {
	let service: StubCredentialService;
	let mockConnection: Connection;
	let mockProgramId: PublicKey;
	let mockUser: ReturnType<typeof createMockUser>;

	beforeEach(() => {
		mockConnection = new Connection("http://localhost:8899", "confirmed");
		mockProgramId = new PublicKey("3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb");
		mockUser = createMockUser();
		service = new StubCredentialService(mockConnection, mockProgramId);
	});

	describe("initialization", () => {
		it("should initialize with correct parameters", () => {
			expect(service.connection).toBe(mockConnection);
			expect(service.programId).toBe(mockProgramId);
		});

		it("should have default mock data", () => {
			expect(service).toBeInstanceOf(StubCredentialService);
		});
	});

	describe("getUserCredentials", () => {
		it("should return empty array for new user", async () => {
			const credentials = await service.getUserCredentials(mockUser.id);
			expect(credentials).toEqual([]);
		});

		it("should return mock credentials for existing user", async () => {
			// Add mock credential
			const mockCredential = {
				id: "cred-1",
				track: "Beginner",
				issuedAt: new Date("2024-01-15"),
				coursesCompleted: 3,
				totalXp: 750,
				metadataUri: "https://arweave.net/credential-metadata",
				isActive: true,
			};

			// Mock the internal data
			service.credentials.set(mockUser.id, [mockCredential]);

			const credentials = await service.getUserCredentials(mockUser.id);
			expect(credentials).toHaveLength(1);
			expect(credentials[0]).toEqual(mockCredential);
		});

		it("should handle invalid user ID", async () => {
			const credentials = await service.getUserCredentials("invalid-id");
			expect(credentials).toEqual([]);
		});
	});

	describe("issueCredential", () => {
		it("should issue credential for valid track completion", async () => {
			const learner = new PublicKey("11111111111111111111111111111112");
			const track = "Beginner";
			const coursesCompleted = 3;
			const totalXp = 750;

			const result = await service.issueCredential(learner, track, coursesCompleted, totalXp);

			expect(result.success).toBe(true);
			expect(result.credentialId).toBeDefined();
			expect(typeof result.credentialId).toBe("string");
		});

		it("should reject invalid track", async () => {
			const learner = new PublicKey("11111111111111111111111111111112");
			const track = "InvalidTrack";
			const coursesCompleted = 1;
			const totalXp = 100;

			const result = await service.issueCredential(learner, track, coursesCompleted, totalXp);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid track");
		});

		it("should reject insufficient requirements", async () => {
			const learner = new PublicKey("11111111111111111111111111111112");
			const track = "Intermediate";
			const coursesCompleted = 1; // Need 3 for intermediate
			const totalXp = 500; // Need 1000 for intermediate

			const result = await service.issueCredential(learner, track, coursesCompleted, totalXp);

			expect(result.success).toBe(false);
			expect(result.error).toContain("requirements not met");
		});

		it("should handle network errors", async () => {
			// Mock connection error
			const brokenConnection = {
				...mockConnection,
				getAccountInfo: vi.fn().mockRejectedValue(new Error("Network error")),
			};

			const failingService = new StubCredentialService(
				brokenConnection as unknown as Connection,
				mockProgramId
			);
			const learner = new PublicKey("11111111111111111111111111111112");

			const result = await failingService.issueCredential(learner, "Beginner", 3, 750);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Network error");
		});
	});

	describe("verifyCredential", () => {
		it("should verify existing credential", async () => {
			const credentialId = "cred-1";

			// Mock existing credential
			service.credentials.set("user-1", [
				{
					id: credentialId,
					track: "Beginner",
					issuedAt: new Date(),
					coursesCompleted: 3,
					totalXp: 750,
					metadataUri: "https://arweave.net/credential-metadata",
					isActive: true,
				},
			]);

			const result = await service.verifyCredential(credentialId);

			expect(result.isValid).toBe(true);
			expect(result.credential).toBeDefined();
			expect(result.credential?.id).toBe(credentialId);
		});

		it("should reject invalid credential ID", async () => {
			const result = await service.verifyCredential("invalid-id");

			expect(result.isValid).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("should reject inactive credentials", async () => {
			const credentialId = "cred-1";

			// Mock inactive credential
			service.credentials.set("user-1", [
				{
					id: credentialId,
					track: "Beginner",
					issuedAt: new Date(),
					coursesCompleted: 3,
					totalXp: 750,
					metadataUri: "https://arweave.net/credential-metadata",
					isActive: false,
				},
			]);

			const result = await service.verifyCredential(credentialId);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain("inactive");
		});
	});

	describe("getCredentialMetadata", () => {
		it("should return metadata for valid credential", async () => {
			const credentialId = "cred-1";
			const expectedMetadata = {
				name: "Superteam Academy Credential",
				description: "Completion credential for Beginner track",
				image: "https://arweave.net/credential-image",
				attributes: [
					{ trait_type: "Track", value: "Beginner" },
					{ trait_type: "Courses Completed", value: "3" },
					{ trait_type: "Total XP", value: "750" },
				],
			};

			const metadata = await service.getCredentialMetadata(credentialId);

			expect(metadata).toEqual(expectedMetadata);
		});

		it("should handle metadata fetch errors", async () => {
			const credentialId = "error-cred";

			// Mock metadata fetch error
			service.metadataCache.set(credentialId, null);

			await expect(service.getCredentialMetadata(credentialId)).rejects.toThrow();
		});
	});

	describe("revokeCredential", () => {
		it("should revoke existing credential", async () => {
			const credentialId = "cred-1";

			// Mock existing credential
			service.credentials.set("user-1", [
				{
					id: credentialId,
					track: "Beginner",
					issuedAt: new Date(),
					coursesCompleted: 3,
					totalXp: 750,
					metadataUri: "https://arweave.net/credential-metadata",
					isActive: true,
				},
			]);

			const result = await service.revokeCredential(credentialId);

			expect(result.success).toBe(true);

			// Verify credential is now inactive
			const verifyResult = await service.verifyCredential(credentialId);
			expect(verifyResult.isValid).toBe(false);
		});

		it("should handle non-existent credential", async () => {
			const result = await service.revokeCredential("non-existent");

			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});
	});

	describe("getTrackRequirements", () => {
		it("should return correct requirements for each track", () => {
			const beginnerReq = service.getTrackRequirements("Beginner");
			expect(beginnerReq).toEqual({ courses: 1, xp: 100 });

			const intermediateReq = service.getTrackRequirements("Intermediate");
			expect(intermediateReq).toEqual({ courses: 3, xp: 1000 });

			const advancedReq = service.getTrackRequirements("Advanced");
			expect(advancedReq).toEqual({ courses: 5, xp: 2500 });

			const expertReq = service.getTrackRequirements("Expert");
			expect(expertReq).toEqual({ courses: 8, xp: 5000 });
		});

		it("should throw for invalid track", () => {
			expect(() => service.getTrackRequirements("Invalid")).toThrow("Invalid track");
		});
	});

	describe("getCredentialsByTrack", () => {
		it("should return credentials filtered by track", async () => {
			const userId = "user-1";

			// Mock multiple credentials
			service.credentials.set(userId, [
				{
					id: "cred-1",
					track: "Beginner",
					issuedAt: new Date(),
					coursesCompleted: 1,
					totalXp: 100,
					metadataUri: "https://arweave.net/credential-1",
					isActive: true,
				},
				{
					id: "cred-2",
					track: "Intermediate",
					issuedAt: new Date(),
					coursesCompleted: 3,
					totalXp: 1000,
					metadataUri: "https://arweave.net/credential-2",
					isActive: true,
				},
			]);

			const beginnerCreds = await service.getCredentialsByTrack(userId, "Beginner");
			expect(beginnerCreds).toHaveLength(1);
			expect(beginnerCreds[0].track).toBe("Beginner");

			const intermediateCreds = await service.getCredentialsByTrack(userId, "Intermediate");
			expect(intermediateCreds).toHaveLength(1);
			expect(intermediateCreds[0].track).toBe("Intermediate");
		});

		it("should return empty array for user with no credentials", async () => {
			const creds = await service.getCredentialsByTrack("new-user", "Beginner");
			expect(creds).toEqual([]);
		});
	});

	describe("error handling", () => {
		it("should handle connection failures gracefully", async () => {
			const failingConnection = {
				...mockConnection,
				getProgramAccounts: vi.fn().mockRejectedValue(new Error("Connection failed")),
			};

			const failingService = new StubCredentialService(
				failingConnection as unknown as Connection,
				mockProgramId
			);

			await expect(failingService.getUserCredentials("user-1")).rejects.toThrow(
				"Connection failed"
			);
		});

		it("should validate input parameters", async () => {
			const learner = new PublicKey("11111111111111111111111111111112");

			// Invalid track
			const result1 = await service.issueCredential(learner, "", 1, 100);
			expect(result1.success).toBe(false);

			// Invalid courses count
			const result2 = await service.issueCredential(learner, "Beginner", -1, 100);
			expect(result2.success).toBe(false);

			// Invalid XP
			const result3 = await service.issueCredential(learner, "Beginner", 1, -100);
			expect(result3.success).toBe(false);
		});
	});

	describe("caching behavior", () => {
		it("should cache credential metadata", async () => {
			const credentialId = "cred-1";

			// First call
			const metadata1 = await service.getCredentialMetadata(credentialId);

			// Second call should use cache
			const metadata2 = await service.getCredentialMetadata(credentialId);

			expect(metadata1).toEqual(metadata2);
			// Verify cache is used (implementation detail)
		});

		it("should handle cache misses", async () => {
			const credentialId = "new-cred";

			const metadata = await service.getCredentialMetadata(credentialId);
			expect(metadata).toBeDefined();
			expect(metadata.name).toContain("Superteam Academy");
		});
	});
});
