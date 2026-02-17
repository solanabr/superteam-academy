import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	ServiceFactory,
	type ServiceEnvironment,
	type ServiceConfig,
} from "@superteam-academy/services";
import { type Connection, PublicKey } from "@solana/web3.js";

// Mock the service implementations
vi.mock("@superteam-academy/services", async () => {
	const actual = await vi.importActual("@superteam-academy/services");
	return {
		...actual,
		SolanaLearningProgressService: vi.fn(),
		MPLCoreCredentialService: vi.fn(),
		DatabaseLeaderboardService: vi.fn(),
		HeliusLeaderboardService: vi.fn(),
		GA4AnalyticsService: vi.fn(),
		BetterAuthLinkingService: vi.fn(),
		DevnetLearningProgressService: vi.fn(),
		MainnetLearningProgressService: vi.fn(),
		DevnetCredentialService: vi.fn(),
		MainnetCredentialService: vi.fn(),
		DevnetLeaderboardService: vi.fn(),
		MainnetLeaderboardService: vi.fn(),
		DevnetAnalyticsService: vi.fn(),
		MainnetAnalyticsService: vi.fn(),
		DevnetAuthLinkingService: vi.fn(),
		MainnetAuthLinkingService: vi.fn(),
		InMemoryServiceTracer: vi.fn(),
		EnvironmentServiceConfiguration: vi.fn(),
		InMemoryServiceDiscovery: vi.fn(),
		DefaultServiceHealth: vi.fn(),
		InMemoryServiceMetrics: vi.fn(),
		ConsoleServiceLogger: vi.fn(),
	};
});

describe("ServiceFactory", () => {
	let mockConnection: Connection;
	let mockWallet: unknown;
	let mockProgramId: PublicKey;

	beforeEach(() => {
		// Reset singleton instance
		(ServiceFactory as unknown).instance = undefined;

		// Create mocks
		mockConnection = {} as Connection;
		mockWallet = { publicKey: new PublicKey("11111111111111111111111111111112") };
		mockProgramId = new PublicKey("11111111111111111111111111111112");
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Singleton Pattern", () => {
		it("should create a single instance", () => {
			const config: ServiceConfig = {
				environment: "development",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory1 = ServiceFactory.initialize(config);
			const factory2 = ServiceFactory.getInstance();

			expect(factory1).toBe(factory2);
		});

		it("should throw error when getting instance before initialization", () => {
			expect(() => ServiceFactory.getInstance()).toThrow(
				"ServiceFactory not initialized. Call initialize() first."
			);
		});
	});

	describe("Service Configuration", () => {
		it("should accept valid configuration", () => {
			const config: ServiceConfig = {
				environment: "development",
				baseUrl: "https://api.example.com",
				apiKey: "test-key",
				timeout: 5000,
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
				analytics: {
					measurementId: "GA-TEST",
				},
				auth: {
					betterAuth: {},
				},
				database: {
					url: "postgresql://test",
				},
				helius: {
					apiKey: "helius-test-key",
				},
			};

			expect(() => ServiceFactory.initialize(config)).not.toThrow();
		});

		it("should store configuration internally", () => {
			const config: ServiceConfig = {
				environment: "devnet",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			expect((factory as unknown).config).toBe(config);
		});
	});

	describe("LearningProgressService", () => {
		it("should return SolanaLearningProgressService for development environment", () => {
			const config: ServiceConfig = {
				environment: "development",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getLearningProgressService();

			expect(service).toBeDefined();
			// Verify the correct constructor was called
			const { SolanaLearningProgressService } = require("@superteam-academy/services");
			expect(SolanaLearningProgressService).toHaveBeenCalledWith(
				mockConnection,
				mockProgramId,
				mockWallet
			);
		});

		it("should return DevnetLearningProgressService for devnet environment", () => {
			const config: ServiceConfig = {
				environment: "devnet",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getLearningProgressService();

			expect(service).toBeDefined();
			const { DevnetLearningProgressService } = require("@superteam-academy/services");
			expect(DevnetLearningProgressService).toHaveBeenCalledWith(mockWallet);
		});

		it("should return MainnetLearningProgressService for mainnet environment", () => {
			const config: ServiceConfig = {
				environment: "mainnet",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getLearningProgressService();

			expect(service).toBeDefined();
			const { MainnetLearningProgressService } = require("@superteam-academy/services");
			expect(MainnetLearningProgressService).toHaveBeenCalledWith(mockWallet);
		});

		it("should throw error for development without Solana config", () => {
			const config: ServiceConfig = {
				environment: "development",
				// Missing solana config
			};

			const factory = ServiceFactory.initialize(config);

			expect(() => factory.getLearningProgressService()).toThrow(
				"Solana configuration required for LearningProgressService"
			);
		});

		it("should cache service instance", () => {
			const config: ServiceConfig = {
				environment: "devnet",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service1 = factory.getLearningProgressService();
			const service2 = factory.getLearningProgressService();

			expect(service1).toBe(service2);
		});
	});

	describe("CredentialService", () => {
		it("should return MPLCoreCredentialService for development environment", () => {
			const config: ServiceConfig = {
				environment: "development",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getCredentialService();

			expect(service).toBeDefined();
			const { MPLCoreCredentialService } = require("@superteam-academy/services");
			expect(MPLCoreCredentialService).toHaveBeenCalledWith(mockConnection, mockWallet);
		});

		it("should return DevnetCredentialService for devnet environment", () => {
			const config: ServiceConfig = {
				environment: "devnet",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getCredentialService();

			expect(service).toBeDefined();
			const { DevnetCredentialService } = require("@superteam-academy/services");
			expect(DevnetCredentialService).toHaveBeenCalledWith(mockWallet);
		});
	});

	describe("LeaderboardService", () => {
		it("should return HeliusLeaderboardService when Helius config is provided", () => {
			const config: ServiceConfig = {
				environment: "development",
				helius: {
					apiKey: "test-key",
					collectionAddresses: { test: "address" },
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getLeaderboardService();

			expect(service).toBeDefined();
			const { HeliusLeaderboardService } = require("@superteam-academy/services");
			expect(HeliusLeaderboardService).toHaveBeenCalledWith("test-key", { test: "address" });
		});

		it("should return DatabaseLeaderboardService for development without Helius", () => {
			const config: ServiceConfig = {
				environment: "development",
				database: {
					url: "postgresql://test",
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getLeaderboardService();

			expect(service).toBeDefined();
			const { DatabaseLeaderboardService } = require("@superteam-academy/services");
			expect(DatabaseLeaderboardService).toHaveBeenCalledWith("postgresql://test");
		});
	});

	describe("AnalyticsService", () => {
		it("should return GA4AnalyticsService for development with measurement ID", () => {
			const config: ServiceConfig = {
				environment: "development",
				analytics: {
					measurementId: "GA-TEST",
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getAnalyticsService();

			expect(service).toBeDefined();
			const { GA4AnalyticsService } = require("@superteam-academy/services");
			expect(GA4AnalyticsService).toHaveBeenCalledWith("GA-TEST");
		});

		it("should throw error for development without analytics config", () => {
			const config: ServiceConfig = {
				environment: "development",
			};

			const factory = ServiceFactory.initialize(config);

			expect(() => factory.getAnalyticsService()).toThrow(
				"Analytics configuration required for AnalyticsService"
			);
		});
	});

	describe("AuthLinkingService", () => {
		it("should return BetterAuthLinkingService for development", () => {
			const mockBetterAuth = {};
			const config: ServiceConfig = {
				environment: "development",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
				auth: {
					betterAuth: mockBetterAuth,
				},
			};

			const factory = ServiceFactory.initialize(config);
			const service = factory.getAuthLinkingService();

			expect(service).toBeDefined();
			const { BetterAuthLinkingService } = require("@superteam-academy/services");
			expect(BetterAuthLinkingService).toHaveBeenCalledWith(mockBetterAuth, mockConnection);
		});

		it("should throw error for development without auth config", () => {
			const config: ServiceConfig = {
				environment: "development",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
				// Missing auth config
			};

			const factory = ServiceFactory.initialize(config);

			expect(() => factory.getAuthLinkingService()).toThrow(
				"Auth and Solana configuration required for AuthLinkingService"
			);
		});
	});

	describe("Infrastructure Services", () => {
		const config: ServiceConfig = {
			environment: "development",
		};

		beforeEach(() => {
			ServiceFactory.initialize(config);
		});

		it("should return InMemoryServiceTracer", () => {
			const factory = ServiceFactory.getInstance();
			const tracer = factory.getTracer();

			expect(tracer).toBeDefined();
			const { InMemoryServiceTracer } = require("@superteam-academy/services");
			expect(InMemoryServiceTracer).toHaveBeenCalled();
		});

		it("should return EnvironmentServiceConfiguration", () => {
			const factory = ServiceFactory.getInstance();
			const configuration = factory.getConfiguration();

			expect(configuration).toBeDefined();
			const { EnvironmentServiceConfiguration } = require("@superteam-academy/services");
			expect(EnvironmentServiceConfiguration).toHaveBeenCalledWith({
				environment: "development",
				requiredKeys: ["SOLANA_RPC_URL", "SOLANA_PROGRAM_ID", "DATABASE_URL"],
				defaults: {
					SERVICE_TIMEOUT: 30_000,
					MAX_RETRIES: 3,
					CACHE_TTL: 300_000,
					LOG_LEVEL: "info",
				},
			});
		});

		it("should return InMemoryServiceDiscovery", () => {
			const factory = ServiceFactory.getInstance();
			const discovery = factory.getServiceDiscovery();

			expect(discovery).toBeDefined();
			const { InMemoryServiceDiscovery } = require("@superteam-academy/services");
			expect(InMemoryServiceDiscovery).toHaveBeenCalled();
		});

		it("should return DefaultServiceHealth", () => {
			const factory = ServiceFactory.getInstance();
			const health = factory.getServiceHealth();

			expect(health).toBeDefined();
			const { DefaultServiceHealth } = require("@superteam-academy/services");
			expect(DefaultServiceHealth).toHaveBeenCalled();
		});

		it("should return InMemoryServiceMetrics", () => {
			const factory = ServiceFactory.getInstance();
			const metrics = factory.getServiceMetrics();

			expect(metrics).toBeDefined();
			const { InMemoryServiceMetrics } = require("@superteam-academy/services");
			expect(InMemoryServiceMetrics).toHaveBeenCalled();
		});

		it("should return ConsoleServiceLogger", () => {
			const factory = ServiceFactory.getInstance();
			const logger = factory.getServiceLogger();

			expect(logger).toBeDefined();
			const { ConsoleServiceLogger } = require("@superteam-academy/services");
			expect(ConsoleServiceLogger).toHaveBeenCalled();
		});
	});

	describe("Convenience Functions", () => {
		beforeEach(() => {
			const config: ServiceConfig = {
				environment: "devnet",
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};
			ServiceFactory.initialize(config);
		});

		it("should provide convenience functions for all services", () => {
			const {
				getLearningProgressService,
				getCredentialService,
				getLeaderboardService,
			} = require("@superteam-academy/services");

			expect(getLearningProgressService()).toBeDefined();
			expect(getCredentialService()).toBeDefined();
			expect(getLeaderboardService()).toBeDefined();
		});
	});

	describe("Environment Handling", () => {
		const environments: ServiceEnvironment[] = [
			"development",
			"devnet",
			"staging",
			"mainnet",
			"production",
		];

		it.each(environments)("should handle %s environment", (environment) => {
			const config: ServiceConfig = {
				environment,
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);

			// Should not throw for valid environments
			expect(() => factory.getLearningProgressService()).not.toThrow();
			expect(() => factory.getCredentialService()).not.toThrow();
			expect(() => factory.getLeaderboardService()).not.toThrow();
			expect(() => factory.getAnalyticsService()).not.toThrow();
		});

		it("should throw error for unknown environment", () => {
			const config: ServiceConfig = {
				environment: "unknown" as unknown,
				solana: {
					connection: mockConnection,
					programId: mockProgramId,
					wallet: mockWallet,
				},
			};

			const factory = ServiceFactory.initialize(config);

			expect(() => factory.getLearningProgressService()).toThrow(
				"Unknown environment: unknown"
			);
		});
	});
});
