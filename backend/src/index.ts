import { serve } from "@hono/node-server";
import "dotenv/config";
import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import academyRoutes from "./routes/academy.js";

const app = new Hono();
const apiToken = process.env.BACKEND_API_TOKEN;

if (!apiToken) {
  throw new Error("BACKEND_API_TOKEN is required");
}

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ??
  "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }
  return allowedOrigins.includes(origin);
}

function getRequestToken(
  authorizationHeader: string | undefined,
  apiKeyHeader: string | undefined
): string | null {
  if (apiKeyHeader && apiKeyHeader.trim().length > 0) {
    return apiKeyHeader.trim();
  }

  if (!authorizationHeader) {
    return null;
  }

  const bearerPrefix = "Bearer ";
  if (authorizationHeader.startsWith(bearerPrefix)) {
    const token = authorizationHeader.slice(bearerPrefix.length).trim();
    return token.length > 0 ? token : null;
  }

  const token = authorizationHeader.trim();
  return token.length > 0 ? token : null;
}

function tokenMatches(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => (isOriginAllowed(origin) ? origin : ""),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
app.use("/academy/*", async (c, next) => {
  const origin = c.req.header("origin");
  if (origin && !isOriginAllowed(origin)) {
    return c.json({ error: "Origin not allowed" }, 403);
  }
  await next();
});
app.use("/academy/*", async (c, next) => {
  const providedToken = getRequestToken(
    c.req.header("authorization"),
    c.req.header("x-api-key")
  );
  if (!providedToken || !tokenMatches(providedToken, apiToken)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

app.get("/health", (c) => c.json({ ok: true, service: "academy-backend" }));
app.route("/academy", academyRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Academy backend listening on http://localhost:${info.port}`);
});
