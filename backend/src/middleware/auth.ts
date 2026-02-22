import { createMiddleware } from "hono/factory";
import * as jose from "jose";
import { config } from "../lib/config.js";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(config.authSecret);
    const { payload } = await jose.jwtVerify(token, secret);

    const userId = (payload.sub ?? payload.id ?? payload.email) as string | undefined;
    if (!userId) {
      return c.json({ error: "Invalid token payload: no user identifier" }, 401);
    }

    c.set("userId", userId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
