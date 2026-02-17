import { GA4AnalyticsService } from "./ga4-analytics";

export class DevnetAnalyticsService extends GA4AnalyticsService {
	constructor() {
		// Devnet GA4 measurement ID
		const measurementId = process.env.DEVNET_GA4_MEASUREMENT_ID || "GA-DEVNET-MEASUREMENT-ID";
		super(measurementId);
	}
}
