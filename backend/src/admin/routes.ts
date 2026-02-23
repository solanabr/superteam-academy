import { Hono } from "hono";
import { signAdminJwt } from "@/lib/admin.js";
import { addKey, generateApiKey } from "@/lib/api-key-store.js";
import type { ApiKeyRole } from "@/lib/api-key-store.js";
import { adminAuth } from "@/middleware/admin-auth.js";
import { bodyGuard } from "@/middleware/body-guard.js";

export function registerAdminRoutes(
  app: Hono,
  env: {
    adminSecret: string;
    adminPassword: string;
    maxBodyBytes: number;
  }
) {
  const adminRouter = new Hono();

  adminRouter.use("*", bodyGuard({ maxBytes: env.maxBodyBytes }));

  adminRouter.post("/login", async (c) => {
    let body: { password?: string };
    try {
      body = (await c.req.json()) as { password?: string };
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const password = body.password;
    if (typeof password !== "string" || password.length === 0) {
      return c.json({ error: "password required" }, 400);
    }
    if (password !== env.adminPassword) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = await signAdminJwt(env.adminSecret);
    return c.json({ token });
  });

  adminRouter.post("/generate-api-key", adminAuth(env.adminSecret), async (c) => {
    let body: { role?: string; label?: string };
    try {
      body = (await c.req.json()) as { role?: string; label?: string };
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const role = body.role;
    if (role !== "admin" && role !== "client") {
      return c.json({ error: "role must be 'admin' or 'client'" }, 400);
    }
    const apiKey = generateApiKey();
    addKey(apiKey, role as ApiKeyRole, body.label);
    return c.json({ apiKey, role, label: body.label ?? undefined });
  });

  app.route("/v1/admin", adminRouter);
}
