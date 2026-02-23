import { Hono } from "hono";
import { cors } from "hono/cors";
import openApiContract from "@/contract/openapi.js";
import { addKey, isKeyValid } from "@/lib/api-key-store.js";
import { checkLiveness, checkReadiness } from "@/lib/health.js";
import { apiAuth } from "@/middleware/auth.js";
import { bodyGuard } from "@/middleware/body-guard.js";
import { requestLogger } from "@/middleware/request-logger.js";
import {
  academyRateLimiter,
  publicRateLimiter,
} from "@/middleware/rate-limit.js";
import academyRoutes from "@/routes/academy.js";
import { registerAdminRoutes } from "@/admin/routes.js";

export type AppEnv = {
  BACKEND_API_TOKEN?: string;
  ADMIN_SECRET?: string;
  ADMIN_PASSWORD?: string;
  CORS_ALLOWED_ORIGINS?: string;
  MAX_BODY_BYTES?: number;
};

export function createApp(envOverrides?: AppEnv): Hono {
  const apiToken = envOverrides?.BACKEND_API_TOKEN ?? process.env.BACKEND_API_TOKEN;
  if (!apiToken) {
    throw new Error("BACKEND_API_TOKEN is required");
  }

  const adminSecret =
    envOverrides?.ADMIN_SECRET ?? process.env.ADMIN_SECRET ?? "";
  const adminPassword =
    envOverrides?.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";

  const allowedOrigins = (
    envOverrides?.CORS_ALLOWED_ORIGINS ??
    process.env.CORS_ALLOWED_ORIGINS ??
    "http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  const maxBodyBytes =
    envOverrides?.MAX_BODY_BYTES ??
    Number(process.env.MAX_BODY_BYTES ?? 65_536);
  if (!Number.isFinite(maxBodyBytes) || maxBodyBytes < 1) {
    throw new Error("MAX_BODY_BYTES must be a positive number");
  }

  function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return false;
    return allowedOrigins.includes(origin);
  }

  const app = new Hono();

  app.use("*", requestLogger());
  app.use(
    "*",
    cors({
      origin: (origin) => (isOriginAllowed(origin) ? origin : ""),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    })
  );
  app.use("*", publicRateLimiter);
  app.use("/v1/academy/*", bodyGuard({ maxBytes: maxBodyBytes }));
  app.use("/v1/academy/*", async (c, next) => {
    const origin = c.req.header("origin");
    if (origin && !isOriginAllowed(origin)) {
      return c.json({ error: "Origin not allowed" }, 403);
    }
    await next();
  });
  app.use("/v1/academy/*", academyRateLimiter);
  addKey(apiToken, "admin", "bootstrap");
  app.use("/v1/academy/*", apiAuth(isKeyValid));

  if (adminSecret && adminPassword) {
    registerAdminRoutes(app, {
      adminSecret,
      adminPassword,
      maxBodyBytes,
    });
  }

  app.get("/health", (c) => c.json(checkLiveness()));
  app.get("/v1/health", (c) =>
    c.json({ ...checkLiveness(), version: "1" })
  );
  app.get("/ready", async (c) => {
    const result = await checkReadiness();
    return c.json(result, result.ok ? 200 : 503);
  });
  app.get("/v1/ready", async (c) => {
    const result = await checkReadiness();
    return c.json({ ...result, version: "1" }, result.ok ? 200 : 503);
  });
  app.route("/v1/academy", academyRoutes);
  app.get("/v1/contract", (c) => c.json(openApiContract));

  return app;
}
