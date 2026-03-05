import { config } from "dotenv";
import { z } from "zod";
config();
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    BACKEND_PORT: z.coerce.number().default(Number(process.env.PORT ?? 4000)),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().default("replace-me"),
    HELIUS_RPC_URL: z.string().optional(),
    HELIUS_API_KEY: z.string().optional(),
    CREDENTIAL_COLLECTIONS: z.string().optional(),
    SOLANA_RPC_URL: z.string().default("https://api.devnet.solana.com"),
    XP_MINT: z.string().optional(),
    INTERNAL_JOB_TOKEN: z.string().default("dev-job-token"),
    ADMIN_TOKEN: z.string().default("dev-admin-token"),
    SOLANA_CLUSTER: z.string().default("devnet"),
    SANITY_PROJECT_ID: z.string().optional(),
    SANITY_DATASET: z.string().optional(),
    SANITY_API_VERSION: z.string().default("2025-01-01"),
    SANITY_TOKEN: z.string().optional(),
    SANITY_USE_CDN: z
        .string()
        .transform((value) => value === "true")
        .optional(),
});
export const env = envSchema.parse(process.env);
