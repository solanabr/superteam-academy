import { GA4AnalyticsService } from "./ga4-analytics";

export class MainnetAnalyticsService extends GA4AnalyticsService {
	constructor() {
		// Mainnet GA4 measurement ID
		const measurementId = process.env.MAINNET_GA4_MEASUREMENT_ID || "GA-MAINNET-MEASUREMENT-ID";
		super(measurementId);
	}
}
