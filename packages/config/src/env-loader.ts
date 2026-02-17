import { config } from "dotenv";
import { resolve } from "node:path";

// Load environment variables based on NODE_ENV
function loadEnv() {
	const nodeEnv = process.env.NODE_ENV || "development";
	const envFile = `.env.${nodeEnv}`;

	// Try to load environment-specific file first
	try {
		config({ path: resolve(process.cwd(), envFile) });
	} catch (_error) {
		console.warn(`Could not load ${envFile}, falling back to .env`);
		// Fallback to .env if environment-specific file doesn't exist
		config();
	}

	// Validate required environment variables
	const { env } = require("./env");
	return env;
}

export { loadEnv };
