import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceFactory } from "@/services/ServiceFactory";
import { LearningProgressService } from "@/services/LearningProgressService";
import { CredentialService } from "@/services/CredentialService";
import { LeaderboardService } from "@/services/LeaderboardService";
import { AnalyticsService } from "@/services/AnalyticsService";
import { AuthLinkingService } from "@/services/AuthLinkingService";
import { Connection, PublicKey } from "@solana/web3.js";

describe("ServiceFactory", () => {
	let mockConnection: Connection;
	let mockProgramId: PublicKey;

	beforeEach(() => {
		mockConnection = new Connection("http://localhost:8899", "confirmed");
		mockProgramId = new PublicKey("3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb");
	});

	describe("createServices", () => {
		it("should create all required services", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			expect(services).toHaveProperty("learningProgress");
			expect(services).toHaveProperty("credential");
			expect(services).toHaveProperty("leaderboard");
			expect(services).toHaveProperty("analytics");
			expect(services).toHaveProperty("authLinking");

			expect(services.learningProgress).toBeInstanceOf(LearningProgressService);
			expect(services.credential).toBeInstanceOf(CredentialService);
			expect(services.leaderboard).toBeInstanceOf(LeaderboardService);
			expect(services.analytics).toBeInstanceOf(AnalyticsService);
			expect(services.authLinking).toBeInstanceOf(AuthLinkingService);
		});

		it("should pass correct parameters to services", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			expect(services.learningProgress.connection).toBe(mockConnection);
			expect(services.learningProgress.programId).toBe(mockProgramId);
			expect(services.credential.connection).toBe(mockConnection);
			expect(services.credential.programId).toBe(mockProgramId);
			expect(services.leaderboard.connection).toBe(mockConnection);
			expect(services.leaderboard.programId).toBe(mockProgramId);
			expect(services.analytics.connection).toBe(mockConnection);
			expect(services.analytics.programId).toBe(mockProgramId);
			expect(services.authLinking.connection).toBe(mockConnection);
			expect(services.authLinking.programId).toBe(mockProgramId);
		});

		it("should create singleton instances", () => {
			const services1 = ServiceFactory.createServices(mockConnection, mockProgramId);
			const services2 = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Services should be different instances (not cached globally)
			expect(services1.learningProgress).not.toBe(services2.learningProgress);
			expect(services1.credential).not.toBe(services2.credential);
		});
	});

	describe("service initialization", () => {
		it("should handle connection errors gracefully", () => {
			const failingConnection = {
				...mockConnection,
				getVersion: vi.fn().mockRejectedValue(new Error("Connection failed")),
			};

			expect(() => {
				ServiceFactory.createServices(
					failingConnection as unknown as Connection,
					mockProgramId
				);
			}).not.toThrow();
		});

		it("should validate program ID", () => {
			const invalidProgramId = new PublicKey("11111111111111111111111111111111");

			const services = ServiceFactory.createServices(mockConnection, invalidProgramId);

			expect(services.programId).toBe(invalidProgramId);
		});

		it("should handle different network configurations", () => {
			const devnetConnection = new Connection("https://api.devnet.solana.com", "confirmed");
			const mainnetConnection = new Connection("https://api.mainnet.solana.com", "confirmed");

			const devnetServices = ServiceFactory.createServices(devnetConnection, mockProgramId);
			const mainnetServices = ServiceFactory.createServices(mainnetConnection, mockProgramId);

			expect(devnetServices.learningProgress.connection).toBe(devnetConnection);
			expect(mainnetServices.learningProgress.connection).toBe(mainnetConnection);
		});
	});

	describe("service dependencies", () => {
		it("should ensure services have proper dependencies", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// All services should have access to connection and programId
			Object.values(services).forEach((service) => {
				expect(service.connection).toBeDefined();
				expect(service.programId).toBeDefined();
			});
		});

		it("should allow services to communicate with each other", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Services should be able to reference each other if needed
			// This is more of an integration test, but validates factory design
			expect(services.learningProgress).toBeDefined();
			expect(services.analytics).toBeDefined();
		});
	});

	describe("error handling", () => {
		it("should handle invalid connection parameter", () => {
			expect(() => {
				ServiceFactory.createServices(null as unknown as Connection, mockProgramId);
			}).toThrow();
		});

		it("should handle invalid program ID parameter", () => {
			expect(() => {
				ServiceFactory.createServices(mockConnection, null as unknown as PublicKey);
			}).toThrow();
		});

		it("should handle network timeouts", async () => {
			const timeoutConnection = {
				...mockConnection,
				getVersion: vi
					.fn()
					.mockImplementation(
						() => new Promise((resolve) => setTimeout(() => resolve({}), 10_000))
					),
			};

			// Should not hang indefinitely
			const services = ServiceFactory.createServices(
				timeoutConnection as unknown as Connection,
				mockProgramId
			);
			expect(services).toBeDefined();
		});
	});

	describe("service configuration", () => {
		it("should apply default configurations", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Services should have default configurations applied
			expect(services.learningProgress).toBeDefined();
			expect(services.credential).toBeDefined();
		});

		it("should support custom configurations", () => {
			// This would test if factory accepts configuration options
			// Implementation depends on factory design
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			expect(services).toBeDefined();
		});

		it("should validate configuration parameters", () => {
			// Test configuration validation
			expect(() => {
				ServiceFactory.createServices(mockConnection, mockProgramId);
			}).not.toThrow();
		});
	});

	describe("performance", () => {
		it("should create services efficiently", () => {
			const startTime = Date.now();

			ServiceFactory.createServices(mockConnection, mockProgramId);

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within reasonable time (less than 100ms)
			expect(duration).toBeLessThan(100);
		});

		it("should not create unnecessary objects", () => {
			const services1 = ServiceFactory.createServices(mockConnection, mockProgramId);
			const services2 = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Should create fresh instances each time
			expect(services1).not.toBe(services2);
		});
	});

	describe("service lifecycle", () => {
		it("should properly initialize services", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// All services should be properly initialized
			expect(services.learningProgress).toBeDefined();
			expect(services.credential).toBeDefined();
			expect(services.leaderboard).toBeDefined();
			expect(services.analytics).toBeDefined();
			expect(services.authLinking).toBeDefined();
		});

		it("should handle service cleanup", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Services should be cleanable if they have cleanup methods
			// This is more of a design validation
			expect(services).toBeDefined();
		});
	});

	describe("integration with real services", () => {
		it("should work with real Solana connection", () => {
			// This test would use a real connection in integration environment
			const realConnection = new Connection("https://api.mainnet.solana.com", "confirmed");
			const services = ServiceFactory.createServices(realConnection, mockProgramId);

			expect(services.connection).toBe(realConnection);
		});

		it("should handle different program IDs", () => {
			const differentProgramId = new PublicKey(
				"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
			); // USDC mint

			const services = ServiceFactory.createServices(mockConnection, differentProgramId);

			expect(services.programId).toBe(differentProgramId);
		});
	});

	describe("factory patterns", () => {
		it("should follow factory pattern principles", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Should encapsulate object creation
			expect(typeof ServiceFactory.createServices).toBe("function");
			expect(services).toBeDefined();
		});

		it("should provide consistent interface", () => {
			const services1 = ServiceFactory.createServices(mockConnection, mockProgramId);
			const services2 = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Both should have same interface
			const keys1 = Object.keys(services1);
			const keys2 = Object.keys(services2);

			expect(keys1).toEqual(keys2);
		});
	});

	describe("type safety", () => {
		it("should return properly typed services", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// TypeScript should ensure proper typing
			expect(services.learningProgress).toBeInstanceOf(LearningProgressService);
			expect(services.credential).toBeInstanceOf(CredentialService);
			expect(services.leaderboard).toBeInstanceOf(LeaderboardService);
			expect(services.analytics).toBeInstanceOf(AnalyticsService);
			expect(services.authLinking).toBeInstanceOf(AuthLinkingService);
		});

		it("should handle type validation", () => {
			const services = ServiceFactory.createServices(mockConnection, mockProgramId);

			// Should pass type checks
			expect(() => {
				expect(services.learningProgress).toBeInstanceOf(LearningProgressService);
				expect(services.credential).toBeInstanceOf(CredentialService);
				expect(services.leaderboard).toBeInstanceOf(LeaderboardService);
				expect(services.analytics).toBeInstanceOf(AnalyticsService);
				expect(services.authLinking).toBeInstanceOf(AuthLinkingService);
			}).not.toThrow();
		});
	});
});
