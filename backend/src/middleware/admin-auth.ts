import type { Context, Next } from "hono";
import { verifyAdminJwt } from "@/lib/admin.js";

export function adminAuth(secret: string) {
  return async (c: Context, next: Next) => {
    const auth = c.req.header("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = auth.slice(7).trim();
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const payload = await verifyAdminJwt(token, secret);
    if (!payload) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("adminPayload", payload);
    return next();
  };
}
