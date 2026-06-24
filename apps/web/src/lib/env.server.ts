import "server-only";
import { z } from "zod";
import { formatEnvError } from "./env";

/**
 * Server-only secrets. Never imported into client code (`server-only` enforces
 * this). Validated eagerly at boot via `instrumentation.ts`.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!parsed.success) {
  throw new Error(formatEnvError("server", parsed.error));
}

export const serverEnv = parsed.data;
