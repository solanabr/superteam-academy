import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    ARCJET_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    SANITY_API_TOKEN: z.string().min(1).optional(),
    SENTRY_DSN: z.string().min(1).optional(),
    BACKEND_SIGNER_KEY: z.string().min(1).optional(),
    BACKEND_SIGNER_KEYPAIR: z.string().min(1).optional(),
    ADMIN_SECRET_KEY: z.string().min(1).optional(),
    ANCHOR_WALLET: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: process.env,
})
