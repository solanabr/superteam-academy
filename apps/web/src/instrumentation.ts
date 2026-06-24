/**
 * Next.js instrumentation hook — runs once at server startup.
 * Eagerly validates environment variables so a missing/malformed var fails fast
 * with a clear, named error instead of a deep SDK crash at first request.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
    await import("@/lib/env.server");
  }
}
