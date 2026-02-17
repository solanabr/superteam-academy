import { DatabaseLeaderboardService } from "./database-leaderboard";

export class MainnetLeaderboardService extends DatabaseLeaderboardService {
	constructor() {
		// Mainnet database URL - should be configured via environment variables
		super();
	}
}
