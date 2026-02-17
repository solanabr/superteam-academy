import { describe, it, expect, beforeEach } from "vitest";
import { StubCredentialService } from "@superteam-academy/services";

describe("StubCredentialService", () => {
	let service: StubCredentialService;

	beforeEach(() => {
		service = new StubCredentialService();
	});

	describe("issueCredential", () => {
		it("should issue a credential successfully", async () => {
			const request = {
				learnerId: "learner-123",
				trackId: "track-456",
				level: 1,
			};

			const result = await service.issueCredential(request);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.learnerId).toBe("learner-123");
			expect(result.data?.trackId).toBe("track-456");
			expect(result.data?.level).toBe(1);
			expect(result.data?.issuedAt).toBeInstanceOf(Date);
			expect(result.data?.metadataUri).toContain("arweave.net");
			expect(result.data?.assetId).toMatch(/^asset_\d+$/);
		});

		it("should generate unique credential IDs", async () => {
			const request1 = {
				learnerId: "learner-1",
				trackId: "track-1",
				level: 1,
			};

			const request2 = {
				learnerId: "learner-2",
				trackId: "track-2",
				level: 1,
			};

			const result1 = await service.issueCredential(request1);
			const result2 = await service.issueCredential(request2);

			expect(result1.data?.id).not.toBe(result2.data?.id);
		});
	});

	describe("getCredential", () => {
		it("should return credential when it exists", async () => {
			const request = {
				learnerId: "learner-123",
				trackId: "track-456",
				level: 1,
			};

			const issueResult = await service.issueCredential(request);
			const credentialId = issueResult.data?.id;

			const getResult = await service.getCredential(credentialId);

			expect(getResult.success).toBe(true);
			expect(getResult.data).toEqual(issueResult.data);
		});

		it("should return error when credential does not exist", async () => {
			const result = await service.getCredential("non-existent-id");

			expect(result.success).toBe(false);
			expect(result.error).toBe("Credential not found");
			expect(result.data).toBeUndefined();
		});
	});

	describe("getLearnerCredentials", () => {
		it("should return all credentials for a learner", async () => {
			const learnerId = "learner-123";

			// Issue multiple credentials for the same learner
			const request1 = { learnerId, trackId: "track-1", level: 1 };
			const request2 = { learnerId, trackId: "track-2", level: 2 };
			const request3 = { learnerId: "other-learner", trackId: "track-3", level: 1 };

			await service.issueCredential(request1);
			await service.issueCredential(request2);
			await service.issueCredential(request3);

			const result = await service.getLearnerCredentials(learnerId);

			expect(result.success).toBe(true);
			expect(result.data).toHaveLength(2);
			expect(result.data?.every((cred) => cred.learnerId === learnerId)).toBe(true);
		});

		it("should return empty array when learner has no credentials", async () => {
			const result = await service.getLearnerCredentials("learner-without-credentials");

			expect(result.success).toBe(true);
			expect(result.data).toEqual([]);
		});
	});

	describe("verifyCredential", () => {
		it("should verify existing credential as valid", async () => {
			const request = {
				learnerId: "learner-123",
				trackId: "track-456",
				level: 1,
			};

			const issueResult = await service.issueCredential(request);
			const credentialId = issueResult.data?.id;

			const verifyResult = await service.verifyCredential(credentialId);

			expect(verifyResult.success).toBe(true);
			expect(verifyResult.data?.isValid).toBe(true);
			expect(verifyResult.data?.credential).toEqual(issueResult.data);
			expect(verifyResult.data?.verificationDetails.method).toBe("stub_verification");
			expect(verifyResult.data?.verificationDetails.verifiedAt).toBeInstanceOf(Date);
		});

		it("should verify non-existent credential as invalid", async () => {
			const result = await service.verifyCredential("non-existent-id");

			expect(result.success).toBe(true);
			expect(result.data?.isValid).toBe(false);
			expect(result.data?.credential).toBeUndefined();
		});
	});

	describe("upgradeCredential", () => {
		it("should upgrade credential level successfully", async () => {
			const request = {
				learnerId: "learner-123",
				trackId: "track-456",
				level: 1,
			};

			const issueResult = await service.issueCredential(request);
			const credentialId = issueResult.data?.id;

			const upgradeResult = await service.upgradeCredential(credentialId, 3);

			expect(upgradeResult.success).toBe(true);
			expect(upgradeResult.data?.level).toBe(3);
			expect(upgradeResult.data?.id).toBe(credentialId);
		});

		it("should return error when upgrading non-existent credential", async () => {
			const result = await service.upgradeCredential("non-existent-id", 2);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Credential not found");
		});
	});

	describe("revokeCredential", () => {
		it("should revoke existing credential successfully", async () => {
			const request = {
				learnerId: "learner-123",
				trackId: "track-456",
				level: 1,
			};

			const issueResult = await service.issueCredential(request);
			const credentialId = issueResult.data?.id;

			// Verify credential exists
			const getBeforeRevoke = await service.getCredential(credentialId);
			expect(getBeforeRevoke.success).toBe(true);

			// Revoke credential
			const revokeResult = await service.revokeCredential(credentialId, "Test revocation");
			expect(revokeResult.success).toBe(true);

			// Verify credential no longer exists
			const getAfterRevoke = await service.getCredential(credentialId);
			expect(getAfterRevoke.success).toBe(false);
		});

		it("should return error when revoking non-existent credential", async () => {
			const result = await service.revokeCredential("non-existent-id", "Test reason");

			expect(result.success).toBe(false);
			expect(result.error).toBe("Credential not found");
		});
	});

	describe("Service Isolation", () => {
		it("should maintain separate credential stores for different service instances", async () => {
			const service1 = new StubCredentialService();
			const service2 = new StubCredentialService();

			const request = {
				learnerId: "learner-123",
				trackId: "track-456",
				level: 1,
			};

			const result1 = await service1.issueCredential(request);
			const result2 = await service2.getCredential(result1.data?.id);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(false); // Should not find credential from different service instance
		});
	});
});
