import type { Connection, PublicKey } from "@solana/web3.js";
import { LearningProgressService } from "./LearningProgressService";
import { CredentialService } from "./CredentialService";
import { LeaderboardService } from "./LeaderboardService";
import { AnalyticsService } from "./AnalyticsService";
import { AuthLinkingService } from "./AuthLinkingService";

export interface AcademyServices {
	connection: Connection;
	programId: PublicKey;
	learningProgress: LearningProgressService;
	credential: CredentialService;
	leaderboard: LeaderboardService;
	analytics: AnalyticsService;
	authLinking: AuthLinkingService;
}

export function createServices(connection: Connection, programId: PublicKey): AcademyServices {
	if (!connection) {
		throw new Error("Connection is required");
	}
	if (!programId) {
		throw new Error("Program ID is required");
	}

	return {
		connection,
		programId,
		learningProgress: new LearningProgressService(connection, programId),
		credential: new CredentialService(connection, programId),
		leaderboard: new LeaderboardService(connection, programId),
		analytics: new AnalyticsService(connection, programId),
		authLinking: new AuthLinkingService(connection, programId),
	};
}

// Backward-compatible namespace
export const ServiceFactory = { createServices };
