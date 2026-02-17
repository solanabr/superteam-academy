import { DatabaseLeaderboardService } from "./database-leaderboard";

export class DevnetLeaderboardService extends DatabaseLeaderboardService {
	constructor() {
		// Devnet database URL - should be configured via environment variables
		super();
	}
}
