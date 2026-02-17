import type { LearningProgressService } from "./interfaces/learning-progress";
import type { CredentialService } from "./interfaces/credential";
import type { LeaderboardService } from "./interfaces/leaderboard";
import type { AnalyticsService } from "./interfaces/analytics";
import type { AuthLinkingService } from "./interfaces/auth-linking";
import type { ServiceTracer } from "./interfaces/service-tracing";
import type { ServiceConfiguration } from "./interfaces/service-configuration";
import type { ServiceDiscovery } from "./interfaces/service-discovery";
import type { ServiceHealthCheck } from "./interfaces/service-health";
import type { ServiceMetrics } from "./interfaces/service-metrics";
import type { ServiceLogger } from "./interfaces/service-logging";
import { SolanaLearningProgressService } from "./impl/solana-learning-progress";
import { MPLCoreCredentialService } from "./impl/mpl-core-credential";
import { DatabaseLeaderboardService } from "./impl/database-leaderboard";
import { HeliusLeaderboardService } from "./impl/helius-leaderboard";
import { GA4AnalyticsService } from "./impl/ga4-analytics";
import { BetterAuthLinkingService } from "./impl/better-auth-linking";
// Environment-specific implementations
import { DevnetLearningProgressService } from "./impl/devnet-learning-progress";
import { MainnetLearningProgressService } from "./impl/mainnet-learning-progress";
import { DevnetCredentialService } from "./impl/devnet-credential";
import { MainnetCredentialService } from "./impl/mainnet-credential";
import { DevnetLeaderboardService } from "./impl/devnet-leaderboard";
import { MainnetLeaderboardService } from "./impl/mainnet-leaderboard";
import { DevnetAnalyticsService } from "./impl/devnet-analytics";
import { MainnetAnalyticsService } from "./impl/mainnet-analytics";
import { DevnetAuthLinkingService } from "./impl/devnet-auth-linking";
import { MainnetAuthLinkingService } from "./impl/mainnet-auth-linking";
import { InMemoryServiceTracer } from "./implementations/in-memory-service-tracer";
import { EnvironmentServiceConfiguration } from "./implementations/environment-service-configuration";
import { InMemoryServiceDiscovery } from "./impl/in-memory-service-discovery";
import { DefaultServiceHealth } from "./impl/default-service-health";
import { InMemoryServiceMetrics } from "./impl/in-memory-service-metrics";
import { ConsoleServiceLogger } from "./impl/console-service-logger";
import type { Connection, PublicKey } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";

export type ServiceEnvironment = "development" | "devnet" | "staging" | "mainnet" | "production";

export interface ServiceConfig {
	environment: ServiceEnvironment;
	baseUrl?: string;
	apiKey?: string;
	timeout?: number;
	// Solana configuration
	solana?: {
		connection: Connection;
		programId: PublicKey;
		wallet: Wallet;
	};
	// Analytics configuration
	analytics?: {
		measurementId: string;
	};
	// Auth configuration
	auth?: {
		betterAuth: Record<string, unknown>; // BetterAuth instance
	};
	// Database configuration
	database?: {
		url: string;
	};
	// Helius DAS configuration
	helius?: {
		apiKey: string;
		collectionAddresses?: Record<string, string>;
	};
}

export class ServiceFactory {
	private static instance: ServiceFactory;
	private config: ServiceConfig;

	// Service instances
	private learningProgressService?: LearningProgressService;
	private credentialService?: CredentialService;
	private leaderboardService?: LeaderboardService;
	private analyticsService?: AnalyticsService;
	private authLinkingService?: AuthLinkingService;
	private tracer?: ServiceTracer;
	private configuration?: ServiceConfiguration;
	private serviceDiscovery?: ServiceDiscovery;
	private serviceHealth?: ServiceHealthCheck;
	private serviceMetrics?: ServiceMetrics;
	private serviceLogger?: ServiceLogger;

	private constructor(config: ServiceConfig) {
		this.config = config;
	}

	static initialize(config: ServiceConfig): ServiceFactory {
		if (!ServiceFactory.instance) {
			ServiceFactory.instance = new ServiceFactory(config);
		}
		return ServiceFactory.instance;
	}

	static getInstance(): ServiceFactory {
		if (!ServiceFactory.instance) {
			throw new Error("ServiceFactory not initialized. Call initialize() first.");
		}
		return ServiceFactory.instance;
	}

	getLearningProgressService(): LearningProgressService {
		if (!this.learningProgressService) {
			switch (this.config.environment) {
				case "development":
					// Use base implementation with provided config
					if (this.config.solana) {
						this.learningProgressService = new SolanaLearningProgressService(
							this.config.solana.connection,
							this.config.solana.programId,
							this.config.solana.wallet
						);
					} else {
						throw new Error(
							"Solana configuration required for LearningProgressService"
						);
					}
					break;
				case "devnet":
					this.learningProgressService = new DevnetLearningProgressService(
						this.config.solana?.wallet
					);
					break;
				case "mainnet":
					this.learningProgressService = new MainnetLearningProgressService(
						this.config.solana?.wallet
					);
					break;
				case "staging":
				case "production":
					// For staging/production, use mainnet services
					this.learningProgressService = new MainnetLearningProgressService(
						this.config.solana?.wallet
					);
					break;
				default:
					throw new Error(`Unknown environment: ${this.config.environment}`);
			}
		}
		return this.learningProgressService;
	}

	getCredentialService(): CredentialService {
		if (!this.credentialService) {
			switch (this.config.environment) {
				case "development":
					if (this.config.solana) {
						this.credentialService = new MPLCoreCredentialService(
							this.config.solana.connection,
							this.config.solana.wallet
						);
					} else {
						throw new Error("Solana configuration required for CredentialService");
					}
					break;
				case "devnet":
					this.credentialService = new DevnetCredentialService(
						this.config.solana?.wallet
					);
					break;
				case "mainnet":
					this.credentialService = new MainnetCredentialService(
						this.config.solana?.wallet
					);
					break;
				case "staging":
				case "production":
					this.credentialService = new MainnetCredentialService(
						this.config.solana?.wallet
					);
					break;
				default:
					throw new Error(`Unknown environment: ${this.config.environment}`);
			}
		}
		return this.credentialService;
	}

	getLeaderboardService(): LeaderboardService {
		if (!this.leaderboardService) {
			// Use Helius DAS integration if configured
			if (this.config.helius?.apiKey) {
				this.leaderboardService = new HeliusLeaderboardService(
					this.config.helius.apiKey,
					this.config.helius.collectionAddresses
				);
			} else {
				// Fall back to environment-specific services
				switch (this.config.environment) {
					case "development":
						this.leaderboardService = new DatabaseLeaderboardService();
						break;
					case "devnet":
						this.leaderboardService = new DevnetLeaderboardService();
						break;
					case "mainnet":
						this.leaderboardService = new MainnetLeaderboardService();
						break;
					case "staging":
					case "production":
						this.leaderboardService = new MainnetLeaderboardService();
						break;
					default:
						throw new Error(`Unknown environment: ${this.config.environment}`);
				}
			}
		}
		return this.leaderboardService;
	}

	getAnalyticsService(): AnalyticsService {
		if (!this.analyticsService) {
			switch (this.config.environment) {
				case "development":
					if (this.config.analytics?.measurementId) {
						this.analyticsService = new GA4AnalyticsService(
							this.config.analytics.measurementId
						);
					} else {
						throw new Error("Analytics configuration required for AnalyticsService");
					}
					break;
				case "devnet":
					this.analyticsService = new DevnetAnalyticsService();
					break;
				case "mainnet":
					this.analyticsService = new MainnetAnalyticsService();
					break;
				case "staging":
				case "production":
					this.analyticsService = new MainnetAnalyticsService();
					break;
				default:
					throw new Error(`Unknown environment: ${this.config.environment}`);
			}
		}
		return this.analyticsService;
	}

	getAuthLinkingService(): AuthLinkingService {
		if (!this.authLinkingService) {
			switch (this.config.environment) {
				case "development":
						if (this.config.auth?.betterAuth && this.config.solana) {
						this.authLinkingService = new BetterAuthLinkingService(
							this.config.auth.betterAuth
						);
					} else {
						throw new Error(
							"Auth and Solana configuration required for AuthLinkingService"
						);
					}
					break;
				case "devnet":
					if (this.config.auth?.betterAuth) {
						this.authLinkingService = new DevnetAuthLinkingService(
							this.config.auth.betterAuth
						);
					} else {
						throw new Error("Auth configuration required for DevnetAuthLinkingService");
					}
					break;
				case "mainnet":
					if (this.config.auth?.betterAuth) {
						this.authLinkingService = new MainnetAuthLinkingService(
							this.config.auth.betterAuth
						);
					} else {
						throw new Error(
							"Auth configuration required for MainnetAuthLinkingService"
						);
					}
					break;
				case "staging":
				case "production":
					if (this.config.auth?.betterAuth) {
						this.authLinkingService = new MainnetAuthLinkingService(
							this.config.auth.betterAuth
						);
					} else {
						throw new Error("Auth configuration required for AuthLinkingService");
					}
					break;
				default:
					throw new Error(`Unknown environment: ${this.config.environment}`);
			}
		}
		return this.authLinkingService;
	}

	getTracer(): ServiceTracer {
		if (!this.tracer) {
			// Use in-memory tracer for all environments
			this.tracer = new InMemoryServiceTracer();
		}
		return this.tracer;
	}

	getConfiguration(): ServiceConfiguration {
		if (!this.configuration) {
			this.configuration = new EnvironmentServiceConfiguration({
				environment: this.config.environment,
				requiredKeys: ["SOLANA_RPC_URL", "SOLANA_PROGRAM_ID", "DATABASE_URL"],
				defaults: {
					SERVICE_TIMEOUT: 30_000,
					MAX_RETRIES: 3,
					CACHE_TTL: 300_000, // 5 minutes
					LOG_LEVEL: "info",
				},
			});
			this.configuration.loadFromEnvironment();
		}
		return this.configuration;
	}

	getServiceDiscovery(): ServiceDiscovery {
		if (!this.serviceDiscovery) {
			this.serviceDiscovery = new InMemoryServiceDiscovery();
		}
		return this.serviceDiscovery;
	}

	getServiceHealth(): ServiceHealthCheck {
		if (!this.serviceHealth) {
			this.serviceHealth = new DefaultServiceHealth();
		}
		return this.serviceHealth;
	}

	getServiceMetrics(): ServiceMetrics {
		if (!this.serviceMetrics) {
			this.serviceMetrics = new InMemoryServiceMetrics();
		}
		return this.serviceMetrics;
	}

	getServiceLogger(): ServiceLogger {
		if (!this.serviceLogger) {
			this.serviceLogger = new ConsoleServiceLogger();
		}
		return this.serviceLogger;
	}
}

// Convenience functions for common service access
export function getLearningProgressService(): LearningProgressService {
	return ServiceFactory.getInstance().getLearningProgressService();
}

export function getCredentialService(): CredentialService {
	return ServiceFactory.getInstance().getCredentialService();
}

export function getLeaderboardService(): LeaderboardService {
	return ServiceFactory.getInstance().getLeaderboardService();
}

export function getAnalyticsService(): AnalyticsService {
	return ServiceFactory.getInstance().getAnalyticsService();
}

export function getAuthLinkingService(): AuthLinkingService {
	return ServiceFactory.getInstance().getAuthLinkingService();
}

export function getServiceTracer(): ServiceTracer {
	return ServiceFactory.getInstance().getTracer();
}

export function getServiceConfiguration(): ServiceConfiguration {
	return ServiceFactory.getInstance().getConfiguration();
}

export function getServiceDiscovery(): ServiceDiscovery {
	return ServiceFactory.getInstance().getServiceDiscovery();
}

export function getServiceHealth(): ServiceHealthCheck {
	return ServiceFactory.getInstance().getServiceHealth();
}

export function getServiceMetrics(): ServiceMetrics {
	return ServiceFactory.getInstance().getServiceMetrics();
}

export function getServiceLogger(): ServiceLogger {
	return ServiceFactory.getInstance().getServiceLogger();
}
