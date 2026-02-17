import {
	ServiceFactory,
	type ServiceConfig,
	getLearningProgressService,
	getCredentialService,
	getLeaderboardService,
	getAnalyticsService,
	getAuthLinkingService,
} from "./factory";
import { Connection, PublicKey } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";
import { LeaderboardCategory, Timeframe } from "./interfaces/leaderboard";

// Example usage of the real service implementations
async function exampleUsage() {
	// Initialize services with real configurations
	const config: ServiceConfig = {
		environment: "development",
		solana: {
			connection: new Connection("https://api.devnet.solana.com"),
			programId: new PublicKey("3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb"),
			wallet: {} as unknown as Wallet, // Would be a real wallet adapter
		},
		analytics: {
			measurementId: "GA_MEASUREMENT_ID",
		},
		auth: {
			betterAuth: {} as Record<string, unknown>, // Would be a real better-auth instance
		},
		database: {
			url: "postgresql://localhost:5432/superteam_academy",
		},
	};

	// Initialize the service factory
	ServiceFactory.initialize(config);

	// Get service instances
	const learningService = getLearningProgressService();
	const credentialService = getCredentialService();
	const leaderboardService = getLeaderboardService();
	const analyticsService = getAnalyticsService();
	const authService = getAuthLinkingService();

	// Example: Get learner progress
	const progress = await learningService.getProgress("user123", "course123");
	if (progress.success) {
		// ignored
	}

	// Example: Issue a credential
	const credential = await credentialService.issueCredential({
		learnerId: "user123",
		trackId: 1,
		level: 1,
	});
	if (credential.success) {
		// ignored
	}

	// Example: Get leaderboard
	const leaderboard = await leaderboardService.queryLeaderboard({
		category: LeaderboardCategory.GLOBAL_XP,
		timeframe: Timeframe.ALL_TIME,
		limit: 10,
		offset: 0,
	});
	if (leaderboard.success) {
		// ignored
	}

	// Example: Track an event
	const eventTracked = await analyticsService.trackEvent({
		eventType: "course_started",
		sessionId: "session123",
		properties: {
			courseId: "course123",
		},
		userId: "user123",
	});
	if (eventTracked.success) {
		// ignored
	}

	// Example: Link OAuth account
	const linked = await authService.linkAccount("user123", {
		provider: "google",
		authorizationCode: "auth_code_here",
		redirectUri: "https://example.com/callback",
	});
	if (linked.success) {
		// ignored
	}
}

export { exampleUsage };
