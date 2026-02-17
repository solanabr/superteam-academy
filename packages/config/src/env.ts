import { z } from "zod";

// Environment variable validation schema
const envSchema = z.object({
	// Database
	DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

	// Solana
	SOLANA_RPC_URL: z.string().url("SOLANA_RPC_URL must be a valid URL"),
	ANCHOR_WALLET: z.string().optional(),

	// Auth
	NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL must be a valid URL"),
	GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
	GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
	GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
	GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),

	// CMS
	SANITY_PROJECT_ID: z.string().min(1, "SANITY_PROJECT_ID is required"),
	SANITY_DATASET: z.string().min(1, "SANITY_DATASET is required").default("production"),
	SANITY_API_VERSION: z.string().default("2024-01-01"),

	// Analytics
	GA4_MEASUREMENT_ID: z
		.string()
		.regex(/^G-[A-Z0-9]+$/, "GA4_MEASUREMENT_ID must be in format G-XXXXXXXXXX")
		.optional(),
	SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL").optional(),

	// Redis
	REDIS_URL: z.string().url("REDIS_URL must be a valid URL").optional(),

	// Security
	NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
	NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

	// API Keys
	HELIUS_API_KEY: z.string().min(1, "HELIUS_API_KEY is required for DAS integration").optional(),
	ALCHEMY_API_KEY: z.string().min(1, "ALCHEMY_API_KEY is required for enhanced RPC").optional(),

	// Email
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z.coerce.number().optional(),
	SMTP_USER: z.string().optional(),
	SMTP_PASS: z.string().optional(),
	FROM_EMAIL: z.string().email("FROM_EMAIL must be a valid email").optional(),

	// Node Environment
	NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),

	// Feature Flags
	NEXT_PUBLIC_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
	NEXT_PUBLIC_ENABLE_SENTRY: z.coerce.boolean().default(false),
	NEXT_PUBLIC_MAINTENANCE_MODE: z.coerce.boolean().default(false),
});

// Parse and validate environment variables
function validateEnv() {
	try {
		const parsed = envSchema.parse(process.env);
		return parsed;
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join("\n");
			throw new Error(`Environment validation failed:\n${errorMessages}`);
		}
		throw error;
	}
}

// Export validated environment variables
export const env = validateEnv();

// Type for the validated environment
export type Env = typeof env;

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
export const isStaging = env.NODE_ENV === "staging";

// Helper function to get public environment variables for client
export const publicEnv = {
	NEXT_PUBLIC_BASE_URL: env.NEXT_PUBLIC_BASE_URL,
	NEXT_PUBLIC_ENABLE_ANALYTICS: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
	NEXT_PUBLIC_ENABLE_SENTRY: env.NEXT_PUBLIC_ENABLE_SENTRY,
	NEXT_PUBLIC_MAINTENANCE_MODE: env.NEXT_PUBLIC_MAINTENANCE_MODE,
	SANITY_PROJECT_ID: env.SANITY_PROJECT_ID,
	SANITY_DATASET: env.SANITY_DATASET,
	SANITY_API_VERSION: env.SANITY_API_VERSION,
	GA4_MEASUREMENT_ID: env.GA4_MEASUREMENT_ID,
} as const;
